import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, User, FileText, BookOpen, ClipboardList, Settings } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const ACTION_ICONS: Record<string, any> = {
  created_exam: ClipboardList,
  deleted_user: User,
  sent_whatsapp_bulk: FileText,
  sent_notification: FileText,
  auto_suspended: Settings,
  login: User,
};

const ACTION_COLORS: Record<string, string> = {
  created_exam: "text-blue-500 bg-blue-500/10",
  deleted_user: "text-red-500 bg-red-500/10",
  sent_whatsapp_bulk: "text-green-500 bg-green-500/10",
  sent_notification: "text-primary bg-primary/10",
  auto_suspended: "text-yellow-500 bg-yellow-500/10",
  login: "text-muted-foreground bg-secondary",
};

export default function ActivityLogsPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id;
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity_logs", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!institutionId,
  });

  const entityTypes = [...new Set(logs?.map((l: any) => l.entity_type).filter(Boolean))];

  const filtered = logs?.filter((l: any) => {
    const matchSearch = !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === "all" || l.entity_type === entityFilter;
    return matchSearch && matchEntity;
  }) || [];

  const actionCounts = logs?.reduce((acc: Record<string, number>, l: any) => {
    const k = l.action || "unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const topActions = Object.entries(actionCounts || {}).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Activity Logs</h1>
        <p className="text-muted-foreground text-sm">Full audit trail of all institution activities</p>
      </div>

      {/* Top Actions Summary */}
      {topActions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {topActions.map(([action, count]) => {
            const Icon = ACTION_ICONS[action] || Activity;
            const colorClass = ACTION_COLORS[action] || "text-muted-foreground bg-secondary";
            return (
              <Card key={action}>
                <CardContent className="pt-3 pb-3 flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-none">{count}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{action.replace(/_/g, " ")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((t: any) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No activity logs found</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {["Action", "Entity", "Details", "User", "Time"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l: any) => {
                const Icon = ACTION_ICONS[l.action] || Activity;
                const colorClass = ACTION_COLORS[l.action] || "text-muted-foreground bg-secondary";
                return (
                  <tr key={l.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${colorClass}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="font-medium text-xs">{l.action?.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {l.entity_type && <Badge variant="outline" className="text-[10px]">{l.entity_type}</Badge>}
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate text-xs text-muted-foreground">
                      {l.new_data ? JSON.stringify(l.new_data).slice(0, 60) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                      {l.user_id ? l.user_id.slice(0, 8) + "..." : "system"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
