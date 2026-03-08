import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Megaphone, Pin, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

export default function AnnouncementsPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!institutionId,
  });

  const create = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("announcements").insert({
        institution_id: institutionId,
        created_by: user?.id,
        title: values.title,
        content: values.content,
        is_published: false,
        is_pinned: false,
        publish_date: values.publish_date || null,
        expire_date: values.expire_date || null,
        audience: ["all"],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase.from("announcements").update({
        is_published: !current,
        publish_date: !current ? new Date().toISOString().split("T")[0] : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase.from("announcements").update({ is_pinned: !current }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted");
    },
  });

  const published = announcements?.filter((a: any) => a.is_published).length || 0;
  const pinned = announcements?.filter((a: any) => a.is_pinned).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm">Publish notices and updates for your institution</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input {...register("title", { required: true })} placeholder="Announcement title" />
              </div>
              <div className="space-y-1">
                <Label>Content *</Label>
                <Textarea {...register("content", { required: true })} rows={4} placeholder="Write your announcement..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Publish Date</Label>
                  <Input type="date" {...register("publish_date")} />
                </div>
                <div className="space-y-1">
                  <Label>Expire Date</Label>
                  <Input type="date" {...register("expire_date")} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Create as Draft"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: announcements?.length || 0, color: "text-foreground" },
          { label: "Published", value: published, color: "text-green-600" },
          { label: "Pinned", value: pinned, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : announcements?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No announcements yet</p>
          <p className="text-sm">Create your first announcement to notify students and staff</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements?.map((a: any) => (
            <Card key={a.id} className={a.is_pinned ? "border-primary/40 bg-primary/5" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                      <h3 className="font-semibold truncate">{a.title}</h3>
                      <Badge variant="outline" className={a.is_published
                        ? "text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
                        : "text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      }>
                        {a.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {format(new Date(a.created_at), "MMM d, yyyy")}
                      {a.expire_date && ` · Expires ${format(new Date(a.expire_date), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      title={a.is_pinned ? "Unpin" : "Pin"}
                      onClick={() => togglePin.mutate({ id: a.id, current: a.is_pinned })}
                    >
                      <Pin className={`h-3.5 w-3.5 ${a.is_pinned ? "text-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      title={a.is_published ? "Unpublish" : "Publish"}
                      onClick={() => togglePublish.mutate({ id: a.id, current: a.is_published })}
                    >
                      {a.is_published
                        ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        : <Eye className="h-3.5 w-3.5 text-green-600" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove.mutate(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
