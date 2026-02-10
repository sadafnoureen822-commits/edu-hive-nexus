import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useAcademicSessions() {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_sessions")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const createSession = useMutation({
    mutationFn: async (values: { name: string; academic_model: string; start_date: string; end_date: string; is_current: boolean }) => {
      const { data, error } = await supabase
        .from("academic_sessions")
        .insert({ ...values, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions", institutionId] });
      toast.success("Academic session created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academic_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions", institutionId] });
      toast.success("Session deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { sessions: sessionsQuery.data ?? [], loading: sessionsQuery.isLoading, createSession, deleteSession };
}
