import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/lms/use-courses";
import { useAssignments } from "@/hooks/lms/use-assignments";
import { useQuizzes } from "@/hooks/lms/use-quizzes";
import { useIssuedCertificates } from "@/hooks/lms/use-certificates";
import { useStudentAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, ClipboardList, HelpCircle, Award, CalendarCheck,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Circle
} from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const institutionId = institution?.id ?? "";

  const { data: courses = [] } = useCourses(institutionId);
  const { data: assignments = [] } = useAssignments(institutionId);
  const { data: quizzes = [] } = useQuizzes(institutionId);
  const { data: certificates = [] } = useIssuedCertificates(institutionId);
  const { data: attendance = [] } = useStudentAttendance(user?.id, institutionId);

  const myCerts = certificates.filter((c) => c.student_id === user?.id);
  const publishedCourses = courses.filter((c) => c.status === "published");
  const activeAssignments = assignments.filter((a) => a.status === "active");
  const publishedQuizzes = quizzes.filter((q) => q.status === "published");

  // Attendance stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const statCards = [
    { label: "Courses Available", value: publishedCourses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active Assignments", value: activeAssignments.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-500/10" },
    { label: "Available Quizzes", value: publishedQuizzes.length, icon: HelpCircle, color: "text-purple-600", bg: "bg-purple-500/10" },
    { label: "Certificates Earned", value: myCerts.length, icon: Award, color: "text-yellow-600", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Attendance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{presentDays} / {totalDays} days present</span>
            <span className={`font-semibold ${attendancePct >= 75 ? "text-primary" : "text-destructive"}`}>{attendancePct}%</span>
          </div>
          <Progress value={attendancePct} className="h-2" />
          {attendancePct < 75 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Attendance below 75% threshold
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          {publishedCourses.length === 0 ? (
            <EmptyState icon={BookOpen} message="No courses published yet" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedCourses.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                        <Badge variant="outline" className="mt-2 text-[10px] text-primary border-primary/30">Published</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          {activeAssignments.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No active assignments" />
          ) : (
            <div className="space-y-3">
              {activeAssignments.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{a.total_marks} marks</span>
                          {a.due_date && (
                            <span className={`flex items-center gap-1 ${new Date(a.due_date) < new Date() ? "text-destructive" : ""}`}>
                              <Clock className="h-3 w-3" />
                              Due: {format(new Date(a.due_date), "dd MMM yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30 flex-shrink-0">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-4">
          {publishedQuizzes.length === 0 ? (
            <EmptyState icon={HelpCircle} message="No quizzes available" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedQuizzes.map((q) => (
                <Card key={q.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{q.title}</h3>
                    {q.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{q.description}</p>}
                    <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{q.total_marks} marks</span>
                      <span>•</span>
                      <span>{q.duration_minutes} min</span>
                      <span>•</span>
                      <span>{q.max_attempts} attempt{q.max_attempts > 1 ? "s" : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          {myCerts.length === 0 ? (
            <EmptyState icon={Award} message="No certificates issued yet" />
          ) : (
            <div className="space-y-3">
              {myCerts.map((c) => {
                const data = c.certificate_data as Record<string, string>;
                return (
                  <Card key={c.id} className="border-yellow-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-yellow-500/10 p-3 rounded-xl">
                          <Award className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{data?.course || "Certificate"}</h3>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">{c.serial_number}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Issued: {format(new Date(c.issued_at), "dd MMM yyyy")}
                          </p>
                        </div>
                        {!c.is_revoked && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {attendance.length === 0 ? (
            <EmptyState icon={CalendarCheck} message="No attendance records yet" />
          ) : (
            <div className="space-y-2">
              {attendance.slice(0, 30).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  {a.status === "present" ? (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : a.status === "late" ? (
                    <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  ) : a.status === "excused" ? (
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                  <span className="text-sm flex-1">{format(new Date(a.date), "EEEE, dd MMM yyyy")}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${
                      a.status === "present" ? "text-primary border-primary/30" :
                      a.status === "late" ? "text-orange-600 border-orange-200" :
                      a.status === "excused" ? "text-blue-600 border-blue-200" :
                      "text-destructive border-destructive/30"
                    }`}
                  >
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
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
        <Icon className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}
