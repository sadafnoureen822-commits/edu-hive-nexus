import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, ClipboardList, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

const STATUS: Record<string, { label: string; className: string; icon: any }> = {
  pending:   { label: "Pending",   className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  reviewing: { label: "Reviewing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Eye },
  approved:  { label: "Approved",  className: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  rejected:  { label: "Rejected",  className: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  enrolled:  { label: "Enrolled",  className: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
};

export default function AdmissionsPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admission_applications", institutionId, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("admission_applications")
        .select("*, classes(name)")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!institutionId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { error } = await supabase.from("admission_applications").update({
        status,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission_applications"] });
      toast.success("Application status updated");
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = applications?.filter((a: any) =>
    !search ||
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.application_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const counts = Object.keys(STATUS).reduce((acc, s) => {
    acc[s] = applications?.filter((a: any) => a.status === s).length || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Admission Applications</h1>
        <p className="text-muted-foreground text-sm">Review and process student admission requests</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS).map(([key, { label, className, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
              statusFilter === key ? "ring-2 ring-primary ring-offset-1" : ""
            } ${className}`}
          >
            <p className="text-xl font-bold">{counts[key]}</p>
            <p className="text-xs font-medium">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, application number, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => {
            const sc = STATUS[a.status] || STATUS.pending;
            const Icon = sc.icon;
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(a)}>
                <CardContent className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl border ${sc.className}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.application_number} • Applying for: {a.classes?.name || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-[10px] ${sc.className}`}>{sc.label}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(a.created_at), "MMM d, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Application — {selected?.application_number}
              {selected && (
                <Badge variant="outline" className={`text-[10px] ${STATUS[selected.status]?.className}`}>
                  {STATUS[selected.status]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Full Name", selected.full_name],
                  ["Date of Birth", selected.date_of_birth],
                  ["Gender", selected.gender],
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["Applying For", selected.classes?.name || "—"],
                  ["Father's Name", selected.father_name],
                  ["Mother's Name", selected.mother_name],
                  ["Guardian Phone", selected.guardian_phone],
                  ["Previous School", selected.previous_school],
                  ["Previous Grade", selected.previous_grade],
                ].map(([label, value]) => value ? (
                  <div key={label as string}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ) : null)}
              </div>
              {selected.address && (
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{selected.address}</p>
                </div>
              )}
              {selected.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
              {selected.rejection_reason && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs font-semibold text-red-600">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selected.rejection_reason}</p>
                </div>
              )}
              {selected.status === "pending" || selected.status === "reviewing" ? (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateStatus.mutate({ id: selected.id, status: "reviewing" })}
                      disabled={selected.status === "reviewing"}
                    >
                      Mark Reviewing
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus.mutate({ id: selected.id, status: "approved" })}
                    >
                      Approve
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Rejection Reason (optional)</Label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      rows={2}
                    />
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => updateStatus.mutate({ id: selected.id, status: "rejected", reason: rejectReason })}
                    >
                      Reject Application
                    </Button>
                  </div>
                </div>
              ) : selected.status === "approved" ? (
                <Button
                  className="w-full"
                  onClick={() => updateStatus.mutate({ id: selected.id, status: "enrolled" })}
                >
                  Mark as Enrolled
                </Button>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
