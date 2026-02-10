import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe } from "lucide-react";

interface DomainWithInstitution {
  id: string;
  domain: string;
  status: string;
  is_primary: boolean;
  created_at: string;
  institution_id: string;
  institutions: { name: string; slug: string } | null;
}

const statusColors: Record<string, string> = {
  active: "bg-accent/10 text-accent border-accent/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending_verification: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainWithInstitution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDomains = async () => {
      const { data } = await supabase
        .from("institution_domains")
        .select("*, institutions(name, slug)")
        .order("created_at", { ascending: false });

      if (data) setDomains(data as unknown as DomainWithInstitution[]);
      setLoading(false);
    };

    fetchDomains();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Domains</h1>
        <p className="text-muted-foreground mt-1">All domain mappings across institutions</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            All Domains
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No domains configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-sm">{d.domain}</TableCell>
                    <TableCell>{d.institutions?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[d.status]}>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
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
