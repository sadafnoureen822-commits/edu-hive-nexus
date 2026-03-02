import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Quiz = {
  id: string;
  institution_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  created_by: string | null;
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  institution_id: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "short_answer";
  marks: number;
  position: number;
  explanation: string | null;
  created_at: string;
  quiz_options?: QuizOption[];
};

export type QuizOption = {
  id: string;
  question_id: string;
  institution_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
};

export function useQuizzes(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["quizzes", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quiz[];
    },
    enabled: !!institutionId,
  });
}

export function useQuizWithQuestions(quizId: string | undefined) {
  return useQuery({
    queryKey: ["quiz-detail", quizId],
    queryFn: async () => {
      if (!quizId) return null;
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*, quiz_options(*)")
        .eq("quiz_id", quizId)
        .order("position");
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!quizId,
  });
}

export function useCreateQuiz(institutionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      title: string;
      description?: string;
      duration_minutes?: number;
      total_marks?: number;
      passing_marks?: number;
      max_attempts?: number;
      course_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("quizzes")
        .insert({ ...values, institution_id: institutionId, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", institutionId] });
      toast.success("Quiz created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateQuiz(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Quiz> & { id: string }) => {
      const { error } = await supabase.from("quizzes").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", institutionId] });
      toast.success("Quiz updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteQuiz(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", institutionId] });
      toast.success("Quiz deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddQuestion(institutionId: string, quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      question_text: string;
      question_type: string;
      marks: number;
      position: number;
      explanation?: string;
      options: { option_text: string; is_correct: boolean; position: number }[];
    }) => {
      const { options, ...questionData } = values;
      const { data: question, error: qErr } = await supabase
        .from("quiz_questions")
        .insert({ ...questionData, quiz_id: quizId, institution_id: institutionId })
        .select()
        .single();
      if (qErr) throw qErr;

      if (options?.length) {
        const { error: oErr } = await supabase.from("quiz_options").insert(
          options.map((o) => ({ ...o, question_id: question.id, institution_id: institutionId }))
        );
        if (oErr) throw oErr;
      }
      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-detail", quizId] });
      toast.success("Question added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteQuestion(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-detail", quizId] });
      toast.success("Question deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
