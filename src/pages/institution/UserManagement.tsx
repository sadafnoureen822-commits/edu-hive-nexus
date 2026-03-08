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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, GraduationCap, UserCheck, UserPlus, Search,
  MoreHorizontal, Shield, BookUser, Trash2, Loader2, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import type { Enums } from "@/integrations/supabase/types";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  teacher: "bg-accent/10 text-accent border-accent/20",
  student: "bg-green-500/10 text-green-700 border-green-200",
  parent: "bg-orange-500/10 text-orange-700 border-orange-200",
  staff: "bg-muted text-muted-foreground border-border",
};

type InstitutionRole = Enums<"institution_role">;
const ALL_ROLES: InstitutionRole[] = ["admin", "teacher", "student", "parent", "principal", "exam_controller"];

export default function UserManagement() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const institutionId = institution?.id ?? "";

  const { data: allMembers = [], isLoading } = useInstitutionMembers(institutionId);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InstitutionRole>("student");
  const [inviteLoading, setInviteLoading] = useState(false);

  const filtered = allMembers.filter((m) => {
    const matchesRole = activeTab === "all" || m.role === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (m.full_name?.toLowerCase().includes(q)) ||
      m.user_id.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const countByRole = (role: string) => allMembers.filter((m) => m.role === role).length;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return toast.error("Email required");
    setInviteLoading(true);

    try {
      // Try to find user by email in profiles
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("user_id", inviteEmail) // Can't search by email directly - use edge function in prod
        .limit(1);

      // Use the admin signup approach: create invite via auth admin or fall back to direct insert
      // For now we'll use the service-role safe approach: sign them up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail.trim(),
        password: Math.random().toString(36).slice(-10) + "A1!",
        options: { data: { invited_by: user?.id } },
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        throw signUpError;
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        // User already exists — try to find them
        // We'll just notify admin that user needs to log in and will be added
        toast.warning("User already registered. Ask them to log in — they'll be added on next sign-in.");
        setInviteOpen(false);
        setInviteLoading(false);
        return;
      }

      // Add to institution_members
      const { error: memberError } = await supabase.from("institution_members").insert({
        institution_id: institutionId,
        user_id: userId,
        role: inviteRole,
        invited_by: user?.id,
      });

      if (memberError) throw memberError;

      toast.success(`${inviteRole} invited successfully!`);
      qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
      setInviteOpen(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("institution_members")
      .delete()
      .eq("id", memberId);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
  };

  const handleChangeRole = async (memberId: string, newRole: InstitutionRole) => {
    const { error } = await supabase
      .from("institution_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["institution-members", institutionId] });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage teachers, students, parents, and staff</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 self-start">
              <UserPlus className="h-4 w-4" /> Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InstitutionRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleInvite} disabled={inviteLoading}>
                  {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "All", count: allMembers.length, icon: Users, color: "text-foreground", bg: "bg-secondary" },
          { label: "Teachers", count: countByRole("teacher"), icon: UserCheck, color: "text-accent", bg: "bg-accent/10" },
          { label: "Students", count: countByRole("student"), icon: GraduationCap, color: "text-primary", bg: "bg-primary/10" },
          { label: "Parents", count: countByRole("parent"), icon: BookUser, color: "text-orange-600", bg: "bg-orange-500/10" },
          { label: "Staff/Admin", count: countByRole("admin") + countByRole("staff"), icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setActiveTab(stat.label === "All" ? "all" : stat.label === "Staff/Admin" ? "admin" : stat.label.toLowerCase())}>
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

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="teacher" className="text-xs">Teachers</TabsTrigger>
            <TabsTrigger value="student" className="text-xs">Students</TabsTrigger>
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
                              <p className="text-xs">Click "Invite User" to add team members</p>
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
                                {member.full_name || "—"}
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
                              {member.role}
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
                              <DropdownMenuContent align="end" className="w-44">
                                {ALL_ROLES.filter((r) => r !== member.role).map((r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() => handleChangeRole(member.id, r)}
                                    className="capitalize text-sm"
                                  >
                                    Change to {r}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
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
    </div>
  );
}
