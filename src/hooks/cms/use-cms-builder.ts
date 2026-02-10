import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export function useCmsSections(pageId: string | undefined) {
  return useQuery({
    queryKey: ["cms-sections", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*, cms_blocks(*)")
        .eq("page_id", pageId!)
        .order("position")
        .order("position", { referencedTable: "cms_blocks" });
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}

export function useCreateCmsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: {
      page_id: string;
      institution_id: string;
      section_type: "hero_banner" | "about" | "programs" | "admission_cta" | "testimonials" | "statistics" | "gallery" | "notice_board" | "contact" | "custom_html";
      title?: string;
      position: number;
      settings?: Json;
    }) => {
      const { data, error } = await supabase
        .from("cms_sections")
        .insert([section])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections", data.page_id] });
      toast.success("Section added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCmsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      pageId,
      ...updates
    }: {
      id: string;
      pageId: string;
      title?: string;
      position?: number;
      settings?: Json;
      is_visible?: boolean;
    }) => {
      const { error } = await supabase
        .from("cms_sections")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return { pageId };
    },
    onSuccess: ({ pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections", pageId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCmsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pageId }: { id: string; pageId: string }) => {
      const { error } = await supabase.from("cms_sections").delete().eq("id", id);
      if (error) throw error;
      return { pageId };
    },
    onSuccess: ({ pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections", pageId] });
      toast.success("Section removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCmsBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block: {
      section_id: string;
      institution_id: string;
      block_type: "text" | "image" | "button" | "heading" | "video" | "divider" | "spacer" | "html" | "icon";
      position: number;
      content?: Json;
      settings?: Json;
      pageId: string;
    }) => {
      const { pageId, ...insertData } = block;
      const { data, error } = await supabase
        .from("cms_blocks")
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return { ...data, pageId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections", data.pageId] });
      toast.success("Block added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCmsBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      pageId,
      ...updates
    }: {
      id: string;
      pageId: string;
      content?: Json;
      settings?: Json;
      position?: number;
    }) => {
      const { error } = await supabase
        .from("cms_blocks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return { pageId };
    },
    onSuccess: ({ pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections", pageId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCmsBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pageId }: { id: string; pageId: string }) => {
      const { error } = await supabase.from("cms_blocks").delete().eq("id", id);
      if (error) throw error;
      return { pageId };
    },
    onSuccess: ({ pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections", pageId] });
      toast.success("Block removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
