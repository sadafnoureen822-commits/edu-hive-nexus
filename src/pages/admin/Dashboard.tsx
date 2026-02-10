import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, Users, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    institutions: 0,
    domains: 0,
    members: 0,
    activeInstitutions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [institutions, domains, members] = await Promise.all([
        supabase.from("institutions").select("id, status"),
        supabase.from("institution_domains").select("id", { count: "exact", head: true }),
        supabase.from("institution_members").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        institutions: institutions.data?.length ?? 0,
        domains: domains.count ?? 0,
        members: members.count ?? 0,
        activeInstitutions: institutions.data?.filter((i) => i.status === "active").length ?? 0,
      });
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Total Institutions", value: stats.institutions, icon: Building2, color: "text-primary" },
    { label: "Active Institutions", value: stats.activeInstitutions, icon: Activity, color: "text-accent" },
    { label: "Total Domains", value: stats.domains, icon: Globe, color: "text-primary" },
    { label: "Total Members", value: stats.members, icon: Users, color: "text-accent" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your multi-tenant platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
