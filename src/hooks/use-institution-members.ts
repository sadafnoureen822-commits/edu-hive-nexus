import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

export type MemberWithProfile = {
  id: string;
  user_id: string;
  institution_id: string;
  role: string;
  created_at: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export function useInstitutionMembers(institutionId: string | undefined, role?: string) {
  return useQuery({
    queryKey: ["institution-members", institutionId, role],
    queryFn: async () => {
      if (!institutionId) return [];
      let q = supabase
        .from("institution_members")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (role) q = q.eq("role", role as Enums<"institution_role">);
      const { data, error } = await q;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = data.map((m) => m.user_id);
      if (!userIds.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      return data.map((m) => ({
        ...m,
        full_name: profileMap[m.user_id]?.full_name ?? null,
        avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
      })) as MemberWithProfile[];
    },
    enabled: !!institutionId,
  });
}
