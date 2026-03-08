import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, GraduationCap, Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const PROMO_TYPES: Record<string, string> = {
  promoted: "Promoted",
  repeated: "Repeated Year",
  transferred: "Transferred",
  graduated: "Graduated",
};

const PROMO_COLORS: Record<string, string> = {
  promoted: "bg-green-500/10 text-green-600 border-green-500/20",
  repeated: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  transferred: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  graduated: "bg-primary/10 text-primary border-primary/20",
};

export default function StudentPromotionsPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: sessions } = useQuery({
    queryKey: ["sessions", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("academic_sessions").select("*").eq("institution_id", institutionId!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("institution_id", institutionId!).order("numeric_level");
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("sections").select("*").eq("institution_id", institutionId!);
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["student_promotions", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_promotions")
        .select(`
          *,
          from_session:from_session_id(name),
          to_session:to_session_id(name),
          from_class:from_class_id(name),
          to_class:to_class_id(name),
          from_sec:from_section_id(name),
          to_sec:to_section_id(name)
        `)
        .eq("institution_id", institutionId!)
        .order("promoted_at", { ascending: false });
      return data || [];
    },
    enabled: !!institutionId,
  });

  const promote = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("student_promotions").insert({
        institution_id: institutionId,
        student_id: values.student_id,
        from_session_id: values.from_session_id,
        to_session_id: values.to_session_id,
        from_class_id: values.from_class_id,
        to_class_id: values.to_class_id,
        from_section_id: values.from_section_id || null,
        to_section_id: values.to_section_id || null,
        promotion_type: values.promotion_type,
        promoted_by: user?.id,
        remarks: values.remarks || null,
      });
      if (error) throw error;

      // Update student profile class
      if (values.to_class_id) {
        await supabase.from("student_profiles").update({
          class_id: values.to_class_id,
          section_id: values.to_section_id || null,
        }).eq("user_id", values.student_id).eq("institution_id", institutionId!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_promotions"] });
      toast.success("Student promotion recorded");
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const counts = Object.entries(PROMO_TYPES).reduce((acc, [key]) => {
    acc[key] = promotions?.filter((p: any) => p.promotion_type === key).length || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Student Promotions</h1>
          <p className="text-muted-foreground text-sm">Manage class promotions, transfers, and graduations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Promotion</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Record Student Promotion</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((v) => promote.mutate(v))} className="space-y-4">
              <div className="space-y-1">
                <Label>Student User ID *</Label>
                <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" {...register("student_id", { required: true })} placeholder="Student UUID" />
              </div>
              <div className="space-y-1">
                <Label>Promotion Type *</Label>
                <Select onValueChange={(v) => setValue("promotion_type", v)} defaultValue="promoted">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROMO_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>From Session *</Label>
                  <Select onValueChange={(v) => setValue("from_session_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {sessions?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>To Session *</Label>
                  <Select onValueChange={(v) => setValue("to_session_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {sessions?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>From Class *</Label>
                  <Select onValueChange={(v) => setValue("from_class_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>To Class *</Label>
                  <Select onValueChange={(v) => setValue("to_class_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>From Section</Label>
                  <Select onValueChange={(v) => setValue("from_section_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {sections?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>To Section</Label>
                  <Select onValueChange={(v) => setValue("to_section_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {sections?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Remarks</Label>
                <Textarea {...register("remarks")} rows={2} placeholder="Optional notes..." />
              </div>
              <Button type="submit" className="w-full" disabled={promote.isPending}>
                {promote.isPending ? "Saving..." : "Record Promotion"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(PROMO_TYPES).map(([key, label]) => (
          <div key={key} className={`p-4 rounded-xl border ${PROMO_COLORS[key]}`}>
            <p className="text-2xl font-bold">{counts[key]}</p>
            <p className="text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : promotions?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No promotions recorded yet</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {["Student", "Type", "From", "To", "Session", "Date", "Remarks"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promotions?.map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{p.student_id.slice(0, 8)}...</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${PROMO_COLORS[p.promotion_type]}`}>
                      {PROMO_TYPES[p.promotion_type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{(p.from_class as any)?.name} {(p.from_sec as any) ? `• ${(p.from_sec as any).name}` : ""}</td>
                  <td className="px-4 py-2.5 text-xs flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    {(p.to_class as any)?.name} {(p.to_sec as any) ? `• ${(p.to_sec as any).name}` : ""}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{(p.from_session as any)?.name} → {(p.to_session as any)?.name}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{format(new Date(p.promoted_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">{p.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
