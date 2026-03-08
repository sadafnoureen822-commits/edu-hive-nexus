import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  paid:     { label: "Paid",     className: "bg-green-500/10 text-green-600 border-green-500/20" },
  overdue:  { label: "Overdue",  className: "bg-red-500/10 text-red-600 border-red-500/20" },
  partial:  { label: "Partial",  className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  waived:   { label: "Waived",   className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

export default function FeeManagement() {
  const { institution } = useTenant();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [structureOpen, setStructureOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: regPay, handleSubmit: handlePay, reset: resetPay, setValue: setPayVal } = useForm();

  const { data: classes } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("institution_id", institutionId!).order("numeric_level");
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("academic_sessions").select("*").eq("institution_id", institutionId!);
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: feeStructures, isLoading: loadingStructures } = useQuery({
    queryKey: ["fee_structures", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("fee_structures")
        .select("*, classes(name), academic_sessions(name)")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["fee_payments", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("fee_payments")
        .select("*, fee_structures(name)")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!institutionId,
  });

  const createStructure = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("fee_structures").insert({
        institution_id: institutionId,
        name: values.name,
        description: values.description,
        fee_type: values.fee_type,
        amount: parseFloat(values.amount),
        due_day: values.due_day ? parseInt(values.due_day) : null,
        late_fee: values.late_fee ? parseFloat(values.late_fee) : 0,
        class_id: values.class_id || null,
        session_id: values.session_id || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("Fee structure created");
      setStructureOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const recordPayment = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("fee_payments").insert({
        institution_id: institutionId,
        student_id: values.student_id,
        fee_structure_id: values.fee_structure_id || null,
        amount_due: parseFloat(values.amount_due),
        amount_paid: parseFloat(values.amount_paid),
        discount: values.discount ? parseFloat(values.discount) : 0,
        fine: values.fine ? parseFloat(values.fine) : 0,
        payment_method: values.payment_method,
        transaction_reference: values.transaction_reference || null,
        month_year: values.month_year || null,
        due_date: values.due_date || null,
        paid_at: new Date().toISOString(),
        status: "paid",
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
      toast.success("Payment recorded");
      setPaymentOpen(false);
      resetPay();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteStructure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("Fee structure deleted");
    },
  });

  // Stats
  const totalCollected = payments?.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount_paid), 0) || 0;
  const totalPending  = payments?.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount_due), 0) || 0;
  const totalOverdue  = payments?.filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + Number(p.amount_due), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Fee Management</h1>
          <p className="text-muted-foreground text-sm">Manage fee structures and student payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Fee Structure</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((v) => createStructure.mutate(v))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input {...register("name", { required: true })} placeholder="e.g. Monthly Tuition Fee" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Fee Type *</Label>
                    <Select onValueChange={(v) => setValue("fee_type", v)} defaultValue="monthly">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="one_time">One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Amount *</Label>
                    <Input type="number" {...register("amount", { required: true })} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label>Due Day (of month)</Label>
                    <Input type="number" min="1" max="31" {...register("due_day")} placeholder="10" />
                  </div>
                  <div className="space-y-1">
                    <Label>Late Fee</Label>
                    <Input type="number" {...register("late_fee")} placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Class (optional)</Label>
                  <Select onValueChange={(v) => setValue("class_id", v)}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All classes</SelectItem>
                      {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createStructure.isPending}>
                  {createStructure.isPending ? "Creating..." : "Create Fee Structure"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <form onSubmit={handlePay((v) => recordPayment.mutate(v))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Student ID *</Label>
                  <Input {...regPay("student_id", { required: true })} placeholder="Student user ID" />
                </div>
                <div className="space-y-1">
                  <Label>Fee Structure</Label>
                  <Select onValueChange={(v) => setPayVal("fee_structure_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
                    <SelectContent>
                      {feeStructures?.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Amount Due *</Label>
                    <Input type="number" {...regPay("amount_due", { required: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Amount Paid *</Label>
                    <Input type="number" {...regPay("amount_paid", { required: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Discount</Label>
                    <Input type="number" {...regPay("discount")} defaultValue="0" />
                  </div>
                  <div className="space-y-1">
                    <Label>Fine</Label>
                    <Input type="number" {...regPay("fine")} defaultValue="0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Payment Method</Label>
                  <Select onValueChange={(v) => setPayVal("payment_method", v)} defaultValue="cash">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Month/Year</Label>
                    <Input type="month" {...regPay("month_year")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Transaction Ref</Label>
                    <Input {...regPay("transaction_reference")} placeholder="Optional" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={recordPayment.isPending}>
                  {recordPayment.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Collected", value: totalCollected, icon: CheckCircle, color: "text-green-600" },
          { label: "Pending", value: totalPending, icon: Clock, color: "text-yellow-600" },
          { label: "Overdue", value: totalOverdue, icon: AlertCircle, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-4">
              <div className="p-2 rounded-xl bg-secondary">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="structures">
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="payments">Payment Records</TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="mt-4">
          {loadingStructures ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : feeStructures?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No fee structures created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeStructures?.map((f: any) => (
                <Card key={f.id}>
                  <CardContent className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.classes?.name || "All Classes"} •
                          <Badge variant="outline" className="ml-1 text-[10px]">{f.fee_type}</Badge>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{Number(f.amount).toLocaleString()}</p>
                        {f.late_fee > 0 && <p className="text-xs text-muted-foreground">+{f.late_fee} late fee</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteStructure.mutate(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          {loadingPayments ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : payments?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No payment records yet</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    {["Receipt", "Fee", "Due", "Paid", "Method", "Month", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p: any) => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={p.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-2.5 font-mono text-xs">{p.receipt_number}</td>
                        <td className="px-4 py-2.5">{p.fee_structures?.name || "-"}</td>
                        <td className="px-4 py-2.5">{Number(p.amount_due).toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-semibold text-green-600">{Number(p.amount_paid).toLocaleString()}</td>
                        <td className="px-4 py-2.5 capitalize">{p.payment_method}</td>
                        <td className="px-4 py-2.5">{p.month_year || "-"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${sc.className}`}>{sc.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
