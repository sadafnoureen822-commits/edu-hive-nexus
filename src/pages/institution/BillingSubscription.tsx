import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Package,
  Download,
  Loader2,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  subscription_plans: { name: string; price_monthly: number; price_yearly: number; features: string[]; max_students: number | null; max_teachers: number | null } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function BillingSubscription() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institution) return;
    fetchBillingData();
  }, [institution]);

  const fetchBillingData = async () => {
    setLoading(true);
    const [subRes, invRes] = await Promise.all([
      supabase
        .from("institution_subscriptions")
        .select("*, subscription_plans!plan_id(name,price_monthly,price_yearly,features,max_students,max_teachers)")
        .eq("institution_id", institution!.id)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id,invoice_number,amount,currency,status,due_date,paid_at,created_at")
        .eq("institution_id", institution!.id)
        .order("created_at", { ascending: false }),
    ]);
    setSubscription(subRes.data as unknown as Subscription | null);
    setInvoices((invRes.data || []) as Invoice[]);
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "trial": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "past_due": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "suspended": return "destructive";
      case "paid": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "overdue": return "destructive";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default: return "secondary";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const plan = subscription?.subscription_plans;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription plan and view payment history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              {subscription && (
                <Badge variant="outline" className={statusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!subscription ? (
              <div className="text-center py-8 space-y-3">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-medium">No active subscription</p>
                <p className="text-xs text-muted-foreground">Contact the platform administrator to assign a subscription plan.</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-display font-bold">{plan?.name || "Custom Plan"}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{subscription.billing_cycle} billing</p>
                  </div>
                  {plan && (
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold">
                        ${subscription.billing_cycle === "yearly" ? plan.price_yearly : plan.price_monthly}
                      </p>
                      <p className="text-xs text-muted-foreground">/ {subscription.billing_cycle === "yearly" ? "year" : "month"}</p>
                    </div>
                  )}
                </div>

                {plan?.features && (
                  <>
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-2 gap-2">
                      {(plan.features as string[]).map((feature: string) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {plan?.max_students && (
                    <div>
                      <p className="text-xs text-muted-foreground">Max Students</p>
                      <p className="font-medium">{plan.max_students.toLocaleString()}</p>
                    </div>
                  )}
                  {plan?.max_teachers && (
                    <div>
                      <p className="text-xs text-muted-foreground">Max Teachers</p>
                      <p className="font-medium">{plan.max_teachers.toLocaleString()}</p>
                    </div>
                  )}
                  {subscription.trial_ends_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Trial Ends</p>
                      <p className="font-medium">{new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {subscription.current_period_end && (
                    <div>
                      <p className="text-xs text-muted-foreground">Next Renewal</p>
                      <p className="font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {subscription?.status === "suspended" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Account Suspended</p>
                  <p className="text-xs text-muted-foreground mt-1">Your account has been suspended. Please contact the platform administrator to resolve any outstanding issues.</p>
                </div>
              </div>
            )}

            {subscription?.status === "past_due" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Payment Overdue</p>
                  <p className="text-xs text-muted-foreground mt-1">You have an overdue invoice. Please settle the payment to avoid service interruption.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Billing Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Invoices</span>
                <span className="font-medium">{invoices.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-green-600">{invoices.filter((i) => i.status === "paid").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600">{invoices.filter((i) => i.status === "pending").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-medium text-destructive">{invoices.filter((i) => i.status === "overdue").length}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Paid</span>
              <span className="text-green-600">
                ${invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Invoice History
          </CardTitle>
          <CardDescription>View past payments and download invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No invoices yet</p>
              <p className="text-xs mt-1">Invoices will appear here when generated by the platform</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/30">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-mono font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {new Date(inv.created_at).toLocaleDateString()}
                        {inv.due_date && ` · Due: ${new Date(inv.due_date).toLocaleDateString()}`}
                        {inv.paid_at && ` · Paid: ${new Date(inv.paid_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm">${Number(inv.amount).toLocaleString()} {inv.currency}</p>
                    <Badge variant="outline" className={statusColor(inv.status)}>{inv.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
