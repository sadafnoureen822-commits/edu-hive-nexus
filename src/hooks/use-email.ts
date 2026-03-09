import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type EmailLog = {
  id: string;
  institution_id: string;
  sent_by: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string | null;
  status: string;
  message_id: string | null;
  error_message: string | null;
  audience: string | null;
  sent_at: string;
  template_id: string | null;
};

export function useEmailLogs(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["email-logs", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .eq("institution_id", institutionId)
        .order("sent_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!institutionId,
  });
}

export function useSendEmail(institutionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      recipient_email: string;
      recipient_name?: string;
      subject: string;
      body: string;
      audience?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          institution_id: institutionId,
          sent_by: user?.id,
          ...payload,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Failed to send email");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-logs", institutionId] });
      toast.success("Email sent successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
