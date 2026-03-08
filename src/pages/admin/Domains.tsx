/**
 * Super Admin — Domain Mapping
 * Add, verify, set primary, and remove custom domains for institutions.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe, Plus, MoreHorizontal, Trash2, Star, CheckCircle2,
  Clock, XCircle, Loader2, Search, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface DomainRow {
  id: string;
  domain: string;
  status: string;
  is_primary: boolean;
  created_at: string;
  institution_id: string;
  institutions: { name: string; slug: string } | null;
}
interface Institution { id: string; name: string; slug: string; }

const domainSchema = z.object({
  domain: z.string().trim().min(3, "Domain too short").max(253)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, "Invalid domain format"),
  institution_id: z.string().uuid("Select an institution"),
});

const statusMeta: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:               { label: "Active",      color: "bg-green-500/10 text-green-600 border-green-200",  icon: CheckCircle2 },
  pending_verification: { label: "Pending",     color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  inactive:             { label: "Inactive",    color: "bg-muted text-muted-foreground border-border",     icon: XCircle },
};

export default function DomainsPage() {
  const qc = useQueryClient();
  const [search,       setSearch]       = useState("");
  const [filterInst,   setFilterInst]   = useState("all");
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [domain,       setDomain]       = useState("");
  const [instId,       setInstId]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DomainRow | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["admin-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_domains")
        .select("*, institutions(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DomainRow[];
    },
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["admin-institutions-for-domains"],
    queryFn: async () => {
      const { data } = await supabase.from("institutions").select("id, name, slug").order("name");
      return (data ?? []) as Institution[];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async ({ domain, institution_id }: { domain: string; institution_id: string }) => {
      const { error } = await supabase.from("institution_domains").insert({
        domain: domain.trim().toLowerCase(),
        institution_id,
        status: "pending_verification",
        is_primary: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domain added — status set to Pending Verification");
      qc.invalidateQueries({ queryKey: ["admin-domains"] });
      setDialogOpen(false);
      setDomain("");
      setInstId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("institution_domains")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domain verified and set to Active");
      qc.invalidateQueries({ queryKey: ["admin-domains"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const primaryMutation = useMutation({
    mutationFn: async ({ id, institutionId }: { id: string; institutionId: string }) => {
      // Unset all primaries for this institution first
      await supabase
        .from("institution_domains")
        .update({ is_primary: false })
        .eq("institution_id", institutionId);
      // Set this one
      const { error } = await supabase
        .from("institution_domains")
        .update({ is_primary: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Primary domain updated");
      qc.invalidateQueries({ queryKey: ["admin-domains"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domain removed");
      qc.invalidateQueries({ queryKey: ["admin-domains"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Add handler ──────────────────────────────────────────────────────────────
  const handleAdd = () => {
    const result = domainSchema.safeParse({ domain, institution_id: instId });
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    if (result.success) addMutation.mutate(result.data as { domain: string; institution_id: string });
  };

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = domains.filter((d) => {
    const q = search.toLowerCase();
    const matchQ    = !q || d.domain.includes(q) || d.institutions?.name.toLowerCase().includes(q);
    const matchInst = filterInst === "all" || d.institution_id === filterInst;
    return matchQ && matchInst;
  });

  const stats = {
    total:   domains.length,
    active:  domains.filter((d) => d.status === "active").length,
    pending: domains.filter((d) => d.status === "pending_verification").length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Globe className="h-7 w-7 text-primary" />
            Domain Mapping
          </h1>
          <p className="text-muted-foreground mt-1">Map custom domains to institutions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Domain
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Domains", value: stats.total,   icon: Globe,        color: "text-primary" },
          { label: "Active",        value: stats.active,  icon: CheckCircle2, color: "text-green-600" },
          { label: "Pending",       value: stats.pending, icon: Clock,        color: "text-yellow-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search domain or institution…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterInst} onValueChange={setFilterInst}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Institutions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Institutions</SelectItem>
            {institutions.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            All Domains
            <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Globe className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No domains found.</p>
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add First Domain
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const meta  = statusMeta[d.status] ?? statusMeta["inactive"];
                  const SIcon = meta.icon;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.domain}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {d.institutions?.name ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs gap-1 ${meta.color}`}>
                          <SIcon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.is_primary && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                            <Star className="h-3 w-3" /> Primary
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {d.status !== "active" && (
                              <DropdownMenuItem onClick={() => verifyMutation.mutate(d.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Mark as Verified
                              </DropdownMenuItem>
                            )}
                            {!d.is_primary && d.status === "active" && (
                              <DropdownMenuItem onClick={() => primaryMutation.mutate({ id: d.id, institutionId: d.institution_id })}>
                                <Star className="h-4 w-4 mr-2 text-primary" />
                                Set as Primary
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(d)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Add Domain Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setDomain(""); setInstId(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Add Custom Domain
            </DialogTitle>
            <DialogDescription>
              Map a custom domain to an institution. The domain will be set to Pending Verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Domain <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. school.edu or app.school.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                maxLength={253}
              />
              <p className="text-xs text-muted-foreground">Enter the full domain without http:// or https://</p>
            </div>
            <div className="space-y-1.5">
              <Label>Institution <span className="text-destructive">*</span></Label>
              <Select value={instId} onValueChange={setInstId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select institution…" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Domain
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong className="font-mono">{deleteTarget?.domain}</strong> from{" "}
              <strong>{deleteTarget?.institutions?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
