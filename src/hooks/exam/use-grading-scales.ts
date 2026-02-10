import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useGradingScales() {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const scalesQuery = useQuery({
    queryKey: ["grading-scales", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grading_scales")
        .select("*, grading_scale_entries(*)")
        .eq("institution_id", institutionId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const createScale = useMutation({
    mutationFn: async (values: { name: string; is_default: boolean; entries: Array<{ grade_letter: string; min_percentage: number; max_percentage: number; gpa_points?: number; description?: string }> }) => {
      const { entries, ...scaleData } = values;
      const { data: scale, error } = await supabase
        .from("grading_scales")
        .insert({ ...scaleData, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;

      if (entries.length > 0) {
        const { error: entriesError } = await supabase
          .from("grading_scale_entries")
          .insert(entries.map(e => ({ ...e, scale_id: scale.id, institution_id: institutionId! })) as any);
        if (entriesError) throw entriesError;
      }
      return scale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales", institutionId] });
      toast.success("Grading scale created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteScale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grading_scales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales", institutionId] });
      toast.success("Grading scale deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { scales: scalesQuery.data ?? [], loading: scalesQuery.isLoading, createScale, deleteScale };
}
