import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Building2, Users, GraduationCap, ClipboardList,
  MessageSquare, CreditCard, Settings, LogOut, ChevronLeft, ChevronRight,
  Loader2, Shield, Globe, FileText, Menu, Image, Palette, BookOpen,
  PenSquare, HelpCircle, Award, CalendarCheck, UserCheck, Clock,
  DollarSign, Megaphone, Bell, Activity, TrendingUp, Key, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const adminNavSections = [
  {
    label: "Overview",
    items: [{ href: "", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { href: "/profile", label: "Institution Profile", icon: Building2 },
      { href: "/users", label: "User Management", icon: Users },
      { href: "/admissions", label: "Admissions", icon: ClipboardCheck },
      { href: "/student-profiles", label: "Student Profiles", icon: UserCheck },
      { href: "/promotions", label: "Promotions", icon: TrendingUp },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/academics", label: "Classes & Subjects", icon: GraduationCap },
      { href: "/timetable", label: "Timetable", icon: Clock },
      { href: "/exams", label: "Examinations", icon: ClipboardList },
      { href: "/marks", label: "Marks & Results", icon: TrendingUp },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/fees", label: "Fee Management", icon: DollarSign },
    ],
  },
  {
    label: "LMS",
    items: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/assignments", label: "Assignments", icon: PenSquare },
      { href: "/quizzes", label: "Quizzes", icon: HelpCircle },
      { href: "/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/communication", label: "Communication", icon: MessageSquare },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/cms", label: "Pages", icon: FileText },
      { href: "/cms/menus", label: "Menus", icon: Menu },
      { href: "/cms/media", label: "Media", icon: Image },
      { href: "/cms/settings", label: "Site Settings", icon: Palette },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/api-keys", label: "API Keys", icon: Key },
      { href: "/activity-logs", label: "Activity Logs", icon: Activity },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const teacherNavSections = [
  {
    label: "Overview",
    items: [{ href: "/teacher", label: "My Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Teaching",
    items: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/assignments", label: "Assignments", icon: PenSquare },
      { href: "/quizzes", label: "Quizzes", icon: HelpCircle },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/marks", label: "Marks & Results", icon: TrendingUp },
    ],
  },
];

const parentNavSections = [
  {
    label: "Overview",
    items: [{ href: "/parent", label: "My Children", icon: LayoutDashboard }],
  },
  {
    label: "Announcements",
    items: [
      { href: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
];

const studentNavSections = [
  {
    label: "Overview",
    items: [{ href: "/student", label: "My Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Learning",
    items: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/assignments", label: "Assignments", icon: PenSquare },
      { href: "/quizzes", label: "Quizzes", icon: HelpCircle },
      { href: "/certificates", label: "My Certificates", icon: Award },
      { href: "/attendance", label: "My Attendance", icon: CalendarCheck },
    ],
  },
  {
    label: "Info",
    items: [
      { href: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
];

// Admin-only paths that non-admin roles cannot access
const ADMIN_ONLY_PATHS = [
  "/users", "/admissions", "/student-profiles", "/promotions",
  "/academics", "/timetable", "/exams", "/marks", "/fees",
  "/communication", "/notifications", "/cms", "/billing",
  "/api-keys", "/activity-logs", "/settings", "/profile",
];

export default function InstitutionLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { institution, membership, loading, error } = useTenant();
  const { user, isPlatformAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const role = membership?.role ?? null;

  // Auto-redirect to the correct home page for the role
  useEffect(() => {
    if (!slug || loading || !membership) return;
    const basePath = `/${slug}`;
    const isExactBase = location.pathname === basePath || location.pathname === `${basePath}/`;

    if (isExactBase) {
      if (role === "student") navigate(`${basePath}/student`, { replace: true });
      else if (role === "teacher") navigate(`${basePath}/teacher`, { replace: true });
      else if (role === "parent") navigate(`${basePath}/parent`, { replace: true });
      // admin stays at basePath (dashboard)
    }
  }, [slug, loading, membership, role, location.pathname, navigate]);

  // Block non-admin roles from accessing admin-only paths
  useEffect(() => {
    if (!slug || loading || !membership || isPlatformAdmin) return;
    if (role === "admin" || role === "principal" || role === "exam_controller") return;

    const basePath = `/${slug}`;
    const relativePath = location.pathname.replace(basePath, "");
    const isRestricted = ADMIN_ONLY_PATHS.some((p) => relativePath.startsWith(p));
    if (isRestricted) {
      if (role === "student") navigate(`${basePath}/student`, { replace: true });
      else if (role === "teacher") navigate(`${basePath}/teacher`, { replace: true });
      else if (role === "parent") navigate(`${basePath}/parent`, { replace: true });
    }
  }, [location.pathname, slug, loading, membership, role, isPlatformAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-display font-bold text-foreground">Institution Not Found</h1>
          <p className="text-muted-foreground">{error || "This institution does not exist."}</p>
          <Link to="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-display font-bold">Sign in Required</h2>
          <p className="text-muted-foreground">You need to sign in to access this institution.</p>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </div>
      </div>
    );
  }

  // Allow platform admins even without explicit membership
  if (!membership && !isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Users className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-display font-bold">Access Restricted</h2>
          <p className="text-muted-foreground">You are not a member of this institution.</p>
          <Link to="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  const effectiveRole = membership?.role ?? "admin";
  const basePath = `/${slug}`;

  const navSections =
    effectiveRole === "student" ? studentNavSections
    : effectiveRole === "teacher" ? teacherNavSections
    : effectiveRole === "parent" ? parentNavSections
    : adminNavSections;

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === "") {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname.startsWith(fullPath);
  };

  const roleLabel = isPlatformAdmin && !membership ? "Platform Admin" : effectiveRole;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Institution Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="feature-icon !w-9 !h-9 flex-shrink-0">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-sm truncate">{institution.name}</h2>
                <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 capitalize">
                  {roleLabel}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={`${basePath}${item.href}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User & Collapse */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && (
            <div className="px-3 py-1.5">
              <p className="text-xs font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full gap-2 text-muted-foreground", collapsed ? "justify-center px-0" : "justify-start")}
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-[68px]" : "ml-64")}>
        <Outlet />
      </main>
    </div>
  );
}
