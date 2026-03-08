import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/hooks/lms/use-assignments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Clock, TrendingUp, CheckCircle2, Upload, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function StudentAssignmentsPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const instId = institution?.id ?? "";

  const { data: assignments = [], isLoading } = useAssignments(instId);
  const active = assignments.filter((a) => a.status === "active");

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-submissions", user?.id, instId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_id", user.id)
        .eq("institution_id", instId);
      return data || [];
    },
    enabled: !!user?.id && !!instId,
  });

  const submittedIds = new Set(mySubmissions.map((s: any) => s.assignment_id));
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const submit = useMutation({
    mutationFn: async ({ assignmentId, notes }: { assignmentId: string; notes: string }) => {
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user!.id,
        institution_id: instId,
        notes,
        status: "submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      setSubmitting(null);
      setNotes("");
      toast.success("Assignment submitted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submittingAssignment = assignments.find((a) => a.id === submitting);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Assignments</h1>
        <p className="text-sm text-muted-foreground">{active.length} active assignment{active.length !== 1 ? "s" : ""}</p>
      </div>

      {active.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No active assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map((a) => {
            const submitted = submittedIds.has(a.id);
            const submission = mySubmissions.find((s: any) => s.assignment_id === a.id);
            const overdue = a.due_date && new Date(a.due_date) < new Date();
            return (
              <Card key={a.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        {submitted && <Badge variant="outline" className="text-green-600 border-green-200 text-[10px]">Submitted</Badge>}
                        {!submitted && overdue && <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">Overdue</Badge>}
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{a.total_marks} marks</span>
                        {a.due_date && (
                          <span className={`flex items-center gap-1 ${overdue && !submitted ? "text-destructive font-medium" : ""}`}>
                            <Clock className="h-3 w-3" />Due: {format(new Date(a.due_date), "dd MMM yyyy, HH:mm")}
                          </span>
                        )}
                      </div>
                      {submission?.marks_obtained != null && (
                        <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="text-xs font-semibold text-primary">Grade: {submission.marks_obtained} / {a.total_marks}</p>
                          {submission.feedback && <p className="text-xs text-muted-foreground mt-0.5">Feedback: {submission.feedback}</p>}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {submitted ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="h-4 w-4" /> Done
                        </div>
                      ) : (
                        <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setSubmitting(a.id)} disabled={!!overdue}>
                          <Upload className="h-3.5 w-3.5" /> Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!submitting} onOpenChange={() => { setSubmitting(null); setNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {submittingAssignment && (
              <div className="p-3 rounded-lg bg-muted/30 border text-sm">
                <p className="font-semibold">{submittingAssignment.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{submittingAssignment.total_marks} marks</p>
                {submittingAssignment.instructions && (
                  <p className="text-xs text-muted-foreground mt-1.5 border-t pt-1.5">{submittingAssignment.instructions}</p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Your Answer / Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Type your answer or notes here..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setSubmitting(null); setNotes(""); }}>Cancel</Button>
              <Button onClick={() => submit.mutate({ assignmentId: submitting!, notes })} disabled={submit.isPending || !notes.trim()}>
                {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
