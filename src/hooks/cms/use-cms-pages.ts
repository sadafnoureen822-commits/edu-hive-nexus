import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCmsPages(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["cms-pages", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("is_system_page", { ascending: false })
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}

export function useCmsPage(pageId: string | undefined) {
  return useQuery({
    queryKey: ["cms-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("id", pageId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (page: {
      institution_id: string;
      title: string;
      slug: string;
      meta_description?: string;
      created_by?: string;
    }) => {
      const { data, error } = await supabase
        .from("cms_pages")
        .insert(page)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages", data.institution_id] });
      toast.success("Page created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      slug?: string;
      meta_description?: string;
      status?: "draft" | "published" | "archived";
      published_at?: string | null;
      updated_by?: string;
    }) => {
      const { data, error } = await supabase
        .from("cms_pages")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages", data.institution_id] });
      queryClient.invalidateQueries({ queryKey: ["cms-page", data.id] });
      toast.success("Page updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, institutionId }: { id: string; institutionId: string }) => {
      const { error } = await supabase.from("cms_pages").delete().eq("id", id);
      if (error) throw error;
      return { institutionId };
    },
    onSuccess: ({ institutionId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages", institutionId] });
      toast.success("Page deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePublishCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { data, error } = await supabase
        .from("cms_pages")
        .update({
          status: publish ? "published" as const : "draft" as const,
          published_at: publish ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages", data.institution_id] });
      queryClient.invalidateQueries({ queryKey: ["cms-page", data.id] });
      toast.success(data.status === "published" ? "Page published" : "Page unpublished");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
