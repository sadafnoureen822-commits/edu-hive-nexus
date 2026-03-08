/**
 * Role-specific login page.
 * Mounted at /super-admin/login, /admin/login, /teacher/login, /student/login, /parent/login
 * Enforces that the authenticated user's DB role matches the portal selected.
 */
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Mail, Lock, User, Eye, EyeOff, Shield, School,
  GraduationCap, Users, ArrowLeft, AlertCircle, CheckCircle2,
} from "lucide-react";

type PortalSlug = "super-admin" | "admin" | "teacher" | "student" | "parent";

const PORTAL_META: Record<PortalSlug, {
  label: string; sub: string; Icon: React.ElementType;
  lightBg: string; iconColor: string; iconBg: string;
  dbRoles: string[]; // allowed institution_members.role values (empty = platform admin only)
}> = {
  "super-admin": {
    label: "Super Admin", sub: "Platform control",
    Icon: Shield,
    lightBg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", iconBg: "bg-blue-100",
    dbRoles: [], // checked via platform_roles
  },
  admin: {
    label: "Institution Admin", sub: "Manage school",
    Icon: School,
    lightBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600", iconBg: "bg-emerald-100",
    dbRoles: ["admin", "principal", "exam_controller"],
  },
  teacher: {
    label: "Teacher", sub: "Classroom portal",
    Icon: GraduationCap,
    lightBg: "bg-violet-50 border-violet-200", iconColor: "text-violet-600", iconBg: "bg-violet-100",
    dbRoles: ["teacher"],
  },
  student: {
    label: "Student", sub: "Learning portal",
    Icon: User,
    lightBg: "bg-orange-50 border-orange-200", iconColor: "text-orange-500", iconBg: "bg-orange-100",
    dbRoles: ["student"],
  },
  parent: {
    label: "Parent", sub: "Child progress",
    Icon: Users,
    lightBg: "bg-rose-50 border-rose-200", iconColor: "text-rose-500", iconBg: "bg-rose-100",
    dbRoles: ["parent"],
  },
};

export default function PortalLogin() {
  const { portal } = useParams<{ portal: PortalSlug }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const meta = portal ? PORTAL_META[portal as PortalSlug] : null;

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-xl font-display font-bold">Invalid Portal</h1>
          <Link to="/auth"><Button variant="outline">← Back to Portal Selection</Button></Link>
        </div>
      </div>
    );
  }

  const { Icon } = meta;

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent!", description: "Check your inbox for the reset link." });
      setForgotMode(false);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotMode) { handleForgot(e); return; }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      toast({ title: "Login failed", description: authError?.message || "Unknown error", variant: "destructive" });
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // ── Role verification ──────────────────────────────────────────────────
    if (portal === "super-admin") {
      const { data: pr } = await supabase.from("platform_roles").select("role").eq("user_id", userId).maybeSingle();
      if (pr?.role !== "platform_admin") {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Your account does not have Super Admin privileges.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      navigate("/admin", { replace: true });
      return;
    }

    // For institution roles
    const { data: memberships } = await supabase
      .from("institution_members")
      .select("role, institution_id")
      .eq("user_id", userId);

    if (!memberships?.length) {
      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "You are not assigned to any institution.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const allowed = meta.dbRoles;
    const match = memberships.find((m) => allowed.includes(m.role));

    if (!match) {
      await supabase.auth.signOut();
      const actualRole = memberships[0].role;
      const portalForRole: Record<string, string> = {
        admin: "/admin/login", principal: "/admin/login",
        teacher: "/teacher/login", student: "/student/login", parent: "/parent/login",
      };
      toast({
        title: "Access Denied",
        description: `Your role is "${actualRole}". Please use the correct portal.`,
        variant: "destructive",
      });
      // Redirect to the correct portal after a short pause
      setTimeout(() => navigate(portalForRole[actualRole] || "/auth"), 1500);
      setLoading(false);
      return;
    }

    // Get institution slug
    const { data: institution } = await supabase
      .from("institutions")
      .select("slug")
      .eq("id", match.institution_id)
      .maybeSingle();

    const slug = institution?.slug;
    if (!slug) {
      toast({ title: "Institution not found", variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);
    toast({ title: "Welcome!", description: "Redirecting to your portal..." });

    if (match.role === "student") navigate(`/${slug}/student`, { replace: true });
    else if (match.role === "teacher") navigate(`/${slug}/teacher`, { replace: true });
    else if (match.role === "parent") navigate(`/${slug}/parent`, { replace: true });
    else navigate(`/${slug}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="feature-icon">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">EduCloud Platform</h1>
        </div>

        {/* Portal badge */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${meta.lightBg}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
            <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Signing in as</p>
            <p className="text-sm font-bold text-foreground">{meta.label}</p>
          </div>
          <Link
            to="/auth"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Change
          </Link>
        </div>

        {/* Card */}
        <Card className="border-border/60 shadow-lg bg-card">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-display font-bold">
              {forgotMode ? "Reset Password" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {forgotMode
                ? "Enter your email to receive a reset link"
                : `Sign in to your ${meta.label} portal`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {!forgotMode && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? "Please wait..." : forgotMode ? "Send Reset Link" : "Sign In"}
              </Button>
            </form>

            {forgotMode && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ← Back to sign in
                </button>
              </div>
            )}

            {/* Access denied info box */}
            <div className="mt-5 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Only <span className="font-semibold text-foreground">{meta.label}</span> accounts can sign in here.
                  If your role doesn't match, you'll be redirected to the correct portal automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="text-center">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to portal selection
          </Link>
        </div>
      </div>
    </div>
  );
}
