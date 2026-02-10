import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  useCmsMenus,
  useCmsMenuItems,
  useCreateCmsMenuItem,
  useUpdateCmsMenuItem,
  useDeleteCmsMenuItem,
} from "@/hooks/cms/use-cms-menus";
import { useCmsPages } from "@/hooks/cms/use-cms-pages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Menu,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  FileText,
  ChevronRight,
  Loader2,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function CmsMenuManager() {
  const { institution } = useTenant();
  const { data: menus, isLoading } = useCmsMenus(institution?.id);
  const headerMenu = menus?.find((m) => m.menu_type === "header");
  const footerMenu = menus?.find((m) => m.menu_type === "footer");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Navigation Menus</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage header and footer navigation for your website.
        </p>
      </div>

      <Tabs defaultValue="header" className="space-y-4">
        <TabsList>
          <TabsTrigger value="header">Header Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="header">
          {headerMenu ? (
            <MenuEditor menu={headerMenu} institutionId={institution!.id} />
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Menu className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No header menu configured.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="footer">
          {footerMenu ? (
            <MenuEditor menu={footerMenu} institutionId={institution!.id} />
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Menu className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No footer menu configured.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MenuEditor({
  menu,
  institutionId,
}: {
  menu: any;
  institutionId: string;
}) {
  const { data: items, isLoading } = useCmsMenuItems(menu.id);
  const { data: pages } = useCmsPages(institutionId);
  const createItem = useCreateCmsMenuItem();
  const updateItem = useUpdateCmsMenuItem();
  const deleteItem = useDeleteCmsMenuItem();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newLinkType, setNewLinkType] = useState<string>("internal");
  const [newUrl, setNewUrl] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");

  const topLevelItems = items?.filter((i) => !i.parent_id) || [];
  const getChildren = (parentId: string) =>
    items?.filter((i) => i.parent_id === parentId) || [];

  const handleAdd = async () => {
    if (!newLabel) return;
    const maxPos = items?.length
      ? Math.max(...items.map((i) => i.position))
      : -1;
    await createItem.mutateAsync({
      menu_id: menu.id,
      institution_id: institutionId,
      label: newLabel,
      link_type: newLinkType as any,
      link_url: newLinkType === "external" ? newUrl : undefined,
      page_id: newLinkType === "internal" && newPageId ? newPageId : null,
      parent_id: newParentId || null,
      position: maxPos + 1,
    });
    setNewLabel("");
    setNewUrl("");
    setNewPageId("");
    setNewParentId("");
    setIsAddOpen(false);
  };

  const handleMove = (itemId: string, direction: "up" | "down") => {
    if (!items) return;
    const sorted = [...items].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((i) => i.id === itemId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    updateItem.mutate({
      id: sorted[idx].id,
      menuId: menu.id,
      position: sorted[swapIdx].position,
    });
    updateItem.mutate({
      id: sorted[swapIdx].id,
      menuId: menu.id,
      position: sorted[idx].position,
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-display">{menu.name}</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. About Us"
                />
              </div>
              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select value={newLinkType} onValueChange={setNewLinkType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Page</SelectItem>
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newLinkType === "internal" ? (
                <div className="space-y-2">
                  <Label>Page</Label>
                  <Select value={newPageId} onValueChange={setNewPageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Parent Item (optional)</Label>
                <Select value={newParentId} onValueChange={setNewParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top level)</SelectItem>
                    {topLevelItems.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newLabel || createItem.isPending}>
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !topLevelItems.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Menu className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No menu items yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {topLevelItems
              .sort((a, b) => a.position - b.position)
              .map((item, idx) => (
                <div key={item.id}>
                  <MenuItemRow
                    item={item}
                    index={idx}
                    total={topLevelItems.length}
                    onMove={handleMove}
                    onDelete={deleteItem}
                    menuId={menu.id}
                  />
                  {getChildren(item.id).map((child, cIdx) => (
                    <div key={child.id} className="ml-8">
                      <MenuItemRow
                        item={child}
                        index={cIdx}
                        total={getChildren(item.id).length}
                        onMove={handleMove}
                        onDelete={deleteItem}
                        menuId={menu.id}
                        isChild
                      />
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MenuItemRow({
  item,
  index,
  total,
  onMove,
  onDelete,
  menuId,
  isChild = false,
}: {
  item: any;
  index: number;
  total: number;
  onMove: (id: string, direction: "up" | "down") => void;
  onDelete: any;
  menuId: string;
  isChild?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors group">
      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      {isChild && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
      <span className="flex-1 text-sm font-medium">{item.label}</span>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {item.link_type === "external" ? (
          <>
            <ExternalLink className="h-3 w-3" />
            {item.link_url}
          </>
        ) : (
          <>
            <FileText className="h-3 w-3" />
            Page Link
          </>
        )}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={index === 0}
          onClick={() => onMove(item.id, "up")}
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={index === total - 1}
          onClick={() => onMove(item.id, "down")}
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{item.label}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this menu item and all its children.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete.mutate({ id: item.id, menuId })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
