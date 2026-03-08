import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, BookOpen, CalendarCheck, Award, TrendingUp,
  AlertCircle, CheckCircle2, XCircle, Loader2, BarChart3,
  Star, Clock, Megaphone
} from "lucide-react";
import { format } from "date-fns";

interface ChildInfo {
  userId: string;
  fullName: string;
  relationship: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  recent: { date: string; status: string }[];
}

interface EnrollmentInfo {
  title: string;
  status: string;
}

interface MarkInfo {
  total_marks: number | null;
  status: string;
  remarks: string | null;
}

interface CertInfo {
  serial_number: string;
  issued_at: string;
  template: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export default function ParentDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentInfo[]>([]);
  const [certificates, setCertificates] = useState<CertInfo[]>([]);
  const [marks, setMarks] = useState<MarkInfo[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !institution) return;
    fetchChildren();
    fetchAnnouncements();
  }, [user, institution]);

  useEffect(() => {
    if (selectedChild) fetchChildData(selectedChild);
  }, [selectedChild]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("id, title, content, is_pinned, created_at")
      .eq("institution_id", institution!.id)
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);
    setAnnouncements(data || []);
  };

  const fetchChildren = async () => {
    setLoading(true);
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_user_id, relationship")
      .eq("parent_user_id", user!.id)
      .eq("institution_id", institution!.id);

    if (!links?.length) { setLoading(false); return; }

    const studentIds = links.map((l) => l.student_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", studentIds);

    const childData: ChildInfo[] = links.map((link) => {
      const profile = profiles?.find((p) => p.user_id === link.student_user_id);
      return {
        userId: link.student_user_id,
        fullName: profile?.full_name || "Student",
        relationship: link.relationship || "parent",
      };
    });

    setChildren(childData);
    if (childData.length > 0) setSelectedChild(childData[0].userId);
    setLoading(false);
  };

  const fetchChildData = async (studentId: string) => {
    const [attRes, enrRes, certsRes, marksRes] = await Promise.all([
      supabase.from("attendance").select("status, date").eq("student_id", studentId).eq("institution_id", institution!.id).order("date", { ascending: false }).limit(30),
      supabase.from("course_enrollments").select("status, courses!course_id(title)").eq("student_id", studentId).eq("institution_id", institution!.id),
      supabase.from("issued_certificates").select("serial_number, issued_at, certificate_templates!template_id(name)").eq("student_id", studentId).eq("institution_id", institution!.id).eq("is_revoked", false),
      supabase.from("student_marks").select("total_marks, status, remarks").eq("student_id", studentId).eq("institution_id", institution!.id).eq("status", "approved"),
    ]);

    const att = attRes.data || [];
    setAttendanceSummary({
      total: att.length,
      present: att.filter((a) => a.status === "present").length,
      absent: att.filter((a) => a.status === "absent").length,
      late: att.filter((a) => a.status === "late").length,
      percentage: att.length > 0 ? Math.round((att.filter((a) => a.status === "present").length / att.length) * 100) : 0,
      recent: att.slice(0, 7),
    });

    setEnrollments((enrRes.data || []).map((e: any) => ({
      title: e.courses?.title || "Course",
      status: e.status,
    })));

    setCertificates((certsRes.data || []).map((c: any) => ({
      serial_number: c.serial_number,
      issued_at: c.issued_at,
      template: c.certificate_templates?.name || "Certificate",
    })));

    setMarks((marksRes.data || []) as MarkInfo[]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Parent Portal</h1>
          <p className="text-muted-foreground mt-1">Monitor your child's progress</p>
        </div>
        <div className="text-center py-16 space-y-3 border-2 border-dashed border-border rounded-xl">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h2 className="text-lg font-display font-bold">No Children Linked</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Ask your institution admin to link your parent account to your child's profile.
          </p>
        </div>

        {/* Show announcements even without children linked */}
        {announcements.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border border-border/50 bg-background">
                  <div className="flex items-start gap-2">
                    {a.is_pinned && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold flex-shrink-0 mt-0.5">PINNED</span>}
                    <div>
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.created_at), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const currentChild = children.find((c) => c.userId === selectedChild);
  const avgScore = marks.length > 0
    ? Math.round(marks.reduce((sum, m) => sum + (m.total_marks || 0), 0) / marks.length)
    : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Parent Portal</h1>
        <p className="text-muted-foreground mt-1">Monitor your child's academic progress</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((child) => (
            <button key={child.userId} onClick={() => setSelectedChild(child.userId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedChild === child.userId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-secondary"}`}>
              <Users className="h-4 w-4" />{child.fullName}
            </button>
          ))}
        </div>
      )}

      {/* Child Info Card */}
      {currentChild && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
              {currentChild.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg">{currentChild.fullName}</h2>
              <p className="text-sm text-muted-foreground capitalize">{currentChild.relationship}</p>
            </div>
            {attendanceSummary && (
              <div className="text-right">
                <p className={`text-2xl font-display font-bold ${attendanceSummary.percentage >= 75 ? "text-green-500" : "text-destructive"}`}>
                  {attendanceSummary.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Present Days", value: attendanceSummary?.present ?? 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Absent Days", value: attendanceSummary?.absent ?? 0, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Avg Score", value: avgScore !== null ? `${avgScore}` : "—", icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
          { label: "Certificates", value: certificates.length, icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
        ].map((s) => (
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

      <Tabs defaultValue="attendance">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="announcements">Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          {attendanceSummary && (
            <>
              {attendanceSummary.percentage < 75 && attendanceSummary.total > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Low Attendance Warning</p>
                    <p className="text-xs text-muted-foreground mt-1">Attendance is below 75% threshold. Please ensure regular school attendance.</p>
                  </div>
                </div>
              )}
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{attendanceSummary.present} of {attendanceSummary.total} days present</span>
                    <span className={`font-bold ${attendanceSummary.percentage >= 75 ? "text-green-500" : "text-destructive"}`}>{attendanceSummary.percentage}%</span>
                  </div>
                  <Progress value={attendanceSummary.percentage} className="h-2.5" />
                </CardContent>
              </Card>
              {attendanceSummary.recent.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Attendance</p>
                  {attendanceSummary.recent.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                      {a.status === "present" ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : a.status === "late" ? <Clock className="h-4 w-4 text-orange-500" />
                        : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="text-sm flex-1">{format(new Date(a.date), "EEEE, dd MMM")}</span>
                      <Badge variant="outline" className={`text-[10px] capitalize ${a.status === "present" ? "text-green-600 border-green-500/30" : a.status === "late" ? "text-orange-600" : "text-destructive border-destructive/30"}`}>{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {marks.length === 0 ? (
            <EmptyState icon={BarChart3} message="No results published yet" />
          ) : (
            <div className="space-y-3">
              {marks.map((m, i) => {
                const pct = m.total_marks || 0;
                return (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className={`h-4 w-4 ${pct >= 50 ? "text-yellow-500" : "text-muted-foreground"}`} />
                          <span className="text-sm font-semibold">Result #{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{m.total_marks ?? "—"}</span>
                          <Badge variant="outline" className={`text-[10px] ${pct >= 50 ? "text-green-600 border-green-500/30" : "text-destructive border-destructive/30"}`}>
                            {pct >= 50 ? "Pass" : "Fail"}
                          </Badge>
                        </div>
                      </div>
                      {m.remarks && <p className="text-xs text-muted-foreground mt-1.5 italic">{m.remarks}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          {enrollments.length === 0 ? (
            <EmptyState icon={BookOpen} message="No course enrollments yet" />
          ) : (
            <div className="space-y-2">
              {enrollments.map((enr, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">{enr.title}</p>
                  </div>
                  <Badge variant="outline" className={enr.status === "completed" ? "text-green-600 border-green-500/30" : "text-primary border-primary/20"}>
                    {enr.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} message="No announcements yet" />
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <Card key={a.id} className={`border-border/50 ${a.is_pinned ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      {a.is_pinned && <Badge className="text-[10px] bg-primary/20 text-primary border-0 flex-shrink-0">PINNED</Badge>}
                      <div>
                        <p className="text-sm font-semibold">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">{format(new Date(a.created_at), "dd MMM yyyy")}</p>
                      </div>
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
