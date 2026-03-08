import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { useStudentMarksByInstitution, useUpsertStudentMark } from "@/hooks/lms/use-student-marks";
import { useExams } from "@/hooks/exam/use-exams";
import { useExamSubjects } from "@/hooks/exam/use-exam-subjects";
import { useSubjects } from "@/hooks/exam/use-subjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Loader2, ClipboardList, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function TeacherMarksPage() {
  const { institution } = useTenant();
  const instId = institution?.id ?? "";

  const { data: students = [], isLoading: studLoading } = useInstitutionMembers(instId, "student");
  const { data: exams = [], isLoading: examLoading } = useExams(instId);
  const { data: allMarks = [], isLoading: marksLoading } = useStudentMarksByInstitution(instId);
  const { data: subjects = [] } = useSubjects(instId);
  const upsertMark = useUpsertStudentMark(instId);

  const [selExamId,    setSelExamId]    = useState("");
  const [selSubjectId, setSelSubjectId] = useState("");
  const [marks, setMarks] = useState<Record<string, { theory: string; practical: string; viva: string }>>({});

  const { data: examSubjects = [] } = useExamSubjects(selExamId);

  const selSubject = subjects.find((s) => s.id === selSubjectId);
  const selExam    = exams.find((e) => e.id === selExamId);
  const selExamSubject = examSubjects.find((es) => es.subject_id === selSubjectId);

  const getExistingMark = (studentId: string) =>
    allMarks.find((m) => m.student_id === studentId && m.exam_subject_id === selExamSubject?.id);

  const getMark = (studentId: string, field: "theory" | "practical" | "viva") => {
    if (marks[studentId]?.[field] !== undefined) return marks[studentId][field];
    const existing = getExistingMark(studentId);
    if (!existing) return "";
    if (field === "theory")    return String(existing.theory_marks ?? "");
    if (field === "practical") return String(existing.practical_marks ?? "");
    if (field === "viva")      return String(existing.viva_marks ?? "");
    return "";
  };

  const setMark = (studentId: string, field: "theory" | "practical" | "viva", value: string) => {
    setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const saveAll = async () => {
    if (!selExamSubject) return toast.error("Select an exam and subject first");
    if (!students.length) return toast.error("No students to save marks for");

    let saved = 0;
    for (const s of students) {
      const theory    = parseFloat(getMark(s.user_id, "theory"))    || 0;
      const practical = parseFloat(getMark(s.user_id, "practical")) || 0;
      const viva      = parseFloat(getMark(s.user_id, "viva"))      || 0;
      const total     = theory + practical + viva;

      try {
        await upsertMark.mutateAsync({
          student_id: s.user_id,
          exam_subject_id: selExamSubject.id,
          theory_marks: theory,
          practical_marks: practical,
          viva_marks: viva,
          total_marks: total,
          status: "pending",
        });
        saved++;
      } catch { /* continue */ }
    }
    toast.success(`Marks saved for ${saved} student${saved !== 1 ? "s" : ""}`);
    setMarks({});
  };

  const isLoading = studLoading || examLoading || marksLoading;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Enter Student Marks</h1>
        <p className="text-sm text-muted-foreground">Record theory, practical, and viva marks per exam and subject</p>
      </div>

      {/* Exam + Subject Selector */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Select Exam</Label>
              <Select value={selExamId} onValueChange={(v) => { setSelExamId(v); setSelSubjectId(""); setMarks({}); }}>
                <SelectTrigger><SelectValue placeholder="Choose exam…" /></SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Select Subject</Label>
              <Select value={selSubjectId} onValueChange={(v) => { setSelSubjectId(v); setMarks({}); }} disabled={!selExamId}>
                <SelectTrigger><SelectValue placeholder={selExamId ? "Choose subject…" : "Select exam first"} /></SelectTrigger>
                <SelectContent>
                  {examSubjects.map((es) => {
                    const sub = subjects.find((s) => s.id === es.subject_id);
                    return <SelectItem key={es.id} value={es.subject_id}>{sub?.name ?? es.subject_id}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selExamSubject && (
            <div className="mt-3 p-3 rounded-lg bg-secondary/50 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Total: <strong>{selExamSubject.total_marks}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Passing: <strong>{selExamSubject.passing_marks}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Theory: <strong>{selExamSubject.theory_weightage}%</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Practical: <strong>{selExamSubject.practical_weightage}%</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Viva: <strong>{selExamSubject.viva_weightage}%</strong>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Table */}
      {selExamId && selSubjectId ? (
        isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : students.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 gap-2">
            <Users className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No students enrolled</p>
          </CardContent></Card>
        ) : (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Marks Entry — {selExam?.name} · {subjects.find(s => s.id === selSubjectId)?.name}
                </CardTitle>
                <Button size="sm" onClick={saveAll} disabled={upsertMark.isPending} className="gap-1.5">
                  {upsertMark.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save All Marks
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Theory</TableHead>
                    <TableHead>Practical</TableHead>
                    <TableHead>Viva</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => {
                    const theory    = parseFloat(getMark(s.user_id, "theory"))    || 0;
                    const practical = parseFloat(getMark(s.user_id, "practical")) || 0;
                    const viva      = parseFloat(getMark(s.user_id, "viva"))      || 0;
                    const total     = theory + practical + viva;
                    const existing  = getExistingMark(s.user_id);
                    const passing   = selExamSubject?.passing_marks ?? 33;

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {(s.full_name || "S").charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{s.full_name || `Student ${i + 1}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} max={selExamSubject?.total_marks ?? 100}
                            value={getMark(s.user_id, "theory")}
                            onChange={(e) => setMark(s.user_id, "theory", e.target.value)}
                            className="w-20 h-7 text-xs" placeholder="0" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} max={selExamSubject?.total_marks ?? 100}
                            value={getMark(s.user_id, "practical")}
                            onChange={(e) => setMark(s.user_id, "practical", e.target.value)}
                            className="w-20 h-7 text-xs" placeholder="0" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} max={selExamSubject?.total_marks ?? 100}
                            value={getMark(s.user_id, "viva")}
                            onChange={(e) => setMark(s.user_id, "viva", e.target.value)}
                            className="w-20 h-7 text-xs" placeholder="0" />
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold text-sm ${total >= passing ? "text-green-600" : total > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {total > 0 ? total : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {existing ? (
                            <Badge variant="outline" className="text-[10px]">{existing.status}</Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 gap-2">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">Select an exam and subject above to start entering marks</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
