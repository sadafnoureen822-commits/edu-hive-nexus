import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CertificateTemplate = {
  id: string;
  institution_id: string;
  name: string;
  template_type: "certificate" | "transcript" | "result_card";
  template_html: string | null;
  background_url: string | null;
  logo_url: string | null;
  signature_urls: import("@/integrations/supabase/types").Json;
  fields: import("@/integrations/supabase/types").Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type IssuedCertificate = {
  id: string;
  template_id: string;
  student_id: string;
  institution_id: string;
  serial_number: string;
  certificate_data: Record<string, unknown>;
  issued_at: string;
  revoked_at: string | null;
  is_revoked: boolean;
};

export function useCertificateTemplates(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["cert-templates", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CertificateTemplate[];
    },
    enabled: !!institutionId,
  });
}

export function useIssuedCertificates(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["issued-certs", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("issued_certificates")
        .select("*")
        .eq("institution_id", institutionId)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as IssuedCertificate[];
    },
    enabled: !!institutionId,
  });
}

export function useCreateCertificateTemplate(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      name: string;
      template_type: string;
      template_html?: string;
      background_url?: string;
      logo_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .insert({ ...values, institution_id: institutionId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cert-templates", institutionId] });
      toast.success("Template created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCertificateTemplate(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CertificateTemplate> & { id: string }) => {
      const { error } = await supabase.from("certificate_templates").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cert-templates", institutionId] });
      toast.success("Template updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useIssueCertificate(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      template_id: string;
      student_id: string;
      certificate_data: Record<string, unknown>;
      serial_number: string;
    }) => {
      const { data, error } = await supabase
        .from("issued_certificates")
        .insert({ ...values, institution_id: institutionId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issued-certs", institutionId] });
      toast.success("Certificate issued");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRevokeCertificate(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("issued_certificates")
        .update({ is_revoked: true, revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issued-certs", institutionId] });
      toast.success("Certificate revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
