import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useSubjects() {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const subjectsQuery = useQuery({
    queryKey: ["subjects", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const createSubject = useMutation({
    mutationFn: async (values: { name: string; code?: string; description?: string }) => {
      const { data, error } = await supabase
        .from("subjects")
        .insert({ ...values, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", institutionId] });
      toast.success("Subject created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", institutionId] });
      toast.success("Subject deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { subjects: subjectsQuery.data ?? [], loading: subjectsQuery.isLoading, createSubject, deleteSubject };
}
