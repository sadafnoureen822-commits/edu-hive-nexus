import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export function useExamSubjects(examId: string | undefined) {
  const { institution } = useTenant();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const examSubjectsQuery = useQuery({
    queryKey: ["exam-subjects", examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_subjects")
        .select("*, subjects(name, code)")
        .eq("exam_id", examId!)
        .order("subjects(name)");
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  const addSubject = useMutation({
    mutationFn: async (values: {
      subject_id: string;
      total_marks?: number;
      passing_marks?: number;
      theory_weightage?: number;
      practical_weightage?: number;
      viva_weightage?: number;
      grace_marks?: number;
    }) => {
      const { data, error } = await supabase
        .from("exam_subjects")
        .insert({ ...values, exam_id: examId!, institution_id: institutionId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-subjects", examId] });
      toast.success("Subject added to exam");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-subjects", examId] });
      toast.success("Subject removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { examSubjects: examSubjectsQuery.data ?? [], loading: examSubjectsQuery.isLoading, addSubject, removeSubject };
}
