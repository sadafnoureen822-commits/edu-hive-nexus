import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  History,
  Users,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useSendEmail, useEmailLogs } from "@/hooks/use-email";
import { useSendWhatsApp, useWhatsAppLogs } from "@/hooks/use-whatsapp";
import { format } from "date-fns";

const emailSchema = z.object({
  recipient_email: z.string().trim().email("Invalid email address").max(255),
  recipient_name: z.string().trim().max(100).optional(),
  subject: z.string().trim().min(1, "Subject is required").max(500),
  body: z.string().trim().min(1, "Message is required").max(10000),
  audience: z.string().optional(),
});

const whatsappSchema = z.object({
  recipient_phone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(20)
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number"),
  recipient_name: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, "Message is required").max(4096),
  audience: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type WhatsAppFormValues = z.infer<typeof whatsappSchema>;

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode }> = {
    sent: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    delivered: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
    pending: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Clock className="h-3 w-3" /> },
  };
  const v = variants[status] ?? variants.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${v.color}`}>
      {v.icon}
      {status}
    </span>
  );
}

export default function CommunicationCenter() {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [historyFilter, setHistoryFilter] = useState<"all" | "email" | "whatsapp">("all");

  const { institution } = useTenant();
  const institutionId = institution?.id ?? "";

  const sendEmail = useSendEmail(institutionId);
  const sendWhatsApp = useSendWhatsApp(institutionId);
  const { data: emailLogs = [], isLoading: emailLoading } = useEmailLogs(institutionId || undefined);
  const { data: waLogs = [], isLoading: waLoading } = useWhatsAppLogs(institutionId || undefined);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { recipient_email: "", recipient_name: "", subject: "", body: "", audience: "individual" },
  });

  const waForm = useForm<WhatsAppFormValues>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: { recipient_phone: "", recipient_name: "", message: "", audience: "individual" },
  });

  const onSendEmail = async (values: EmailFormValues) => {
    await sendEmail.mutateAsync({
      recipient_email: values.recipient_email,
      recipient_name: values.recipient_name,
      subject: values.subject,
      body: values.body,
      audience: values.audience,
    });
    emailForm.reset();
  };

  const onSendWhatsApp = async (values: WhatsAppFormValues) => {
    await sendWhatsApp.mutateAsync({
      recipient_phone: values.recipient_phone,
      recipient_name: values.recipient_name,
      message: values.message,
      audience: values.audience,
    });
    waForm.reset();
  };

  const combinedHistory = useMemo(() => {
    const emails = emailLogs.map((l) => ({ ...l, _type: "email" as const, _date: l.sent_at, _to: l.recipient_email, _content: l.subject }));
    const wa = waLogs.map((l) => ({ ...l, _type: "whatsapp" as const, _date: l.created_at, _to: l.recipient_phone, _content: l.message }));
    const all = [...emails, ...wa].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
    if (historyFilter === "all") return all;
    return all.filter((i) => i._type === historyFilter);
  }, [emailLogs, waLogs, historyFilter]);

  const emailSent = emailLogs.filter((l) => l.status === "sent" || l.status === "delivered").length;
  const waSent = waLogs.filter((l) => l.status === "sent" || l.status === "delivered").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Communication Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Send emails and WhatsApp messages to your institution members
        </p>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Email Sent", icon: Mail, color: "text-primary", bg: "bg-primary/10", count: emailSent },
          { label: "WhatsApp Sent", icon: MessageCircle, color: "text-accent", bg: "bg-accent/10", count: waSent },
          { label: "Total Messages", icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", count: emailSent + waSent },
        ].map((ch) => (
          <Card key={ch.label} className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`${ch.bg} p-2.5 rounded-xl`}>
                  <ch.icon className={`h-5 w-5 ${ch.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{ch.label}</p>
                  <p className="text-2xl font-display font-bold">{ch.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="compose">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="compose" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
            {combinedHistory.length > 0 && (
              <span className="ml-1 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0 font-medium">
                {combinedHistory.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── COMPOSE TAB ── */}
        <TabsContent value="compose" className="mt-6 space-y-4">
          {/* Channel selector */}
          <div className="flex gap-2">
            <Button
              variant={channel === "email" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setChannel("email")}
            >
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button
              variant={channel === "whatsapp" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setChannel("whatsapp")}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>

          {/* Email Form */}
          {channel === "email" && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Compose Email
                </CardTitle>
                <CardDescription>Send an email to a recipient. Requires Resend API key.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="recipient_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Email *</FormLabel>
                            <FormControl>
                              <Input placeholder="student@school.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="recipient_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject *</FormLabel>
                            <FormControl>
                              <Input placeholder="Important announcement" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="audience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audience Tag</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="all_students">All Students</SelectItem>
                                <SelectItem value="all_teachers">All Teachers</SelectItem>
                                <SelectItem value="all_parents">All Parents</SelectItem>
                                <SelectItem value="all_staff">All Staff</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={emailForm.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your email message here..."
                              rows={7}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <span className="text-xs text-muted-foreground ml-auto">{field.value?.length ?? 0}/10000</span>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={sendEmail.isPending || !institutionId}
                        className="gap-2"
                      >
                        {sendEmail.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {sendEmail.isPending ? "Sending…" : "Send Email"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* WhatsApp Form */}
          {channel === "whatsapp" && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  Compose WhatsApp Message
                </CardTitle>
                <CardDescription>
                  Send a WhatsApp message via Meta Business API. Requires WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...waForm}>
                  <form onSubmit={waForm.handleSubmit(onSendWhatsApp)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={waForm.control}
                        name="recipient_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={waForm.control}
                        name="recipient_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={waForm.control}
                      name="audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audience Tag</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="all_students">All Students</SelectItem>
                              <SelectItem value="all_teachers">All Teachers</SelectItem>
                              <SelectItem value="all_parents">All Parents</SelectItem>
                              <SelectItem value="all_staff">All Staff</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={waForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your WhatsApp message here..."
                              rows={7}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <span className="text-xs text-muted-foreground ml-auto">{field.value?.length ?? 0}/4096</span>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={sendWhatsApp.isPending || !institutionId}
                        className="gap-2"
                      >
                        {sendWhatsApp.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {sendWhatsApp.isPending ? "Sending…" : "Send WhatsApp"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <History className="h-5 w-5 text-accent" />
                    Message History
                  </CardTitle>
                  <CardDescription>All sent messages and delivery status</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  {(["all", "email", "whatsapp"] as const).map((f) => (
                    <Button
                      key={f}
                      variant={historyFilter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHistoryFilter(f)}
                      className="capitalize text-xs h-7 px-3"
                    >
                      {f === "whatsapp" ? "WhatsApp" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(emailLoading || waLoading) && (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading history…</span>
                </div>
              )}
              {!emailLoading && !waLoading && combinedHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm font-medium">No messages sent yet</p>
                  <p className="text-xs mt-1">Compose your first message to see history here</p>
                </div>
              )}
              {!emailLoading && !waLoading && combinedHistory.length > 0 && (
                <div className="divide-y divide-border/50">
                  {combinedHistory.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${item._type === "email" ? "bg-primary/10" : "bg-accent/10"}`}>
                        {item._type === "email" ? (
                          <Mail className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5 text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{item._to}</span>
                          <StatusBadge status={item.status} />
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {format(new Date(item._date), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item._content}</p>
                        {item.status === "failed" && "error_message" in item && item.error_message && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            {item.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
