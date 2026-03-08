import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Building2, ExternalLink } from "lucide-react";
import AIDataExport from "@/components/ui/AIDataExport";
import type { Tables } from "@/integrations/supabase/types";

type Institution = Tables<"institutions">;

const statusColors: Record<string, string> = {
  active: "bg-accent/10 text-accent border-accent/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchInstitutions = async () => {
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setInstitutions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const { error } = await supabase.from("institutions").insert({ name, slug });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Institution created" });
      setDialogOpen(false);
      setName("");
      setSlug("");
      fetchInstitutions();
    }

    setCreating(false);
  };

  const handleToggleStatus = async (inst: Institution) => {
    const newStatus = inst.status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("institutions")
      .update({ status: newStatus })
      .eq("id", inst.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchInstitutions();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Institutions</h1>
          <p className="text-muted-foreground mt-1">Manage your tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <AIDataExport
            contextData={institutions.map((i) => ({ Name: i.name, Slug: i.slug, Status: i.status, Created: new Date(i.created_at).toLocaleDateString() }))}
            label="AI Export"
            exportTitle="Institutions Report"
            fileName="institutions"
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Institution
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Institution</DialogTitle>
              <DialogDescription>Add a new tenant to the platform</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inst-name">Name</Label>
                <Input
                  id="inst-name"
                  placeholder="Acme University"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                    );
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-slug">Slug (URL path)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    id="inst-slug"
                    placeholder="acme-university"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Institution"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            All Institutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4">Loading...</p>
          ) : institutions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No institutions yet. Create your first one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">/{inst.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[inst.status]}>
                        {inst.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(inst.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(inst)}
                      >
                        {inst.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                      <Link to={`/admin/institutions/${inst.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Manage
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
