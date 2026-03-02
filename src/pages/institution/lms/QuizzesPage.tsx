import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useQuizzes, useCreateQuiz, useUpdateQuiz, useDeleteQuiz, useQuizWithQuestions, useAddQuestion, useDeleteQuestion } from "@/hooks/lms/use-quizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, HelpCircle, Edit, Trash2, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";

export default function QuizzesPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id ?? "";

  const { data: quizzes = [], isLoading } = useQuizzes(institutionId);
  const createQuiz = useCreateQuiz(institutionId);
  const updateQuiz = useUpdateQuiz(institutionId);
  const deleteQuiz = useDeleteQuiz(institutionId);

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<typeof quizzes[0] | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: "", description: "", duration_minutes: 60, total_marks: 100, passing_marks: 40, max_attempts: 1, status: "draft" },
  });

  const openCreate = () => { setEditing(null); reset(); setDialog(true); };
  const openEdit = (q: typeof quizzes[0]) => {
    setEditing(q);
    reset({ title: q.title, description: q.description ?? "", duration_minutes: q.duration_minutes ?? 60, total_marks: q.total_marks, passing_marks: q.passing_marks, max_attempts: q.max_attempts, status: q.status });
    setDialog(true);
  };

  const onSubmit = async (values: { title: string; description: string; duration_minutes: number; total_marks: number; passing_marks: number; max_attempts: number; status: string }) => {
    const payload = { ...values, duration_minutes: Number(values.duration_minutes), total_marks: Number(values.total_marks), passing_marks: Number(values.passing_marks), max_attempts: Number(values.max_attempts) };
    if (editing) await updateQuiz.mutateAsync({ id: editing.id, ...payload });
    else await createQuiz.mutateAsync(payload);
    setDialog(false);
  };

  const statusColor = (s: string) =>
    s === "published" ? "bg-green-500/10 text-green-600 border-green-200" :
    s === "closed" ? "bg-muted text-muted-foreground" :
    "bg-yellow-500/10 text-yellow-600 border-yellow-200";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Quizzes</h1>
          <p className="text-sm text-muted-foreground">Build and manage quiz assessments</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Quiz</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse h-36" />)}</div>
      ) : quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No quizzes yet</p>
            <Button size="sm" onClick={openCreate} variant="outline">Create first quiz</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold">{q.title}</CardTitle>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusColor(q.status)}`}>{q.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>{q.total_marks} marks</span>
                  <span>•</span>
                  <span>{q.duration_minutes} min</span>
                  <span>•</span>
                  <span>{q.max_attempts} attempt{q.max_attempts > 1 ? "s" : ""}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSelectedQuizId(q.id === selectedQuizId ? null : q.id)}>
                    Questions <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => openEdit(q)}><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteQuiz.mutate(q.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedQuizId && (
        <QuestionsPanel
          quizId={selectedQuizId}
          institutionId={institutionId}
          quizTitle={quizzes.find((q) => q.id === selectedQuizId)?.title ?? ""}
          onClose={() => setSelectedQuizId(null)}
        />
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Quiz" : "New Quiz"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Title *</Label><Input {...register("title", { required: true })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea {...register("description")} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Marks</Label><Input type="number" {...register("total_marks")} /></div>
              <div className="space-y-1.5"><Label>Passing Marks</Label><Input type="number" {...register("passing_marks")} /></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" {...register("duration_minutes")} /></div>
              <div className="space-y-1.5"><Label>Max Attempts</Label><Input type="number" {...register("max_attempts")} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createQuiz.isPending || updateQuiz.isPending}>{editing ? "Save" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type QuestionForm = {
  question_text: string;
  question_type: string;
  marks: number;
  explanation: string;
  options: { option_text: string; is_correct: boolean }[];
};

function QuestionsPanel({ quizId, institutionId, quizTitle, onClose }: { quizId: string; institutionId: string; quizTitle: string; onClose: () => void }) {
  const { data: questions = [] } = useQuizWithQuestions(quizId);
  const addQuestion = useAddQuestion(institutionId, quizId);
  const deleteQuestion = useDeleteQuestion(quizId);
  const [qDialog, setQDialog] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, control } = useForm<QuestionForm>({
    defaultValues: { question_text: "", question_type: "mcq", marks: 1, explanation: "", options: [{ option_text: "", is_correct: false }, { option_text: "", is_correct: false }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  const onSubmit = async (values: QuestionForm) => {
    await addQuestion.mutateAsync({ ...values, marks: Number(values.marks), position: questions.length, options: values.options.map((o, i) => ({ ...o, position: i })) });
    setQDialog(false);
    reset();
  };

  const qType = watch("question_type");

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Questions: {quizTitle}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setQDialog(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Question</Button>
            <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No questions yet. Add your first question.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="p-3 rounded-lg border bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">Q{i + 1}</span>
                      <Badge variant="outline" className="text-[10px]">{q.question_type}</Badge>
                      <span className="text-[11px] text-muted-foreground ml-auto">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm font-medium">{q.question_text}</p>
                    {q.quiz_options && q.quiz_options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.quiz_options.map((opt) => (
                          <div key={opt.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${opt.is_correct ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                            {opt.is_correct ? <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-600" /> : <Circle className="h-3 w-3 flex-shrink-0" />}
                            {opt.option_text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0" onClick={() => deleteQuestion.mutate(q.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={qDialog} onOpenChange={setQDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Question</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Question *</Label><Textarea {...register("question_text", { required: true })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={qType} onValueChange={(v) => setValue("question_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True / False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Marks</Label><Input type="number" {...register("marks")} /></div>
            </div>
            {(qType === "mcq" || qType === "true_false") && (
              <div className="space-y-2">
                <Label>Options (check correct answer{qType === "mcq" ? "s" : ""})</Label>
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input type="checkbox" {...register(`options.${idx}.is_correct`)} className="rounded border-border" />
                    <Input {...register(`options.${idx}.option_text`, { required: true })} placeholder={`Option ${idx + 1}`} className="flex-1" />
                    {fields.length > 2 && <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(idx)}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                ))}
                {qType === "mcq" && fields.length < 6 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => append({ option_text: "", is_correct: false })} className="gap-1.5"><Plus className="h-3 w-3" /> Add Option</Button>
                )}
              </div>
            )}
            <div className="space-y-1.5"><Label>Explanation (optional)</Label><Input {...register("explanation")} placeholder="Explain the correct answer..." /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setQDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={addQuestion.isPending}>Add Question</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
