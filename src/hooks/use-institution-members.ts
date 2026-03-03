import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MemberWithProfile = {
  id: string;
  user_id: string;
  institution_id: string;
  role: string;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export function useInstitutionMembers(institutionId: string | undefined, role?: string) {
  return useQuery({
    queryKey: ["institution-members", institutionId, role],
    queryFn: async () => {
      if (!institutionId) return [];
      let q = supabase
        .from("institution_members")
        .select("*, profiles(full_name, avatar_url)")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (role) q = q.eq("role", role);
      const { data, error } = await q;
      if (error) throw error;
      return data as MemberWithProfile[];
    },
    enabled: !!institutionId,
  });
}
