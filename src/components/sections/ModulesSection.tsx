import { 
  Users, 
  Calendar, 
  BookOpen, 
  FileText, 
  Award, 
  Globe,
  CreditCard,
  Settings,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  {
    id: 1,
    icon: Users,
    title: "User Management",
    description: "Complete user lifecycle management with role-based access control",
    features: [
      "Student, Teacher, Admin, Custom Roles",
      "Fine-grained permissions matrix",
      "Bulk import/export users",
      "SSO & LDAP integration",
    ],
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    icon: Calendar,
    title: "Academic Management",
    description: "Comprehensive academic operations and scheduling",
    features: [
      "Classes & sections management",
      "Subject & program configuration",
      "Attendance tracking (biometric support)",
      "Academic calendar & timetables",
    ],
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: 3,
    icon: BookOpen,
    title: "Learning Management System",
    description: "Full-featured LMS for modern digital learning",
    features: [
      "Course builder with rich content",
      "Video lessons & live classes",
      "Assignments & quizzes",
      "Progress tracking & analytics",
    ],
    color: "from-purple-500 to-purple-600",
  },
  {
    id: 4,
    icon: FileText,
    title: "Exams & Grading",
    description: "End-to-end examination and evaluation system",
    features: [
      "Exam scheduling & hall management",
      "Online & offline exam support",
      "Automated grading & GPA/CGPA",
      "Result publication & transcripts",
    ],
    color: "from-orange-500 to-orange-600",
  },
  {
    id: 5,
    icon: Award,
    title: "Certificates & Documents",
    description: "Automated document generation with verification",
    features: [
      "Certificate templates builder",
      "QR-code based verification",
      "Transcript generation",
      "Digital signature support",
    ],
    color: "from-pink-500 to-pink-600",
  },
  {
    id: 6,
    icon: Globe,
    title: "Institution CMS",
    description: "White-label website builder for each institution",
    features: [
      "Drag-and-drop page builder",
      "Custom domain/subdomain",
      "News & announcements",
      "Brand customization",
    ],
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: 7,
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Flexible subscription and payment management",
    features: [
      "Multiple subscription tiers",
      "Automated invoicing",
      "Payment gateway integration",
      "Revenue analytics & reporting",
    ],
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: 8,
    icon: Settings,
    title: "Super Admin Console",
    description: "Centralized control for the entire platform",
    features: [
      "Tenant provisioning & management",
      "System-wide analytics",
      "Global configuration",
      "Audit logs & compliance",
    ],
    color: "from-slate-600 to-slate-700",
  },
];

const ModulesSection = () => {
  return (
    <section id="modules" className="py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Core Modules</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            8 Powerful Modules for{" "}
            <span className="gradient-text">Complete Education Management</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Each module is designed to work independently or together, giving institutions flexibility to adopt what they need.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className="group bg-white rounded-2xl border border-border/50 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-br ${module.color} text-white`}>
                <module.icon className="w-10 h-10 mb-3 opacity-90" />
                <h3 className="font-display font-bold text-lg">{module.title}</h3>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
                <ul className="space-y-2">
                  {module.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button variant="hero" size="lg">
            Explore All Modules
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
