import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  CalendarRange, BookOpen, Layers, GraduationCap, Plus, Trash2, Loader2, Star,
} from "lucide-react";
import { useAcademicSessions } from "@/hooks/exam/use-academic-sessions";
import { useClasses } from "@/hooks/exam/use-classes";
import { useSections } from "@/hooks/exam/use-sections";
import { useSubjects } from "@/hooks/exam/use-subjects";
import { useGradingScales } from "@/hooks/exam/use-grading-scales";

const academicTabs = [
  { value: "years", label: "Academic Sessions", icon: CalendarRange },
  { value: "classes", label: "Classes / Grades", icon: BookOpen },
  { value: "sections", label: "Sections", icon: Layers },
  { value: "subjects", label: "Subjects", icon: GraduationCap },
  { value: "grading", label: "Grading Scales", icon: Star },
];

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1">{description}</p>
    </div>
  );
}

function SessionsTab() {
  const { sessions, loading, createSession, deleteSession } = useAcademicSessions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", academic_model: "annual", start_date: "", end_date: "", is_current: false });

  const handleSubmit = () => {
    createSession.mutate(form, { onSuccess: () => { setOpen(false); setForm({ name: "", academic_model: "annual", start_date: "", end_date: "", is_current: false }); } });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-display">Academic Sessions</CardTitle>
          <CardDescription>Define academic calendar periods and their model type</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Academic Session</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2025-2026" /></div>
              <div><Label>Academic Model</Label>
                <Select value={form.academic_model} onValueChange={v => setForm(p => ({ ...p, academic_model: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="term">Term</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_current} onCheckedChange={v => setForm(p => ({ ...p, is_current: v }))} />
                <Label>Current Session</Label>
              </div>
              <Button onClick={handleSubmit} disabled={!form.name || !form.start_date || !form.end_date || createSession.isPending} className="w-full">
                {createSession.isPending ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarRange} title="No academic sessions" description="Create your first academic session" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{s.academic_model}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.start_date} → {s.end_date}</TableCell>
                  <TableCell>{s.is_current && <Badge className="bg-primary/10 text-primary border-primary/20">Current</Badge>}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteSession.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ClassesTab() {
  const { classes, loading, createClass, deleteClass } = useClasses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", numeric_level: "", description: "" });

  const handleSubmit = () => {
    createClass.mutate({ name: form.name, numeric_level: form.numeric_level ? Number(form.numeric_level) : undefined, description: form.description || undefined }, { onSuccess: () => { setOpen(false); setForm({ name: "", numeric_level: "", description: "" }); } });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-display">Classes / Grades</CardTitle>
          <CardDescription>Manage classes offered by your institution</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Grade 10" /></div>
              <div><Label>Numeric Level</Label><Input type="number" value={form.numeric_level} onChange={e => setForm(p => ({ ...p, numeric_level: e.target.value }))} placeholder="e.g. 10" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <Button onClick={handleSubmit} disabled={!form.name || createClass.isPending} className="w-full">{createClass.isPending ? "Creating..." : "Create Class"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <EmptyState icon={BookOpen} title="No classes created" description="Add classes for your institution" />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>Description</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {classes.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.numeric_level ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description ?? "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteClass.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SectionsTab() {
  const { sections, loading, createSection, deleteSection } = useSections();
  const { classes } = useClasses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", class_id: "" });

  const handleSubmit = () => {
    createSection.mutate(form, { onSuccess: () => { setOpen(false); setForm({ name: "", class_id: "" }); } });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-display">Sections</CardTitle>
          <CardDescription>Create sections within each class</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Section</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Section</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Section Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Section A" /></div>
              <Button onClick={handleSubmit} disabled={!form.name || !form.class_id || createSection.isPending} className="w-full">{createSection.isPending ? "Creating..." : "Create Section"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <EmptyState icon={Layers} title="No sections created" description="Add sections after creating classes" />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Class</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {sections.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{(s.classes as any)?.name ?? "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteSection.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SubjectsTab() {
  const { subjects, loading, createSubject, deleteSubject } = useSubjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const handleSubmit = () => {
    createSubject.mutate({ name: form.name, code: form.code || undefined, description: form.description || undefined }, { onSuccess: () => { setOpen(false); setForm({ name: "", code: "", description: "" }); } });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-display">Subjects</CardTitle>
          <CardDescription>Manage subjects with codes and descriptions</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Subject</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mathematics" /></div>
              <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. MATH101" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <Button onClick={handleSubmit} disabled={!form.name || createSubject.isPending} className="w-full">{createSubject.isPending ? "Creating..." : "Create Subject"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No subjects added" description="Add subjects with codes" />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {subjects.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.code || "—"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.description ?? "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteSubject.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function GradingTab() {
  const { scales, loading, createScale, deleteScale } = useGradingScales();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", is_default: false });
  const [entries, setEntries] = useState([{ grade_letter: "", min_percentage: 0, max_percentage: 100, gpa_points: 0 }]);

  const addEntry = () => setEntries(p => [...p, { grade_letter: "", min_percentage: 0, max_percentage: 100, gpa_points: 0 }]);

  const handleSubmit = () => {
    createScale.mutate({ name: form.name, is_default: form.is_default, entries: entries.filter(e => e.grade_letter) }, {
      onSuccess: () => { setOpen(false); setForm({ name: "", is_default: false }); setEntries([{ grade_letter: "", min_percentage: 0, max_percentage: 100, gpa_points: 0 }]); },
    });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-display">Grading Scales</CardTitle>
          <CardDescription>Define grading policies with letter grades and GPA points</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Scale</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Grading Scale</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Scale Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Standard 10-Point Scale" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_default} onCheckedChange={v => setForm(p => ({ ...p, is_default: v }))} /><Label>Default Scale</Label></div>
              <div>
                <div className="flex items-center justify-between mb-2"><Label>Grade Entries</Label><Button type="button" variant="outline" size="sm" onClick={addEntry}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      <Input placeholder="Grade" value={entry.grade_letter} onChange={e => { const n = [...entries]; n[i].grade_letter = e.target.value; setEntries(n); }} />
                      <Input type="number" placeholder="Min %" value={entry.min_percentage} onChange={e => { const n = [...entries]; n[i].min_percentage = Number(e.target.value); setEntries(n); }} />
                      <Input type="number" placeholder="Max %" value={entry.max_percentage} onChange={e => { const n = [...entries]; n[i].max_percentage = Number(e.target.value); setEntries(n); }} />
                      <Input type="number" step="0.01" placeholder="GPA" value={entry.gpa_points} onChange={e => { const n = [...entries]; n[i].gpa_points = Number(e.target.value); setEntries(n); }} />
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={!form.name || createScale.isPending} className="w-full">{createScale.isPending ? "Creating..." : "Create Scale"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {scales.length === 0 ? (
          <EmptyState icon={Star} title="No grading scales" description="Create a grading scale to use in exams" />
        ) : (
          <div className="space-y-4">
            {scales.map((s: any) => (
              <Card key={s.id} className="border-border/30">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    {s.is_default && <Badge className="bg-primary/10 text-primary border-primary/20">Default</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteScale.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </CardHeader>
                {s.grading_scale_entries?.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {s.grading_scale_entries.sort((a: any, b: any) => b.max_percentage - a.max_percentage).map((e: any) => (
                        <Badge key={e.id} variant="outline" className="text-xs">{e.grade_letter}: {e.min_percentage}–{e.max_percentage}% (GPA {e.gpa_points})</Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AcademicControl() {
  const [activeTab, setActiveTab] = useState("years");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Academic Control</h1>
        <p className="text-muted-foreground mt-1">Manage academic sessions, classes, sections, subjects, and grading</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
          {academicTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="years" className="mt-4"><SessionsTab /></TabsContent>
        <TabsContent value="classes" className="mt-4"><ClassesTab /></TabsContent>
        <TabsContent value="sections" className="mt-4"><SectionsTab /></TabsContent>
        <TabsContent value="subjects" className="mt-4"><SubjectsTab /></TabsContent>
        <TabsContent value="grading" className="mt-4"><GradingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
