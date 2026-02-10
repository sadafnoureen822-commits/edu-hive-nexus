import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCmsPages,
  useCreateCmsPage,
  useDeleteCmsPage,
  usePublishCmsPage,
} from "@/hooks/cms/use-cms-pages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Globe,
  FileEdit,
  Lock,
  Loader2,
  Search,
} from "lucide-react";

export default function CmsPages() {
  const { slug } = useParams<{ slug: string }>();
  const { institution } = useTenant();
  const { user } = useAuth();
  const { data: pages, isLoading } = useCmsPages(institution?.id);
  const createPage = useCreateCmsPage();
  const deletePage = useDeleteCmsPage();
  const publishPage = usePublishCmsPage();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPages = pages?.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!institution || !newTitle || !newSlug) return;
    await createPage.mutateAsync({
      institution_id: institution.id,
      title: newTitle,
      slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      meta_description: newDescription || undefined,
      created_by: user?.id,
    });
    setNewTitle("");
    setNewSlug("");
    setNewDescription("");
    setIsCreateOpen(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your website pages, SEO, and publishing status.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setNewSlug(generateSlug(e.target.value));
                  }}
                  placeholder="e.g. Scholarships"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. scholarships"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /{slug}/{newSlug || "..."}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description (SEO)</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description for search engines..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newTitle || !newSlug || createPage.isPending}
              >
                {createPage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search pages..."
          className="pl-9"
        />
      </div>

      {/* Pages Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !filteredPages?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No pages found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {page.is_system_page ? (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {page.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      /{page.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          page.is_system_page
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {page.is_system_page ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={page.status === "published" ? "default" : "outline"}
                        className={
                          page.status === "published"
                            ? "bg-accent text-accent-foreground"
                            : page.status === "draft"
                            ? "text-muted-foreground"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {page.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            publishPage.mutate({
                              id: page.id,
                              publish: page.status !== "published",
                            })
                          }
                          title={page.status === "published" ? "Unpublish" : "Publish"}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Link to={`/${slug}/cms/pages/${page.id}`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {!page.is_system_page && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{page.title}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this page and all its content. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() =>
                                    deletePage.mutate({
                                      id: page.id,
                                      institutionId: institution!.id,
                                    })
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
