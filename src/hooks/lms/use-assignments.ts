import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Assignment = {
  id: string;
  institution_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  total_marks: number;
  passing_marks: number;
  created_by: string | null;
  status: "draft" | "active" | "closed";
  created_at: string;
  updated_at: string;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  institution_id: string;
  file_url: string | null;
  notes: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  status: "submitted" | "graded" | "returned";
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
};

export function useAssignments(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["assignments", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: !!institutionId,
  });
}

export function useAssignmentSubmissions(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as AssignmentSubmission[];
    },
    enabled: !!assignmentId,
  });
}

export function useCreateAssignment(institutionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      title: string;
      description?: string;
      instructions?: string;
      due_date?: string;
      total_marks?: number;
      passing_marks?: number;
      course_id?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("assignments")
        .insert({ ...values, institution_id: institutionId, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", institutionId] });
      toast.success("Assignment created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAssignment(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Assignment> & { id: string }) => {
      const { error } = await supabase.from("assignments").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", institutionId] });
      toast.success("Assignment updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAssignment(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", institutionId] });
      toast.success("Assignment deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGradeSubmission(assignmentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, marks_obtained, feedback }: { id: string; marks_obtained: number; feedback?: string }) => {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({ marks_obtained, feedback, status: "graded", graded_by: user?.id, graded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", assignmentId] });
      toast.success("Submission graded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
