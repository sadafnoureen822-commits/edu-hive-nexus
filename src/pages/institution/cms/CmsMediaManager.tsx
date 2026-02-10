import { useState, useRef } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCmsMedia,
  useCmsMediaFolders,
  useCreateCmsMediaFolder,
  useUploadCmsMedia,
  useDeleteCmsMedia,
} from "@/hooks/cms/use-cms-media";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FolderPlus,
  Folder,
  FileImage,
  FileText,
  Film,
  Trash2,
  Search,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
];

export default function CmsMediaManager() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading } = useCmsMedia(institution?.id, currentFolderId);
  const { data: folders } = useCmsMediaFolders(institution?.id);
  const createFolder = useCreateCmsMediaFolder();
  const uploadMedia = useUploadCmsMedia();
  const deleteMedia = useDeleteCmsMedia();

  const currentFolders =
    folders?.filter((f) =>
      currentFolderId
        ? f.parent_id === currentFolderId
        : !f.parent_id
    ) || [];

  const filteredMedia = media?.filter((m) =>
    m.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFolder = async () => {
    if (!newFolderName || !institution) return;
    await createFolder.mutateAsync({
      institution_id: institution.id,
      name: newFolderName,
      parent_id: currentFolderId,
    });
    setNewFolderName("");
    setIsFolderDialogOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !institution) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      await uploadMedia.mutateAsync({
        file,
        institutionId: institution.id,
        folderId: currentFolderId,
        uploadedBy: user?.id,
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon;
    if (type.startsWith("video/")) return Film;
    if (type.includes("pdf")) return FileText;
    return File;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const currentFolderName = currentFolderId
    ? folders?.find((f) => f.id === currentFolderId)?.name
    : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage images, documents, and files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMedia.isPending}
          >
            {uploadMedia.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolderId && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setCurrentFolderId(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Files
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{currentFolderName}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="pl-9"
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Folders */}
        {currentFolders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {currentFolders.map((folder) => (
              <Card
                key={folder.id}
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <Folder className="h-8 w-8 text-primary" />
                  <p className="text-xs font-medium text-center truncate w-full">
                    {folder.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Files Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !filteredMedia?.length && !currentFolders.length ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No files in this location.</p>
              <p className="text-xs mt-1">Upload files or create folders to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia?.map((file) => {
              const Icon = getFileIcon(file.file_type);
              const isImage = file.file_type.startsWith("image/");

              return (
                <Card key={file.id} className="border-border/50 overflow-hidden group">
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center relative">
                    {isImage ? (
                      <img
                        src={file.file_url}
                        alt={file.alt_text || file.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="h-12 w-12 text-muted-foreground/40" />
                    )}
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyUrl(file.file_url)}
                      >
                        {copiedUrl === file.file_url ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete file?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{file.file_name}" will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() =>
                                deleteMedia.mutate({
                                  id: file.id,
                                  institutionId: institution!.id,
                                  fileUrl: file.file_url,
                                })
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {file.file_type.split("/")[1]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatSize(file.file_size)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
