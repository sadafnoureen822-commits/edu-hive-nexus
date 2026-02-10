import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  Building2,
  Receipt,
} from "lucide-react";

export default function BillingSubscription() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription plan and view payment history
        </p>
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
              <Badge className="bg-accent/10 text-accent border-accent/20" variant="outline">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-display font-bold">Standard Plan</h3>
                  <p className="text-sm text-muted-foreground">For growing institutions</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold">—</p>
                  <p className="text-xs text-muted-foreground">/ month</p>
                </div>
              </div>

              <Separator className="mb-4" />

              <div className="grid grid-cols-2 gap-3">
                {[
                  "Up to 500 students",
                  "50 teachers",
                  "All academic modules",
                  "Email & SMS",
                  "WhatsApp messaging",
                  "Priority support",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Renewal: —</span>
              </div>
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Payment Method
            </CardTitle>
            <CardDescription>Bank transfer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="text-sm font-medium">Bank Transfer</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Account Status</p>
                <Badge variant="outline" className="mt-1 bg-accent/10 text-accent border-accent/20">
                  Verified
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Payment History
          </CardTitle>
          <CardDescription>View past payments and download invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Receipt className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No payment history</p>
            <p className="text-xs mt-1">Invoices and payment records will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
