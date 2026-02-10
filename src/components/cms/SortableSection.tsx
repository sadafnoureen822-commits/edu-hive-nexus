import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import SortableBlockList from "./SortableBlockList";
import { SECTION_TYPES, BLOCK_TYPES } from "./cms-constants";

interface SortableSectionProps {
  section: any;
  expanded: boolean;
  onToggle: () => void;
  onUpdateSection: any;
  onDeleteSection: any;
  onAddBlock: (sectionId: string, blockType: string) => void;
  onUpdateBlock: any;
  onDeleteBlock: any;
  onReorderBlocks: (sectionId: string, blockIds: string[]) => void;
  pageId: string;
  institutionId: string;
}

export default function SortableSection({
  section,
  expanded,
  onToggle,
  onUpdateSection,
  onDeleteSection,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  pageId,
  institutionId,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const blocks = section.cms_blocks || [];
  const sectionLabel =
    SECTION_TYPES.find((t) => t.value === section.section_type)?.label ||
    section.section_type;

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <div className="border rounded-lg bg-card overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {section.title || sectionLabel}
                </p>
                <p className="text-xs text-muted-foreground">{sectionLabel}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {blocks.length} blocks
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSection.mutate({
                      id: section.id,
                      pageId,
                      is_visible: !section.is_visible,
                    });
                  }}
                >
                  {section.is_visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete section?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove this section and all its blocks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() =>
                          onDeleteSection.mutate({ id: section.id, pageId })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Section Title</Label>
                <Input
                  defaultValue={section.title || ""}
                  onBlur={(e) =>
                    onUpdateSection.mutate({
                      id: section.id,
                      pageId,
                      title: e.target.value,
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <Separator />

              <SortableBlockList
                blocks={blocks}
                sectionId={section.id}
                pageId={pageId}
                institutionId={institutionId}
                onAddBlock={onAddBlock}
                onUpdateBlock={onUpdateBlock}
                onDeleteBlock={onDeleteBlock}
                onReorderBlocks={onReorderBlocks}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
