import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/lms/use-courses";
import { useAssignments } from "@/hooks/lms/use-assignments";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
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
  TrendingUp, HelpCircle, Award, PenSquare
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

export default function TeacherDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const institutionId = institution?.id ?? "";

  const { data: courses = [] } = useCourses(institutionId);
  const { data: assignments = [] } = useAssignments(institutionId);
  const { data: students = [] } = useInstitutionMembers(institutionId, "student");

  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: existingAttendance = [] } = useAttendance(institutionId, attendanceDate);
  const markAttendance = useMarkAttendance(institutionId);
  const [sheet, setSheet] = useState<Record<string, AttendanceStatus>>({});

  const myCourses = courses.filter((c) => c.created_by === user?.id || courses.length <= 3);
  const myAssignments = assignments.filter((a) => a.created_by === user?.id || assignments.length <= 3);
  const presentToday = existingAttendance.filter((a) => a.status === "present").length;
  const attendancePct = students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0;

  const getStatus = (studentId: string): AttendanceStatus => {
    if (sheet[studentId]) return sheet[studentId];
    const existing = existingAttendance.find((a) => a.student_id === studentId);
    return (existing?.status as AttendanceStatus) || "present";
  };

  const saveAttendance = async () => {
    if (students.length === 0) { toast.error("No students to mark"); return; }
    const records = students.map((s) => ({
      student_id: s.user_id,
      date: attendanceDate,
      status: getStatus(s.user_id),
    }));
    await markAttendance.mutateAsync(records);
    setSheet({});
  };

  const go = (path: string) => navigate(`/${slug}${path}`);

  const statCards = [
    { label: "My Courses", value: myCourses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Assignments", value: myAssignments.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-500/10" },
    { label: "Total Students", value: students.length, icon: Users, color: "text-accent", bg: "bg-accent/10" },
    { label: "Present Today", value: presentToday, icon: CalendarCheck, color: "text-green-600", bg: "bg-green-500/10" },
  ];

  const statusConfig: Record<AttendanceStatus, { icon: React.ElementType; color: string }> = {
    present: { icon: CheckCircle2, color: "text-green-500" },
    late: { icon: Clock, color: "text-orange-500" },
    excused: { icon: AlertCircle, color: "text-blue-500" },
    absent: { icon: Circle, color: "text-destructive" },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Teacher Portal</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/50">
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

      {/* Attendance Progress Bar */}
      {students.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Today's Attendance ({format(new Date(attendanceDate), "dd MMM")})</span>
              </div>
              <span className={`text-sm font-bold ${attendancePct >= 75 ? "text-green-500" : "text-destructive"}`}>{attendancePct}%</span>
            </div>
            <Progress value={attendancePct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">{presentToday} of {students.length} students present</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="attendance">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" /> Mark Daily Attendance
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-36 h-8 text-xs" />
                  <Button size="sm" onClick={saveAttendance} disabled={markAttendance.isPending} className="gap-1.5 h-8">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No students found in this institution</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((s, i) => {
                    const currentStatus = getStatus(s.user_id);
                    const cfg = statusConfig[currentStatus];
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-background">
                        <span className="text-xs text-muted-foreground w-5 text-center font-mono">{i + 1}</span>
                        <cfg.icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.full_name || `Student ${i + 1}`}</p>
                        </div>
                        <Select value={currentStatus} onValueChange={(v) => setSheet((prev) => ({ ...prev, [s.user_id]: v as AttendanceStatus }))}>
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

        {/* Courses */}
        <TabsContent value="courses" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">{courses.length} total course{courses.length !== 1 ? "s" : ""}</p>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => go("/courses")}>
              Manage Courses <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {courses.length === 0 ? (
            <EmptyState icon={BookOpen} message="No courses yet" action={{ label: "Create Course", onClick: () => go("/courses") }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => (
                <Card key={c.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                        <Badge variant="outline" className={`mt-2 text-[10px] ${c.status === "published" ? "text-green-600 border-green-500/30" : "text-muted-foreground"}`}>{c.status}</Badge>
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
            <p className="text-sm font-medium text-muted-foreground">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</p>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => go("/assignments")}>
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {assignments.length === 0 ? (
            <EmptyState icon={PenSquare} message="No assignments yet" action={{ label: "Create Assignment", onClick: () => go("/assignments") }} />
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
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

        {/* Students */}
        <TabsContent value="students" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">{students.length} student{students.length !== 1 ? "s" : ""} enrolled</p>
          </div>
          {students.length === 0 ? (
            <EmptyState icon={Users} message="No students enrolled yet" />
          ) : (
            <div className="space-y-2">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card">
                  <div className="bg-primary/10 rounded-full w-9 h-9 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {(s.full_name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.full_name || `Student ${i + 1}`}</p>
                    <p className="text-[11px] text-muted-foreground">Joined {format(new Date(s.created_at), "dd MMM yyyy")}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/20">student</Badge>
                </div>
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
