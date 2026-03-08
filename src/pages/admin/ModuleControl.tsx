/**
 * Super Admin — Module Control
 * Enable / disable LMS, CMS, Exams and other modules per institution.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BookOpen, Globe, ClipboardList, DollarSign, CalendarCheck,
  UserPlus, Award, MessageSquare, Search, Building2, Loader2,
  Settings2, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import AIDataExport from "@/components/ui/AIDataExport";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ModuleRow {
  id: string;
  institution_id: string;
  module_name: string;
  is_enabled: boolean;
  updated_at: string;
}
interface Institution { id: string; name: string; slug: string; status: string; }

const MODULE_META: Record<string, { label: string; icon: React.ElementType; description: string; color: string }> = {
  lms:           { label: "LMS",           icon: BookOpen,      description: "Courses, lessons, quizzes & assignments",   color: "text-primary" },
  cms:           { label: "CMS",           icon: Globe,         description: "Public website builder & pages",            color: "text-violet-600" },
  exams:         { label: "Exams",         icon: ClipboardList, description: "Exam creation, date sheets & results",      color: "text-orange-600" },
  fees:          { label: "Fee Management",icon: DollarSign,    description: "Fee structures & payment tracking",         color: "text-green-600" },
  attendance:    { label: "Attendance",    icon: CalendarCheck, description: "Daily & subject-wise attendance",           color: "text-blue-600" },
  admissions:    { label: "Admissions",    icon: UserPlus,      description: "Online application & enrollment workflow",  color: "text-teal-600" },
  certificates:  { label: "Certificates", icon: Award,         description: "Certificate templates & issuance",          color: "text-amber-600" },
  communication: { label: "Communication",icon: MessageSquare, description: "Announcements, notifications & messaging",  color: "text-pink-600" },
};

const ALL_MODULES = Object.keys(MODULE_META);

export default function ModuleControlPage() {
  const qc = useQueryClient();
  const [search,     setSearch]     = useState("");
  const [filterInst, setFilterInst] = useState("all");

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: institutions = [], isLoading: instLoading } = useQuery({
    queryKey: ["mc-institutions"],
    queryFn: async () => {
      const { data } = await supabase.from("institutions").select("id, name, slug, status").order("name");
      return (data ?? []) as Institution[];
    },
  });

  const { data: moduleRows = [], isLoading: modLoading } = useQuery({
    queryKey: ["mc-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_modules" as any)
        .select("*")
        .order("institution_id");
      if (error) throw error;
      return (data ?? []) as unknown as ModuleRow[];
    },
  });

  // ── Mutation: toggle one module ──────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async ({ institutionId, moduleName, enabled }: { institutionId: string; moduleName: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("institution_modules" as any)
        .upsert(
          { institution_id: institutionId, module_name: moduleName, is_enabled: enabled },
          { onConflict: "institution_id,module_name" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`${MODULE_META[vars.moduleName]?.label} ${vars.enabled ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["mc-modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Mutation: enable/disable all modules for an institution ──────────────────
  const bulkMutation = useMutation({
    mutationFn: async ({ institutionId, enabled }: { institutionId: string; enabled: boolean }) => {
      const rows = ALL_MODULES.map((m) => ({
        institution_id: institutionId,
        module_name: m,
        is_enabled: enabled,
      }));
      const { error } = await supabase
        .from("institution_modules" as any)
        .upsert(rows, { onConflict: "institution_id,module_name" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`All modules ${vars.enabled ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["mc-modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Helper: get module state ─────────────────────────────────────────────────
  const getEnabled = (institutionId: string, moduleName: string): boolean => {
    const row = moduleRows.find((r) => r.institution_id === institutionId && r.module_name === moduleName);
    return row?.is_enabled ?? true;
  };

  const getEnabledCount = (institutionId: string) =>
    ALL_MODULES.filter((m) => getEnabled(institutionId, m)).length;

  // ── Filtered institutions ────────────────────────────────────────────────────
  const filtered = institutions.filter((i) => {
    const q = search.toLowerCase();
    const matchQ    = !q || i.name.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q);
    const matchInst = filterInst === "all" || i.id === filterInst;
    return matchQ && matchInst;
  });

  const isLoading = instLoading || modLoading;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Settings2 className="h-7 w-7 text-primary" />
            Module Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Enable or disable platform modules for each institution
          </p>
        </div>
      </div>

      {/* Module Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ALL_MODULES.map((m) => {
          const meta = MODULE_META[m];
          const Icon = meta.icon;
          return (
            <div key={m} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/50 bg-card/50 text-center">
              <Icon className={`h-5 w-5 ${meta.color}`} />
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search institution…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterInst} onValueChange={setFilterInst}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Institutions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Institutions</SelectItem>
            {institutions.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterInst !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterInst("all"); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Institution Module Grids */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No institutions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((inst) => {
            const enabledCount = getEnabledCount(inst.id);
            const allEnabled   = enabledCount === ALL_MODULES.length;
            const allDisabled  = enabledCount === 0;

            return (
              <Card key={inst.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{inst.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">/{inst.slug}</code>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${inst.status === "active" ? "text-green-600 border-green-200 bg-green-50" : "text-destructive border-destructive/20"}`}
                          >
                            {inst.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{enabledCount}/{ALL_MODULES.length} modules on</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        className="gap-1.5 text-xs h-7 text-green-600 border-green-200 hover:bg-green-50"
                        disabled={allEnabled || bulkMutation.isPending}
                        onClick={() => bulkMutation.mutate({ institutionId: inst.id, enabled: true })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Enable All
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="gap-1.5 text-xs h-7 text-destructive border-destructive/20 hover:bg-destructive/5"
                        disabled={allDisabled || bulkMutation.isPending}
                        onClick={() => bulkMutation.mutate({ institutionId: inst.id, enabled: false })}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Disable All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ALL_MODULES.map((moduleName) => {
                      const meta    = MODULE_META[moduleName];
                      const Icon    = meta.icon;
                      const enabled = getEnabled(inst.id, moduleName);
                      const busy    = toggleMutation.isPending;

                      return (
                        <div
                          key={moduleName}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                            enabled
                              ? "border-primary/20 bg-primary/5"
                              : "border-border/50 bg-muted/30 opacity-60"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${enabled ? "bg-background" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${enabled ? meta.color : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold truncate">{meta.label}</p>
                              <Switch
                                checked={enabled}
                                disabled={busy}
                                onCheckedChange={(v) =>
                                  toggleMutation.mutate({ institutionId: inst.id, moduleName, enabled: v })
                                }
                                className="scale-75 flex-shrink-0"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                              {meta.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
