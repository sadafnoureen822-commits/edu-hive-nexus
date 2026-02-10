import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useExams() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const institutionId = institution?.id;

  const examsQuery = useQuery({
    queryKey: ["exams", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*, academic_sessions(name), classes(name), sections(name), grading_scales(name)")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const createExam = useMutation({
    mutationFn: async (values: {
      name: string;
      session_id: string;
      class_id: string;
      section_id?: string;
      exam_type: string;
      term_number?: number;
      start_date?: string;
      end_date?: string;
      grading_scale_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("exams")
        .insert({ ...values, institution_id: institutionId!, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", institutionId] });
      toast.success("Exam created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateExamStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("exams").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", institutionId] });
      toast.success("Exam status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", institutionId] });
      toast.success("Exam deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { exams: examsQuery.data ?? [], loading: examsQuery.isLoading, createExam, updateExamStatus, deleteExam };
}
