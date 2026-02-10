import { useState } from "react";
import { useCmsMedia, useCmsMediaFolders } from "@/hooks/cms/use-cms-media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Search, Folder, ArrowLeft, Loader2 } from "lucide-react";

interface MediaPickerButtonProps {
  institutionId: string;
  onSelect: (url: string) => void;
}

export default function MediaPickerButton({
  institutionId,
  onSelect,
}: MediaPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: media, isLoading } = useCmsMedia(institutionId, folderId);
  const { data: folders } = useCmsMediaFolders(institutionId);

  const currentFolders =
    folders?.filter((f) =>
      folderId ? f.parent_id === folderId : !f.parent_id
    ) || [];

  const images = media?.filter(
    (m) =>
      m.file_type.startsWith("image/") &&
      m.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0">
          <ImageIcon className="h-3 w-3" />
          Browse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {folderId && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setFolderId(null)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images..."
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {/* Folders */}
            {currentFolders.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {currentFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setFolderId(folder.id)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <Folder className="h-6 w-6 text-primary" />
                    <span className="text-xs truncate w-full text-center">
                      {folder.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Images */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !images?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No images found</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {images.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleSelect(file.file_url)}
                    className="aspect-square rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={file.file_url}
                      alt={file.alt_text || file.file_name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
