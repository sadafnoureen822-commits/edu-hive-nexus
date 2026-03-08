import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useAssignmentSubmissions, useGradeSubmission } from "@/hooks/lms/use-assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, ClipboardList, Edit, Trash2, Eye, Calendar, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import ExportButton from "@/components/ui/ExportButton";

export default function AssignmentsPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id ?? "";

  const { data: assignments = [], isLoading } = useAssignments(institutionId);
  const createAssignment = useCreateAssignment(institutionId);
  const updateAssignment = useUpdateAssignment(institutionId);
  const deleteAssignment = useDeleteAssignment(institutionId);

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<typeof assignments[0] | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: "", description: "", instructions: "", due_date: "", total_marks: 100, passing_marks: 40, status: "active" },
  });

  const openCreate = () => { setEditing(null); reset(); setDialog(true); };
  const openEdit = (a: typeof assignments[0]) => {
    setEditing(a);
    reset({
      title: a.title, description: a.description ?? "", instructions: a.instructions ?? "",
      due_date: a.due_date ? a.due_date.slice(0, 16) : "",
      total_marks: a.total_marks, passing_marks: a.passing_marks, status: a.status,
    });
    setDialog(true);
  };

  const onSubmit = async (values: { title: string; description: string; instructions: string; due_date: string; total_marks: number; passing_marks: number; status: string }) => {
    const payload = { ...values, total_marks: Number(values.total_marks), passing_marks: Number(values.passing_marks) };
    if (editing) await updateAssignment.mutateAsync({ id: editing.id, ...payload as Parameters<typeof updateAssignment.mutateAsync>[0] });
    else await createAssignment.mutateAsync(payload);
    setDialog(false);
  };

  const statusColor = (s: string) =>
    s === "active" ? "bg-green-500/10 text-green-600 border-green-200" :
    s === "closed" ? "bg-muted text-muted-foreground" :
    "bg-yellow-500/10 text-yellow-600 border-yellow-200";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Assignments</h1>
          <p className="text-sm text-muted-foreground">Create and manage student assignments</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Assignment</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-20" />)}</div>
      ) : assignments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No assignments yet</p>
            <Button size="sm" onClick={openCreate} variant="outline">Create first assignment</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(a.status)}`}>{a.status}</Badge>
                    </div>
                    {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" /> {a.total_marks} marks</span>
                      {a.due_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {format(new Date(a.due_date), "dd MMM yyyy HH:mm")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setViewingId(a.id)}><Eye className="h-3 w-3" /> Submissions</Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteAssignment.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewingId && (
        <SubmissionsPanel
          assignmentId={viewingId}
          institutionId={institutionId}
          assignmentTitle={assignments.find((a) => a.id === viewingId)?.title ?? ""}
          onClose={() => setViewingId(null)}
        />
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Assignment" : "New Assignment"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Title *</Label><Input {...register("title", { required: true })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea {...register("description")} rows={2} /></div>
            <div className="space-y-1.5"><Label>Instructions</Label><Textarea {...register("instructions")} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Marks</Label><Input type="number" {...register("total_marks")} /></div>
              <div className="space-y-1.5"><Label>Passing Marks</Label><Input type="number" {...register("passing_marks")} /></div>
            </div>
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="datetime-local" {...register("due_date")} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createAssignment.isPending || updateAssignment.isPending}>{editing ? "Save" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionsPanel({ assignmentId, institutionId, assignmentTitle, onClose }: { assignmentId: string; institutionId: string; assignmentTitle: string; onClose: () => void }) {
  const { data: submissions = [] } = useAssignmentSubmissions(assignmentId);
  const grade = useGradeSubmission(assignmentId);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { marks_obtained: 0, feedback: "" } });

  const onGrade = async (values: { marks_obtained: number; feedback: string }) => {
    if (!gradingId) return;
    await grade.mutateAsync({ id: gradingId, marks_obtained: Number(values.marks_obtained), feedback: values.feedback });
    setGradingId(null);
    reset();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Submissions: {assignmentTitle}</CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No submissions yet</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Student ID: {s.student_id.slice(0, 8)}...</p>
                  {s.notes && <p className="text-sm mt-0.5 line-clamp-1">{s.notes}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(s.submitted_at), "dd MMM yyyy HH:mm")}</p>
                </div>
                <div className="text-right">
                  {s.marks_obtained !== null ? (
                    <span className="text-sm font-semibold text-green-600">{s.marks_obtained} marks</span>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setGradingId(s.id); reset({ marks_obtained: 0, feedback: "" }); }}>Grade</Button>
                  )}
                  <Badge variant="outline" className={`block mt-1 text-[10px] ${s.status === "graded" ? "text-green-600 border-green-200" : ""}`}>{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={!!gradingId} onOpenChange={(o) => !o && setGradingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onGrade)} className="space-y-4">
            <div className="space-y-1.5"><Label>Marks Obtained</Label><Input type="number" {...register("marks_obtained")} /></div>
            <div className="space-y-1.5"><Label>Feedback</Label><Textarea {...register("feedback")} rows={3} /></div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setGradingId(null)}>Cancel</Button>
              <Button type="submit" disabled={grade.isPending}>Submit Grade</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
