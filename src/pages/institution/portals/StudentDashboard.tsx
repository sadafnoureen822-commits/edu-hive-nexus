import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/lms/use-courses";
import { useAssignments } from "@/hooks/lms/use-assignments";
import { useQuizzes } from "@/hooks/lms/use-quizzes";
import { useIssuedCertificates } from "@/hooks/lms/use-certificates";
import { useStudentAttendance } from "@/hooks/use-attendance";
import { useStudentMarksByInstitution } from "@/hooks/lms/use-student-marks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, ClipboardList, HelpCircle, Award, CalendarCheck,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Circle, ArrowRight,
  BarChart3, Star
} from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const institutionId = institution?.id ?? "";

  const { data: courses = [] } = useCourses(institutionId);
  const { data: assignments = [] } = useAssignments(institutionId);
  const { data: quizzes = [] } = useQuizzes(institutionId);
  const { data: certificates = [] } = useIssuedCertificates(institutionId);
  const { data: attendance = [] } = useStudentAttendance(user?.id, institutionId);
  const { data: marks = [] } = useStudentMarksByInstitution(institutionId);

  const myCerts = certificates.filter((c) => c.student_id === user?.id);
  const myMarks = marks.filter((m) => m.student_id === user?.id);
  const publishedCourses = courses.filter((c) => c.status === "published");
  const activeAssignments = assignments.filter((a) => a.status === "active");
  const publishedQuizzes = quizzes.filter((q) => q.status === "published");

  // Attendance stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Results stats
  const approvedMarks = myMarks.filter((m) => m.status === "approved" && m.total_marks !== null);
  const avgScore = approvedMarks.length > 0
    ? Math.round(approvedMarks.reduce((sum, m) => sum + (m.total_marks || 0), 0) / approvedMarks.length)
    : null;

  const go = (path: string) => navigate(`/${slug}${path}`);

  const statCards = [
    { label: "Courses Available", value: publishedCourses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", action: () => go("/courses") },
    { label: "Active Assignments", value: activeAssignments.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-500/10", action: () => go("/assignments") },
    { label: "Quizzes", value: publishedQuizzes.length, icon: HelpCircle, color: "text-purple-600", bg: "bg-purple-500/10", action: () => go("/quizzes") },
    { label: "Certificates", value: myCerts.length, icon: Award, color: "text-yellow-600", bg: "bg-yellow-500/10", action: () => go("/certificates") },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Student Portal</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={s.action}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg} flex-shrink-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" /> Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{presentDays} / {totalDays} days present</span>
              <span className={`font-bold text-lg ${attendancePct >= 75 ? "text-green-500" : "text-destructive"}`}>{attendancePct}%</span>
            </div>
            <Progress value={attendancePct} className="h-2.5" />
            {attendancePct < 75 && totalDays > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Below 75% — attendance at risk
              </p>
            )}
            {totalDays === 0 && <p className="text-xs text-muted-foreground">No attendance records yet</p>}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvedMarks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No published results yet</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-display font-bold text-primary">{avgScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div className="flex-1 space-y-1">
                  {approvedMarks.slice(0, 3).map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate flex-1">Exam result</span>
                      <span className={`font-semibold ml-2 ${(m.total_marks || 0) >= 50 ? "text-green-500" : "text-destructive"}`}>
                        {m.total_marks} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Courses */}
        <TabsContent value="courses" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{publishedCourses.length} course{publishedCourses.length !== 1 ? "s" : ""} available</p>
            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => go("/courses")}>
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {publishedCourses.length === 0 ? (
            <EmptyState icon={BookOpen} message="No courses published yet" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedCourses.map((c) => (
                <Card key={c.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => go("/courses")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                        <Badge variant="outline" className="mt-2 text-[10px] text-green-600 border-green-500/30">Published</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="mt-4">
          {activeAssignments.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No active assignments" />
          ) : (
            <div className="space-y-3">
              {activeAssignments.map((a) => (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{a.total_marks} marks</span>
                        {a.due_date && (
                          <span className={`flex items-center gap-1 ${new Date(a.due_date) < new Date() ? "text-destructive" : ""}`}>
                            <Clock className="h-3 w-3" />Due: {format(new Date(a.due_date), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 flex-shrink-0">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quizzes */}
        <TabsContent value="quizzes" className="mt-4">
          {publishedQuizzes.length === 0 ? (
            <EmptyState icon={HelpCircle} message="No quizzes available" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedQuizzes.map((q) => (
                <Card key={q.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{q.title}</h3>
                    {q.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{q.description}</p>}
                    <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{q.total_marks} marks</span>
                      <span>·</span>
                      <span>{q.duration_minutes} min</span>
                      <span>·</span>
                      <span>{q.max_attempts} attempt{q.max_attempts > 1 ? "s" : ""}</span>
                    </div>
                    <Button size="sm" className="mt-3 w-full h-8 text-xs gap-1">
                      <HelpCircle className="h-3 w-3" /> Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="mt-4">
          {approvedMarks.length === 0 ? (
            <EmptyState icon={BarChart3} message="No results published yet" />
          ) : (
            <div className="space-y-3">
              {approvedMarks.map((m) => {
                const pct = m.total_marks ? Math.round((m.total_marks / 100) * 100) : 0;
                return (
                  <Card key={m.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className={`h-4 w-4 ${pct >= 50 ? "text-yellow-500" : "text-muted-foreground"}`} />
                          <span className="text-sm font-semibold">Exam Result</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${pct >= 50 ? "text-green-600 border-green-500/30" : "text-destructive border-destructive/30"}`}>
                          {pct >= 50 ? "Pass" : "Fail"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Score: <span className="font-bold text-foreground">{m.total_marks} pts</span></span>
                        {m.remarks && <span className="italic">{m.remarks}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-4">
          {attendance.length === 0 ? (
            <EmptyState icon={CalendarCheck} message="No attendance records yet" />
          ) : (
            <div className="space-y-1.5">
              {attendance.slice(0, 30).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                  {a.status === "present" ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    : a.status === "late" ? <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    : a.status === "excused" ? <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    : <Circle className="h-4 w-4 text-destructive flex-shrink-0" />}
                  <span className="text-sm flex-1">{format(new Date(a.date), "EEEE, dd MMM yyyy")}</span>
                  <Badge variant="outline" className={`text-[10px] capitalize ${
                    a.status === "present" ? "text-green-600 border-green-500/30" :
                    a.status === "late" ? "text-orange-600 border-orange-200" :
                    a.status === "excused" ? "text-blue-600 border-blue-200" :
                    "text-destructive border-destructive/30"}`}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <Card className="border-dashed border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        <Icon className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
