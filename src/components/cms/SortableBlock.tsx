import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Trash2, Type } from "lucide-react";
import { BLOCK_TYPES } from "./cms-constants";
import MediaPickerButton from "./MediaPickerButton";

interface SortableBlockProps {
  block: any;
  onUpdate: any;
  onDelete: any;
  pageId: string;
  institutionId: string;
}

export default function SortableBlock({
  block,
  onUpdate,
  onDelete,
  pageId,
  institutionId,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const content = block.content || {};
  const blockIcon = BLOCK_TYPES.find((bt) => bt.value === block.block_type);
  const Icon = blockIcon?.icon || Type;

  const handleContentChange = (key: string, value: string | number) => {
    onUpdate.mutate({
      id: block.id,
      pageId,
      content: { ...content, [key]: value },
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-2.5 rounded-md bg-secondary/30 border border-border/50"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mt-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium capitalize">{block.block_type}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-destructive hover:text-destructive"
            onClick={() => onDelete.mutate({ id: block.id, pageId })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {renderBlockEditor(block.block_type, content, handleContentChange, institutionId)}
      </div>
    </div>
  );
}

function renderBlockEditor(
  type: string,
  content: Record<string, any>,
  onChange: (key: string, value: string | number) => void,
  institutionId: string
) {
  switch (type) {
    case "heading":
      return (
        <div className="space-y-1.5">
          <Input
            defaultValue={content.text || ""}
            onBlur={(e) => onChange("text", e.target.value)}
            className="h-7 text-xs"
            placeholder="Heading text..."
          />
          <Select
            defaultValue={String(content.level || 2)}
            onValueChange={(v) => onChange("level", parseInt(v))}
          >
            <SelectTrigger className="h-7 text-xs w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((l) => (
                <SelectItem key={l} value={String(l)}>
                  H{l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "text":
      return (
        <Textarea
          defaultValue={content.text || ""}
          onBlur={(e) => onChange("text", e.target.value)}
          className="text-xs min-h-[60px]"
          placeholder="Enter text..."
        />
      );
    case "image":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              defaultValue={content.url || ""}
              onBlur={(e) => onChange("url", e.target.value)}
              className="h-7 text-xs flex-1"
              placeholder="Image URL..."
            />
            <MediaPickerButton
              institutionId={institutionId}
              onSelect={(url) => onChange("url", url)}
            />
          </div>
          {content.url && (
            <div className="w-full max-h-24 rounded border border-border overflow-hidden">
              <img src={content.url} alt={content.alt || ""} className="w-full h-full object-cover" />
            </div>
          )}
          <Input
            defaultValue={content.alt || ""}
            onBlur={(e) => onChange("alt", e.target.value)}
            className="h-7 text-xs"
            placeholder="Alt text..."
          />
        </div>
      );
    case "button":
      return (
        <div className="space-y-1.5">
          <Input
            defaultValue={content.text || ""}
            onBlur={(e) => onChange("text", e.target.value)}
            className="h-7 text-xs"
            placeholder="Button label..."
          />
          <Input
            defaultValue={content.url || ""}
            onBlur={(e) => onChange("url", e.target.value)}
            className="h-7 text-xs"
            placeholder="Button URL..."
          />
        </div>
      );
    case "video":
      return (
        <Input
          defaultValue={content.url || ""}
          onBlur={(e) => onChange("url", e.target.value)}
          className="h-7 text-xs"
          placeholder="Video embed URL..."
        />
      );
    case "html":
      return (
        <Textarea
          defaultValue={content.html || ""}
          onBlur={(e) => onChange("html", e.target.value)}
          className="text-xs min-h-[80px] font-mono"
          placeholder="<div>Custom HTML...</div>"
        />
      );
    default:
      return <p className="text-xs text-muted-foreground">No editor for this block type.</p>;
  }
}
