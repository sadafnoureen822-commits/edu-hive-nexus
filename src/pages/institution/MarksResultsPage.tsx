import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useExams } from "@/hooks/exam/use-exams";
import { useExamSubjects } from "@/hooks/exam/use-exam-subjects";
import { useInstitutionMembers } from "@/hooks/use-institution-members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Save, ClipboardList, Award, TrendingUp, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ExportButton from "@/components/ui/ExportButton";

interface Mark {
  student_id: string;
  theory_marks: number;
  practical_marks: number;
  viva_marks: number;
  is_absent: boolean;
  remarks: string;
}

export default function MarksResultsPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const institutionId = institution?.id ?? "";

  const { exams, loading: examsLoading } = useExams();
  const { data: students = [] } = useInstitutionMembers(institutionId, "student");

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const { examSubjects, loading: esLoading } = useExamSubjects(selectedExam);

  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [saving, setSaving] = useState(false);
  const [resultsView, setResultsView] = useState<any[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);

  const selectedExamData = exams.find((e: any) => e.id === selectedExam);
  const selectedSubjectData = examSubjects.find((es: any) => es.id === selectedSubjectId);

  // Load existing marks when subject changes
  useEffect(() => {
    if (!selectedSubjectId || !students.length) return;
    const load = async () => {
      setLoadingMarks(true);
      const { data } = await supabase
        .from("student_marks")
        .select("*")
        .eq("exam_subject_id", selectedSubjectId);

      const map: Record<string, Mark> = {};
      students.forEach((s) => {
        const existing = data?.find((m) => m.student_id === s.user_id);
        map[s.user_id] = existing
          ? {
              student_id: s.user_id,
              theory_marks: existing.theory_marks || 0,
              practical_marks: existing.practical_marks || 0,
              viva_marks: existing.viva_marks || 0,
              is_absent: existing.is_absent || false,
              remarks: existing.remarks || "",
            }
          : { student_id: s.user_id, theory_marks: 0, practical_marks: 0, viva_marks: 0, is_absent: false, remarks: "" };
      });
      setMarks(map);
      setLoadingMarks(false);
    };
    load();
  }, [selectedSubjectId, students]);

  const updateMark = (studentId: string, field: keyof Mark, value: any) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const saveMarks = async () => {
    if (!selectedSubjectId || !selectedExam) return toast.error("Select exam and subject first");
    setSaving(true);
    const rows = Object.values(marks).map((m) => ({
      institution_id: institutionId,
      exam_id: selectedExam,
      exam_subject_id: selectedSubjectId,
      student_id: m.student_id,
      theory_marks: m.is_absent ? 0 : m.theory_marks,
      practical_marks: m.is_absent ? 0 : m.practical_marks,
      viva_marks: m.is_absent ? 0 : m.viva_marks,
      is_absent: m.is_absent,
      remarks: m.remarks,
      entered_by: user?.id,
    }));

    const { error } = await supabase.from("student_marks").upsert(rows, {
      onConflict: "exam_subject_id,student_id",
    });
    setSaving(false);

    if (error) return toast.error(error.message);
    toast.success(`Marks saved for ${rows.length} students`);
  };

  // Load results for results view
  const loadResults = async () => {
    if (!selectedExam) return;
    setLoadingMarks(true);
    const { data: marksData } = await (supabase as any)
      .from("student_marks")
      .select("*, exam_subjects!exam_subject_id(subject_id, total_marks, passing_marks, subjects!subject_id(name))")
      .eq("exam_id", selectedExam)
      .eq("institution_id", institutionId);

    // Group by student
    const grouped: Record<string, any[]> = {};
    (marksData || []).forEach((m: any) => {
      if (!grouped[m.student_id]) grouped[m.student_id] = [];
      grouped[m.student_id].push(m);
    });

    const results = students.map((s) => {
      const sMarks = grouped[s.user_id] || [];
      const totalObtained = sMarks.reduce((sum, m) => sum + (m.total_obtained || 0), 0);
      const totalMax = sMarks.reduce((sum, m) => sum + ((m.exam_subjects as any)?.total_marks || 100), 0);
      const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "N/A";
      const failed = sMarks.some((m) => {
        const passing = (m.exam_subjects as any)?.passing_marks || 33;
        return !m.is_absent && m.total_obtained < passing;
      });
      return {
        name: s.full_name || "Unknown",
        studentId: s.user_id,
        subjects: sMarks.length,
        totalObtained,
        totalMax,
        percentage,
        status: sMarks.length === 0 ? "No marks" : failed ? "Fail" : "Pass",
      };
    }).filter((r) => r.subjects > 0);

    setResultsView(results);
    setLoadingMarks(false);
  };

  const totalSubjectMarks = selectedSubjectData ? (selectedSubjectData as any).total_marks || 100 : 100;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Marks & Results</h1>
          <p className="text-muted-foreground mt-1">Enter student marks and view results</p>
        </div>
        <ExportButton
          data={Object.values(marks).map((m) => ({
            "Student ID": m.student_id,
            Exam: selectedExamData?.name ?? "",
            "Theory Marks": m.theory_marks,
            "Practical Marks": m.practical_marks,
            "Viva Marks": m.viva_marks,
            Absent: m.is_absent ? "Yes" : "No",
            Remarks: m.remarks,
          }))}
          fileName="student-marks"
          sheetName="Marks"
          disabled={!selectedSubjectId}
        />
      </div>

      {/* Exam + Subject Selectors */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Select Exam & Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Exam</Label>
              <Select value={selectedExam} onValueChange={(v) => { setSelectedExam(v); setSelectedSubjectId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder={examsLoading ? "Loading..." : "Select exam"} />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder={esLoading ? "Loading..." : "Select subject"} />
                </SelectTrigger>
                <SelectContent>
                  {examSubjects.map((es: any) => (
                    <SelectItem key={es.id} value={es.id}>
                      {(es.subjects as any)?.name || es.subject_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entry">
        <TabsList>
          <TabsTrigger value="entry" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Marks Entry</TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5" onClick={loadResults}><BarChart2 className="h-3.5 w-3.5" /> Results</TabsTrigger>
        </TabsList>

        {/* MARKS ENTRY */}
        <TabsContent value="entry" className="mt-4">
          {!selectedSubjectId ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Select an exam and subject to enter marks</p>
              </CardContent>
            </Card>
          ) : loadingMarks ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {(selectedSubjectData as any)?.subjects?.name || "Subject"} — {selectedExamData?.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total Marks: {totalSubjectMarks} | Students: {students.length}
                  </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={saveMarks} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="w-24">Theory</TableHead>
                      <TableHead className="w-24">Practical</TableHead>
                      <TableHead className="w-24">Viva</TableHead>
                      <TableHead className="w-20">Total</TableHead>
                      <TableHead className="w-20">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                          No students enrolled
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((s, i) => {
                        const m = marks[s.user_id] || { theory_marks: 0, practical_marks: 0, viva_marks: 0, is_absent: false, remarks: "" };
                        const total = m.is_absent ? 0 : (Number(m.theory_marks) + Number(m.practical_marks) + Number(m.viva_marks));
                        const passing = (selectedSubjectData as any)?.passing_marks || 33;
                        const passed = total >= passing;
                        return (
                          <TableRow key={s.id} className={m.is_absent ? "opacity-50" : ""}>
                            <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {(s.full_name || "S").charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{s.full_name || `Student ${i + 1}`}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={totalSubjectMarks}
                                value={m.theory_marks}
                                onChange={(e) => updateMark(s.user_id, "theory_marks", Number(e.target.value))}
                                disabled={m.is_absent}
                                className="h-7 w-20 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={totalSubjectMarks}
                                value={m.practical_marks}
                                onChange={(e) => updateMark(s.user_id, "practical_marks", Number(e.target.value))}
                                disabled={m.is_absent}
                                className="h-7 w-20 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={totalSubjectMarks}
                                value={m.viva_marks}
                                onChange={(e) => updateMark(s.user_id, "viva_marks", Number(e.target.value))}
                                disabled={m.is_absent}
                                className="h-7 w-20 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              {m.is_absent ? (
                                <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">ABS</Badge>
                              ) : (
                                <Badge variant="outline" className={`text-[10px] ${passed ? "text-primary border-primary/30" : "text-destructive border-destructive/30"}`}>
                                  {total}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={m.is_absent}
                                onChange={(e) => updateMark(s.user_id, "is_absent", e.target.checked)}
                                className="w-4 h-4 accent-primary"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RESULTS VIEW */}
        <TabsContent value="results" className="mt-4">
          {!selectedExam ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
                <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Select an exam to view results</p>
              </CardContent>
            </Card>
          ) : loadingMarks ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : resultsView.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
                <Award className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No marks entered yet for this exam</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedExamData?.name} — Results</CardTitle>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-primary font-semibold">{resultsView.filter((r) => r.status === "Pass").length} Passed</span>
                    <span>·</span>
                    <span className="text-destructive font-semibold">{resultsView.filter((r) => r.status === "Fail").length} Failed</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultsView.map((r, i) => (
                      <TableRow key={r.studentId}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{r.name}</TableCell>
                        <TableCell className="text-sm">{r.subjects}</TableCell>
                        <TableCell className="text-sm">{r.totalObtained} / {r.totalMax}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full ${Number(r.percentage) >= 50 ? "bg-primary" : "bg-destructive"}`}
                                style={{ width: `${Math.min(Number(r.percentage), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{r.percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${r.status === "Pass" ? "bg-primary/10 text-primary border-primary/20" : r.status === "Fail" ? "bg-destructive/10 text-destructive border-destructive/20" : "text-muted-foreground"}`}
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
