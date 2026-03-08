import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useCourseLessons } from "@/hooks/lms/use-courses";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Video, FileText, Clock, CheckCircle2, Play, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function StudentCoursesPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const instId = institution?.id ?? "";

  const { data: allCourses = [], isLoading } = useCourses(instId);
  const published = allCourses.filter((c) => c.status === "published");

  // My enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.id, instId],
    queryFn: async () => {
      if (!user?.id || !instId) return [];
      const { data } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("student_id", user.id)
        .eq("institution_id", instId);
      return data || [];
    },
    enabled: !!user?.id && !!instId,
  });

  const enroll = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("course_enrollments").insert({
        course_id: courseId,
        student_id: user!.id,
        institution_id: instId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast.success("Enrolled successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enrolledIds = new Set(enrollments.map((e: any) => e.course_id));
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse = published.find((c) => c.id === selectedCourseId);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Courses</h1>
        <p className="text-sm text-muted-foreground">{published.length} course{published.length !== 1 ? "s" : ""} available</p>
      </div>

      {published.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No courses published yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {published.map((course) => {
            const enrolled = enrolledIds.has(course.id);
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
                      {course.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {enrolled ? (
                      <>
                        <Badge variant="outline" className="text-green-600 border-green-200 text-[10px]">Enrolled</Badge>
                        <Button size="sm" className="ml-auto gap-1.5 h-7 text-xs" onClick={() => setSelectedCourseId(course.id)}>
                          <Play className="h-3 w-3" /> Open Course
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="w-full gap-1.5 h-8 text-xs" onClick={() => enroll.mutate(course.id)} disabled={enroll.isPending}>
                        <ChevronRight className="h-3 w-3" /> Enroll Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCourse && (
        <LessonViewer
          course={selectedCourse}
          userId={user?.id ?? ""}
          institutionId={instId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </div>
  );
}

function LessonViewer({ course, userId, institutionId, onClose }: { course: { id: string; title: string }; userId: string; institutionId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: lessons = [] } = useCourseLessons(course.id);
  const publishedLessons = lessons.filter((l) => l.is_published);

  const { data: progress = [] } = useQuery({
    queryKey: ["lesson-progress", userId, course.id],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_progress").select("lesson_id, is_completed").eq("student_id", userId).eq("institution_id", institutionId);
      return data || [];
    },
  });

  const completedIds = new Set(progress.filter((p: any) => p.is_completed).map((p: any) => p.lesson_id));
  const pct = publishedLessons.length > 0 ? Math.round((completedIds.size / publishedLessons.length) * 100) : 0;

  const markComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from("lesson_progress").upsert({
        lesson_id: lessonId,
        student_id: userId,
        institution_id: institutionId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "lesson_id,student_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-progress", userId, course.id] });
      toast.success("Lesson marked complete!");
    },
  });

  const [viewing, setViewing] = useState<typeof lessons[0] | null>(null);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedIds.size} of {publishedLessons.length} lessons completed</span>
              <span className="font-semibold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          {/* Lesson viewer */}
          {viewing ? (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setViewing(null)} className="text-xs gap-1">← Back to lessons</Button>
              <h3 className="font-semibold text-base">{viewing.title}</h3>
              {viewing.video_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  {viewing.video_url.includes("youtube") || viewing.video_url.includes("youtu.be") ? (
                    <iframe
                      src={viewing.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={viewing.video_url} controls className="w-full h-full" />
                  )}
                </div>
              )}
              {viewing.content && (
                <div className="p-4 rounded-lg bg-muted/30 border text-sm leading-relaxed whitespace-pre-wrap">{viewing.content}</div>
              )}
              {viewing.file_url && (
                <a href={viewing.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Download File</Button>
                </a>
              )}
              {!completedIds.has(viewing.id) && (
                <Button size="sm" className="gap-1.5" onClick={() => markComplete.mutate(viewing.id)} disabled={markComplete.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Complete
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {publishedLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No lessons published yet.</p>
              ) : (
                publishedLessons.map((lesson, i) => {
                  const done = completedIds.has(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-accent/20 transition-colors text-left"
                      onClick={() => setViewing(lesson)}
                    >
                      <span className="text-xs text-muted-foreground w-5 text-center font-mono">{i + 1}</span>
                      {lesson.video_url ? <Video className="h-4 w-4 text-primary flex-shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{lesson.title}</p>
                        {lesson.duration_minutes && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.duration_minutes} min</p>
                        )}
                      </div>
                      {done && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
