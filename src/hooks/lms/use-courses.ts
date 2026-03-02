import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Course = {
  id: string;
  institution_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: "draft" | "published" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CourseLesson = {
  id: string;
  course_id: string;
  institution_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  file_url: string | null;
  position: number;
  duration_minutes: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export function useCourses(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["courses", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!institutionId,
  });
}

export function useCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("position");
      if (error) throw error;
      return data as CourseLesson[];
    },
    enabled: !!courseId,
  });
}

export function useCreateCourse(institutionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { title: string; description?: string; status?: string }) => {
      const { data, error } = await supabase
        .from("courses")
        .insert({ ...values, institution_id: institutionId, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", institutionId] });
      toast.success("Course created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCourse(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Course> & { id: string }) => {
      const { error } = await supabase.from("courses").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", institutionId] });
      toast.success("Course updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCourse(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", institutionId] });
      toast.success("Course deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLesson(institutionId: string, courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { title: string; content?: string; video_url?: string; position?: number; duration_minutes?: number }) => {
      const { data, error } = await supabase
        .from("course_lessons")
        .insert({ ...values, course_id: courseId, institution_id: institutionId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success("Lesson added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CourseLesson> & { id: string }) => {
      const { error } = await supabase.from("course_lessons").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success("Lesson updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success("Lesson deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
