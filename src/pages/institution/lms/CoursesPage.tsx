import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, useCourseLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from "@/hooks/lms/use-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, BookOpen, Edit, Trash2, ChevronRight, Video, FileText, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import ExportButton from "@/components/ui/ExportButton";

export default function CoursesPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id ?? "";

  const { data: courses = [], isLoading } = useCourses(institutionId);
  const createCourse = useCreateCourse(institutionId);
  const updateCourse = useUpdateCourse(institutionId);
  const deleteCourse = useDeleteCourse(institutionId);

  const [courseDialog, setCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<typeof courses[0] | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: "", description: "", status: "draft" },
  });

  const openCreate = () => {
    setEditingCourse(null);
    reset({ title: "", description: "", status: "draft" });
    setCourseDialog(true);
  };

  const openEdit = (course: typeof courses[0]) => {
    setEditingCourse(course);
    reset({ title: course.title, description: course.description ?? "", status: course.status });
    setCourseDialog(true);
  };

  const onSubmit = async (values: { title: string; description: string; status: string }) => {
    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, ...values as Parameters<typeof updateCourse.mutateAsync>[0] });
    } else {
      await createCourse.mutateAsync(values);
    }
    setCourseDialog(false);
    reset();
  };

  const statusColor = (s: string) =>
    s === "published" ? "bg-green-500/10 text-green-600 border-green-200" :
    s === "archived" ? "bg-muted text-muted-foreground" :
    "bg-yellow-500/10 text-yellow-600 border-yellow-200";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">Manage course content and lessons</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={courses.map((c) => ({ Title: c.title, Description: c.description ?? "", Status: c.status, Created: c.created_at }))}
            fileName="courses"
            sheetName="Courses"
          />
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Course
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No courses yet</p>
            <Button size="sm" onClick={openCreate} variant="outline">Create your first course</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCourseId(course.id === selectedCourseId ? null : course.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold line-clamp-2">{course.title}</CardTitle>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusColor(course.status)}`}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={(e) => { e.stopPropagation(); openEdit(course); }}>
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteCourse.mutate(course.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto gap-1" onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.id === selectedCourseId ? null : course.id); }}>
                    Lessons <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCourse && (
        <LessonsPanel
          course={selectedCourse}
          institutionId={institutionId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}

      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Course Title *</Label>
              <Input {...register("title", { required: true })} placeholder="e.g. Mathematics Grade 10" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Brief course overview..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setCourseDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createCourse.isPending || updateCourse.isPending}>
                {editingCourse ? "Save Changes" : "Create Course"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonsPanel({ course, institutionId, onClose }: { course: { id: string; title: string }; institutionId: string; onClose: () => void }) {
  const { data: lessons = [] } = useCourseLessons(course.id);
  const createLesson = useCreateLesson(institutionId, course.id);
  const updateLesson = useUpdateLesson(course.id);
  const deleteLesson = useDeleteLesson(course.id);

  const [lessonDialog, setLessonDialog] = useState(false);
  const [editing, setEditing] = useState<typeof lessons[0] | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: "", content: "", video_url: "", duration_minutes: 0, is_published: false },
  });

  const openCreate = () => { setEditing(null); reset(); setLessonDialog(true); };
  const openEdit = (l: typeof lessons[0]) => {
    setEditing(l);
    reset({ title: l.title, content: l.content ?? "", video_url: l.video_url ?? "", duration_minutes: l.duration_minutes ?? 0, is_published: l.is_published });
    setLessonDialog(true);
  };

  const onSubmit = async (values: { title: string; content: string; video_url: string; duration_minutes: number; is_published: boolean }) => {
    if (editing) {
      await updateLesson.mutateAsync({ id: editing.id, ...values, position: editing.position });
    } else {
      await createLesson.mutateAsync({ ...values, position: lessons.length });
    }
    setLessonDialog(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Lessons: {course.title}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Lesson</Button>
            <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No lessons yet. Add your first lesson.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, i) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent/30 transition-colors">
                <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                {lesson.video_url ? <Video className="h-4 w-4 text-primary flex-shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                  {lesson.duration_minutes ? <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.duration_minutes} min</p> : null}
                </div>
                <Badge variant="outline" className={`text-[10px] ${lesson.is_published ? "text-green-600 border-green-200" : "text-muted-foreground"}`}>
                  {lesson.is_published ? "Live" : "Draft"}
                </Badge>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(lesson)}><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteLesson.mutate(lesson.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Lesson" : "Add Lesson"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Lesson Title *</Label>
              <Input {...register("title", { required: true })} placeholder="e.g. Introduction to Algebra" />
            </div>
            <div className="space-y-1.5">
              <Label>Content / Notes</Label>
              <Textarea {...register("content")} rows={4} placeholder="Lesson notes or description..." />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input {...register("video_url")} placeholder="https://youtube.com/... or video link" />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" {...register("duration_minutes", { valueAsNumber: true })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={watch("is_published")} onCheckedChange={(v) => setValue("is_published", v)} id="is_published" />
              <Label htmlFor="is_published">Published (visible to students)</Label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setLessonDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createLesson.isPending || updateLesson.isPending}>{editing ? "Save" : "Add Lesson"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
