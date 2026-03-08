/**
 * Super Admin — Role Assignment
 * Assign / change / remove user roles across all institutions.
 * Only accessible to platform admins (enforced by ProtectedRoute + RLS).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserCog, Search, Plus, Pencil, Trash2, Shield, GraduationCap,
  User, Users, School, Loader2, Building2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface Profile { user_id: string; full_name: string | null; }
interface Institution { id: string; name: string; slug: string; }
interface Member {
  id: string; user_id: string; institution_id: string; role: string;
  full_name?: string; email?: string;
  institutions?: { name: string; slug: string } | null;
}

const ALL_ROLES = ["admin", "teacher", "student", "parent", "principal", "exam_controller"] as const;
type AssignableRole = typeof ALL_ROLES[number];

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:           { label: "Institution Admin", icon: School,        color: "bg-primary/10 text-primary border-primary/20" },
  teacher:         { label: "Teacher",           icon: GraduationCap, color: "bg-violet-500/10 text-violet-700 border-violet-200" },
  student:         { label: "Student",           icon: User,          color: "bg-green-500/10 text-green-700 border-green-200" },
  parent:          { label: "Parent",            icon: Users,         color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  principal:       { label: "Principal",         icon: Shield,        color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  exam_controller: { label: "Exam Controller",   icon: UserCog,       color: "bg-rose-500/10 text-rose-700 border-rose-200" },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function RoleAssignmentPage() {
  const qc = useQueryClient();
  const [searchUser, setSearchUser]     = useState("");
  const [filterRole, setFilterRole]     = useState<string>("all");
  const [filterInst, setFilterInst]     = useState<string>("all");

  // Assign dialog state
  const [assignOpen, setAssignOpen]     = useState(false);
  const [editMember, setEditMember]     = useState<Member | null>(null);
  const [selUserId,  setSelUserId]      = useState("");
  const [selInstId,  setSelInstId]      = useState("");
  const [selRole,    setSelRole]        = useState<AssignableRole>("student");
  const [userSearch, setUserSearch]     = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_members")
        .select("id, user_id, institution_id, role, institutions(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with profile data
      const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
      if (!userIds.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((m) => ({
        ...m,
        full_name: profileMap[m.user_id]?.full_name ?? null,
      })) as Member[];
    },
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["admin-institutions-list"],
    queryFn: async () => {
      const { data } = await supabase.from("institutions").select("id, name, slug").order("name");
      return (data ?? []) as Institution[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
      return (data ?? []) as Profile[];
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: async ({ userId, institutionId, role }: { userId: string; institutionId: string; role: string }) => {
      const { error } = await supabase.from("institution_members").upsert(
        { user_id: userId, institution_id: institutionId, role },
        { onConflict: "user_id,institution_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editMember ? "Role updated successfully" : "Role assigned successfully");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("institution_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed successfully");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openAssign = () => {
    setEditMember(null);
    setSelUserId(""); setSelInstId(""); setSelRole("student"); setUserSearch("");
    setAssignOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditMember(m);
    setSelUserId(m.user_id);
    setSelInstId(m.institution_id);
    setSelRole(m.role as AssignableRole);
    setUserSearch(m.full_name ?? m.user_id.slice(0, 8));
    setAssignOpen(true);
  };

  const closeDialog = () => { setAssignOpen(false); setEditMember(null); };

  const handleSubmit = () => {
    if (!selUserId || !selInstId || !selRole) return toast.error("All fields are required");
    assignMutation.mutate({ userId: selUserId, institutionId: selInstId, role: selRole });
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = members.filter((m) => {
    const q = searchUser.toLowerCase();
    const matchSearch = !q || (m.full_name?.toLowerCase().includes(q)) || m.user_id.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || m.role === filterRole;
    const matchInst = filterInst === "all" || m.institution_id === filterInst;
    return matchSearch && matchRole && matchInst;
  });

  const filteredProfiles = profiles.filter((p) =>
    !userSearch || p.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const counts = ALL_ROLES.reduce((acc, r) => {
    acc[r] = members.filter((m) => m.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <UserCog className="h-7 w-7 text-primary" />
            Role Assignment
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign, update, or remove user roles across all institutions
          </p>
        </div>
        <Button onClick={openAssign} className="gap-2">
          <Plus className="h-4 w-4" />
          Assign Role
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ALL_ROLES.map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <Card key={role} className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setFilterRole(filterRole === role ? "all" : role)}>
              <CardContent className="p-4 text-center space-y-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-display font-bold">{counts[role]}</p>
                <p className="text-xs text-muted-foreground leading-tight">{meta.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <Label className="text-xs mb-1.5 block text-muted-foreground">Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or user ID..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-44">
              <Label className="text-xs mb-1.5 block text-muted-foreground">Filter by Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-52">
              <Label className="text-xs mb-1.5 block text-muted-foreground">Filter by Institution</Label>
              <Select value={filterInst} onValueChange={setFilterInst}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(filterRole !== "all" || filterInst !== "all" || searchUser) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterRole("all"); setFilterInst("all"); setSearchUser(""); }}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Role Assignments
            <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <UserCog className="h-10 w-10 mx-auto opacity-30" />
              <p className="font-medium">No assignments found</p>
              <p className="text-sm">Try adjusting your filters or assign a new role.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const meta = ROLE_META[m.role] ?? ROLE_META.student;
                  const Icon = meta.icon;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                            {(m.full_name ?? m.user_id).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {m.full_name ?? <span className="text-muted-foreground italic">No name</span>}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{m.user_id.slice(0, 12)}…</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {m.institutions?.name ?? <span className="text-muted-foreground italic">Unknown</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Assign / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <UserCog className="h-5 w-5 text-primary" />
              {editMember ? "Edit Role Assignment" : "Assign New Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* User picker */}
            <div className="space-y-1.5">
              <Label>User <span className="text-destructive">*</span></Label>
              {editMember ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(editMember.full_name ?? editMember.user_id).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{editMember.full_name ?? "No name"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{editMember.user_id.slice(0, 20)}…</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name…"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setSelUserId(""); }}
                      className="pl-9"
                    />
                  </div>
                  {userSearch && filteredProfiles.length > 0 && !selUserId && (
                    <div className="border border-border rounded-lg bg-card max-h-40 overflow-y-auto divide-y divide-border">
                      {filteredProfiles.slice(0, 8).map((p) => (
                        <button
                          key={p.user_id}
                          type="button"
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-secondary transition-colors"
                          onClick={() => { setSelUserId(p.user_id); setUserSearch(p.full_name ?? p.user_id.slice(0, 8)); }}
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {(p.full_name ?? p.user_id).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.full_name ?? <span className="italic text-muted-foreground">No name</span>}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.user_id.slice(0, 16)}…</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selUserId && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      ✓ User selected: <span className="font-mono">{selUserId.slice(0, 16)}…</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Institution picker */}
            <div className="space-y-1.5">
              <Label>Institution <span className="text-destructive">*</span></Label>
              <Select value={selInstId} onValueChange={setSelInstId} disabled={!!editMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select institution…" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {i.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editMember && (
                <p className="text-xs text-muted-foreground">Institution cannot be changed — remove and re-assign if needed.</p>
              )}
            </div>

            {/* Role picker */}
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  const selected = selRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelRole(role)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={assignMutation.isPending || !selUserId || !selInstId || !selRole}
              >
                {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editMember ? "Update Role" : "Assign Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteTarget?.full_name ?? "this user"}</strong> from{" "}
              <strong>{(deleteTarget as any)?.institutions?.name ?? "the institution"}</strong> as a{" "}
              <strong>{ROLE_META[deleteTarget?.role ?? "student"]?.label}</strong>. They will lose all
              access to that portal immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
