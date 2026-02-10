import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList, Plus, Trash2, Loader2, CalendarDays, BookOpen, Settings2,
} from "lucide-react";
import { useExams } from "@/hooks/exam/use-exams";
import { useAcademicSessions } from "@/hooks/exam/use-academic-sessions";
import { useClasses } from "@/hooks/exam/use-classes";
import { useSections } from "@/hooks/exam/use-sections";
import { useSubjects } from "@/hooks/exam/use-subjects";
import { useGradingScales } from "@/hooks/exam/use-grading-scales";
import { useExamSubjects } from "@/hooks/exam/use-exam-subjects";
import { useDateSheets } from "@/hooks/exam/use-date-sheets";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

function ExamDetail({ examId, onClose }: { examId: string; onClose: () => void }) {
  const { examSubjects, loading: loadingSubjects, addSubject, removeSubject } = useExamSubjects(examId);
  const { dateSheets, loading: loadingSheets, createDateSheet, deleteDateSheet } = useDateSheets(examId);
  const { subjects } = useSubjects();
  const [subjectForm, setSubjectForm] = useState({ subject_id: "", total_marks: "100", passing_marks: "33", theory_weightage: "80", practical_weightage: "20", viva_weightage: "0" });
  const [dateForm, setDateForm] = useState({ exam_subject_id: "", exam_date: "", start_time: "", end_time: "", location: "" });
  const [tab, setTab] = useState("subjects");

  const assignedSubjectIds = examSubjects.map((es: any) => es.subject_id);
  const availableSubjects = subjects.filter((s: any) => !assignedSubjectIds.includes(s.id));

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="subjects" className="gap-1"><BookOpen className="h-3.5 w-3.5" />Subjects</TabsTrigger>
          <TabsTrigger value="datesheet" className="gap-1"><CalendarDays className="h-3.5 w-3.5" />Date Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4 space-y-4">
          {/* Add subject form */}
          <Card className="border-border/30">
            <CardHeader className="py-3"><CardTitle className="text-sm">Add Subject to Exam</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Select value={subjectForm.subject_id} onValueChange={v => setSubjectForm(p => ({ ...p, subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{availableSubjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Total Marks</Label><Input type="number" value={subjectForm.total_marks} onChange={e => setSubjectForm(p => ({ ...p, total_marks: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs">Pass Marks</Label><Input type="number" value={subjectForm.passing_marks} onChange={e => setSubjectForm(p => ({ ...p, passing_marks: e.target.value }))} /></div>
                <div><Label className="text-xs">Theory %</Label><Input type="number" value={subjectForm.theory_weightage} onChange={e => setSubjectForm(p => ({ ...p, theory_weightage: e.target.value }))} /></div>
                <div><Label className="text-xs">Practical %</Label><Input type="number" value={subjectForm.practical_weightage} onChange={e => setSubjectForm(p => ({ ...p, practical_weightage: e.target.value }))} /></div>
                <div><Label className="text-xs">Viva %</Label><Input type="number" value={subjectForm.viva_weightage} onChange={e => setSubjectForm(p => ({ ...p, viva_weightage: e.target.value }))} /></div>
              </div>
              <Button size="sm" disabled={!subjectForm.subject_id || addSubject.isPending} onClick={() => {
                addSubject.mutate({
                  subject_id: subjectForm.subject_id,
                  total_marks: Number(subjectForm.total_marks),
                  passing_marks: Number(subjectForm.passing_marks),
                  theory_weightage: Number(subjectForm.theory_weightage),
                  practical_weightage: Number(subjectForm.practical_weightage),
                  viva_weightage: Number(subjectForm.viva_weightage),
                }, { onSuccess: () => setSubjectForm(p => ({ ...p, subject_id: "" })) });
              }}><Plus className="h-3 w-3 mr-1" />Add Subject</Button>
            </CardContent>
          </Card>

          {loadingSubjects ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : examSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No subjects assigned yet</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Total</TableHead><TableHead>Pass</TableHead><TableHead>Theory</TableHead><TableHead>Practical</TableHead><TableHead>Viva</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {examSubjects.map((es: any) => (
                  <TableRow key={es.id}>
                    <TableCell className="font-medium">{(es.subjects as any)?.name ?? "—"}</TableCell>
                    <TableCell>{es.total_marks}</TableCell>
                    <TableCell>{es.passing_marks}</TableCell>
                    <TableCell>{es.theory_weightage}%</TableCell>
                    <TableCell>{es.practical_weightage}%</TableCell>
                    <TableCell>{es.viva_weightage}%</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeSubject.mutate(es.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="datesheet" className="mt-4 space-y-4">
          <Card className="border-border/30">
            <CardHeader className="py-3"><CardTitle className="text-sm">Add Date Sheet Entry</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Select value={dateForm.exam_subject_id} onValueChange={v => setDateForm(p => ({ ...p, exam_subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{examSubjects.map((es: any) => <SelectItem key={es.id} value={es.id}>{(es.subjects as any)?.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Date</Label><Input type="date" value={dateForm.exam_date} onChange={e => setDateForm(p => ({ ...p, exam_date: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Start Time</Label><Input type="time" value={dateForm.start_time} onChange={e => setDateForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                <div><Label className="text-xs">End Time</Label><Input type="time" value={dateForm.end_time} onChange={e => setDateForm(p => ({ ...p, end_time: e.target.value }))} /></div>
                <div><Label className="text-xs">Location</Label><Input value={dateForm.location} onChange={e => setDateForm(p => ({ ...p, location: e.target.value }))} placeholder="Room/Hall" /></div>
              </div>
              <Button size="sm" disabled={!dateForm.exam_subject_id || !dateForm.exam_date || createDateSheet.isPending} onClick={() => {
                createDateSheet.mutate({
                  exam_subject_id: dateForm.exam_subject_id,
                  exam_date: dateForm.exam_date,
                  start_time: dateForm.start_time || undefined,
                  end_time: dateForm.end_time || undefined,
                  location: dateForm.location || undefined,
                }, { onSuccess: () => setDateForm({ exam_subject_id: "", exam_date: "", start_time: "", end_time: "", location: "" }) });
              }}><Plus className="h-3 w-3 mr-1" />Add Entry</Button>
            </CardContent>
          </Card>

          {loadingSheets ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : dateSheets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No date sheet entries</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Location</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {dateSheets.map((ds: any) => (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium">{(ds.exam_subjects as any)?.subjects?.name ?? "—"}</TableCell>
                    <TableCell>{ds.exam_date}</TableCell>
                    <TableCell className="text-sm">{ds.start_time ?? "—"} – {ds.end_time ?? "—"}</TableCell>
                    <TableCell>{ds.location ?? "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => deleteDateSheet.mutate(ds.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ExamManagement() {
  const { exams, loading, createExam, updateExamStatus, deleteExam } = useExams();
  const { sessions } = useAcademicSessions();
  const { classes } = useClasses();
  const { sections } = useSections();
  const { scales } = useGradingScales();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailExamId, setDetailExamId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", session_id: "", class_id: "", section_id: "", exam_type: "annual", term_number: "", start_date: "", end_date: "", grading_scale_id: "",
  });

  const filteredSections = sections.filter((s: any) => s.class_id === form.class_id);

  const handleCreate = () => {
    createExam.mutate({
      name: form.name,
      session_id: form.session_id,
      class_id: form.class_id,
      section_id: form.section_id || undefined,
      exam_type: form.exam_type,
      term_number: form.term_number ? Number(form.term_number) : undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      grading_scale_id: form.grading_scale_id || undefined,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ name: "", session_id: "", class_id: "", section_id: "", exam_type: "annual", term_number: "", start_date: "", end_date: "", grading_scale_id: "" });
      },
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Exam Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage examinations, assign subjects, and build date sheets</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Create Exam</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Examination</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Exam Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mid-Term Exam 2025" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Academic Session</Label>
                  <Select value={form.session_id} onValueChange={v => setForm(p => ({ ...p, session_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>{sessions.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Exam Type</Label>
                  <Select value={form.exam_type} onValueChange={v => setForm(p => ({ ...p, exam_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="term">Term</SelectItem>
                      <SelectItem value="semester">Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(form.exam_type === "term" || form.exam_type === "semester") && (
                <div><Label>Term / Semester Number</Label><Input type="number" value={form.term_number} onChange={e => setForm(p => ({ ...p, term_number: e.target.value }))} placeholder="e.g. 1" /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Class</Label>
                  <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v, section_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Section (optional)</Label>
                  <Select value={form.section_id} onValueChange={v => setForm(p => ({ ...p, section_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {filteredSections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
              </div>
              <div><Label>Grading Scale (optional)</Label>
                <Select value={form.grading_scale_id} onValueChange={v => setForm(p => ({ ...p, grading_scale_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {scales.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!form.name || !form.session_id || !form.class_id || createExam.isPending} className="w-full">
                {createExam.isPending ? "Creating..." : "Create Exam"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exam detail dialog */}
      <Dialog open={!!detailExamId} onOpenChange={() => setDetailExamId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Exam Configuration</DialogTitle></DialogHeader>
          {detailExamId && <ExamDetail examId={detailExamId} onClose={() => setDetailExamId(null)} />}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : exams.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">No exams created yet</p>
            <p className="text-xs mt-1">Create your first exam to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam: any) => (
            <Card key={exam.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailExamId(exam.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold">{exam.name}</h3>
                      <Badge className={statusColors[exam.status] ?? ""} variant="outline">{exam.status}</Badge>
                      <Badge variant="outline" className="capitalize">{exam.exam_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(exam.academic_sessions as any)?.name} · {(exam.classes as any)?.name}
                      {(exam.sections as any)?.name ? ` · ${(exam.sections as any).name}` : ""}
                      {exam.start_date ? ` · ${exam.start_date}` : ""}
                      {exam.end_date ? ` → ${exam.end_date}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Select value={exam.status} onValueChange={v => updateExamStatus.mutate({ id: exam.id, status: v })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => deleteExam.mutate(exam.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
