import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from "@/hooks/lms/use-assignments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ClipboardList, Edit, Trash2, Loader2, CheckCircle2, Clock, FileText, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TeacherAssignmentsPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const institutionId = institution?.id ?? "";

  const { data: allAssignments = [], isLoading } = useAssignments(institutionId);
  const createAssignment = useCreateAssignment(institutionId);
  const updateAssignment = useUpdateAssignment(institutionId);
  const deleteAssignment = useDeleteAssignment(institutionId);

  // Teacher sees their assignments + grading
  const myAssignments = allAssignments.filter((a) => a.created_by === user?.id);

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<typeof myAssignments[0] | null>(null);
  const [selAssId, setSelAssId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", instructions: "", total_marks: "100", passing_marks: "40", due_date: "" });

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", instructions: "", total_marks: "100", passing_marks: "40", due_date: "" }); setDialog(true); };
  const openEdit = (a: typeof myAssignments[0]) => {
    setEditing(a);
    setForm({ title: a.title, description: a.description ?? "", instructions: a.instructions ?? "", total_marks: String(a.total_marks), passing_marks: String(a.passing_marks), due_date: a.due_date ? format(new Date(a.due_date), "yyyy-MM-dd'T'HH:mm") : "" });
    setDialog(true);
  };
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    try {
      const payload = { title: form.title, description: form.description || null, instructions: form.instructions || null, total_marks: parseFloat(form.total_marks) || 100, passing_marks: parseFloat(form.passing_marks) || 40, due_date: form.due_date || null, status: "active" };
      if (editing) { await updateAssignment.mutateAsync({ id: editing.id, ...payload }); toast.success("Assignment updated"); }
      else { await createAssignment.mutateAsync(payload); toast.success("Assignment created"); }
      setDialog(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const statusColor = (s: string) => s === "active" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-muted text-muted-foreground border-border";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Assignments</h1>
          <p className="text-sm text-muted-foreground">Create assignments and grade submissions</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Assignment</Button>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">My Assignments ({myAssignments.length})</TabsTrigger>
          {selAssId && <TabsTrigger value="submissions">Submissions</TabsTrigger>}
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : myAssignments.length === 0 ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 gap-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No assignments yet</p>
              <Button size="sm" variant="outline" onClick={openCreate}>Create your first assignment</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {myAssignments.map((a) => (
                <Card key={a.id} className={`border-border/50 cursor-pointer hover:shadow-sm transition-shadow ${selAssId === a.id ? "border-primary/40" : ""}`}
                  onClick={() => setSelAssId(a.id === selAssId ? null : a.id)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <ClipboardList className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {a.total_marks} marks · Pass: {a.passing_marks}
                        {a.due_date ? ` · Due: ${format(new Date(a.due_date), "dd MMM yyyy HH:mm")}` : " · No due date"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(a.status)}`}>{a.status}</Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openEdit(a); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteAssignment.mutate(a.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {selAssId && (
          <TabsContent value="submissions" className="mt-4">
            <SubmissionsPanel assignmentId={selAssId} institutionId={institutionId} />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Assignment" : "Create Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Instructions</Label><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} placeholder="Detailed instructions for students..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Marks</Label><Input type="number" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Passing Marks</Label><Input type="number" value={form.passing_marks} onChange={(e) => setForm({ ...form, passing_marks: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Due Date & Time</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createAssignment.isPending || updateAssignment.isPending}>
                {editing ? "Save Changes" : "Create Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionsPanel({ assignmentId, institutionId }: { assignmentId: string; institutionId: string }) {
  const qc = useQueryClient();
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: async () => {
      const { data } = await supabase.from("assignment_submissions").select("*").eq("assignment_id", assignmentId);
      return data ?? [];
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, marks, feedback }: { id: string; marks: number; feedback: string }) => {
      const { error } = await supabase.from("assignment_submissions").update({
        marks_obtained: marks, feedback, status: "graded", graded_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Graded"); qc.invalidateQueries({ queryKey: ["submissions", assignmentId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [gradeDialogId, setGradeDialogId] = useState<string | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (submissions.length === 0) return <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 gap-2"><FileText className="h-8 w-8 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No submissions yet</p></CardContent></Card>;

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Submissions ({submissions.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Student</TableHead><TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead><TableHead>Marks</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.student_id.slice(0, 8)}…</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(s.submitted_at), "dd MMM yyyy")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{s.status}</Badge></TableCell>
                  <TableCell>{s.marks_obtained ?? "—"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setGradeDialogId(s.id); setMarks(String(s.marks_obtained ?? "")); setFeedback(s.feedback ?? ""); }}>
                      <Star className="h-3 w-3" /> Grade
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!gradeDialogId} onOpenChange={(o) => !o && setGradeDialogId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Marks Obtained</Label><Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="e.g. 85" /></div>
            <div className="space-y-1.5"><Label>Feedback</Label><Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Teacher feedback..." /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setGradeDialogId(null)}>Cancel</Button>
              <Button onClick={() => { if (gradeDialogId) { gradeMutation.mutate({ id: gradeDialogId, marks: parseFloat(marks) || 0, feedback }); setGradeDialogId(null); } }}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
