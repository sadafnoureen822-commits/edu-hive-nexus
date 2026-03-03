import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { useAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, CheckCircle2, Circle, Clock, AlertCircle, Users, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function AttendancePage() {
  const { institution } = useTenant();
  const institutionId = institution?.id ?? "";

  const { data: students = [] } = useInstitutionMembers(institutionId, "student");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: dayAttendance = [] } = useAttendance(institutionId, selectedDate);
  const { data: allAttendance = [] } = useAttendance(institutionId);

  const presentToday = dayAttendance.filter((a) => a.status === "present").length;
  const absentToday = dayAttendance.filter((a) => a.status === "absent").length;
  const lateToday = dayAttendance.filter((a) => a.status === "late").length;
  const totalStudents = students.length;

  // Per-student stats
  const getStudentStats = (userId: string) => {
    const records = allAttendance.filter((a) => a.student_id === userId);
    const present = records.filter((a) => a.status === "present" || a.status === "late").length;
    const total = records.length;
    return { present, total, pct: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const statusColor: Record<string, string> = {
    present: "text-primary border-primary/30",
    late: "text-orange-600 border-orange-200",
    excused: "text-blue-600 border-blue-200",
    absent: "text-destructive border-destructive/30",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Track and manage student attendance</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalStudents, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Present Today", value: presentToday, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
          { label: "Absent Today", value: absentToday, icon: Circle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Late Today", value: lateToday, icon: Clock, color: "text-orange-600", bg: "bg-orange-500/10" },
        ].map((s) => (
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

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="students">Student Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm">Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {format(new Date(selectedDate), "EEEE, dd MMMM yyyy")} — {dayAttendance.length} records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance marked for this date</p>
              ) : (
                <div className="space-y-2">
                  {dayAttendance.map((a) => {
                    const student = students.find((s) => s.user_id === a.student_id);
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                        <div className="bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {(student?.full_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm flex-1 truncate">{student?.full_name || a.student_id.slice(0, 8) + "..."}</span>
                        {a.notes && <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">{a.notes}</span>}
                        <Badge variant="outline" className={`text-[10px] capitalize flex-shrink-0 ${statusColor[a.status] || ""}`}>
                          {a.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Users className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">No students found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((s, i) => {
                    const stats = getStudentStats(s.user_id);
                    return (
                      <div key={s.id} className="flex items-center gap-4 p-4">
                        <div className="bg-primary/10 rounded-full w-9 h-9 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {(s.full_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{s.full_name || `Student ${i + 1}`}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <Progress value={stats.pct} className="h-1.5 flex-1" />
                            <span className={`text-xs font-medium w-10 text-right ${stats.pct >= 75 ? "text-primary" : "text-destructive"}`}>
                              {stats.pct}%
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{stats.present} / {stats.total} days present</p>
                        </div>
                        {stats.pct < 75 && (
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
