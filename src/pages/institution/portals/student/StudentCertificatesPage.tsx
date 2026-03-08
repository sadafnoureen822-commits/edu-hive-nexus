import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIssuedCertificates, useCertificateTemplates } from "@/hooks/lms/use-certificates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Download, QrCode, Shield, Calendar, Hash, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";

export default function StudentCertificatesPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const instId = institution?.id ?? "";

  const { data: allCerts = [], isLoading } = useIssuedCertificates(instId);
  const { data: templates = [] } = useCertificateTemplates(instId);
  const myCerts = allCerts.filter((c) => c.student_id === user?.id && !c.is_revoked);

  const [viewing, setViewing] = useState<typeof myCerts[0] | null>(null);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Certificates</h1>
        <p className="text-sm text-muted-foreground">{myCerts.length} certificate{myCerts.length !== 1 ? "s" : ""} issued</p>
      </div>

      {myCerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Award className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No certificates issued yet</p>
            <p className="text-xs text-muted-foreground">Certificates will appear here once issued by your institution</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCerts.map((cert) => {
            const data = cert.certificate_data as Record<string, any>;
            const template = templates.find((t) => t.id === cert.template_id);
            return (
              <Card key={cert.id} className="hover:shadow-md transition-shadow border-border/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-500/10 p-2.5 rounded-xl flex-shrink-0">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{template?.name || "Certificate"}</h3>
                      {data?.course && <p className="text-xs text-muted-foreground">{data.course}</p>}
                    </div>
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1"><Hash className="h-3 w-3" /> <span className="font-mono">{cert.serial_number}</span></p>
                    <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Issued: {format(new Date(cert.issued_at), "dd MMM yyyy")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 flex-1 h-8 text-xs" onClick={() => setViewing(cert)}>
                      <QrCode className="h-3.5 w-3.5" /> View & Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && (
        <CertificateViewer
          cert={viewing}
          template={templates.find((t) => t.id === viewing.template_id)}
          institutionName={institution?.name ?? ""}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function CertificateViewer({ cert, template, institutionName, onClose }: {
  cert: any;
  template: any;
  institutionName: string;
  onClose: () => void;
}) {
  const data = cert.certificate_data as Record<string, any>;
  const [qrUrl, setQrUrl] = useState("");
  const verificationUrl = `${window.location.origin}/verify?serial=${cert.serial_number}`;

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, { width: 200, margin: 1 }).then(setQrUrl);
  }, [verificationUrl]);

  const printCertificate = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>${template?.name || "Certificate"}</title>
      <style>
        body { font-family: Georgia, serif; padding: 60px; text-align: center; background: #fff; }
        .border { border: 8px double #b8860b; padding: 40px; }
        h1 { color: #1a1a2e; font-size: 36px; margin-bottom: 10px; }
        h2 { color: #b8860b; font-size: 28px; margin: 20px 0; }
        p { font-size: 18px; color: #333; line-height: 1.8; }
        .serial { font-family: monospace; font-size: 12px; color: #666; margin-top: 30px; }
        .institution { font-size: 22px; color: #1a1a2e; font-weight: bold; }
        img.qr { width: 80px; height: 80px; margin-top: 20px; }
        @media print { body { padding: 30px; } }
      </style>
      </head><body>
      <div class="border">
        <p style="font-size:14px; color:#666; letter-spacing:3px; text-transform:uppercase;">Certificate of Achievement</p>
        <h1>${template?.name || "Certificate"}</h1>
        <p style="font-size:16px; color:#666;">This is to certify that</p>
        <h2>${data?.student_name || "Student"}</h2>
        <p>has successfully completed</p>
        <p style="font-weight:bold; font-size:22px; color:#1a1a2e;">${data?.course || ""}</p>
        <p class="institution">${institutionName}</p>
        <p style="font-size:14px; color:#666; margin-top:20px;">Issued on: ${new Date(cert.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p class="serial">Serial: ${cert.serial_number}</p>
        ${qrUrl ? `<img class="qr" src="${qrUrl}" alt="QR Code" />` : ""}
        <p style="font-size:11px; color:#999;">Verify at: ${verificationUrl}</p>
      </div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" /> {template?.name || "Certificate"}
          </DialogTitle>
        </DialogHeader>

        {/* Certificate preview */}
        <div className="border-4 border-double border-yellow-600/40 p-6 rounded-lg bg-gradient-to-br from-yellow-50/50 to-white text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Certificate of Achievement</p>
          <h2 className="text-2xl font-display font-bold text-foreground">{template?.name || "Certificate"}</h2>
          <p className="text-sm text-muted-foreground">This is to certify that</p>
          <p className="text-xl font-display font-bold text-primary">{data?.student_name || "Student"}</p>
          <p className="text-sm text-muted-foreground">has successfully completed</p>
          <p className="text-lg font-semibold">{data?.course || ""}</p>
          <p className="font-semibold text-sm">{institutionName}</p>
          <p className="text-xs text-muted-foreground">Issued: {format(new Date(cert.issued_at), "MMMM d, yyyy")}</p>
          <p className="font-mono text-xs text-muted-foreground">{cert.serial_number}</p>

          {qrUrl && (
            <div className="flex justify-center pt-2">
              <img src={qrUrl} alt="QR Code" className="w-20 h-20" />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">Scan to verify</p>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 gap-1.5" onClick={printCertificate}>
            <Download className="h-4 w-4" /> Print / Download
          </Button>
          <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full gap-1.5">
              <ExternalLink className="h-4 w-4" /> Verify Online
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
