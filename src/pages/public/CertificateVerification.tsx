import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Search,
  Award,
  Calendar,
  Hash,
  Building2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

interface VerificationResult {
  valid: boolean;
  certificate?: {
    id: string;
    serial_number: string;
    issued_at: string;
    is_revoked: boolean;
    certificate_data: Record<string, unknown>;
    template?: { name: string; template_type: string };
    institution?: { name: string; logo_url: string | null };
  };
  error?: string;
}

export default function CertificateVerification() {
  const [searchParams] = useSearchParams();
  const [serial, setSerial] = useState(searchParams.get("serial") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verify = async () => {
    if (!serial.trim()) return;
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase
      .from("issued_certificates")
      .select(`
        id, serial_number, issued_at, is_revoked, certificate_data,
        certificate_templates!template_id(name, template_type),
        institutions!institution_id(name, logo_url)
      `)
      .eq("serial_number", serial.trim().toUpperCase())
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      setResult({ valid: false, error: "Certificate not found. Please check the serial number." });
      return;
    }

    if (data.is_revoked) {
      setResult({ valid: false, error: "This certificate has been revoked by the issuing institution.", certificate: data as VerificationResult["certificate"] });
      return;
    }

    setResult({ valid: true, certificate: data as VerificationResult["certificate"] });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Certificate Verification</h1>
              <p className="text-xs text-muted-foreground">EduHive Nexus — Trusted Document Verification</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">Back to Platform</Button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold">Verify a Certificate</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Enter the serial number printed on the certificate or scan the QR code to instantly verify its authenticity.
          </p>
        </div>

        {/* Search */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. CERT-2025-000001"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  className="pl-9 font-mono uppercase"
                />
              </div>
              <Button onClick={verify} disabled={loading || !serial.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={`border-2 ${result.valid ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 text-xl font-display ${result.valid ? "text-accent" : "text-destructive"}`}>
                {result.valid ? (
                  <><ShieldCheck className="h-7 w-7" /> Certificate Verified</>
                ) : (
                  <><ShieldX className="h-7 w-7" /> Verification Failed</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.error && (
                <p className="text-sm text-muted-foreground">{result.error}</p>
              )}

              {result.certificate && (
                <div className="space-y-4">
                  {/* Institution */}
                  {result.certificate.institution && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50">
                      {result.certificate.institution.logo_url ? (
                        <img src={result.certificate.institution.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Issued by</p>
                        <p className="font-semibold">{result.certificate.institution.name}</p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Hash className="h-3 w-3" /> Serial Number</p>
                      <p className="font-mono font-bold text-sm">{result.certificate.serial_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Issue Date</p>
                      <p className="font-medium text-sm">{format(new Date(result.certificate.issued_at), "MMMM d, yyyy")}</p>
                    </div>
                    {result.certificate.template && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Award className="h-3 w-3" /> Certificate Type</p>
                        <p className="font-medium text-sm capitalize">{result.certificate.template.template_type}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      {result.certificate.is_revoked ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : (
                        <Badge className="bg-accent/10 text-accent border-accent/20" variant="outline">Valid & Active</Badge>
                      )}
                    </div>
                  </div>

                  {/* Certificate data fields */}
                  {result.certificate.certificate_data && Object.keys(result.certificate.certificate_data).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Certificate Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(result.certificate.certificate_data).map(([key, value]) => (
                            <div key={key} className="p-3 rounded-lg bg-background border border-border/50">
                              <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                              <p className="text-sm font-medium">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        {!result && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Hash, title: "Enter Serial Number", desc: "Find the serial number on the certificate document" },
              { icon: Search, title: "Instant Verification", desc: "Our system checks against the secure database" },
              { icon: ShieldCheck, title: "Get Results", desc: "See full certificate details and validity status" },
            ].map((step) => (
              <div key={step.title} className="p-4 rounded-xl border border-border/50 bg-card text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        EduHive Nexus © {new Date().getFullYear()} — Secure Certificate Verification System
      </footer>
    </div>
  );
}
