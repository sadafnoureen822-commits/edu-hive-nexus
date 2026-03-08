import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Clock, Trash2, Calendar } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimetablePage() {
  const { institution } = useTenant();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const { data: sessions } = useQuery({
    queryKey: ["sessions", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("academic_sessions").select("*").eq("institution_id", institutionId!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("institution_id", institutionId!).order("numeric_level");
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", institutionId, selectedClass],
    queryFn: async () => {
      const { data } = await supabase.from("sections").select("*").eq("institution_id", institutionId!).eq("class_id", selectedClass);
      return data || [];
    },
    enabled: !!institutionId && !!selectedClass,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").eq("institution_id", institutionId!).eq("is_active", true);
      return data || [];
    },
    enabled: !!institutionId,
  });

  const currentSession = sessions?.find((s: any) => s.is_current);

  const { data: timetable, isLoading } = useQuery({
    queryKey: ["timetable", institutionId, selectedClass, selectedSection],
    queryFn: async () => {
      let q = supabase
        .from("timetables")
        .select("*, subjects(name, code), classes(name), sections(name)")
        .eq("institution_id", institutionId!)
        .eq("class_id", selectedClass)
        .order("day_of_week")
        .order("start_time");
      if (selectedSection) q = q.eq("section_id", selectedSection);
      const { data } = await q;
      return data || [];
    },
    enabled: !!institutionId && !!selectedClass,
  });

  const createEntry = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("timetables").insert({
        institution_id: institutionId,
        session_id: currentSession?.id,
        class_id: selectedClass,
        section_id: selectedSection || null,
        subject_id: values.subject_id,
        day_of_week: parseInt(values.day_of_week),
        start_time: values.start_time,
        end_time: values.end_time,
        room: values.room || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Timetable entry added");
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timetables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Entry removed");
    },
  });

  const grouped = DAYS.reduce((acc, _, i) => {
    acc[i] = (timetable || []).filter((t: any) => t.day_of_week === i);
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Timetable</h1>
          <p className="text-muted-foreground text-sm">Manage class schedules and periods</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedClass}>
              <Plus className="h-4 w-4 mr-2" /> Add Period
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Timetable Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((v) => createEntry.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Day</Label>
                  <Select onValueChange={(v) => setValue("day_of_week", v)}>
                    <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Select onValueChange={(v) => setValue("subject_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Start Time</Label>
                  <Input type="time" {...register("start_time", { required: true })} />
                </div>
                <div className="space-y-1">
                  <Label>End Time</Label>
                  <Input type="time" {...register("end_time", { required: true })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Room (optional)</Label>
                <Input {...register("room")} placeholder="e.g. Room 101" />
              </div>
              <Button type="submit" className="w-full" disabled={createEntry.isPending}>
                {createEntry.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Class</Label>
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {sections && sections.length > 0 && (
              <div className="space-y-1 min-w-[160px]">
                <Label className="text-xs">Section (optional)</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sections</SelectItem>
                    {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedClass ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Select a class to view its timetable</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day, i) => (
            <Card key={i} className={grouped[i]?.length ? "" : "opacity-60"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {DAYS_SHORT[i]}
                  </span>
                  {day}
                  <Badge variant="secondary" className="ml-auto text-xs">{grouped[i]?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {grouped[i]?.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No classes</p>
                ) : (
                  grouped[i]?.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 group">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{entry.subjects?.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {entry.start_time?.slice(0,5)} – {entry.end_time?.slice(0,5)}
                          {entry.room && <span className="ml-1">• {entry.room}</span>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteEntry.mutate(entry.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
