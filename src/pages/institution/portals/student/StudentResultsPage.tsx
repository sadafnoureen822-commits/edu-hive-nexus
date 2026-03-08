import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, Award, TrendingUp, Loader2, Star } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";

interface ExamResult {
  examName: string;
  subjects: { subjectName: string; theoryMarks: number; practicalMarks: number; vivaMarks: number; totalObtained: number; totalMarks: number; passingMarks: number; isAbsent: boolean; remarks: string | null }[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  passed: boolean;
}

export default function StudentResultsPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const instId = institution?.id ?? "";

  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>("all");

  useEffect(() => {
    if (!user?.id || !instId) return;
    fetchResults();
  }, [user?.id, instId]);

  const fetchResults = async () => {
    setLoading(true);
    const { data: marksData } = await supabase
      .from("student_marks")
      .select(`
        theory_marks, practical_marks, viva_marks, total_obtained, is_absent, remarks, status,
        exam_id,
        exam_subjects!exam_subject_id(
          total_marks, passing_marks,
          subjects!subject_id(name),
          exams!exam_id(name)
        )
      `)
      .eq("student_id", user!.id)
      .eq("institution_id", instId)
      .eq("status", "approved");

    if (!marksData?.length) { setLoading(false); return; }

    // Group by exam
    const grouped: Record<string, any[]> = {};
    marksData.forEach((m: any) => {
      const examId = m.exam_id || m.exam_subjects?.exams?.id || "unknown";
      if (!grouped[examId]) grouped[examId] = [];
      grouped[examId].push(m);
    });

    const examResults: ExamResult[] = Object.entries(grouped).map(([, marks]) => {
      const examName = (marks[0] as any)?.exam_subjects?.exams?.name || "Exam";
      const subjects = marks.map((m: any) => ({
        subjectName: m.exam_subjects?.subjects?.name || "Subject",
        theoryMarks: m.theory_marks || 0,
        practicalMarks: m.practical_marks || 0,
        vivaMarks: m.viva_marks || 0,
        totalObtained: m.total_obtained || (m.theory_marks || 0) + (m.practical_marks || 0) + (m.viva_marks || 0),
        totalMarks: m.exam_subjects?.total_marks || 100,
        passingMarks: m.exam_subjects?.passing_marks || 33,
        isAbsent: m.is_absent,
        remarks: m.remarks,
      }));
      const totalObtained = subjects.reduce((s, sub) => s + (sub.isAbsent ? 0 : sub.totalObtained), 0);
      const totalMax = subjects.reduce((s, sub) => s + sub.totalMarks, 0);
      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      const passed = subjects.every((s) => s.isAbsent || s.totalObtained >= s.passingMarks);
      return { examName, subjects, totalObtained, totalMax, percentage, passed };
    });

    setResults(examResults);
    setLoading(false);
  };

  const displayResults = selectedExam === "all" ? results : results.filter((r) => r.examName === selectedExam);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Exam Results</h1>
        <p className="text-sm text-muted-foreground">Your approved exam results</p>
      </div>

      {results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No results published yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {results.length > 1 && (
            <div className="max-w-xs">
              <Label className="text-xs text-muted-foreground">Filter by Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {results.map((r) => (
                    <SelectItem key={r.examName} value={r.examName}>{r.examName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-6">
            {displayResults.map((result, i) => (
              <Card key={i} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" /> {result.examName}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-primary">{result.percentage.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">{result.totalObtained}/{result.totalMax}</p>
                      </div>
                      <Badge variant="outline" className={result.passed ? "text-green-600 border-green-200" : "text-destructive border-destructive/30"}>
                        {result.passed ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={result.percentage} className="h-2 mt-2" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-t divide-y divide-border/50">
                    {result.subjects.map((sub, j) => {
                      const pct = sub.totalMarks > 0 ? (sub.totalObtained / sub.totalMarks) * 100 : 0;
                      const subPassed = sub.isAbsent || sub.totalObtained >= sub.passingMarks;
                      return (
                        <div key={j} className="px-4 py-3 flex items-center gap-4">
                          <Star className={`h-3.5 w-3.5 flex-shrink-0 ${subPassed ? "text-yellow-500" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{sub.subjectName}</p>
                            {sub.isAbsent ? (
                              <p className="text-xs text-destructive">Absent</p>
                            ) : (
                              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                {sub.theoryMarks > 0 && <span>Theory: {sub.theoryMarks}</span>}
                                {sub.practicalMarks > 0 && <span>Practical: {sub.practicalMarks}</span>}
                                {sub.vivaMarks > 0 && <span>Viva: {sub.vivaMarks}</span>}
                              </div>
                            )}
                            {sub.remarks && <p className="text-xs text-muted-foreground italic mt-0.5">{sub.remarks}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold">{sub.isAbsent ? "ABS" : `${sub.totalObtained}/${sub.totalMarks}`}</p>
                            <Badge variant="outline" className={`text-[10px] ${subPassed ? "text-green-600 border-green-200" : "text-destructive border-destructive/30"}`}>
                              {sub.isAbsent ? "Absent" : subPassed ? "Pass" : "Fail"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
