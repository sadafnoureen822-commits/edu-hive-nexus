import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AttendanceRecord = {
  id: string;
  institution_id: string;
  student_id: string;
  class_id: string | null;
  section_id: string | null;
  subject_id: string | null;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  marked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useAttendance(institutionId: string | undefined, date?: string, classId?: string) {
  return useQuery({
    queryKey: ["attendance", institutionId, date, classId],
    queryFn: async () => {
      if (!institutionId) return [];
      let q = supabase
        .from("attendance")
        .select("*")
        .eq("institution_id", institutionId)
        .order("date", { ascending: false });
      if (date) q = q.eq("date", date);
      if (classId) q = q.eq("class_id", classId);
      const { data, error } = await q;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!institutionId,
  });
}

export function useStudentAttendance(studentId: string | undefined, institutionId: string | undefined) {
  return useQuery({
    queryKey: ["attendance-student", studentId, institutionId],
    queryFn: async () => {
      if (!studentId || !institutionId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .eq("institution_id", institutionId)
        .order("date", { ascending: false })
        .limit(90);
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!studentId && !!institutionId,
  });
}

export function useMarkAttendance(institutionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (records: Array<{
      student_id: string;
      date: string;
      status: "present" | "absent" | "late" | "excused";
      class_id?: string;
      section_id?: string;
      subject_id?: string;
      notes?: string;
    }>) => {
      const rows = records.map((r) => ({
        ...r,
        institution_id: institutionId,
        marked_by: user?.id,
      }));
      const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "institution_id,student_id,date" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", institutionId] });
      toast.success("Attendance saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
