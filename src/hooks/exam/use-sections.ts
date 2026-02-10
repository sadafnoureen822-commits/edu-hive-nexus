import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useSections() {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const sectionsQuery = useQuery({
    queryKey: ["sections", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections")
        .select("*, classes(name)")
        .eq("institution_id", institutionId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const createSection = useMutation({
    mutationFn: async (values: { name: string; class_id: string }) => {
      const { data, error } = await supabase
        .from("sections")
        .insert({ ...values, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", institutionId] });
      toast.success("Section created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", institutionId] });
      toast.success("Section deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { sections: sectionsQuery.data ?? [], loading: sectionsQuery.isLoading, createSection, deleteSection };
}
