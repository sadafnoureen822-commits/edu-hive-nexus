import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/lms/use-courses";
import { useAssignments } from "@/hooks/lms/use-assignments";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudentMarksByInstitution } from "@/hooks/lms/use-student-marks";
import { useExams } from "@/hooks/exam/use-exams";
import { useAcademicSessions } from "@/hooks/exam/use-academic-sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, BookOpen, ClipboardList, CalendarCheck, GraduationCap,
  BarChart3, TrendingUp, School, ArrowRight, Award, ShieldCheck,
  PenSquare, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import ExportButton from "@/components/ui/ExportButton";

export default function PrincipalDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const instId = institution?.id ?? "";
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: students = [] } = useInstitutionMembers(instId, "student");
  const { data: teachers = [] } = useInstitutionMembers(instId, "teacher");
  const { data: courses = [] } = useCourses(instId);
  const { data: assignments = [] } = useAssignments(instId);
  const { data: todayAtt = [] } = useAttendance(instId, today);
  const { data: allMarks = [] } = useStudentMarksByInstitution(instId);
  const { sessions = [] } = useAcademicSessions();
  const { exams = [] } = useExams();

  const go = (path: string) => navigate(`/${slug}${path}`);

  const presentToday = todayAtt.filter((a) => a.status === "present").length;
  const attPct = students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0;
  const publishedCourses = courses.filter((c) => c.status === "published").length;
  const activeExams = exams.filter((e) => e.status === "active" || e.status === "scheduled").length;
  const approvedMarks = allMarks.filter((m) => m.status === "approved");
  const avgScore = approvedMarks.length > 0
    ? Math.round(approvedMarks.reduce((acc, m) => acc + (m.total_marks || 0), 0) / approvedMarks.length)
    : null;
  const currentSession = sessions.find((s) => s.is_current);

  const statCards = [
    { label: "Total Students", value: students.length, icon: Users, color: "text-primary", bg: "bg-primary/10", action: () => go("/student-profiles") },
    { label: "Teaching Staff", value: teachers.length, icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-500/10", action: () => go("/users") },
    { label: "Active Courses", value: publishedCourses, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10", action: () => go("/courses") },
    { label: "Active Exams", value: activeExams, icon: PenSquare, color: "text-orange-600", bg: "bg-orange-500/10", action: () => go("/exams") },
  ];

  // Teacher performance summary
  const teacherSummary = teachers.map((t) => {
    const tCourses = courses.filter((c) => c.created_by === t.user_id).length;
    const tAssignments = assignments.filter((a) => a.created_by === t.user_id).length;
    return { ...t, courseCount: tCourses, assignmentCount: tAssignments };
  });

  // Student mark summaries
  const studentSummary = students.map((s) => {
    const sMarks = approvedMarks.filter((m) => m.student_id === s.user_id);
    const avg = sMarks.length > 0
      ? Math.round(sMarks.reduce((acc, m) => acc + (m.total_marks || 0), 0) / sMarks.length)
      : null;
    return { ...s, avg, marksCount: sMarks.length };
  }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  // Bulk export
  const allExportData = [
    ...teacherSummary.map((t) => ({ Section: "Teachers", Name: t.full_name ?? "", Courses: t.courseCount, Assignments: t.assignmentCount, Joined: t.created_at })),
    ...studentSummary.map((s) => ({ Section: "Students", Name: s.full_name ?? "", "Avg Score": s.avg ?? "", "Results Count": s.marksCount })),
    ...exams.map((e) => ({ Section: "Exams", Name: e.name, Type: e.exam_type, Status: e.status, "Start Date": e.start_date ?? "" })),
    ...todayAtt.map((a) => ({ Section: "Attendance", Date: today, "Student ID": a.student_id, Status: a.status })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-teal-500/10 p-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
            </div>
            <Badge variant="outline" className="text-teal-600 border-teal-200 bg-teal-50 text-[10px]">
              Principal Portal
            </Badge>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Principal"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {institution?.name} · {format(new Date(), "EEEE, dd MMM yyyy")}
            {currentSession && <span> · Session: {currentSession.name}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportButton data={allExportData} fileName="principal-portal-full-export" sheetName="Principal Data" label="Download All" />
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => go("/exams")}>
            <PenSquare className="h-3.5 w-3.5" /> Exams
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => go("/marks")}>
            <BarChart3 className="h-3.5 w-3.5" /> View Results
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card
            key={s.label}
            className="border-border/50 transition-shadow hover:shadow-md cursor-pointer"
            onClick={s.action}
          >
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

      {/* Attendance + Avg Score summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Today's Attendance</span>
              </div>
              <span className={`text-sm font-bold ${attPct >= 75 ? "text-green-500" : "text-destructive"}`}>
                {attPct}%
              </span>
            </div>
            <Progress value={attPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {presentToday} of {students.length} students present
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold">Academic Performance</span>
            </div>
            {avgScore !== null ? (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-display font-bold text-foreground">{avgScore}</span>
                  <span className="text-sm text-muted-foreground mb-1">/ 100 avg score</span>
                </div>
                <p className="text-xs text-muted-foreground">Based on {approvedMarks.length} approved results</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No approved results yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="teachers">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="teachers">Teaching Staff</TabsTrigger>
          <TabsTrigger value="students">Student Results</TabsTrigger>
          <TabsTrigger value="exams">Exams & Sessions</TabsTrigger>
        </TabsList>

        {/* Teaching Staff */}
        <TabsContent value="teachers" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{teachers.length} teacher{teachers.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <ExportButton data={teacherSummary.map((t) => ({ Name: t.full_name ?? "", Courses: t.courseCount, Assignments: t.assignmentCount, Joined: t.created_at }))} fileName="teaching-staff" sheetName="Teachers" />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => go("/users")}>
                Manage Staff <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {teachers.length === 0 ? (
            <EmptyState icon={GraduationCap} message="No teachers assigned yet" />
          ) : (
            <div className="space-y-2">
              {teacherSummary.map((t, i) => (
                <Card key={t.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-violet-500/10 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-violet-600 flex-shrink-0">
                      {(t.full_name || "T").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.full_name || `Teacher ${i + 1}`}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.courseCount} course{t.courseCount !== 1 ? "s" : ""} · {t.assignmentCount} assignment{t.assignmentCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-200">
                        <BookOpen className="h-2.5 w-2.5 mr-1" />{t.courseCount}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200">
                        <ClipboardList className="h-2.5 w-2.5 mr-1" />{t.assignmentCount}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Student Results */}
        <TabsContent value="students" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{students.length} student{students.length !== 1 ? "s" : ""} · ranked by avg score</p>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => go("/marks")}>
              Full Results <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {students.length === 0 ? (
            <EmptyState icon={Users} message="No students enrolled yet" />
          ) : (
            <div className="space-y-2">
              {studentSummary.map((s, i) => (
                <Card key={s.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {(s.full_name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.full_name || `Student ${i + 1}`}</p>
                      <p className="text-[11px] text-muted-foreground">{s.marksCount} result{s.marksCount !== 1 ? "s" : ""}</p>
                    </div>
                    {i < 3 && s.avg !== null && (
                      <Award className={`h-4 w-4 flex-shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-600"}`} />
                    )}
                    <div className="text-right flex-shrink-0">
                      {s.avg !== null ? (
                        <>
                          <p className={`text-lg font-display font-bold ${s.avg >= 50 ? "text-green-500" : "text-destructive"}`}>{s.avg}</p>
                          <p className="text-[10px] text-muted-foreground">avg</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No results</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Exams & Sessions */}
        <TabsContent value="exams" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{exams.length} exam{exams.length !== 1 ? "s" : ""} total</p>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => go("/exams")}>
              Manage Exams <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {exams.length === 0 ? (
            <EmptyState icon={PenSquare} message="No exams created yet" action={{ label: "Create Exam", onClick: () => go("/exams") }} />
          ) : (
            <div className="space-y-2">
              {exams.slice(0, 10).map((e) => (
                <Card key={e.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-orange-500/10 p-2 rounded-lg flex-shrink-0">
                      <PenSquare className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{e.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.exam_type} · {e.start_date ? format(new Date(e.start_date), "dd MMM yyyy") : "No date set"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] flex-shrink-0 ${
                        e.status === "active" || e.status === "scheduled"
                          ? "text-green-600 border-green-500/30"
                          : e.status === "completed"
                          ? "text-muted-foreground"
                          : "text-orange-600 border-orange-500/30"
                      }`}
                    >
                      {e.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="border-dashed border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        <Icon className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">{message}</p>
        {action && (
          <Button size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
