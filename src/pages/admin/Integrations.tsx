import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle, Mail, Smartphone, CheckCircle2, XCircle,
  AlertCircle, Loader2, Eye, EyeOff, Send, Zap, Settings,
  ExternalLink, Info,
} from "lucide-react";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type ConnectionStatus = "idle" | "testing" | "connected" | "error";

interface IntegrationState {
  status: ConnectionStatus;
  message: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ConnectionStatus }) {
  const cfg = {
    idle: { label: "Not Configured", color: "text-muted-foreground border-border bg-muted/50", icon: AlertCircle },
    testing: { label: "Testing…", color: "text-orange-600 border-orange-200 bg-orange-50", icon: Loader2 },
    connected: { label: "Connected", color: "text-green-600 border-green-200 bg-green-50", icon: CheckCircle2 },
    error: { label: "Error", color: "text-destructive border-destructive/30 bg-destructive/5", icon: XCircle },
  }[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
      <Icon className={`h-3 w-3 ${status === "testing" ? "animate-spin" : ""}`} />
      {cfg.label}
    </Badge>
  );
}

function SecretInput({ label, placeholder, value, onChange, hint }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-9 text-sm font-mono"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// WhatsApp Tab
// ──────────────────────────────────────────────────────────────
function WhatsAppTab() {
  const [token, setToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [state, setState] = useState<IntegrationState>({ status: "idle", message: "" });

  const handleTest = async () => {
    if (!token || !phoneId) { toast.error("Please enter both API Token and Phone Number ID"); return; }
    if (!testPhone) { toast.error("Enter a test phone number (e.g. +923001234567)"); return; }

    setState({ status: "testing", message: "Sending test message…" });
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: testPhone,
          message: "✅ WhatsApp integration test successful! Your EduCloud platform is now connected.",
          institution_id: "test",
          log_id: "test",
          _test_token: token,
          _test_phone_id: phoneId,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setState({ status: "connected", message: `Message sent (ID: ${data.message_id ?? "ok"})` });
        toast.success("WhatsApp test message sent successfully!");
      } else {
        setState({ status: "error", message: data?.error ?? "Unknown error" });
        toast.error(data?.error ?? "WhatsApp test failed");
      }
    } catch (err: any) {
      setState({ status: "error", message: String(err) });
      toast.error("WhatsApp test failed: " + String(err));
    }
  };

  return (
    <div className="space-y-5">
      <InfoBox>
        WhatsApp uses the <strong>Meta Cloud API (WhatsApp Business)</strong>. You need a Meta Business account,
        a verified phone number, and a permanent access token from the{" "}
        <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5">
          Meta Developer Portal <ExternalLink className="h-3 w-3" />
        </a>.
      </InfoBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SecretInput
          label="API Access Token"
          placeholder="EAAxxxxx…"
          value={token}
          onChange={setToken}
          hint="Permanent token from Meta Business Suite → System Users"
        />
        <SecretInput
          label="Phone Number ID"
          placeholder="1234567890123456"
          value={phoneId}
          onChange={setPhoneId}
          hint="Found under WhatsApp → API Setup in your Meta App"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-primary" /> Test Connection
        </h4>
        <div className="flex gap-2">
          <Input
            placeholder="+923001234567 (with country code)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="text-sm"
          />
          <Button onClick={handleTest} disabled={state.status === "testing"} className="gap-1.5 flex-shrink-0">
            {state.status === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Test
          </Button>
        </div>
        {state.message && (
          <p className={`text-xs ${state.status === "connected" ? "text-green-600" : "text-destructive"}`}>
            {state.message}
          </p>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Secrets (Cloud → Secrets)</h4>
        {[
          { key: "WHATSAPP_API_TOKEN", desc: "Your permanent Meta access token" },
          { key: "WHATSAPP_PHONE_NUMBER_ID", desc: "Your WhatsApp Business phone number ID" },
        ].map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3">
            <code className="text-xs bg-background border border-border px-2 py-0.5 rounded font-mono">{s.key}</code>
            <span className="text-xs text-muted-foreground text-right">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SMS Tab
// ──────────────────────────────────────────────────────────────
function SMSTab() {
  const [provider, setProvider] = useState<"twilio" | "vonage" | "custom">("twilio");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [state, setState] = useState<IntegrationState>({ status: "idle", message: "" });

  const handleTest = async () => {
    if (!accountSid || !authToken || !fromNumber) {
      toast.error("Please fill in all SMS gateway credentials");
      return;
    }
    if (!testPhone) { toast.error("Enter a test phone number"); return; }

    setState({ status: "testing", message: "Sending test SMS…" });

    try {
      // Twilio REST API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        From: fromNumber,
        To: testPhone,
        Body: "✅ SMS integration test successful! EduCloud platform connected.",
      });

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const result = await resp.json();
      if (resp.ok && result.sid) {
        setState({ status: "connected", message: `SMS sent (SID: ${result.sid})` });
        toast.success("SMS test sent successfully!");
      } else {
        const msg = result.message ?? "Unknown Twilio error";
        setState({ status: "error", message: msg });
        toast.error("SMS test failed: " + msg);
      }
    } catch (err: any) {
      setState({ status: "error", message: String(err) });
      toast.error("SMS test failed: " + String(err));
    }
  };

  return (
    <div className="space-y-5">
      <InfoBox>
        SMS is powered by <strong>Twilio</strong>. Create a free account at{" "}
        <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5">
          twilio.com <ExternalLink className="h-3 w-3" />
        </a>{" "}
        to get your Account SID, Auth Token, and a Twilio phone number.
      </InfoBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SecretInput
          label="Account SID"
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxx"
          value={accountSid}
          onChange={setAccountSid}
          hint="Found in your Twilio Console dashboard"
        />
        <SecretInput
          label="Auth Token"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
          value={authToken}
          onChange={setAuthToken}
          hint="Found next to Account SID in Twilio Console"
        />
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From Phone Number</Label>
          <Input
            placeholder="+14155552671"
            value={fromNumber}
            onChange={(e) => setFromNumber(e.target.value)}
            className="text-sm font-mono"
          />
          <p className="text-[10px] text-muted-foreground">Your Twilio phone number with country code</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-primary" /> Test Connection
        </h4>
        <div className="flex gap-2">
          <Input
            placeholder="+923001234567 (with country code)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="text-sm"
          />
          <Button onClick={handleTest} disabled={state.status === "testing"} className="gap-1.5 flex-shrink-0">
            {state.status === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Test
          </Button>
        </div>
        {state.message && (
          <p className={`text-xs ${state.status === "connected" ? "text-green-600" : "text-destructive"}`}>
            {state.message}
          </p>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Secrets (Cloud → Secrets)</h4>
        {[
          { key: "TWILIO_ACCOUNT_SID", desc: "Your Twilio Account SID" },
          { key: "TWILIO_AUTH_TOKEN", desc: "Your Twilio Auth Token" },
          { key: "TWILIO_FROM_NUMBER", desc: "Your Twilio phone number" },
        ].map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3">
            <code className="text-xs bg-background border border-border px-2 py-0.5 rounded font-mono">{s.key}</code>
            <span className="text-xs text-muted-foreground text-right">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Email Tab
// ──────────────────────────────────────────────────────────────
function EmailTab() {
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("EduCloud Nexus");
  const [testEmail, setTestEmail] = useState("");
  const [state, setState] = useState<IntegrationState>({ status: "idle", message: "" });

  const handleTest = async () => {
    if (!apiKey) { toast.error("Please enter your Resend API Key"); return; }
    if (!fromEmail) { toast.error("Please enter a From email address"); return; }
    if (!testEmail) { toast.error("Enter a test recipient email"); return; }

    setState({ status: "testing", message: "Sending test email…" });

    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: testEmail,
          subject: "✅ EduCloud Email Integration Test",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
              <h2 style="color:#1a56db;">Email Integration Test</h2>
              <p>This is a test email from your <strong>EduCloud Nexus</strong> platform.</p>
              <p>Your email server is configured correctly and ready to send notifications.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#888;font-size:12px;">Sent from EduCloud Platform Integrations</p>
            </div>`,
        }),
      });

      const result = await resp.json();
      if (resp.ok && result.id) {
        setState({ status: "connected", message: `Email sent (ID: ${result.id})` });
        toast.success("Test email sent successfully!");
      } else {
        const msg = result.message ?? result.name ?? "Unknown Resend error";
        setState({ status: "error", message: msg });
        toast.error("Email test failed: " + msg);
      }
    } catch (err: any) {
      setState({ status: "error", message: String(err) });
      toast.error("Email test failed");
    }
  };

  return (
    <div className="space-y-5">
      <InfoBox>
        Email is powered by <strong>Resend</strong>. Get a free API key at{" "}
        <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5">
          resend.com <ExternalLink className="h-3 w-3" />
        </a>.
        You can send from <code className="bg-muted px-1 rounded text-[11px]">onboarding@resend.dev</code> for testing,
        or a verified custom domain for production.
      </InfoBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SecretInput
          label="Resend API Key"
          placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
          value={apiKey}
          onChange={setApiKey}
          hint="From Resend Dashboard → API Keys"
        />
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From Name</Label>
          <Input
            placeholder="EduCloud Nexus"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Sender name shown in recipients' inbox</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From Email Address</Label>
          <Input
            placeholder="notifications@yourdomain.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            className="text-sm font-mono"
          />
          <p className="text-[10px] text-muted-foreground">Use onboarding@resend.dev for testing</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-primary" /> Test Connection
        </h4>
        <div className="flex gap-2">
          <Input
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="text-sm"
          />
          <Button onClick={handleTest} disabled={state.status === "testing"} className="gap-1.5 flex-shrink-0">
            {state.status === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Test
          </Button>
        </div>
        {state.message && (
          <p className={`text-xs ${state.status === "connected" ? "text-green-600" : "text-destructive"}`}>
            {state.message}
          </p>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Secrets (Cloud → Secrets)</h4>
        {[
          { key: "RESEND_API_KEY", desc: "Your Resend API Key" },
        ].map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3">
            <code className="text-xs bg-background border border-border px-2 py-0.5 rounded font-mono">{s.key}</code>
            <span className="text-xs text-muted-foreground text-right">{s.desc}</span>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground pt-1">
          Add secrets via Lovable Cloud → Project Settings → Secrets. They are then automatically
          available in all edge functions.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────
const integrations = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    description: "Send automated messages via WhatsApp Business API",
    provider: "Meta Cloud API",
  },
  {
    id: "sms",
    label: "SMS Gateway",
    icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description: "Send SMS notifications and alerts via Twilio",
    provider: "Twilio",
  },
  {
    id: "email",
    label: "Email Server",
    icon: Mail,
    color: "text-primary",
    bg: "bg-primary/10",
    description: "Send transactional emails via Resend",
    provider: "Resend",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Platform Integrations</h1>
        <p className="text-muted-foreground mt-1">Configure third-party communication services for the entire platform</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {integrations.map((int) => (
          <Card key={int.id} className="border-border/50">
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-3 rounded-xl ${int.bg} flex-shrink-0`}>
                <int.icon className={`h-5 w-5 ${int.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold">{int.label}</h3>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">{int.provider}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{int.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration tabs */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Configuration & Testing
          </CardTitle>
          <CardDescription>Enter credentials below to configure each service. Use the test button to verify connectivity.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="email" className="gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" /> Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-1.5 text-xs">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </TabsTrigger>
              <TabsTrigger value="sms" className="gap-1.5 text-xs">
                <Smartphone className="h-3.5 w-3.5" /> SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email"><EmailTab /></TabsContent>
            <TabsContent value="whatsapp"><WhatsAppTab /></TabsContent>
            <TabsContent value="sms"><SMSTab /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
