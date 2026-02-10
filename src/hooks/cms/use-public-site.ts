import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicInstitution(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-institution", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function usePublicSiteSettings(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["public-site-settings", institutionId],
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

export function usePublicPages(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["public-pages", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("id, title, slug, meta_description, status")
        .eq("institution_id", institutionId!)
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}

export function usePublicPage(institutionId: string | undefined, pageSlug: string | undefined) {
  return useQuery({
    queryKey: ["public-page", institutionId, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("institution_id", institutionId!)
        .eq("slug", pageSlug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId && !!pageSlug,
  });
}

export function usePublicSections(pageId: string | undefined) {
  return useQuery({
    queryKey: ["public-sections", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*, cms_blocks(*)")
        .eq("page_id", pageId!)
        .eq("is_visible", true)
        .order("position")
        .order("position", { referencedTable: "cms_blocks" });
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}

export function usePublicMenuItems(menuId: string | undefined) {
  return useQuery({
    queryKey: ["public-menu-items", menuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_menu_items")
        .select("*")
        .eq("menu_id", menuId!)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!menuId,
  });
}

export function usePublicMenus(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["public-menus", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_menus")
        .select("*, cms_menu_items(*)")
        .eq("institution_id", institutionId!)
        .order("position", { referencedTable: "cms_menu_items" });
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}
