import { useNavigate } from "react-router-dom";
import { Building2, Shield, School, GraduationCap, User, Users, ShieldCheck, ChevronRight, Star } from "lucide-react";

const PORTAL_CARDS = [
  {
    urlSlug: "super-admin",
    label: "Super Admin",
    sub: "Full platform control & billing",
    Icon: Shield,
    gradient: "from-blue-600 to-blue-700",
    bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    iconBg: "bg-blue-600",
    textColor: "text-blue-700",
    badge: "Platform",
  },
  {
    urlSlug: "admin",
    label: "Institution Admin",
    sub: "Manage your school's data",
    Icon: School,
    gradient: "from-emerald-600 to-emerald-700",
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    iconBg: "bg-emerald-600",
    textColor: "text-emerald-700",
    badge: "Admin",
  },
  {
    urlSlug: "principal",
    label: "Principal",
    sub: "School-wide oversight & approvals",
    Icon: ShieldCheck,
    gradient: "from-teal-600 to-teal-700",
    bg: "bg-teal-50 hover:bg-teal-100 border-teal-200",
    iconBg: "bg-teal-600",
    textColor: "text-teal-700",
    badge: "Leadership",
  },
  {
    urlSlug: "teacher",
    label: "Teacher",
    sub: "Classes, attendance & marks",
    Icon: GraduationCap,
    gradient: "from-violet-600 to-violet-700",
    bg: "bg-violet-50 hover:bg-violet-100 border-violet-200",
    iconBg: "bg-violet-600",
    textColor: "text-violet-700",
    badge: "Faculty",
  },
  {
    urlSlug: "student",
    label: "Student",
    sub: "Courses, results & certificates",
    Icon: User,
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    iconBg: "bg-orange-500",
    textColor: "text-orange-700",
    badge: "Student",
  },
  {
    urlSlug: "parent",
    label: "Parent",
    sub: "Monitor your child's progress",
    Icon: Users,
    gradient: "from-rose-500 to-rose-600",
    bg: "bg-rose-50 hover:bg-rose-100 border-rose-200",
    iconBg: "bg-rose-500",
    textColor: "text-rose-700",
    badge: "Guardian",
  },
];

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-secondary/30 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Building2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">EduCloud</h1>
          <p className="text-xs text-muted-foreground">Multi-Institution Education Platform</p>
        </div>
      </div>

      <div className="w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Select Your Portal</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Choose your role to access the right dashboard
          </p>
        </div>

        {/* Portal Grid */}
        <div className="space-y-2.5">
          {PORTAL_CARDS.map(({ urlSlug, label, sub, Icon, bg, iconBg, textColor, badge }) => (
            <button
              key={urlSlug}
              type="button"
              onClick={() => navigate(`/${urlSlug}/login`)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${bg} text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${textColor}`}>{label}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60 ${textColor} border border-current/20`}>
                    {badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <ChevronRight className={`h-4 w-4 ${textColor} opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            Secure role-based access · All portals are fully encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
