import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useCertificateTemplates, useCreateCertificateTemplate, useUpdateCertificateTemplate, useIssuedCertificates, useIssueCertificate, useRevokeCertificate } from "@/hooks/lms/use-certificates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Award, FileText, QrCode, Shield, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

export default function CertificatesPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id ?? "";

  const { data: templates = [], isLoading: tLoading } = useCertificateTemplates(institutionId);
  const { data: issued = [], isLoading: iLoading } = useIssuedCertificates(institutionId);
  const createTemplate = useCreateCertificateTemplate(institutionId);
  const updateTemplate = useUpdateCertificateTemplate(institutionId);
  const issueCert = useIssueCertificate(institutionId);
  const revokeCert = useRevokeCertificate(institutionId);

  const [tDialog, setTDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [issueDialog, setIssueDialog] = useState(false);

  const { register: rT, handleSubmit: hT, reset: resetT, setValue: svT, watch: wT } = useForm({
    defaultValues: { name: "", template_type: "certificate", template_html: "", background_url: "", logo_url: "" },
  });

  const { register: rI, handleSubmit: hI, reset: resetI, setValue: svI, watch: wI } = useForm({
    defaultValues: { template_id: "", student_id: "", student_name: "", course: "" },
  });

  const openCreateTemplate = () => { setEditingTemplate(null); resetT(); setTDialog(true); };
  const openEditTemplate = (t: typeof templates[0]) => {
    setEditingTemplate(t);
    resetT({ name: t.name, template_type: t.template_type, template_html: t.template_html ?? "", background_url: t.background_url ?? "", logo_url: t.logo_url ?? "" });
    setTDialog(true);
  };

  const onSubmitTemplate = async (values: { name: string; template_type: string; template_html: string; background_url: string; logo_url: string }) => {
    if (editingTemplate) await updateTemplate.mutateAsync({ id: editingTemplate.id, ...values as Parameters<typeof updateTemplate.mutateAsync>[0] });
    else await createTemplate.mutateAsync(values);
    setTDialog(false);
  };

  const generateSerial = (type: string) => {
    const prefix = type.slice(0, 4).toUpperCase();
    const year = new Date().getFullYear();
    const seq = String(issued.length + 1).padStart(6, "0");
    return `${prefix}-${year}-${seq}`;
  };

  const onIssue = async (values: { template_id: string; student_id: string; student_name: string; course: string }) => {
    const template = templates.find((t) => t.id === values.template_id);
    if (!template) return;
    const serial = generateSerial(template.template_type);
    await issueCert.mutateAsync({
      template_id: values.template_id,
      student_id: values.student_id,
      serial_number: serial,
      certificate_data: { student_name: values.student_name, course: values.course, institution: institution?.name, issued_date: new Date().toISOString() },
    });
    setIssueDialog(false);
    resetI();
  };

  const typeIcon = (t: string) => t === "certificate" ? <Award className="h-4 w-4" /> : t === "transcript" ? <FileText className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  const typeColor = (t: string) => t === "certificate" ? "text-yellow-600 bg-yellow-50 border-yellow-200" : t === "transcript" ? "text-blue-600 bg-blue-50 border-blue-200" : "text-purple-600 bg-purple-50 border-purple-200";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Certificates & Transcripts</h1>
          <p className="text-sm text-muted-foreground">Manage templates and issue academic documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIssueDialog(true)} className="gap-2" disabled={templates.length === 0}><Award className="h-4 w-4" /> Issue Certificate</Button>
          <Button onClick={openCreateTemplate} className="gap-2"><Plus className="h-4 w-4" /> New Template</Button>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="issued">Issued ({issued.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {tLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-40" />)}</div>
          ) : templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Award className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No templates yet</p>
                <Button size="sm" onClick={openCreateTemplate} variant="outline">Create first template</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <Card key={t.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg border ${typeColor(t.template_type)}`}>{typeIcon(t.template_type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{t.name}</p>
                        <Badge variant="outline" className={`text-[10px] mt-0.5 ${typeColor(t.template_type)}`}>{t.template_type}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${t.is_active ? "text-green-600 border-green-200" : "text-muted-foreground"}`}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => openEditTemplate(t)}>
                      Edit Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="issued" className="mt-4">
          {iLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-16" />)}</div>
          ) : issued.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <QrCode className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No certificates issued yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {issued.map((c) => {
                const data = c.certificate_data as Record<string, string>;
                return (
                  <Card key={c.id} className={`transition-shadow ${c.is_revoked ? "opacity-60" : "hover:shadow-sm"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{data?.student_name || "—"}</p>
                            {c.is_revoked && <Badge variant="destructive" className="text-[10px]">Revoked</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.serial_number}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Issued: {format(new Date(c.issued_at), "dd MMM yyyy")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {!c.is_revoked && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => revokeCert.mutate(c.id)}>
                              <AlertCircle className="h-3 w-3 mr-1" /> Revoke
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
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={tDialog} onOpenChange={setTDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <form onSubmit={hT(onSubmitTemplate)} className="space-y-4">
            <div className="space-y-1.5"><Label>Template Name *</Label><Input {...rT("name", { required: true })} placeholder="e.g. Annual Completion Certificate" /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={wT("template_type")} onValueChange={(v) => svT("template_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="transcript">Transcript</SelectItem>
                  <SelectItem value="result_card">Result Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Background Image URL</Label><Input {...rT("background_url")} placeholder="https://..." /></div>
            <div className="space-y-1.5"><Label>Logo URL</Label><Input {...rT("logo_url")} placeholder="https://..." /></div>
            <div className="space-y-1.5"><Label>Template HTML (optional)</Label><Textarea {...rT("template_html")} rows={5} placeholder="Custom HTML template with {{student_name}}, {{course}}, etc." className="font-mono text-xs" /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setTDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>{editingTemplate ? "Save" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialog} onOpenChange={setIssueDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Certificate</DialogTitle></DialogHeader>
          <form onSubmit={hI(onIssue)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template *</Label>
              <Select value={wI("template_id")} onValueChange={(v) => svI("template_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Student ID (User ID) *</Label><Input {...rI("student_id", { required: true })} placeholder="Student's auth UUID" /></div>
            <div className="space-y-1.5"><Label>Student Name *</Label><Input {...rI("student_name", { required: true })} /></div>
            <div className="space-y-1.5"><Label>Course / Qualification *</Label><Input {...rI("course", { required: true })} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIssueDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={issueCert.isPending}>Issue Certificate</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
