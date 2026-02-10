import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCmsSiteSettings(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["cms-site-settings", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_site_settings")
        .select("*")
        .eq("institution_id", institutionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}

export function useUpdateCmsSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      institutionId,
      ...updates
    }: {
      institutionId: string;
      site_title?: string;
      tagline?: string;
      logo_url?: string;
      favicon_url?: string;
      primary_color?: string;
      secondary_color?: string;
      font_family?: string;
      custom_css?: string;
      analytics_code?: string;
    }) => {
      // Upsert: update if exists, insert if not
      const { data: existing } = await supabase
        .from("cms_site_settings")
        .select("id")
        .eq("institution_id", institutionId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("cms_site_settings")
          .update(updates)
          .eq("institution_id", institutionId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("cms_site_settings")
          .insert({ institution_id: institutionId, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-site-settings", data.institution_id] });
      toast.success("Site settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
