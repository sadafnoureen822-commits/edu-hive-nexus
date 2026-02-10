import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCmsMedia(institutionId: string | undefined, folderId?: string | null) {
  return useQuery({
    queryKey: ["cms-media", institutionId, folderId],
    queryFn: async () => {
      let query = supabase
        .from("cms_media")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });

      if (folderId) {
        query = query.eq("folder_id", folderId);
      } else {
        query = query.is("folder_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}

export function useCmsMediaFolders(institutionId: string | undefined) {
  return useQuery({
    queryKey: ["cms-media-folders", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_media_folders")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
}

export function useCreateCmsMediaFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folder: {
      institution_id: string;
      name: string;
      parent_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("cms_media_folders")
        .insert(folder)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-media-folders", data.institution_id] });
      toast.success("Folder created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUploadCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      institutionId,
      folderId,
      uploadedBy,
    }: {
      file: File;
      institutionId: string;
      folderId?: string | null;
      uploadedBy?: string;
    }) => {
      const fileName = `${Date.now()}-${file.name}`;
      const storagePath = `${institutionId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("institution-media")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("institution-media")
        .getPublicUrl(storagePath);

      // Insert record
      const { data, error } = await supabase
        .from("cms_media")
        .insert({
          institution_id: institutionId,
          folder_id: folderId || null,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: uploadedBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-media", data.institution_id] });
      toast.success("File uploaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      institutionId,
      fileUrl,
    }: {
      id: string;
      institutionId: string;
      fileUrl: string;
    }) => {
      // Extract storage path from URL
      const urlParts = fileUrl.split("/institution-media/");
      if (urlParts[1]) {
        await supabase.storage
          .from("institution-media")
          .remove([urlParts[1]]);
      }

      const { error } = await supabase.from("cms_media").delete().eq("id", id);
      if (error) throw error;
      return { institutionId };
    },
    onSuccess: ({ institutionId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-media", institutionId] });
      toast.success("File deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
