import { 
  Building2, 
  Users, 
  BookOpen, 
  ClipboardList, 
  Award, 
  Globe, 
  CreditCard, 
  Shield,
  Layers,
  Database,
  Lock,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Multi-Tenant Architecture",
    description: "Each institution operates in complete isolation with its own data, configurations, and customizations.",
    accent: false,
  },
  {
    icon: Users,
    title: "User Management",
    description: "Comprehensive role-based access control for students, teachers, admins, and custom roles.",
    accent: false,
  },
  {
    icon: BookOpen,
    title: "Learning Management",
    description: "Full-featured LMS with courses, lessons, assignments, quizzes, and progress tracking.",
    accent: true,
  },
  {
    icon: ClipboardList,
    title: "Academic Management",
    description: "Classes, programs, subjects, attendance, and academic calendar management.",
    accent: false,
  },
  {
    icon: Award,
    title: "Exams & Grading",
    description: "Comprehensive examination system with GPA/CGPA calculations and result management.",
    accent: false,
  },
  {
    icon: Globe,
    title: "Institution Websites",
    description: "Built-in CMS for each institution with custom domains, branding, and content management.",
    accent: true,
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    description: "Flexible subscription plans, automated invoicing, and multiple payment gateway support.",
    accent: false,
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "ISO 27001 certified with SOC 2 compliance, encryption at rest, and audit logging.",
    accent: false,
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Powerful Features</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Run Education at Scale</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete ecosystem designed for multi-institution management with enterprise-grade features and flexibility.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={feature.accent ? "accent-icon mb-4" : "feature-icon mb-4"}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Architecture Highlight */}
        <div className="mt-20 glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Database className="w-4 h-4" />
                Architecture
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">
                True Multi-Tenant Design
              </h3>
              <p className="text-muted-foreground mb-6">
                Each institution gets complete data isolation with shared infrastructure benefits. 
                Scale to thousands of tenants without compromising performance or security.
              </p>
              <ul className="space-y-3">
                {[
                  "Tenant-level database isolation",
                  "Shared codebase, isolated data",
                  "Per-tenant configuration & branding",
                  "Cross-tenant analytics for super admin",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-secondary to-background rounded-2xl p-6 border border-border">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white mb-3">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="font-display font-bold">Super Admin</div>
                  <div className="text-xs text-muted-foreground">System Owner</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["School A", "College B", "University C"].map((inst, i) => (
                    <div key={i} className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm border border-border/50">
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                        i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}>
                        {inst.charAt(0)}
                      </div>
                      <div className="text-xs font-medium">{inst}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
