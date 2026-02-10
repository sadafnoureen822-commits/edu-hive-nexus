import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import SortableBlock from "./SortableBlock";
import { BLOCK_TYPES } from "./cms-constants";

interface SortableBlockListProps {
  blocks: any[];
  sectionId: string;
  pageId: string;
  institutionId: string;
  onAddBlock: (sectionId: string, blockType: string) => void;
  onUpdateBlock: any;
  onDeleteBlock: any;
  onReorderBlocks: (sectionId: string, blockIds: string[]) => void;
}

export default function SortableBlockList({
  blocks,
  sectionId,
  pageId,
  institutionId,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
}: SortableBlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const blockIds = sorted.map((b) => b.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blockIds.indexOf(active.id as string);
    const newIndex = blockIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...blockIds];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);
    onReorderBlocks(sectionId, newOrder);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Blocks
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No blocks yet.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sorted.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={onUpdateBlock}
                  onDelete={onDeleteBlock}
                  pageId={pageId}
                  institutionId={institutionId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Block */}
      <div className="flex flex-wrap gap-1.5 pt-2">
        {BLOCK_TYPES.map((bt) => (
          <Button
            key={bt.value}
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onAddBlock(sectionId, bt.value)}
          >
            <bt.icon className="h-3 w-3" />
            {bt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
