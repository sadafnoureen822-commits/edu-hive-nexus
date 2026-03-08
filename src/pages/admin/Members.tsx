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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, UserPlus, Search, MoreHorizontal, Trash2, Pencil,
  Loader2, GraduationCap, User, Shield, School, UserCog, Building2, Mail,
} from "lucide-react";
import AIDataExport from "@/components/ui/AIDataExport";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberRow {
  id: string;
  user_id: string;
  institution_id: string;
  role: string;
  created_at: string;
  full_name?: string | null;
  email?: string | null;
  institutions?: { name: string; slug: string } | null;
}
interface Institution { id: string; name: string; slug: string; }
interface Profile { user_id: string; full_name: string | null; }

const ALL_ROLES = ["admin", "teacher", "student", "principal", "parent", "exam_controller"] as const;
type AssignableRole = typeof ALL_ROLES[number];

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:           { label: "Institution Admin", icon: School,        color: "bg-primary/10 text-primary border-primary/20" },
  teacher:         { label: "Teacher",           icon: GraduationCap, color: "bg-violet-500/10 text-violet-700 border-violet-200" },
  student:         { label: "Student",           icon: User,          color: "bg-green-500/10 text-green-700 border-green-200" },
  parent:          { label: "Parent",            icon: Users,         color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  principal:       { label: "Principal",         icon: Shield,        color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  exam_controller: { label: "Exam Controller",   icon: UserCog,       color: "bg-rose-500/10 text-rose-700 border-rose-200" },
};

export default function MembersPage() {
  const qc = useQueryClient();

  // Filters
  const [search,      setSearch]      = useState("");
  const [filterRole,  setFilterRole]  = useState("all");
  const [filterInst,  setFilterInst]  = useState("all");

  // Add member dialog
  const [dialogOpen,   setDialogOpen]  = useState(false);
  const [userSearch,   setUserSearch]  = useState("");
  const [selUserId,    setSelUserId]   = useState("");
  const [selInstId,    setSelInstId]   = useState("");
  const [selRole,      setSelRole]     = useState<AssignableRole>("student");
  const [addBusy,      setAddBusy]     = useState(false);

  // Edit role dialog
  const [editTarget,   setEditTarget]  = useState<MemberRow | null>(null);
  const [editRole,     setEditRole]    = useState<AssignableRole>("student");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);

  // ── Fetch emails from edge function ─────────────────────────────────────────
  const { data: emailMap = {} } = useQuery({
    queryKey: ["admin-user-emails"],
    staleTime: 0,
    retry: 2,
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-list-users");
      if (res.error) throw new Error(res.error.message ?? "Failed to fetch emails");
      const users = (res.data as any)?.users ?? [];
      return Object.fromEntries(users.map((u: any) => [u.id, u.email])) as Record<string, string>;
    },
  });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_members")
        .select("id, user_id, institution_id, role, created_at, institutions(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
      if (!userIds.length) return [];

      const { data: profiles } = await supabase
        .from("profiles").select("user_id, full_name").in("user_id", userIds);
      const pm = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

      return (data ?? []).map((m) => ({
        ...m,
        full_name: pm[m.user_id]?.full_name ?? null,
      })) as MemberRow[];
    },
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["members-institutions"],
    queryFn: async () => {
      const { data } = await supabase.from("institutions").select("id, name, slug").order("name");
      return (data ?? []) as Institution[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["members-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
      return (data ?? []) as Profile[];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      const { error } = await supabase
        .from("institution_members").update({ role: newRole as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["members-page"] });
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["members-page"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Add Member ───────────────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!selUserId)  return toast.error("Please select a user");
    if (!selInstId)  return toast.error("Please select an institution");

    setAddBusy(true);
    try {
      const { data: existing } = await supabase
        .from("institution_members").select("id")
        .eq("user_id", selUserId).eq("institution_id", selInstId).maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("institution_members").update({ role: selRole as any }).eq("id", existing.id);
        if (error) throw error;
        toast.success("Member already exists — role updated.");
      } else {
        const { error } = await supabase.from("institution_members").insert({
          user_id: selUserId,
          institution_id: selInstId,
          role: selRole as any,
        });
        if (error) throw error;
        const uName = profiles.find((p) => p.user_id === selUserId)?.full_name ?? "User";
        const iName = institutions.find((i) => i.id === selInstId)?.name ?? "institution";
        toast.success(`${uName} added to ${iName} as ${ROLE_META[selRole].label}`);
      }

      qc.invalidateQueries({ queryKey: ["members-page"] });
      closeDialog();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setAddBusy(false);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setUserSearch(""); setSelUserId(""); setSelInstId(""); setSelRole("student");
  };

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const email = emailMap[m.user_id] ?? "";
    const matchQ    = !q || m.full_name?.toLowerCase().includes(q) || m.user_id.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || m.role === filterRole;
    const matchInst = filterInst === "all" || m.institution_id === filterInst;
    return matchQ && matchRole && matchInst;
  });

  const filteredProfiles = profiles.filter((p) =>
    !userSearch || p.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const counts = ALL_ROLES.reduce((acc, r) => {
    acc[r] = members.filter((m) => m.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            Members
          </h1>
          <p className="text-muted-foreground mt-1">Manage institution memberships across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <AIDataExport
            contextData={filtered.map((m) => ({
              Name: m.full_name || "Unknown",
              Email: emailMap[m.user_id] || "—",
              Institution: m.institutions?.name ?? "—",
              Role: ROLE_META[m.role]?.label ?? m.role,
              Added: new Date(m.created_at).toLocaleDateString(),
            }))}
            label="AI Export"
            exportTitle="Members Report"
            fileName="platform-members"
          />
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ALL_ROLES.map((r) => {
          const meta = ROLE_META[r];
          const Icon = meta.icon;
          return (
            <Card
              key={r}
              className={`border-border/50 cursor-pointer hover:border-primary/40 transition-colors ${filterRole === r ? "border-primary/50 bg-primary/5" : ""}`}
              onClick={() => setFilterRole(filterRole === r ? "all" : r)}
            >
              <CardContent className="p-4 text-center space-y-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-display font-bold">{counts[r]}</p>
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
              <Label className="text-xs mb-1.5 block text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, email or user ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-44">
              <Label className="text-xs mb-1.5 block text-muted-foreground">Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-52">
              <Label className="text-xs mb-1.5 block text-muted-foreground">Institution</Label>
              <Select value={filterInst} onValueChange={setFilterInst}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterRole !== "all" || filterInst !== "all" || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterRole("all"); setFilterInst("all"); setSearch(""); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            All Members
            <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No members found.</p>
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-2">
                <UserPlus className="h-3.5 w-3.5" /> Add First Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const meta = ROLE_META[m.role] ?? ROLE_META["student"];
                  const Icon = meta.icon;
                  const email = emailMap[m.user_id];
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.full_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{m.user_id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {email ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {m.institutions?.name ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditTarget(m); setEditRole(m.role as AssignableRole); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(m)}
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

      {/* ── Add Member Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add New Member
            </DialogTitle>
            <DialogDescription>
              Select an existing user, choose their institution and role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* User picker */}
            <div className="space-y-1.5">
              <Label>User <span className="text-destructive">*</span></Label>
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name…"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setSelUserId(""); }}
                  className="pl-9"
                />
              </div>
              {userSearch && (
                <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                  {filteredProfiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">No users found</p>
                  ) : (
                    filteredProfiles.slice(0, 8).map((p) => (
                      <button
                        key={p.user_id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2 ${selUserId === p.user_id ? "bg-primary/10 text-primary" : ""}`}
                        onClick={() => { setSelUserId(p.user_id); setUserSearch(p.full_name ?? p.user_id.slice(0, 8)); }}
                      >
                        <User className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{p.full_name || "Unnamed"}</span>
                          {emailMap[p.user_id] && (
                            <span className="block text-xs text-muted-foreground truncate">{emailMap[p.user_id]}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono ml-auto">{p.user_id.slice(0, 6)}…</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selUserId && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <User className="h-3 w-3" /> Selected: {profiles.find(p => p.user_id === selUserId)?.full_name || selUserId.slice(0, 8)}
                  {emailMap[selUserId] && <span className="text-muted-foreground">({emailMap[selUserId]})</span>}
                </p>
              )}
            </div>

            {/* Institution */}
            <div className="space-y-1.5">
              <Label>Institution <span className="text-destructive">*</span></Label>
              <Select value={selInstId} onValueChange={setSelInstId}>
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

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={selRole} onValueChange={(v) => setSelRole(v as AssignableRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeDialog}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleAddMember} disabled={addBusy}>
                {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Role Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{editTarget?.full_name || "this user"}</strong> at{" "}
              <strong>{editTarget?.institutions?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Select value={editRole} onValueChange={(v) => setEditRole(v as AssignableRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={editMutation.isPending}
                onClick={() => editTarget && editMutation.mutate({ id: editTarget.id, newRole: editRole })}
              >
                {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.full_name || "this user"}</strong> from{" "}
              <strong>{deleteTarget?.institutions?.name}</strong>? This only removes their membership, not their account.
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
