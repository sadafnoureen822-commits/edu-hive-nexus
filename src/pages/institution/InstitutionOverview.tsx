import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, BookOpen, TrendingUp, CalendarDays,
  UserCheck, ClipboardList, DollarSign, Award, Activity, ArrowRight, Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalCourses: number;
  totalAssignments: number;
  pendingAdmissions: number;
  totalCertificates: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
}

export default function InstitutionOverview() {
  const { institution } = useTenant();
  const { slug } = useParams<{ slug: string }>();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0, totalTeachers: 0, totalClasses: 0,
    totalSubjects: 0, totalCourses: 0, totalAssignments: 0,
    pendingAdmissions: 0, totalCertificates: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institution?.id) return;
    const id = institution.id;

    const fetchAll = async () => {
      setLoading(true);
      const [
        studentsRes, teachersRes, classesRes, subjectsRes,
        coursesRes, assignmentsRes, admissionsRes, certsRes, activityRes,
      ] = await Promise.all([
        supabase.from("institution_members").select("id", { count: "exact", head: true }).eq("institution_id", id).eq("role", "student"),
        supabase.from("institution_members").select("id", { count: "exact", head: true }).eq("institution_id", id).eq("role", "teacher"),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("institution_id", id).eq("is_active", true),
        supabase.from("subjects").select("id", { count: "exact", head: true }).eq("institution_id", id),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("institution_id", id),
        supabase.from("assignments").select("id", { count: "exact", head: true }).eq("institution_id", id).eq("status", "active"),
        supabase.from("admission_applications").select("id", { count: "exact", head: true }).eq("institution_id", id).eq("status", "pending"),
        supabase.from("issued_certificates").select("id", { count: "exact", head: true }).eq("institution_id", id).eq("is_revoked", false),
        supabase.from("activity_logs").select("id, action, entity_type, created_at").eq("institution_id", id).order("created_at", { ascending: false }).limit(8),
      ]);

      setStats({
        totalStudents: studentsRes.count ?? 0,
        totalTeachers: teachersRes.count ?? 0,
        totalClasses: classesRes.count ?? 0,
        totalSubjects: subjectsRes.count ?? 0,
        totalCourses: coursesRes.count ?? 0,
        totalAssignments: assignmentsRes.count ?? 0,
        pendingAdmissions: admissionsRes.count ?? 0,
        totalCertificates: certsRes.count ?? 0,
      });
      setActivities((activityRes.data as RecentActivity[]) || []);
      setLoading(false);
    };

    fetchAll();
  }, [institution?.id]);

  const statCards = [
    { label: "Total Students", value: stats.totalStudents, icon: GraduationCap, color: "text-primary", bg: "bg-primary/10", href: "/users" },
    { label: "Teachers", value: stats.totalTeachers, icon: UserCheck, color: "text-accent", bg: "bg-accent/10", href: "/users" },
    { label: "Active Classes", value: stats.totalClasses, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", href: "/academics" },
    { label: "Subjects", value: stats.totalSubjects, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10", href: "/academics" },
    { label: "Courses (LMS)", value: stats.totalCourses, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", href: "/courses" },
    { label: "Active Assignments", value: stats.totalAssignments, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-500/10", href: "/assignments" },
    { label: "Pending Admissions", value: stats.pendingAdmissions, icon: Users, color: "text-yellow-600", bg: "bg-yellow-500/10", href: "/admissions" },
    { label: "Certificates Issued", value: stats.totalCertificates, icon: Award, color: "text-yellow-600", bg: "bg-yellow-500/10", href: "/certificates" },
  ];

  const quickActions = [
    { label: "Manage Users", href: "/users", icon: Users },
    { label: "Academic Setup", href: "/academics", icon: GraduationCap },
    { label: "Exam Management", href: "/exams", icon: ClipboardList },
    { label: "LMS Courses", href: "/courses", icon: BookOpen },
    { label: "Fee Management", href: "/fees", icon: DollarSign },
    { label: "View Admissions", href: "/admissions", icon: Activity },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {institution?.name} — Overview
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
          {institution?.status}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <Link key={card.label} to={`/${slug}${card.href}`}>
                <Card className="border-border/50 hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-display font-bold">{card.value}</p>
                      </div>
                      <div className={`${card.bg} p-2 rounded-lg`}>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No activity yet — start using the platform!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium capitalize">{a.action.replace(/_/g, " ")}</span>
                          {a.entity_type && (
                            <span className="text-muted-foreground"> · {a.entity_type}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {format(new Date(a.created_at), "dd MMM, HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action) => (
                  <Link key={action.label} to={`/${slug}${action.href}`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm h-9 px-3 hover:bg-primary/5 hover:text-primary"
                    >
                      <div className="flex items-center gap-2">
                        <action.icon className="h-3.5 w-3.5" />
                        {action.label}
                      </div>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
