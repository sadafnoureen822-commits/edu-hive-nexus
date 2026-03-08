import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2, Globe, Users, Activity, TrendingUp, CreditCard,
  DollarSign, CheckCircle2, AlertCircle, Clock, ArrowRight, BarChart3
} from "lucide-react";
import AIDataExport from "@/components/ui/AIDataExport";
import { format } from "date-fns";

interface PlatformStats {
  totalInstitutions: number;
  activeInstitutions: number;
  suspendedInstitutions: number;
  totalMembers: number;
  totalDomains: number;
  totalRevenue: number;
  pendingInvoices: number;
}

interface Institution {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  memberCount?: number;
}

interface PlanBreakdown {
  plan: string;
  count: number;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>({
    totalInstitutions: 0,
    activeInstitutions: 0,
    suspendedInstitutions: 0,
    totalMembers: 0,
    totalDomains: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
  });
  const [recentInstitutions, setRecentInstitutions] = useState<Institution[]>([]);
  const [plans, setPlans] = useState<PlanBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [instRes, membersRes, domainsRes, invoicesRes, subsRes, plansRes] = await Promise.all([
      supabase.from("institutions").select("id, name, slug, status, created_at").order("created_at", { ascending: false }),
      supabase.from("institution_members").select("id", { count: "exact", head: true }),
      supabase.from("institution_domains").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("amount, status"),
      supabase.from("institution_subscriptions").select("status, plan_id, subscription_plans(name)"),
      supabase.from("subscription_plans").select("id, name"),
    ]);

    const institutions = instRes.data || [];
    const invoices = invoicesRes.data || [];
    const subs = (subsRes.data || []) as { status: string; plan_id: string | null; subscription_plans?: { name: string } | null }[];

    const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingInvoices = invoices.filter((i) => i.status === "pending").length;

    // Plan breakdown
    const planCounts: Record<string, number> = {};
    subs.forEach((s) => {
      const name = (s.subscription_plans as { name: string } | null)?.name || "No Plan";
      planCounts[name] = (planCounts[name] || 0) + 1;
    });
    const colors = ["text-primary", "text-accent", "text-orange-500", "text-purple-500"];
    const planBreakdown = Object.entries(planCounts).map(([plan, count], i) => ({
      plan, count, color: colors[i % colors.length]
    }));

    setStats({
      totalInstitutions: institutions.length,
      activeInstitutions: institutions.filter((i) => i.status === "active").length,
      suspendedInstitutions: institutions.filter((i) => i.status === "suspended").length,
      totalMembers: membersRes.count || 0,
      totalDomains: domainsRes.count || 0,
      totalRevenue,
      pendingInvoices,
    });

    setRecentInstitutions(institutions.slice(0, 6));
    setPlans(planBreakdown);
    setLoading(false);
  };

  const statCards = [
    { label: "Total Institutions", value: stats.totalInstitutions, icon: Building2, color: "text-primary", bg: "bg-primary/10", sub: `${stats.activeInstitutions} active` },
    { label: "Total Members", value: stats.totalMembers, icon: Users, color: "text-accent", bg: "bg-accent/10", sub: "across all institutions" },
    { label: "Total Domains", value: stats.totalDomains, icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10", sub: "mapped domains" },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", sub: `${stats.pendingInvoices} pending` },
  ];

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    suspended: "bg-destructive/10 text-destructive border-destructive/20",
    pending: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    inactive: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform-wide management and revenue overview</p>
        </div>
        <div className="flex items-center gap-2">
          <AIDataExport
            contextData={[
              ...recentInstitutions.map((i) => ({ Section: "Institutions", Name: i.name, Slug: i.slug, Status: i.status, Created: i.created_at })),
              { Section: "Stats", Metric: "Total Institutions", Value: stats.totalInstitutions },
              { Section: "Stats", Metric: "Active Institutions", Value: stats.activeInstitutions },
              { Section: "Stats", Metric: "Total Members", Value: stats.totalMembers },
              { Section: "Stats", Metric: "Total Revenue", Value: stats.totalRevenue },
            ]}
            label="AI Export"
            exportTitle="Platform Dashboard Report"
            fileName="admin-dashboard"
          />
          <Button onClick={() => navigate("/admin/institutions")} className="gap-2">
            <Building2 className="h-4 w-4" /> Manage Institutions
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Institutions */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Recent Institutions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/institutions")} className="gap-1 text-xs">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentInstitutions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No institutions yet</p>
              ) : (
                recentInstitutions.map((inst) => (
                  <div key={inst.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/institutions/${inst.id}`)}>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">{inst.slug} · {format(new Date(inst.created_at), "dd MMM yyyy")}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusColor[inst.status] || statusColor.inactive}`}>
                      {inst.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Platform Health */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Active Rate</span>
                  <span className="font-semibold text-primary">
                    {stats.totalInstitutions > 0 ? Math.round((stats.activeInstitutions / stats.totalInstitutions) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={stats.totalInstitutions > 0 ? (stats.activeInstitutions / stats.totalInstitutions) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-display font-bold text-green-600">{stats.activeInstitutions}</p>
                  <p className="text-[10px] text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive mx-auto mb-1" />
                  <p className="text-lg font-display font-bold text-destructive">{stats.suspendedInstitutions}</p>
                  <p className="text-[10px] text-muted-foreground">Suspended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Breakdown */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No subscriptions yet</p>
              ) : (
                <div className="space-y-2">
                  {plans.map((p) => (
                    <div key={p.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className={`h-3.5 w-3.5 ${p.color}`} />
                        <span className="text-xs text-muted-foreground">{p.plan}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{p.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full mt-4 text-xs gap-1" onClick={() => navigate("/admin/billing")}>
                <TrendingUp className="h-3 w-3" /> Revenue Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
