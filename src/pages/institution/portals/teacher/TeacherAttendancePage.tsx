import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
import { useStudentMarksByInstitution, useUpsertStudentMark } from "@/hooks/lms/use-student-marks";
import { useExams } from "@/hooks/exam/use-exams";
import { useExamSubjects } from "@/hooks/exam/use-exam-subjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Save, CheckCircle2, Clock, AlertCircle, Circle, Users, BarChart3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ExportButton from "@/components/ui/ExportButton";

type AttStatus = "present" | "absent" | "late" | "excused";

export default function TeacherAttendancePage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const instId = institution?.id ?? "";

  const { data: students = [], isLoading: studLoading } = useInstitutionMembers(instId, "student");
  const [attDate, setAttDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: existingAtt = [], isLoading: attLoading } = useAttendance(instId, attDate);
  const markAttendance = useMarkAttendance(instId);
  const [sheet, setSheet] = useState<Record<string, AttStatus>>({});

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

  const presentCount = students.filter((s) => getStatus(s.user_id) === "present").length;
  const lateCount    = students.filter((s) => getStatus(s.user_id) === "late").length;
  const absentCount  = students.filter((s) => getStatus(s.user_id) === "absent").length;
  const attPct = students.length > 0 ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0;

  const statusCfg: Record<AttStatus, { icon: React.ElementType; color: string }> = {
    present: { icon: CheckCircle2, color: "text-green-500" },
    late:    { icon: Clock,        color: "text-orange-500" },
    excused: { icon: AlertCircle,  color: "text-blue-500" },
    absent:  { icon: Circle,       color: "text-destructive" },
  };

  const isLoading = studLoading || attLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark and manage daily student attendance</p>
        </div>
        <ExportButton
          data={students.map((s) => ({
            "Student ID": s.user_id,
            Date: attDate,
            Status: getStatus(s.user_id),
          }))}
          fileName={`attendance-${attDate}`}
          sheetName="Attendance"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Present", value: presentCount, color: "text-green-600", bg: "bg-green-500/10" },
          { label: "Late",    value: lateCount,    color: "text-orange-600", bg: "bg-orange-500/10" },
          { label: "Absent",  value: absentCount,  color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Total",   value: students.length, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Mark Attendance</CardTitle>
              <span className={`text-sm font-bold ml-2 ${attPct >= 75 ? "text-green-500" : "text-destructive"}`}>{attPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" value={attDate} onChange={(e) => { setAttDate(e.target.value); setSheet({}); }} className="w-36 h-8 text-xs" />
              <Button size="sm" onClick={saveAttendance} disabled={markAttendance.isPending || !students.length} className="gap-1.5 h-8 text-xs">
                {markAttendance.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>
          <Progress value={attPct} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No students enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
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
                      <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
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
    </div>
  );
}
