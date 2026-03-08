import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, BookOpen, CalendarCheck, Award, AlertCircle, CheckCircle2,
  XCircle, Loader2, BarChart3, Star, Clock, Megaphone, HeartHandshake,
} from "lucide-react";
import { format } from "date-fns";
import AIDataExport from "@/components/ui/AIDataExport";

interface ChildInfo { userId: string; fullName: string; relationship: string }
interface AttSummary { total: number; present: number; absent: number; late: number; pct: number; recent: { date: string; status: string }[] }
interface EnrollInfo { title: string; status: string }
interface MarkInfo { total_marks: number | null; status: string; remarks: string | null }
interface CertInfo { serial_number: string; issued_at: string; template: string }
interface Announcement { id: string; title: string; content: string; is_pinned: boolean; created_at: string }

export default function ParentDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();

  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttSummary | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollInfo[]>([]);
  const [certs, setCerts] = useState<CertInfo[]>([]);
  const [marks, setMarks] = useState<MarkInfo[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [childDataLoading, setChildDataLoading] = useState(false);

  useEffect(() => {
    if (!user || !institution) return;
    Promise.all([fetchChildren(), fetchAnnouncements()]);
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

    const ids = links.map((l) => l.student_user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);

    const childData: ChildInfo[] = links.map((link) => {
      const p = profiles?.find((x) => x.user_id === link.student_user_id);
      return { userId: link.student_user_id, fullName: p?.full_name || "Student", relationship: link.relationship || "parent" };
    });

    setChildren(childData);
    if (childData.length > 0) setSelectedChild(childData[0].userId);
    setLoading(false);
  };

  const fetchChildData = async (studentId: string) => {
    setChildDataLoading(true);
    const [attRes, enrRes, certsRes, marksRes] = await Promise.all([
      supabase.from("attendance").select("status, date").eq("student_id", studentId).eq("institution_id", institution!.id).order("date", { ascending: false }).limit(30),
      supabase.from("course_enrollments").select("status, courses!course_id(title)").eq("student_id", studentId).eq("institution_id", institution!.id),
      supabase.from("issued_certificates").select("serial_number, issued_at, certificate_templates!template_id(name)").eq("student_id", studentId).eq("institution_id", institution!.id).eq("is_revoked", false),
      supabase.from("student_marks").select("total_marks, status, remarks").eq("student_id", studentId).eq("institution_id", institution!.id).eq("status", "approved"),
    ]);

    const att = attRes.data || [];
    const present = att.filter((a) => a.status === "present").length;
    setAttendance({
      total: att.length,
      present,
      absent: att.filter((a) => a.status === "absent").length,
      late: att.filter((a) => a.status === "late").length,
      pct: att.length > 0 ? Math.round((present / att.length) * 100) : 0,
      recent: att.slice(0, 7),
    });

    setEnrollments((enrRes.data || []).map((e: any) => ({ title: e.courses?.title || "Course", status: e.status })));
    setCerts((certsRes.data || []).map((c: any) => ({ serial_number: c.serial_number, issued_at: c.issued_at, template: c.certificate_templates?.name || "Certificate" })));
    setMarks((marksRes.data || []) as MarkInfo[]);
    setChildDataLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentChild = children.find((c) => c.userId === selectedChild);
  const avgScore = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.total_marks || 0), 0) / marks.length)
    : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-rose-500/10 p-1.5 rounded-lg">
              <HeartHandshake className="h-4 w-4 text-rose-500" />
            </div>
            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-[10px]">Parent Portal</Badge>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Parent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{institution?.name} · {format(new Date(), "EEEE, dd MMM yyyy")}</p>
        </div>
        <AIDataExport
          contextData={[
            ...(attendance?.recent ?? []).map((a) => ({ Section: "Attendance", Date: a.date, Status: a.status })),
            ...marks.map((m, i) => ({ Section: "Results", "#": i + 1, Score: m.total_marks ?? "", Status: m.status, Remarks: m.remarks ?? "" })),
            ...enrollments.map((e) => ({ Section: "Courses", Title: e.title, Status: e.status })),
            ...certs.map((c) => ({ Section: "Certificates", Serial: c.serial_number, "Issued At": c.issued_at, Template: c.template })),
          ]}
          label="AI Export"
          exportTitle={`${currentChild?.fullName ?? "Child"} Report`}
          fileName={`parent-portal-${currentChild?.fullName ?? "child"}-export`}
        />
      </div>

      {/* No children linked */}
      {children.length === 0 && (
        <>
          <Card className="border-2 border-dashed border-rose-200 bg-rose-50/30">
            <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
              <Users className="h-12 w-12 text-rose-300" />
              <h2 className="text-lg font-display font-bold">No Children Linked</h2>
              <p className="text-muted-foreground text-sm max-w-sm text-center">
                Contact your institution admin to link your parent account to your child's profile.
              </p>
            </CardContent>
          </Card>
          {announcements.length > 0 && <AnnouncementsCard announcements={announcements} />}
        </>
      )}

      {/* Children selector */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((c) => (
            <button
              key={c.userId}
              onClick={() => setSelectedChild(c.userId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedChild === c.userId
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border hover:bg-secondary"}`}
            >
              <Users className="h-4 w-4" /> {c.fullName}
            </button>
          ))}
        </div>
      )}

      {/* Child card */}
      {currentChild && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center font-bold text-primary text-xl flex-shrink-0">
              {currentChild.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-xl">{currentChild.fullName}</h2>
              <p className="text-sm text-muted-foreground capitalize">{currentChild.relationship} · {institution?.name}</p>
            </div>
            {attendance && (
              <div className="text-right flex-shrink-0">
                <p className={`text-3xl font-display font-bold ${attendance.pct >= 75 ? "text-green-500" : "text-destructive"}`}>
                  {attendance.pct}%
                </p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Present Days", value: attendance?.present ?? 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Absent Days", value: attendance?.absent ?? 0, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Avg Score", value: avgScore !== null ? `${avgScore}` : "—", icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
            { label: "Certificates", value: certs.length, icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
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
      )}

      {/* Tabs */}
      {children.length > 0 && (
        <Tabs defaultValue="attendance">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="announcements">Notices</TabsTrigger>
            </TabsList>
            <AIDataExport
              contextData={[
                ...attendance ? attendance.recent.map((a) => ({ Type: "Attendance", Date: a.date, Status: a.status })) : [],
                ...marks.map((m, i) => ({ Type: "Marks", Index: i + 1, "Total Marks": m.total_marks ?? "", Status: m.status, Remarks: m.remarks ?? "" })),
                ...certs.map((c) => ({ Type: "Certificate", Serial: c.serial_number, "Issued At": c.issued_at, Template: c.template })),
              ]}
              label="AI Export"
              exportTitle={`${currentChild?.fullName ?? "Child"} Full Report`}
              fileName={`child-report-${currentChild?.fullName ?? "child"}`}
            />
          </div>

          {/* Attendance */}
          <TabsContent value="attendance" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{attendance?.total ?? 0} records</p>
              <AIDataExport contextData={(attendance?.recent ?? []).map((a) => ({ Date: a.date, Status: a.status }))} label="Export Attendance" exportTitle="Attendance Records" fileName={`attendance-${currentChild?.fullName ?? "child"}`} />
            </div>
            {childDataLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : attendance ? (
              <>
                {attendance.pct < 75 && attendance.total > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Low Attendance Warning</p>
                      <p className="text-xs text-muted-foreground mt-1">Below 75% — ensure regular school attendance.</p>
                    </div>
                  </div>
                )}
                <Card className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{attendance.present} of {attendance.total} days present</span>
                      <span className={`font-bold ${attendance.pct >= 75 ? "text-green-500" : "text-destructive"}`}>{attendance.pct}%</span>
                    </div>
                    <Progress value={attendance.pct} className="h-2.5" />
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      {[
                        { label: "Present", value: attendance.present, color: "text-green-500" },
                        { label: "Absent", value: attendance.absent, color: "text-destructive" },
                        { label: "Late", value: attendance.late, color: "text-orange-500" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {attendance.recent.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Records</p>
                    {attendance.recent.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                        {a.status === "present" ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          : a.status === "late" ? <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                        <span className="text-sm flex-1">{format(new Date(a.date), "EEEE, dd MMM yyyy")}</span>
                        <Badge variant="outline" className={`text-[10px] capitalize ${a.status === "present" ? "text-green-600 border-green-500/30" : a.status === "late" ? "text-orange-600 border-orange-200" : "text-destructive border-destructive/30"}`}>{a.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={CalendarCheck} message="No attendance records yet" />
            )}
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-muted-foreground">{marks.length} result{marks.length !== 1 ? "s" : ""}</p>
              <AIDataExport contextData={marks.map((m, i) => ({ "#": i + 1, Score: m.total_marks ?? "", Result: (m.total_marks ?? 0) >= 50 ? "Pass" : "Fail", Remarks: m.remarks ?? "" }))} label="Export Results" exportTitle="Results" fileName={`results-${currentChild?.fullName ?? "child"}`} />
            </div>
            {childDataLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : marks.length === 0 ? (
              <EmptyState icon={BarChart3} message="No published results yet" />
            ) : (
              <div className="space-y-3">
                {marks.map((m, i) => {
                  const pct = m.total_marks || 0;
                  const pass = pct >= 50;
                  return (
                    <Card key={i} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className={`h-4 w-4 ${pass ? "text-yellow-500" : "text-muted-foreground"}`} />
                            <span className="text-sm font-semibold">Result #{i + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg font-display">{m.total_marks ?? "—"}</span>
                            <Badge variant="outline" className={`text-[10px] ${pass ? "text-green-600 border-green-500/30" : "text-destructive border-destructive/30"}`}>
                              {pass ? "Pass" : "Fail"}
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

          {/* Courses */}
          <TabsContent value="courses" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-muted-foreground">{enrollments.length} enrollment{enrollments.length !== 1 ? "s" : ""}</p>
              <ExportButton data={enrollments.map((e) => ({ Course: e.title, Status: e.status }))} fileName={`courses-${currentChild?.fullName ?? "child"}`} sheetName="Courses" />
            </div>
            {childDataLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : enrollments.length === 0 ? (
              <EmptyState icon={BookOpen} message="No course enrollments yet" />
            ) : (
              <div className="space-y-2">
                {enrollments.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-medium text-sm">{e.title}</p>
                    </div>
                    <Badge variant="outline" className={e.status === "completed" ? "text-green-600 border-green-500/30 text-[10px]" : "text-primary border-primary/20 text-[10px]"}>
                      {e.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Announcements */}
          <TabsContent value="announcements" className="mt-4">
            <AnnouncementsCard announcements={announcements} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AnnouncementsCard({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return <EmptyState icon={Megaphone} message="No announcements yet" />;
  }
  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <Card key={a.id} className={`border-border/50 ${a.is_pinned ? "border-primary/30 bg-primary/5" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              {a.is_pinned && <Badge className="text-[10px] bg-primary/20 text-primary border-0 flex-shrink-0 mt-0.5">PINNED</Badge>}
              <div>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.content}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{format(new Date(a.created_at), "dd MMM yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
