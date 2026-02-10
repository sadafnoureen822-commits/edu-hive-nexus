import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useDateSheets(examId: string | undefined) {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const dateSheetsQuery = useQuery({
    queryKey: ["date-sheets", examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_date_sheets")
        .select("*, exam_subjects(*, subjects(name, code))")
        .eq("institution_id", institutionId!)
        .order("exam_date");
      if (error) throw error;
      // filter by exam subjects belonging to this exam
      return data;
    },
    enabled: !!examId && !!institutionId,
  });

  const createDateSheet = useMutation({
    mutationFn: async (values: {
      exam_subject_id: string;
      exam_date: string;
      start_time?: string;
      end_time?: string;
      location?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("exam_date_sheets")
        .insert({ ...values, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-sheets", examId] });
      toast.success("Date sheet entry created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDateSheet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_date_sheets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-sheets", examId] });
      toast.success("Date sheet entry deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { dateSheets: dateSheetsQuery.data ?? [], loading: dateSheetsQuery.isLoading, createDateSheet, deleteDateSheet };
}
