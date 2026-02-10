import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Users, Plus, Trash2 } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Institution = Tables<"institutions">;
type Domain = Tables<"institution_domains">;
type Member = Tables<"institution_members">;

export default function InstitutionDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Add domain state
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // Add member state
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Enums<"institution_role">>("student");
  const [addingMember, setAddingMember] = useState(false);

  const fetchAll = async () => {
    if (!id) return;

    const [instRes, domainsRes, membersRes] = await Promise.all([
      supabase.from("institutions").select("*").eq("id", id).maybeSingle(),
      supabase.from("institution_domains").select("*").eq("institution_id", id).order("created_at"),
      supabase.from("institution_members").select("*").eq("institution_id", id).order("created_at"),
    ]);

    if (instRes.data) setInstitution(instRes.data);
    if (domainsRes.data) setDomains(domainsRes.data);
    if (membersRes.data) setMembers(membersRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setAddingDomain(true);

    const { error } = await supabase.from("institution_domains").insert({
      institution_id: id,
      domain: newDomain.toLowerCase().trim(),
      status: "pending_verification",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Domain added" });
      setDomainDialogOpen(false);
      setNewDomain("");
      fetchAll();
    }

    setAddingDomain(false);
  };

  const handleToggleDomainStatus = async (domain: Domain) => {
    const newStatus = domain.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("institution_domains")
      .update({ status: newStatus })
      .eq("id", domain.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchAll();
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    const { error } = await supabase.from("institution_domains").delete().eq("id", domainId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchAll();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setAddingMember(true);

    // Note: In a real app, you'd look up the user by email via an edge function.
    // For now we show this as a placeholder — members need a user_id.
    toast({
      title: "Member invitation",
      description:
        "In production, this would send an invitation email. For now, add members by their user ID directly.",
    });

    setMemberDialogOpen(false);
    setMemberEmail("");
    setAddingMember(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from("institution_members").delete().eq("id", memberId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchAll();
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  if (!institution) {
    return <div className="p-8 text-destructive">Institution not found</div>;
  }

  const domainStatusColors: Record<string, string> = {
    active: "bg-accent/10 text-accent border-accent/20",
    inactive: "bg-muted text-muted-foreground border-border",
    pending_verification: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    teacher: "bg-accent/10 text-accent border-accent/20",
    student: "bg-secondary text-foreground border-border",
  };

  return (
    <div className="p-8">
      <Link to="/admin/institutions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Institutions
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">{institution.name}</h1>
        <p className="text-muted-foreground mt-1">
          Slug: <code className="bg-secondary px-2 py-0.5 rounded text-sm">/{institution.slug}</code>
        </p>
      </div>

      <div className="grid gap-8">
        {/* Domains */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Domains ({domains.length})
            </CardTitle>
            <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Add Domain</DialogTitle>
                  <DialogDescription>Map a domain to this institution</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddDomain} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      placeholder="www.acme-university.edu"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addingDomain}>
                    {addingDomain ? "Adding..." : "Add Domain"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {domains.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No domains mapped yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.domain}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={domainStatusColors[d.status]}>
                          {d.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.is_primary && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            Primary
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleDomainStatus(d)}
                        >
                          {d.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteDomain(d.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Members ({members.length})
            </CardTitle>
            <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Add Member</DialogTitle>
                  <DialogDescription>Invite a user to this institution</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="user@example.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-role">Role</Label>
                    <Select value={memberRole} onValueChange={(v) => setMemberRole(v as Enums<"institution_role">)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={addingMember}>
                    {addingMember ? "Adding..." : "Add Member"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No members yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.user_id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[m.role]}>
                          {m.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveMember(m.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
