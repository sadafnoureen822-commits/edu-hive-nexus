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
  BarChart3, Star, GraduationCap, Download,
} from "lucide-react";
import { format } from "date-fns";
import ExportButton from "@/components/ui/ExportButton";

export default function StudentDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const instId = institution?.id ?? "";

  // Fetch data
  const { data: courses = [] } = useCourses(instId);
  const { data: assignments = [] } = useAssignments(instId);
  const { data: quizzes = [] } = useQuizzes(instId);
  const { data: allCerts = [] } = useIssuedCertificates(instId);
  const { data: attendance = [] } = useStudentAttendance(user?.id, instId);
  const { data: allMarks = [] } = useStudentMarksByInstitution(instId);

  // Filter to only MY data
  const myCerts = allCerts.filter((c) => c.student_id === user?.id);
  const myMarks = allMarks.filter((m) => m.student_id === user?.id && m.status === "approved");

  const publishedCourses = courses.filter((c) => c.status === "published");
  const activeAssignments = assignments.filter((a) => a.status === "active");
  const publishedQuizzes = quizzes.filter((q) => q.status === "published");

  // Attendance
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Results
  const avgScore = myMarks.length > 0
    ? Math.round(myMarks.reduce((s, m) => s + (m.total_marks || 0), 0) / myMarks.length)
    : null;

  const go = (path: string) => navigate(`/${slug}${path}`);

  const statCards = [
    { label: "Courses", value: publishedCourses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", action: () => go("/courses") },
    { label: "Assignments", value: activeAssignments.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-500/10", action: () => go("/assignments") },
    { label: "Quizzes", value: publishedQuizzes.length, icon: HelpCircle, color: "text-violet-600", bg: "bg-violet-500/10", action: () => go("/quizzes") },
    { label: "Certificates", value: myCerts.length, icon: Award, color: "text-yellow-600", bg: "bg-yellow-500/10", action: () => go("/certificates") },
  ];

  // Bulk export
  const allExportData = [
    ...publishedCourses.map((c) => ({ Section: "Courses", Title: c.title, Status: c.status })),
    ...activeAssignments.map((a) => ({ Section: "Assignments", Title: a.title, "Total Marks": a.total_marks, "Due Date": a.due_date ?? "" })),
    ...publishedQuizzes.map((q) => ({ Section: "Quizzes", Title: q.title, "Total Marks": q.total_marks, "Duration (min)": q.duration_minutes })),
    ...myMarks.map((m, i) => ({ Section: "Results", Index: i + 1, Score: m.total_marks ?? "", Theory: m.theory_marks ?? "", Practical: m.practical_marks ?? "", Remarks: m.remarks ?? "" })),
    ...attendance.map((a) => ({ Section: "Attendance", Date: a.date, Status: a.status })),
    ...myCerts.map((c) => ({ Section: "Certificates", Serial: c.serial_number, "Issued At": c.issued_at })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-orange-500/10 p-1.5 rounded-lg">
              <GraduationCap className="h-4 w-4 text-orange-500" />
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px]">Student Portal</Badge>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{institution?.name} · {format(new Date(), "EEEE, dd MMM yyyy")}</p>
        </div>
        <ExportButton data={allExportData} fileName="student-portal-full-export" sheetName="Student Data" label="Download All" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={s.action}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.bg} flex-shrink-0`}>
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{presentDays} / {totalDays} days</span>
              <span className={`font-bold text-xl font-display ${attPct >= 75 ? "text-green-500" : "text-destructive"}`}>{attPct}%</span>
            </div>
            <Progress value={attPct} className="h-2.5" />
            {attPct < 75 && totalDays > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Below 75% threshold — risk of shortage
              </p>
            )}
            {totalDays === 0 && <p className="text-xs text-muted-foreground">No records yet</p>}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myMarks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No published results yet</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-display font-bold text-primary">{avgScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {myMarks.slice(0, 3).map((m) => {
                    const pct = m.total_marks ? Math.round(m.total_marks) : 0;
                    return (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Result</span>
                        <span className={`font-semibold ${pct >= 50 ? "text-green-500" : "text-destructive"}`}>{m.total_marks} pts</span>
                      </div>
                    );
                  })}
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
          <TabsTrigger value="assignments">Tasks</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Courses */}
        <TabsContent value="courses" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{publishedCourses.length} published course{publishedCourses.length !== 1 ? "s" : ""}</p>
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-8" onClick={() => go("/courses")}>
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
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30">Published</Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1" onClick={(e) => { e.stopPropagation(); go("/courses"); }}>
                            Start <ArrowRight className="h-2.5 w-2.5" />
                          </Button>
                        </div>
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
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{activeAssignments.length} active</p>
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-8" onClick={() => go("/assignments")}>View All <ArrowRight className="h-3 w-3" /></Button>
          </div>
          {activeAssignments.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No active assignments" />
          ) : (
            <div className="space-y-3">
              {activeAssignments.map((a) => (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                      {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{a.total_marks} marks</span>
                        {a.due_date && (
                          <span className={`flex items-center gap-1 ${new Date(a.due_date) < new Date() ? "text-destructive" : ""}`}>
                            <Clock className="h-3 w-3" />Due: {format(new Date(a.due_date), "dd MMM")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs flex-shrink-0 gap-1" onClick={() => go("/assignments")}>
                      Submit <ArrowRight className="h-3 w-3" />
                    </Button>
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
                    <Button size="sm" className="mt-3 w-full h-8 text-xs gap-1" onClick={() => go("/quizzes")}>
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
          {myMarks.length === 0 ? (
            <EmptyState icon={BarChart3} message="No results published yet" />
          ) : (
            <div className="space-y-3">
              {myMarks.map((m, i) => {
                const pct = m.total_marks ? Math.round(m.total_marks) : 0;
                const pass = pct >= 50;
                return (
                  <Card key={m.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className={`h-4 w-4 ${pass ? "text-yellow-500" : "text-muted-foreground"}`} />
                          <span className="text-sm font-semibold">Result #{i + 1}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${pass ? "text-green-600 border-green-500/30" : "text-destructive border-destructive/30"}`}>
                          {pass ? "Pass" : "Fail"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Score: <span className="font-bold text-foreground">{m.total_marks} pts</span></span>
                        {m.theory_marks !== null && <span>Theory: {m.theory_marks}</span>}
                        {m.practical_marks !== null && <span>Practical: {m.practical_marks}</span>}
                      </div>
                      {m.remarks && <p className="text-xs text-muted-foreground mt-1.5 italic border-l-2 border-border pl-2">{m.remarks}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Present", value: presentDays, color: "text-green-500 bg-green-500/10" },
              { label: "Absent", value: attendance.filter((a) => a.status === "absent").length, color: "text-destructive bg-destructive/10" },
              { label: "Late", value: attendance.filter((a) => a.status === "late").length, color: "text-orange-500 bg-orange-500/10" },
            ].map((s) => (
              <Card key={s.label} className="border-border/50">
                <CardContent className={`p-3 text-center ${s.color} rounded-lg`}>
                  <p className="text-2xl font-display font-bold">{s.value}</p>
                  <p className="text-xs">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
              {attendance.length > 30 && (
                <p className="text-xs text-muted-foreground text-center pt-2">Showing last 30 records</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Certificates section */}
      {myCerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" /> My Certificates
            </h2>
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-8" onClick={() => go("/certificates")}>
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myCerts.slice(0, 4).map((c) => (
              <Card key={c.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">Certificate #{c.serial_number}</p>
                    <p className="text-xs text-muted-foreground">Issued: {format(new Date(c.issued_at), "dd MMM yyyy")}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-yellow-700 hover:bg-yellow-100">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
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
