import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuizzes, useQuizWithQuestions } from "@/hooks/lms/use-quizzes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, Clock, CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import ExportButton from "@/components/ui/ExportButton";

export default function StudentQuizzesPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const instId = institution?.id ?? "";

  const { data: quizzes = [], isLoading } = useQuizzes(instId);
  const published = quizzes.filter((q) => q.status === "published");

  const { data: myAttempts = [] } = useQuery({
    queryKey: ["my-quiz-attempts", user?.id, instId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_id", user.id)
        .eq("institution_id", instId)
        .order("started_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id && !!instId,
  });

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Quizzes</h1>
        <p className="text-sm text-muted-foreground">{published.length} quiz{published.length !== 1 ? "zes" : ""} available</p>
      </div>

      {published.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <HelpCircle className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No quizzes available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {published.map((quiz) => {
            const attempts = myAttempts.filter((a: any) => a.quiz_id === quiz.id);
            const completedAttempts = attempts.filter((a: any) => a.status === "completed");
            const canAttempt = completedAttempts.length < quiz.max_attempts;
            const bestScore = completedAttempts.length > 0
              ? Math.max(...completedAttempts.map((a: any) => a.percentage || 0))
              : null;

            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-violet-500/10 p-2.5 rounded-xl flex-shrink-0">
                      <HelpCircle className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{quiz.title}</h3>
                      {quiz.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{quiz.description}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{quiz.total_marks} marks</span>
                    {quiz.duration_minutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.duration_minutes} min</span>}
                    <span>{completedAttempts.length}/{quiz.max_attempts} attempts used</span>
                  </div>

                  {bestScore !== null && (
                    <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Best Score</span>
                        <span className="font-bold text-primary">{bestScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={bestScore} className="h-1.5" />
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full gap-1.5 h-8 text-xs"
                    disabled={!canAttempt}
                    onClick={() => setActiveQuizId(quiz.id)}
                  >
                    {canAttempt ? "Start Quiz" : "Max Attempts Reached"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeQuizId && (
        <QuizAttemptDialog
          quizId={activeQuizId}
          quiz={published.find((q) => q.id === activeQuizId)!}
          userId={user?.id ?? ""}
          institutionId={instId}
          onClose={() => setActiveQuizId(null)}
        />
      )}
    </div>
  );
}

function QuizAttemptDialog({ quizId, quiz, userId, institutionId, onClose }: {
  quizId: string;
  quiz: any;
  userId: string;
  institutionId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: questions = [] } = useQuizWithQuestions(quizId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pct: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create attempt
      const { data: attempt, error: aErr } = await supabase
        .from("quiz_attempts")
        .insert({ quiz_id: quizId, student_id: userId, institution_id: institutionId, status: "in_progress" })
        .select().single();
      if (aErr) throw aErr;

      // Calculate score
      let score = 0;
      const answerRows: any[] = [];

      for (const q of questions) {
        const selectedOptId = answers[q.id];
        const textAns = textAnswers[q.id];
        let isCorrect = null;
        let marksAwarded = 0;

        if (q.question_type === "short_answer") {
          answerRows.push({ attempt_id: attempt.id, question_id: q.id, institution_id: institutionId, text_answer: textAns || null });
        } else if (selectedOptId) {
          const opt = q.quiz_options?.find((o: any) => o.id === selectedOptId);
          isCorrect = opt?.is_correct ?? false;
          if (isCorrect) { marksAwarded = q.marks; score += q.marks; }
          answerRows.push({ attempt_id: attempt.id, question_id: q.id, institution_id: institutionId, selected_option_id: selectedOptId, is_correct: isCorrect, marks_awarded: marksAwarded });
        }
      }

      if (answerRows.length > 0) {
        await supabase.from("quiz_answers").insert(answerRows);
      }

      const pct = quiz.total_marks > 0 ? (score / quiz.total_marks) * 100 : 0;

      await supabase.from("quiz_attempts").update({
        status: "completed",
        marks_obtained: score,
        percentage: pct,
        submitted_at: new Date().toISOString(),
      }).eq("id", attempt.id);

      setResult({ score, total: quiz.total_marks, pct });
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["my-quiz-attempts"] });
    } catch (e: any) {
      toast.error(e.message);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> {quiz.title}
          </DialogTitle>
        </DialogHeader>

        {submitted && result ? (
          <div className="text-center space-y-4 py-6">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${result.pct >= quiz.passing_marks / quiz.total_marks * 100 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              {result.pct >= (quiz.passing_marks / quiz.total_marks) * 100 ? (
                <Trophy className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-3xl font-display font-bold">{result.score} / {result.total}</p>
              <p className="text-lg font-semibold text-muted-foreground">{result.pct.toFixed(1)}%</p>
              <Badge variant="outline" className={`mt-2 ${result.pct >= (quiz.passing_marks / quiz.total_marks) * 100 ? "text-green-600 border-green-200" : "text-destructive border-destructive/30"}`}>
                {result.pct >= (quiz.passing_marks / quiz.total_marks) * 100 ? "Passed" : "Failed"}
              </Badge>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-shrink-0">Q{i + 1}</span>
                  <p className="text-sm font-medium">{q.question_text}</p>
                  <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
                </div>

                {q.question_type === "short_answer" ? (
                  <Textarea
                    placeholder="Your answer..."
                    value={textAnswers[q.id] || ""}
                    onChange={(e) => setTextAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    rows={2}
                  />
                ) : (
                  <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}>
                    {q.quiz_options?.map((opt: any) => (
                      <div key={opt.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-sm">{opt.option_text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Submit Quiz
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
