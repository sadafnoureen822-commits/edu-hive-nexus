import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCmsPage, useUpdateCmsPage, usePublishCmsPage } from "@/hooks/cms/use-cms-pages";
import {
  useCmsSections,
  useCreateCmsSection,
  useUpdateCmsSection,
  useDeleteCmsSection,
  useCreateCmsBlock,
  useUpdateCmsBlock,
  useDeleteCmsBlock,
} from "@/hooks/cms/use-cms-builder";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Globe, Plus, Loader2, ExternalLink } from "lucide-react";
import SortableSection from "@/components/cms/SortableSection";
import { SECTION_TYPES } from "@/components/cms/cms-constants";

export default function CmsPageEditor() {
  const { slug, pageId } = useParams<{ slug: string; pageId: string }>();
  const { institution } = useTenant();
  const { user } = useAuth();

  const { data: page, isLoading: pageLoading } = useCmsPage(pageId);
  const { data: sections, isLoading: sectionsLoading } = useCmsSections(pageId);
  const updatePage = useUpdateCmsPage();
  const publishPage = usePublishCmsPage();
  const createSection = useCreateCmsSection();
  const updateSection = useUpdateCmsSection();
  const deleteSection = useDeleteCmsSection();
  const createBlock = useCreateCmsBlock();
  const updateBlock = useUpdateCmsBlock();
  const deleteBlock = useDeleteCmsBlock();

  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [addSectionType, setAddSectionType] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (page && !initialized) {
    setEditTitle(page.title);
    setEditSlug(page.slug);
    setEditDescription(page.meta_description || "");
    setInitialized(true);
  }

  const handleSaveMeta = () => {
    if (!page) return;
    updatePage.mutate({
      id: page.id,
      title: editTitle,
      slug: editSlug,
      meta_description: editDescription,
      updated_by: user?.id,
    });
  };

  const handleAddSection = () => {
    if (!addSectionType || !page || !institution) return;
    const maxPos = sections?.length
      ? Math.max(...sections.map((s: any) => s.position))
      : -1;
    createSection.mutate({
      page_id: page.id,
      institution_id: institution.id,
      section_type: addSectionType as any,
      title: SECTION_TYPES.find((t) => t.value === addSectionType)?.label || addSectionType,
      position: maxPos + 1,
    });
    setAddSectionType("");
  };

  const handleAddBlock = (sectionId: string, blockType: string) => {
    if (!institution || !pageId) return;
    const section = sections?.find((s: any) => s.id === sectionId);
    const maxPos = section?.cms_blocks?.length
      ? Math.max(...section.cms_blocks.map((b: any) => b.position))
      : -1;
    createBlock.mutate({
      section_id: sectionId,
      institution_id: institution.id,
      block_type: blockType as any,
      position: maxPos + 1,
      content: getDefaultBlockContent(blockType) as Json,
      pageId,
    });
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sections || !pageId) return;

    const sorted = [...sections].sort((a: any, b: any) => a.position - b.position);
    const sectionIds = sorted.map((s: any) => s.id);
    const oldIndex = sectionIds.indexOf(active.id as string);
    const newIndex = sectionIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...sectionIds];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);

    newOrder.forEach((id, idx) => {
      updateSection.mutate({ id, pageId, position: idx });
    });
  };

  const handleReorderBlocks = useCallback(
    (sectionId: string, blockIds: string[]) => {
      if (!pageId) return;
      blockIds.forEach((id, idx) => {
        updateBlock.mutate({ id, pageId, position: idx });
      });
    },
    [pageId, updateBlock]
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (pageLoading || sectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Page not found.</p>
        <Link to={`/${slug}/cms`}>
          <Button variant="link">Back to Pages</Button>
        </Link>
      </div>
    );
  }

  const sortedSections = sections
    ? [...sections].sort((a: any, b: any) => a.position - b.position)
    : [];
  const sectionIds = sortedSections.map((s: any) => s.id);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/${slug}/cms`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {page.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant={page.status === "published" ? "default" : "outline"}
                className={
                  page.status === "published"
                    ? "bg-accent text-accent-foreground text-[10px]"
                    : "text-[10px]"
                }
              >
                {page.status}
              </Badge>
              {page.is_system_page && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                  System Page
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {page.status === "published" && (
            <Link to={`/site/${slug}/${page.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              publishPage.mutate({
                id: page.id,
                publish: page.status !== "published",
              })
            }
          >
            <Globe className="h-4 w-4 mr-1.5" />
            {page.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" onClick={handleSaveMeta} disabled={updatePage.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page Metadata */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-display">Page Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                disabled={page.is_system_page}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="SEO description..."
              />
              <p className="text-xs text-muted-foreground">
                {editDescription.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sections Builder with Drag & Drop */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-display">
                Page Sections ({sortedSections.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={addSectionType} onValueChange={setAddSectionType}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Select section type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSection}
                  disabled={!addSectionType}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!sortedSections.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No sections yet. Add one above to start building.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={sectionIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedSections.map((section: any) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        expanded={expandedSections.has(section.id)}
                        onToggle={() => toggleSection(section.id)}
                        onUpdateSection={updateSection}
                        onDeleteSection={deleteSection}
                        onAddBlock={handleAddBlock}
                        onUpdateBlock={updateBlock}
                        onDeleteBlock={deleteBlock}
                        onReorderBlocks={handleReorderBlocks}
                        pageId={pageId!}
                        institutionId={institution?.id || ""}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getDefaultBlockContent(type: string): Record<string, unknown> {
  switch (type) {
    case "heading":
      return { text: "Section Heading", level: 2 };
    case "text":
      return { text: "Enter your content here..." };
    case "image":
      return { url: "", alt: "Image description" };
    case "button":
      return { text: "Click Here", url: "#", variant: "primary" };
    case "video":
      return { url: "" };
    case "html":
      return { html: "" };
    case "divider":
      return { style: "solid" };
    default:
      return {};
  }
}
