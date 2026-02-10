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
import { Users } from "lucide-react";

interface MemberWithInstitution {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  institution_id: string;
  institutions: { name: string; slug: string } | null;
}

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  teacher: "bg-accent/10 text-accent border-accent/20",
  student: "bg-secondary text-foreground border-border",
};

export default function MembersPage() {
  const [members, setMembers] = useState<MemberWithInstitution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("institution_members")
        .select("*, institutions(name, slug)")
        .order("created_at", { ascending: false });

      if (data) setMembers(data as unknown as MemberWithInstitution[]);
      setLoading(false);
    };

    fetchMembers();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Members</h1>
        <p className="text-muted-foreground mt-1">All members across institutions</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            All Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>{m.institutions?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[m.role]}>
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
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
