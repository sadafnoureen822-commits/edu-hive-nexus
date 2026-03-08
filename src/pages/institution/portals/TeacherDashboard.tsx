import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/lms/use-courses";
import { useAssignments } from "@/hooks/lms/use-assignments";
import { useQuizzes } from "@/hooks/lms/use-quizzes";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
import { useStudentMarksByInstitution } from "@/hooks/lms/use-student-marks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, ClipboardList, Users, CalendarCheck,
  CheckCircle2, Circle, Clock, AlertCircle, Save, ArrowRight,
  HelpCircle, PenSquare, TrendingUp, GraduationCap, BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ExportButton from "@/components/ui/ExportButton";

type AttStatus = "present" | "absent" | "late" | "excused";

export default function TeacherDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const instId = institution?.id ?? "";

  const { data: allCourses = [] } = useCourses(instId);
  const { data: allAssignments = [] } = useAssignments(instId);
  const { data: quizzes = [] } = useQuizzes(instId);
  const { data: students = [] } = useInstitutionMembers(instId, "student");
  const { data: allMarks = [] } = useStudentMarksByInstitution(instId);

  const [attDate, setAttDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: existingAtt = [] } = useAttendance(instId, attDate);
  const markAttendance = useMarkAttendance(instId);
  const [sheet, setSheet] = useState<Record<string, AttStatus>>({});

  // Filter my courses/assignments (created_by this teacher)
  const myCourses = allCourses.filter((c) => c.created_by === user?.id);
  const myAssignments = allAssignments.filter((a) => a.created_by === user?.id);
  const myQuizzes = quizzes.filter((q) => q.created_by === user?.id);

  const presentToday = existingAtt.filter((a) => a.status === "present").length;
  const attPct = students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0;

  // Student progress: approved marks grouped by student
  const studentProgress = students.map((s) => {
    const sMarks = allMarks.filter((m) => m.student_id === s.user_id && m.status === "approved");
    const avg = sMarks.length > 0
      ? Math.round(sMarks.reduce((acc, m) => acc + (m.total_marks || 0), 0) / sMarks.length)
      : null;
    return { ...s, marksCount: sMarks.length, avg };
  });

  const getStatus = (sid: string): AttStatus => {
    if (sheet[sid]) return sheet[sid];
    return (existingAtt.find((a) => a.student_id === sid)?.status as AttStatus) || "present";
  };

  const saveAttendance = async () => {
    if (!students.length) { toast.error("No students to mark"); return; }
    await markAttendance.mutateAsync(
      students.map((s) => ({ student_id: s.user_id, date: attDate, status: getStatus(s.user_id) }))
    );
    setSheet({});
  };

  const go = (path: string) => navigate(`/${slug}${path}`);

  const statusCfg: Record<AttStatus, { icon: React.ElementType; color: string }> = {
    present: { icon: CheckCircle2, color: "text-green-500" },
    late: { icon: Clock, color: "text-orange-500" },
    excused: { icon: AlertCircle, color: "text-blue-500" },
    absent: { icon: Circle, color: "text-destructive" },
  };

  const statCards = [
    { label: "My Courses", value: myCourses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", action: () => go("/courses") },
    { label: "My Assignments", value: myAssignments.length, icon: PenSquare, color: "text-orange-600", bg: "bg-orange-500/10", action: () => go("/assignments") },
    { label: "My Quizzes", value: myQuizzes.length, icon: HelpCircle, color: "text-violet-600", bg: "bg-violet-500/10", action: () => go("/quizzes") },
    { label: "Students", value: students.length, icon: Users, color: "text-accent", bg: "bg-accent/10" },
  ];

  // Bulk export data
  const allExportData = [
    ...myCourses.map((c) => ({ Section: "Courses", Title: c.title, Description: c.description ?? "", Status: c.status, Created: c.created_at })),
    ...myAssignments.map((a) => ({ Section: "Assignments", Title: a.title, "Total Marks": a.total_marks, "Passing Marks": a.passing_marks, Status: a.status, "Due Date": a.due_date ?? "" })),
    ...myQuizzes.map((q) => ({ Section: "Quizzes", Title: q.title, Description: q.description ?? "", Status: q.status, "Total Marks": q.total_marks, "Duration (min)": q.duration_minutes })),
    ...studentProgress.map((s) => ({ Section: "Students", Name: s.full_name ?? "", "Avg Score": s.avg ?? "", "Results Count": s.marksCount, Joined: s.created_at })),
    ...existingAtt.map((a) => ({ Section: "Attendance", Date: attDate, "Student ID": a.student_id, Status: a.status })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-violet-500/10 p-1.5 rounded-lg">
              <GraduationCap className="h-4 w-4 text-violet-600" />
            </div>
            <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50 text-[10px]">Teacher Portal</Badge>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Teacher"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{institution?.name} · {format(new Date(), "EEEE, dd MMM yyyy")}</p>
        </div>
        <ExportButton data={allExportData} fileName="teacher-portal-full-export" sheetName="Teacher Data" label="Download All" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className={`border-border/50 transition-shadow ${s.action ? "hover:shadow-md cursor-pointer" : ""}`} onClick={s.action}>
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

      {/* Today's Attendance Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Today's Attendance</span>
              <span className="text-xs text-muted-foreground">({format(new Date(attDate), "dd MMM yyyy")})</span>
            </div>
            <span className={`text-sm font-bold ${attPct >= 75 ? "text-green-500" : "text-destructive"}`}>{attPct}%</span>
          </div>
          <Progress value={attPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">{presentToday} of {students.length} students present</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">Students</TabsTrigger>
        </TabsList>

        {/* ── Attendance ── */}
        <TabsContent value="attendance" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" /> Mark Daily Attendance
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} className="w-36 h-8 text-xs" />
                  <Button size="sm" onClick={saveAttendance} disabled={markAttendance.isPending} className="gap-1.5 h-8 text-xs">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState icon={Users} message="No students in this institution yet" />
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {students.map((s, i) => {
                    const cur = getStatus(s.user_id);
                    const cfg = statusCfg[cur];
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-background">
                        <span className="text-xs text-muted-foreground w-5 text-center font-mono">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {(s.full_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.full_name || `Student ${i + 1}`}</p>
                        </div>
                        <cfg.icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
                        <Select value={cur} onValueChange={(v) => setSheet((p) => ({ ...p, [s.user_id]: v as AttStatus }))}>
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">✅ Present</SelectItem>
                            <SelectItem value="late">⏰ Late</SelectItem>
                            <SelectItem value="excused">ℹ️ Excused</SelectItem>
                            <SelectItem value="absent">❌ Absent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Courses ── */}
        <TabsContent value="courses" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{myCourses.length} course{myCourses.length !== 1 ? "s" : ""} created by you</p>
            <div className="flex gap-2">
              <ExportButton data={myCourses.map((c) => ({ Title: c.title, Description: c.description ?? "", Status: c.status, Created: c.created_at }))} fileName="my-courses" sheetName="Courses" />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => go("/courses")}>
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {myCourses.length === 0 ? (
            <EmptyState icon={BookOpen} message="You haven't created any courses yet" action={{ label: "Create Course", onClick: () => go("/courses") }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCourses.map((c) => (
                <Card key={c.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                        <Badge variant="outline" className={`mt-2 text-[10px] ${c.status === "published" ? "text-green-600 border-green-500/30" : "text-muted-foreground"}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Assignments ── */}
        <TabsContent value="assignments" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{myAssignments.length} assignment{myAssignments.length !== 1 ? "s" : ""} created by you</p>
            <div className="flex gap-2">
              <ExportButton data={myAssignments.map((a) => ({ Title: a.title, "Total Marks": a.total_marks, "Passing Marks": a.passing_marks, Status: a.status, "Due Date": a.due_date ?? "" }))} fileName="my-assignments" sheetName="Assignments" />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => go("/assignments")}>
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {myAssignments.length === 0 ? (
            <EmptyState icon={ClipboardList} message="You haven't created any assignments yet" action={{ label: "Create Assignment", onClick: () => go("/assignments") }} />
          ) : (
            <div className="space-y-2">
              {myAssignments.map((a) => (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <PenSquare className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {a.total_marks} marks
                        {a.due_date ? ` · Due: ${format(new Date(a.due_date), "dd MMM yyyy")}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${a.status === "active" ? "text-green-600 border-green-500/30" : "text-muted-foreground"}`}>
                      {a.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Student Progress ── */}
        <TabsContent value="progress" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{students.length} student{students.length !== 1 ? "s" : ""} enrolled</p>
            <ExportButton data={studentProgress.map((s) => ({ Name: s.full_name ?? "", "Avg Score": s.avg ?? "", "Results Count": s.marksCount, Joined: s.created_at }))} fileName="student-progress" sheetName="Students" />
          </div>
          {students.length === 0 ? (
            <EmptyState icon={Users} message="No students enrolled yet" />
          ) : (
            <div className="space-y-2">
              {studentProgress.map((s, i) => (
                <Card key={s.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {(s.full_name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.full_name || `Student ${i + 1}`}</p>
                      <p className="text-[11px] text-muted-foreground">Joined {format(new Date(s.created_at), "dd MMM yyyy")}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {s.avg !== null ? (
                        <>
                          <p className={`text-lg font-display font-bold ${s.avg >= 50 ? "text-green-500" : "text-destructive"}`}>{s.avg}</p>
                          <p className="text-[10px] text-muted-foreground">avg score</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No results</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className={`h-3.5 w-3.5 ${s.marksCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs text-muted-foreground">{s.marksCount} result{s.marksCount !== 1 ? "s" : ""}</span>
                    </div>
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

function EmptyState({ icon: Icon, message, action }: { icon: React.ElementType; message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <Card className="border-dashed border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        <Icon className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">{message}</p>
        {action && (
          <Button size="sm" variant="outline" onClick={action.onClick}>{action.label}</Button>
        )}
      </CardContent>
    </Card>
  );
}
