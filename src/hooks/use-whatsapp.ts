import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type WhatsAppLog = {
  id: string;
  institution_id: string;
  sent_by: string | null;
  recipient_phone: string;
  recipient_name: string | null;
  message: string;
  status: "pending" | "sent" | "delivered" | "failed";
  message_id: string | null;
  error_message: string | null;
  audience: string | null;
  created_at: string;
};

export function useWhatsAppLogs(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["whatsapp-logs", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as WhatsAppLog[];
    },
    enabled: !!institutionId,
  });
}

export function useSendWhatsApp(institutionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      recipient_phone: string;
      recipient_name?: string;
      message: string;
      audience?: string;
    }) => {
      // Log the message first
      const { data: log, error: logErr } = await supabase
        .from("whatsapp_logs")
        .insert({
          institution_id: institutionId,
          sent_by: user?.id,
          recipient_phone: payload.recipient_phone,
          recipient_name: payload.recipient_name,
          message: payload.message,
          audience: payload.audience || "individual",
          status: "pending",
        })
        .select()
        .single();
      if (logErr) throw logErr;

      // Call edge function to actually send via WhatsApp API
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          log_id: log.id,
          phone: payload.recipient_phone,
          message: payload.message,
          institution_id: institutionId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs", institutionId] });
      toast.success("Message sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
