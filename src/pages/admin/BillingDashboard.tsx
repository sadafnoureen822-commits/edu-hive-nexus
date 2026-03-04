import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  DollarSign,
  Package,
  Plus,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Edit2,
  Loader2,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_students: number | null;
  max_teachers: number | null;
  features: string[];
  is_active: boolean;
  is_trial: boolean;
}

interface Subscription {
  id: string;
  institution_id: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  institutions: { name: string; slug: string };
  subscription_plans: { name: string; price_monthly: number } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  institutions: { name: string };
}

export default function BillingDashboard() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [planForm, setPlanForm] = useState({ name: "", description: "", price_monthly: "", price_yearly: "", max_students: "", max_teachers: "" });
  const [assignForm, setAssignForm] = useState({ institution_id: "", plan_id: "", billing_cycle: "monthly" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [plansRes, subsRes, invoicesRes, instsRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("price_monthly"),
      supabase.from("institution_subscriptions").select("*, institutions!institution_id(name,slug), subscription_plans!plan_id(name,price_monthly)").order("created_at", { ascending: false }),
      supabase.from("invoices").select("*, institutions!institution_id(name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("institutions").select("id, name"),
    ]);
    setPlans((plansRes.data || []) as Plan[]);
    setSubscriptions((subsRes.data || []) as unknown as Subscription[]);
    setInvoices((invoicesRes.data || []) as unknown as Invoice[]);
    setInstitutions(instsRes.data || []);
    setLoading(false);
  };

  const savePlan = async () => {
    setSaving(true);
    const { error } = await supabase.from("subscription_plans").insert({
      name: planForm.name,
      description: planForm.description || null,
      price_monthly: parseFloat(planForm.price_monthly) || 0,
      price_yearly: parseFloat(planForm.price_yearly) || 0,
      max_students: planForm.max_students ? parseInt(planForm.max_students) : null,
      max_teachers: planForm.max_teachers ? parseInt(planForm.max_teachers) : null,
      features: [],
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plan created" });
    setShowPlanDialog(false);
    setPlanForm({ name: "", description: "", price_monthly: "", price_yearly: "", max_students: "", max_teachers: "" });
    fetchAll();
  };

  const assignPlan = async () => {
    setSaving(true);
    const plan = plans.find((p) => p.id === assignForm.plan_id);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (assignForm.billing_cycle === "yearly" ? 12 : 1));

    const { error } = await supabase.from("institution_subscriptions").upsert({
      institution_id: assignForm.institution_id,
      plan_id: assignForm.plan_id,
      billing_cycle: assignForm.billing_cycle,
      status: plan?.is_trial ? "trial" : "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_ends_at: plan?.is_trial ? periodEnd.toISOString() : null,
    }, { onConflict: "institution_id" });

    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plan assigned successfully" });
    setShowAssignDialog(false);
    fetchAll();
  };

  const updateSubscriptionStatus = async (subId: string, status: string) => {
    const { error } = await supabase.from("institution_subscriptions").update({
      status,
      suspended_at: status === "suspended" ? new Date().toISOString() : null,
    }).eq("id", subId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Subscription ${status}` });
    fetchAll();
  };

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount), 0);
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length;
  const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-accent/10 text-accent border-accent/20";
      case "trial": return "bg-primary/10 text-primary border-primary/20";
      case "past_due": return "bg-destructive/10 text-destructive border-destructive/20";
      case "suspended": return "bg-destructive/10 text-destructive border-destructive/20";
      case "paid": return "bg-accent/10 text-accent border-accent/20";
      case "overdue": return "bg-destructive/10 text-destructive border-destructive/20";
      case "pending": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Billing & Revenue</h1>
          <p className="text-muted-foreground mt-1">Manage subscription plans and institution billing</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline"><Building2 className="h-4 w-4 mr-2" />Assign Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Subscription Plan</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Select value={assignForm.institution_id} onValueChange={(v) => setAssignForm({ ...assignForm, institution_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                    <SelectContent>{institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={assignForm.plan_id} onValueChange={(v) => setAssignForm({ ...assignForm, plan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>{plans.filter((p) => p.is_active).map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — ${p.price_monthly}/mo</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select value={assignForm.billing_cycle} onValueChange={(v) => setAssignForm({ ...assignForm, billing_cycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly (save ~17%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={assignPlan} disabled={saving || !assignForm.institution_id || !assignForm.plan_id}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Assign Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Subscription Plan</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                {[
                  { label: "Plan Name", key: "name", placeholder: "e.g. Enterprise" },
                  { label: "Description", key: "description", placeholder: "Brief description" },
                  { label: "Monthly Price (USD)", key: "price_monthly", placeholder: "99" },
                  { label: "Yearly Price (USD)", key: "price_yearly", placeholder: "990" },
                  { label: "Max Students (blank = unlimited)", key: "max_students", placeholder: "500" },
                  { label: "Max Teachers (blank = unlimited)", key: "max_teachers", placeholder: "50" },
                ].map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    <Input value={planForm[f.key as keyof typeof planForm]} onChange={(e) => setPlanForm({ ...planForm, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  </div>
                ))}
                <Button className="w-full" onClick={savePlan} disabled={saving || !planForm.name}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
          { label: "Active Subscriptions", value: activeSubscriptions, icon: CheckCircle2, color: "text-primary" },
          { label: "Total Plans", value: plans.length, icon: Package, color: "text-accent" },
          { label: "Overdue Invoices", value: overdueInvoices, icon: AlertCircle, color: overdueInvoices > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Institution Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No subscriptions yet. Assign a plan to an institution.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{(sub.institutions as { name: string })?.name}</p>
                          <p className="text-xs text-muted-foreground">{(sub.subscription_plans as { name: string } | null)?.name || "No plan"} · {sub.billing_cycle}</p>
                          {sub.current_period_end && (
                            <p className="text-xs text-muted-foreground">Renews: {new Date(sub.current_period_end).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColor(sub.status)}>{sub.status}</Badge>
                        {sub.status === "active" && (
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => updateSubscriptionStatus(sub.id, "suspended")}>Suspend</Button>
                        )}
                        {sub.status === "suspended" && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-500/20 hover:bg-green-500/10" onClick={() => updateSubscriptionStatus(sub.id, "active")}>Reactivate</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />Invoice History</CardTitle>
              <CardDescription>All invoices across institutions</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30">
                      <div>
                        <p className="text-sm font-mono font-medium">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{(inv.institutions as { name: string })?.name}</p>
                        {inv.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>}
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-sm">${Number(inv.amount).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{inv.currency}</p>
                        </div>
                        <Badge variant="outline" className={statusColor(inv.status)}>{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans */}
        <TabsContent value="plans" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`border-border/50 ${!plan.is_active ? "opacity-50" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-display">{plan.name}</CardTitle>
                      {plan.is_trial && <Badge variant="outline" className="mt-1 text-[10px]">Trial</Badge>}
                    </div>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-display font-bold">${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    {plan.price_yearly > 0 && <p className="text-xs text-muted-foreground">${plan.price_yearly}/yr</p>}
                  </div>
                  <Separator />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Students: {plan.max_students ?? "Unlimited"}</p>
                    <p>Teachers: {plan.max_teachers ?? "Unlimited"}</p>
                  </div>
                  {(plan.features as string[]).length > 0 && (
                    <div className="space-y-1">
                      {(plan.features as string[]).slice(0, 4).map((f: string) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
