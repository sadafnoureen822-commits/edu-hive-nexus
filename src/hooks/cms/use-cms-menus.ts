import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCmsMenus(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["cms-menus", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_menus")
        .select("*")
        .eq("institution_id", institutionId!);
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}

export function useCmsMenuItems(menuId: string | undefined) {
  return useQuery({
    queryKey: ["cms-menu-items", menuId],
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

export function useCreateCmsMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      menu_id: string;
      institution_id: string;
      label: string;
      link_type?: "internal" | "external";
      link_url?: string;
      page_id?: string | null;
      parent_id?: string | null;
      position: number;
    }) => {
      const { data, error } = await supabase
        .from("cms_menu_items")
        .insert([item])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-menu-items", data.menu_id] });
      toast.success("Menu item added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCmsMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      menuId,
      ...updates
    }: {
      id: string;
      menuId: string;
      label?: string;
      link_type?: "internal" | "external";
      link_url?: string;
      page_id?: string | null;
      parent_id?: string | null;
      position?: number;
    }) => {
      const { error } = await supabase
        .from("cms_menu_items")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return { menuId };
    },
    onSuccess: ({ menuId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-menu-items", menuId] });
      toast.success("Menu item updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCmsMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, menuId }: { id: string; menuId: string }) => {
      const { error } = await supabase.from("cms_menu_items").delete().eq("id", id);
      if (error) throw error;
      return { menuId };
    },
    onSuccess: ({ menuId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-menu-items", menuId] });
      toast.success("Menu item deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
