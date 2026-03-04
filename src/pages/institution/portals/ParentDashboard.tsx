import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface ChildInfo {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  relationship: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function ParentDashboard() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [enrollments, setEnrollments] = useState<{ title: string; status: string }[]>([]);
  const [certificates, setCertificates] = useState<{ serial_number: string; issued_at: string; template: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !institution) return;
    fetchChildren();
  }, [user, institution]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    setLoading(true);
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_user_id, relationship")
      .eq("parent_user_id", user!.id)
      .eq("institution_id", institution!.id);

    if (!links?.length) {
      setLoading(false);
      return;
    }

    const studentIds = links.map((l) => l.student_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", studentIds);

    const childData: ChildInfo[] = links.map((link) => {
      const profile = profiles?.find((p) => p.user_id === link.student_user_id);
      return {
        userId: link.student_user_id,
        fullName: profile?.full_name || "Student",
        avatarUrl: profile?.avatar_url || null,
        relationship: link.relationship || "parent",
      };
    });

    setChildren(childData);
    if (childData.length > 0) setSelectedChild(childData[0].userId);
    setLoading(false);
  };

  const fetchChildData = async (studentId: string) => {
    const [attendanceRes, enrollmentsRes, certsRes] = await Promise.all([
      supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId)
        .eq("institution_id", institution!.id),
      supabase
        .from("course_enrollments")
        .select("status, courses!course_id(title)")
        .eq("student_id", studentId)
        .eq("institution_id", institution!.id),
      supabase
        .from("issued_certificates")
        .select("serial_number, issued_at, certificate_templates!template_id(name)")
        .eq("student_id", studentId)
        .eq("institution_id", institution!.id)
        .eq("is_revoked", false),
    ]);

    // Attendance summary
    const att = attendanceRes.data || [];
    const summary: AttendanceSummary = {
      total: att.length,
      present: att.filter((a) => a.status === "present").length,
      absent: att.filter((a) => a.status === "absent").length,
      late: att.filter((a) => a.status === "late").length,
      percentage: att.length > 0 ? Math.round((att.filter((a) => a.status === "present").length / att.length) * 100) : 0,
    };
    setAttendanceSummary(summary);

    // Enrollments
    const enrData = (enrollmentsRes.data || []).map((e: { status: string; courses?: { title: string } | null }) => ({
      title: (e.courses as { title: string } | null)?.title || "Unknown Course",
      status: e.status,
    }));
    setEnrollments(enrData);

    // Certificates
    const certData = (certsRes.data || []).map((c: { serial_number: string; issued_at: string; certificate_templates?: { name: string } | null }) => ({
      serial_number: c.serial_number,
      issued_at: c.issued_at,
      template: (c.certificate_templates as { name: string } | null)?.name || "Certificate",
    }));
    setCertificates(certData);
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
      <div className="p-6 lg:p-8">
        <div className="text-center py-16 space-y-3">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h2 className="text-xl font-display font-bold">No Children Linked</h2>
          <p className="text-muted-foreground text-sm">
            Ask the institution admin to link your account to your child's profile.
          </p>
        </div>
      </div>
    );
  }

  const currentChild = children.find((c) => c.userId === selectedChild);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Parent Portal</h1>
        <p className="text-muted-foreground mt-1">Monitor your child's academic progress</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((child) => (
            <button
              key={child.userId}
              onClick={() => setSelectedChild(child.userId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedChild === child.userId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-secondary"
              }`}
            >
              <Users className="h-4 w-4" />
              {child.fullName}
            </button>
          ))}
        </div>
      )}

      {currentChild && (
        <div className="p-4 rounded-xl border border-border/50 bg-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">{currentChild.fullName}</h2>
            <p className="text-sm text-muted-foreground capitalize">{currentChild.relationship}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="attendance">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6 space-y-4">
          {attendanceSummary && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Days", value: attendanceSummary.total, icon: CalendarCheck, color: "text-primary" },
                  { label: "Present", value: attendanceSummary.present, icon: CheckCircle2, color: "text-green-500" },
                  { label: "Absent", value: attendanceSummary.absent, icon: XCircle, color: "text-destructive" },
                  { label: "Attendance %", value: `${attendanceSummary.percentage}%`, icon: TrendingUp, color: attendanceSummary.percentage >= 75 ? "text-green-500" : "text-destructive" },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {attendanceSummary.percentage < 75 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Low Attendance Warning</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your child's attendance is below the required 75% threshold. Please ensure regular attendance.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="space-y-3">
            {enrollments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No course enrollments yet</p>
              </div>
            ) : (
              enrollments.map((enr, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <p className="font-medium text-sm">{enr.title}</p>
                  </div>
                  <Badge variant="outline" className={enr.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}>
                    {enr.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No certificates issued yet</p>
              </div>
            ) : (
              certificates.map((cert, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{cert.template}</p>
                      <p className="text-xs text-muted-foreground font-mono">{cert.serial_number}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
