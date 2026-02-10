import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useClasses() {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const classesQuery = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("numeric_level", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const createClass = useMutation({
    mutationFn: async (values: { name: string; numeric_level?: number; description?: string }) => {
      const { data, error } = await supabase
        .from("classes")
        .insert({ ...values, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", institutionId] });
      toast.success("Class created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", institutionId] });
      toast.success("Class deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { classes: classesQuery.data ?? [], loading: classesQuery.isLoading, createClass, deleteClass };
}
