import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
  Users, GraduationCap, UserCheck, UserPlus, Search,
  MoreHorizontal, Shield, BookUser, Trash2, Loader2, Mail,
  Eye, EyeOff, User, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import type { Enums } from "@/integrations/supabase/types";

// ── Constants ────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  admin:           "bg-primary/10 text-primary border-primary/20",
  teacher:         "bg-violet-500/10 text-violet-700 border-violet-200",
  student:         "bg-green-500/10 text-green-700 border-green-200",
  parent:          "bg-orange-500/10 text-orange-700 border-orange-200",
  principal:       "bg-blue-500/10 text-blue-700 border-blue-200",
  exam_controller: "bg-rose-500/10 text-rose-700 border-rose-200",
};

const ROLE_LABELS: Record<string, string> = {
  admin:           "Admin",
  teacher:         "Teacher",
  student:         "Student",
  parent:          "Parent",
  principal:       "Principal",
  exam_controller: "Exam Controller",
};

type InstitutionRole = Enums<"institution_role">;
const ALL_ROLES: InstitutionRole[] = [
  "teacher", "student", "parent", "principal", "exam_controller", "admin",
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const institutionId = institution?.id ?? "";

  const { data: allMembers = [], isLoading } = useInstitutionMembers(institutionId);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit-role">("create");
  const [editMemberId, setEditMemberId] = useState<string>("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InstitutionRole>("student");
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = allMembers.filter((m) => {
    const matchesRole = activeTab === "all" || m.role === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (m.full_name?.toLowerCase().includes(q)) ||
      m.user_id.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const countByRole = (...roles: string[]) =>
    allMembers.filter((m) => roles.includes(m.role)).length;

  // ── Open dialog helpers ───────────────────────────────────────────────────
  const openCreate = () => {
    setDialogMode("create");
    setFullName(""); setEmail(""); setPassword("");
    setSelectedRole("student"); setShowPassword(false);
    setDialogOpen(true);
  };

  const openEditRole = (memberId: string, currentRole: InstitutionRole) => {
    setDialogMode("edit-role");
    setEditMemberId(memberId);
    setSelectedRole(currentRole);
    setDialogOpen(true);
  };

  // ── Create user ───────────────────────────────────────────────────────────
  const handleCreateUser = async () => {
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!email.trim()) return toast.error("Email is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return toast.error("Enter a valid email address");
    if (password && password.length < 6) return toast.error("Password must be at least 6 characters");

    setFormLoading(true);
    try {
      // Sign up new user
      const pwd = password || Math.random().toString(36).slice(-8) + "Aa1!";
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pwd,
        options: {
          data: { full_name: fullName.trim(), invited_by: user?.id },
        },
      });

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("already exists")
        ) {
          toast.warning(
            "This email is already registered. Use the role assignment to add an existing user.",
            { duration: 6000 }
          );
          setDialogOpen(false);
          return;
        }
        throw signUpError;
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        toast.warning("User may already be registered. Ask them to sign in first.");
        setDialogOpen(false);
        return;
      }

      // Upsert profile with full_name
      await supabase.from("profiles").upsert(
        { user_id: userId, full_name: fullName.trim() },
        { onConflict: "user_id" }
      );

      // Check if already a member
      const { data: existing } = await supabase
        .from("institution_members")
        .select("id")
        .eq("institution_id", institutionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update role
        const { error } = await supabase
          .from("institution_members")
          .update({ role: selectedRole })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success(`User already existed — role updated to ${ROLE_LABELS[selectedRole]}.`);
      } else {
        // Add to institution
        const { error: memberError } = await supabase
          .from("institution_members")
          .insert({
            institution_id: institutionId,
            user_id: userId,
            role: selectedRole,
            invited_by: user?.id,
          });
        if (memberError) throw memberError;
        toast.success(
          `${fullName.trim()} created as ${ROLE_LABELS[selectedRole]}!${!password ? " A password reset email will be sent." : ""}`
        );
      }

      qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit role ─────────────────────────────────────────────────────────────
  const handleEditRole = async () => {
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from("institution_members")
        .update({ role: selectedRole })
        .eq("id", editMemberId);
      if (error) throw error;
      toast.success(`Role updated to ${ROLE_LABELS[selectedRole]}`);
      qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("institution_members")
      .delete()
      .eq("id", memberId);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage teachers, students, principals, and parents
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start">
          <UserPlus className="h-4 w-4" /> Create User
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "All",       count: allMembers.length,                             icon: Users,       color: "text-foreground",  bg: "bg-secondary" },
          { label: "Teachers",  count: countByRole("teacher"),                        icon: UserCheck,   color: "text-violet-600",  bg: "bg-violet-500/10" },
          { label: "Students",  count: countByRole("student"),                        icon: GraduationCap, color: "text-primary",   bg: "bg-primary/10" },
          { label: "Parents",   count: countByRole("parent"),                         icon: BookUser,    color: "text-orange-600",  bg: "bg-orange-500/10" },
          { label: "Staff",     count: countByRole("admin", "principal", "exam_controller"), icon: Shield, color: "text-blue-600", bg: "bg-blue-500/10" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-border/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => setActiveTab(
              stat.label === "All" ? "all" :
              stat.label === "Staff" ? "principal" :
              stat.label.toLowerCase().replace("s", "")
            )}
          >
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <div className={`${stat.bg} p-1.5 rounded-lg`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-display font-bold leading-none">{stat.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role quick-create shortcuts */}
      <Card className="border-border/50 bg-secondary/30">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Quick Create</p>
          <div className="flex flex-wrap gap-2">
            {(["teacher", "student", "principal", "parent", "exam_controller"] as InstitutionRole[]).map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  setDialogMode("create");
                  setFullName(""); setEmail(""); setPassword("");
                  setSelectedRole(role); setShowPassword(false);
                  setDialogOpen(true);
                }}
              >
                <UserPlus className="h-3 w-3" />
                Add {ROLE_LABELS[role]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="bg-secondary/50 flex-wrap h-auto">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="teacher" className="text-xs">Teachers</TabsTrigger>
            <TabsTrigger value="student" className="text-xs">Students</TabsTrigger>
            <TabsTrigger value="principal" className="text-xs">Principals</TabsTrigger>
            <TabsTrigger value="parent" className="text-xs">Parents</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={activeTab}>
          <Card className="border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Users className="h-8 w-8 opacity-30" />
                            <p className="text-sm font-medium">
                              {searchQuery ? "No users match your search" : "No users yet"}
                            </p>
                            {!searchQuery && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-1 gap-2"
                                onClick={openCreate}
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                Create your first user
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {(member.full_name || "U").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm">
                                {member.full_name || <span className="italic text-muted-foreground">No name</span>}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                            {member.user_id.slice(0, 12)}…
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${ROLE_COLORS[member.role] || ""}`}
                            >
                              {ROLE_LABELS[member.role] || member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(member.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => openEditRole(member.id, member.role as InstitutionRole)}
                                  className="text-sm gap-2"
                                >
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {ALL_ROLES.filter((r) => r !== member.role).map((r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() => {
                                      setEditMemberId(member.id);
                                      setSelectedRole(r);
                                      // Direct quick-change without dialog
                                      supabase
                                        .from("institution_members")
                                        .update({ role: r })
                                        .eq("id", member.id)
                                        .then(({ error }) => {
                                          if (error) return toast.error(error.message);
                                          toast.success(`Role changed to ${ROLE_LABELS[r]}`);
                                          qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
                                        });
                                    }}
                                    className="text-sm pl-7 text-muted-foreground hover:text-foreground"
                                  >
                                    → {ROLE_LABELS[r]}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive text-sm gap-2"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: member.id,
                                      name: member.full_name || "this user",
                                    })
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove from institution
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Create / Edit Role Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <UserPlus className="h-5 w-5 text-primary" />
              {dialogMode === "create" ? "Create New User" : "Change Role"}
            </DialogTitle>
          </DialogHeader>

          {dialogMode === "create" ? (
            <div className="space-y-4 pt-2">
              {/* Role selector — prominent at top */}
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["teacher", "student", "principal", "parent", "exam_controller", "admin"] as InstitutionRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all focus:outline-none ${
                        selectedRole === r
                          ? `${ROLE_COLORS[r]} border-current shadow-sm`
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full-name"
                    placeholder="e.g. John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">
                  Password
                  <span className="text-muted-foreground font-normal ml-1 text-xs">(optional — auto-generated if blank)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCreateUser}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create {ROLE_LABELS[selectedRole]}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>New Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["teacher", "student", "principal", "parent", "exam_controller", "admin"] as InstitutionRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all focus:outline-none ${
                        selectedRole === r
                          ? `${ROLE_COLORS[r]} border-current shadow-sm`
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleEditRole}
                  disabled={formLoading}
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Role"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteTarget?.name}</strong> from this institution.
              Their account will not be deleted — they can be re-added later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleRemoveMember(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
