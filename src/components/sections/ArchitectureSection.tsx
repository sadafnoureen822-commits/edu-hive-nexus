import { 
  Server, 
  Database, 
  Shield, 
  Globe,
  Cloud,
  Lock,
  Cpu,
  HardDrive
} from "lucide-react";

const ArchitectureSection = () => {
  const techStack = [
    { category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "Next.js"] },
    { category: "Backend", items: ["Node.js", "NestJS", "GraphQL", "REST APIs"] },
    { category: "Database", items: ["PostgreSQL", "Redis", "Elasticsearch", "S3"] },
    { category: "Infrastructure", items: ["Kubernetes", "Docker", "AWS/GCP", "Terraform"] },
  ];

  return (
    <section id="architecture" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Cpu className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">System Architecture</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Built for{" "}
            <span className="gradient-text">Enterprise Scale</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Modern cloud-native architecture designed for security, scalability, and reliability.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            {/* Layers */}
            <div className="space-y-6">
              {/* Client Layer */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">Client Layer</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Super Admin Portal", "Institution Admin", "Teacher Portal", "Student App"].map((item, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                      <span className="text-sm font-medium text-blue-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-px h-8 bg-gradient-to-b from-blue-300 to-emerald-300" />
              </div>

              {/* API Layer */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">API Gateway & Services</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["API Gateway", "Auth Service", "Tenant Service", "Notification Service"].map((item, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                      <span className="text-sm font-medium text-emerald-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-px h-8 bg-gradient-to-b from-emerald-300 to-purple-300" />
              </div>

              {/* Business Layer */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">Microservices</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["User Service", "Academic Service", "LMS Service", "Exam Service", "Certificate Service", "CMS Service", "Billing Service", "Analytics Service"].map((item, i) => (
                    <div key={i} className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                      <span className="text-sm font-medium text-purple-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-px h-8 bg-gradient-to-b from-purple-300 to-orange-300" />
              </div>

              {/* Data Layer */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">Data Layer</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["PostgreSQL (Tenants)", "Redis Cache", "Elasticsearch", "File Storage (S3)"].map((item, i) => (
                    <div key={i} className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                      <span className="text-sm font-medium text-orange-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack & Security */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Tech Stack */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="feature-icon !w-10 !h-10">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-xl">Technology Stack</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {techStack.map((stack, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">{stack.category}</h4>
                  <ul className="space-y-1">
                    {stack.items.map((item, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="accent-icon !w-10 !h-10">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-xl">Security & Compliance</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: "Data Isolation", desc: "Row-level security with tenant context" },
                { title: "Encryption", desc: "AES-256 at rest, TLS 1.3 in transit" },
                { title: "Authentication", desc: "OAuth 2.0, SAML, MFA support" },
                { title: "Compliance", desc: "ISO 27001, SOC 2 Type II, GDPR" },
                { title: "Audit Logging", desc: "Complete audit trail for all operations" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
