import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type StudentMark = {
  id: string;
  exam_subject_id: string;
  student_id: string;
  institution_id: string;
  theory_marks: number | null;
  practical_marks: number | null;
  viva_marks: number | null;
  total_marks: number | null;
  grace_marks_applied: number;
  is_absent: boolean;
  status: "draft" | "submitted" | "reviewed" | "approved" | "rejected";
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export function useStudentMarks(examSubjectId: string | undefined) {
  return useQuery({
    queryKey: ["student-marks", examSubjectId],
    queryFn: async () => {
      if (!examSubjectId) return [];
      const { data, error } = await supabase
        .from("student_marks")
        .select("*")
        .eq("exam_subject_id", examSubjectId)
        .order("created_at");
      if (error) throw error;
      return data as StudentMark[];
    },
    enabled: !!examSubjectId,
  });
}

export function useStudentMarksByInstitution(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["all-student-marks", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("student_marks")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StudentMark[];
    },
    enabled: !!institutionId,
  });
}

export function useUpsertStudentMark(examSubjectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      student_id: string;
      institution_id: string;
      theory_marks?: number;
      practical_marks?: number;
      viva_marks?: number;
      grace_marks_applied?: number;
      is_absent?: boolean;
      remarks?: string;
    }) => {
      const { data, error } = await supabase
        .from("student_marks")
        .upsert(
          { ...values, exam_subject_id: examSubjectId },
          { onConflict: "exam_subject_id,student_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-marks", examSubjectId] });
      toast.success("Marks saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitMarks(examSubjectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (markIds: string[]) => {
      const { error } = await supabase
        .from("student_marks")
        .update({ status: "submitted", submitted_by: user?.id, submitted_at: new Date().toISOString() })
        .in("id", markIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-marks", examSubjectId] });
      toast.success("Marks submitted for review");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReviewMarks(examSubjectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ markIds, action, rejection_reason }: { markIds: string[]; action: "reviewed" | "rejected"; rejection_reason?: string }) => {
      const update: Record<string, unknown> = {
        status: action,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };
      if (action === "rejected" && rejection_reason) update.rejection_reason = rejection_reason;
      const { error } = await supabase.from("student_marks").update(update).in("id", markIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-marks", examSubjectId] });
      toast.success("Marks reviewed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveMarks(examSubjectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (markIds: string[]) => {
      const { error } = await supabase
        .from("student_marks")
        .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
        .in("id", markIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-marks", examSubjectId] });
      toast.success("Marks approved and published");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
