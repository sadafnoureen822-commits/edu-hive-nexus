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
  Eye, EyeOff, Loader2, GraduationCap, User, Shield, School, UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberRow {
  id: string;
  user_id: string;
  institution_id: string;
  role: string;
  created_at: string;
  full_name?: string | null;
  institutions?: { name: string; slug: string } | null;
}
interface Institution { id: string; name: string; slug: string; }

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

// ── Validation ─────────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email:    z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72).or(z.literal("")),
  instId:   z.string().uuid("Please select an institution"),
  role:     z.enum(ALL_ROLES),
});

// ── Component ──────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const qc = useQueryClient();

  // Filters
  const [search,      setSearch]      = useState("");
  const [filterRole,  setFilterRole]  = useState("all");
  const [filterInst,  setFilterInst]  = useState("all");

  // Create dialog
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [instId,       setInstId]       = useState("");
  const [role,         setRole]         = useState<AssignableRole>("student");
  const [createBusy,   setCreateBusy]   = useState(false);

  // Edit role dialog
  const [editTarget,   setEditTarget]   = useState<MemberRow | null>(null);
  const [editRole,     setEditRole]     = useState<AssignableRole>("student");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);

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

  // ── Mutations ────────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      const { error } = await supabase
        .from("institution_members").update({ role: newRole as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
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

  // ── Create User ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const parsed = createUserSchema.safeParse({ fullName, email, password, instId, role });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setCreateBusy(true);
    try {
      const pwd = password || Math.random().toString(36).slice(-8) + "Aa1!";
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pwd,
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes("already registered") ||
            signUpErr.message.toLowerCase().includes("already exists")) {
          toast.warning("That email is already registered. Use Role Assignment to assign them.", { duration: 6000 });
          setCreateBusy(false);
          return;
        }
        throw signUpErr;
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        toast.warning("User may already exist — check Role Assignment page.");
        setCreateBusy(false);
        return;
      }

      await supabase.from("profiles").upsert(
        { user_id: userId, full_name: fullName.trim() },
        { onConflict: "user_id" }
      );

      const { data: existing } = await supabase
        .from("institution_members").select("id")
        .eq("user_id", userId).eq("institution_id", instId).maybeSingle();

      if (existing) {
        await supabase.from("institution_members")
          .update({ role: role as any }).eq("id", existing.id);
        toast.success(`Role updated for existing user.`);
      } else {
        const { error } = await supabase.from("institution_members")
          .insert({ user_id: userId, institution_id: instId, role: role as any });
        if (error) throw error;
        toast.success(`${fullName} created as ${ROLE_META[role].label}!`);
      }

      qc.invalidateQueries({ queryKey: ["members-page"] });
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  };

  const resetForm = () => {
    setFullName(""); setEmail(""); setPassword(""); setInstId(""); setRole("student"); setShowPwd(false);
  };

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchQ    = !q || m.full_name?.toLowerCase().includes(q) || m.user_id.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || m.role === filterRole;
    const matchInst = filterInst === "all" || m.institution_id === filterInst;
    return matchQ && matchRole && matchInst;
  });

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
          <p className="text-muted-foreground mt-1">All members across all institutions</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Create New User
        </Button>
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
                  placeholder="Name or user ID…"
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
            <p className="text-sm text-muted-foreground py-12 text-center">No members found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const meta = ROLE_META[m.role] ?? ROLE_META["student"];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${meta.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{m.user_id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{m.institutions?.name ?? "—"}</span>
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
                              <Pencil className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(m)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
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

      {/* ── Create User Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Register a new user and assign them to an institution with a specific role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Password <span className="text-muted-foreground text-xs">(optional — auto-generated if blank)</span></Label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={72}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={role} onValueChange={(v) => setRole(v as AssignableRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleCreate} disabled={createBusy}>
                {createBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create User
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
              <strong>{deleteTarget?.institutions?.name}</strong>? This only removes their institution access.
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
