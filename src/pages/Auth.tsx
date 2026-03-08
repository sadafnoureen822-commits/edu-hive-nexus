import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, User, Eye, EyeOff, Shield, School, GraduationCap, Users, ArrowLeft, ChevronRight } from "lucide-react";

type PortalKey = "superadmin" | "admin" | "teacher" | "student" | "parent" | null;

const PORTAL_CARDS = [
  {
    key: "superadmin" as PortalKey,
    urlSlug: "super-admin",
    label: "Super Admin",
    sub: "Platform control",
    Icon: Shield,
    lightBg: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    key: "admin" as PortalKey,
    urlSlug: "admin",
    label: "Institution Admin",
    sub: "Manage school",
    Icon: School,
    lightBg: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    key: "teacher" as PortalKey,
    urlSlug: "teacher",
    label: "Teacher",
    sub: "Classroom portal",
    Icon: GraduationCap,
    lightBg: "bg-violet-50 border-violet-200",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
  },
  {
    key: "student" as PortalKey,
    urlSlug: "student",
    label: "Student",
    sub: "Learning portal",
    Icon: User,
    lightBg: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-100",
  },
  {
    key: "parent" as PortalKey,
    urlSlug: "parent",
    label: "Parent",
    sub: "Child progress",
    Icon: Users,
    lightBg: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
  },
];

export default function Auth() {
  const [selectedPortal, setSelectedPortal] = useState<PortalKey>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as any)?.from?.pathname || null;

  const activePortal = PORTAL_CARDS.find(p => p.key === selectedPortal);

  // Navigate to the correct portal based on actual DB role
  const navigateByRole = async (userId: string, hintRole?: PortalKey) => {
    // Check platform admin first
    const { data: platformData } = await supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (platformData?.role === "platform_admin") {
      navigate("/admin", { replace: true });
      return;
    }

    // Get institution membership
    const { data: memberships, error } = await supabase
      .from("institution_members")
      .select("role, institution_id")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error("Error fetching memberships:", error);
    }

    if (!memberships || memberships.length === 0) {
      // No membership — if they selected superadmin portal, go to /admin
      if (hintRole === "superadmin") {
        navigate("/admin", { replace: true });
        return;
      }
      toast({
        title: "No institution found",
        description: "You are not assigned to any institution yet.",
        variant: "destructive",
      });
      return;
    }

    const m = memberships[0];
    const institutionId = m.institution_id;
    const role = m.role;

    // Get the institution slug
    const { data: institution } = await supabase
      .from("institutions")
      .select("slug")
      .eq("id", institutionId)
      .maybeSingle();

    const slug = institution?.slug;
    if (!slug) {
      toast({ title: "Institution not found", variant: "destructive" });
      return;
    }

    if (role === "student") navigate(`/${slug}/student`, { replace: true });
    else if (role === "teacher") navigate(`/${slug}/teacher`, { replace: true });
    else if (role === "parent") navigate(`/${slug}/parent`, { replace: true });
    else navigate(`/${slug}`, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (forgotMode) {
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
      return;
    }

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data.user) {
        setLoading(false);
        toast({ title: "Welcome back!", description: "Redirecting to your portal..." });
        if (from && from !== "/auth") {
          navigate(from, { replace: true });
        } else {
          await navigateByRole(data.user.id, selectedPortal);
        }
      }
    } else {
      if (!fullName.trim()) {
        toast({ title: "Full name required", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
      }
      setLoading(false);
    }
  };

  // ── Portal selection screen ──────────────────────────────────────────────
  if (!selectedPortal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/40 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-center gap-3">
            <div className="feature-icon">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">EduCloud Platform</h1>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">Select Your Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your role to sign in to the right portal</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {PORTAL_CARDS.map(({ key, label, sub, Icon, lightBg, iconColor, iconBg }) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(`/${key}/login`)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${lightBg} text-left transition-all duration-150 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Login form (after portal selected) ──────────────────────────────────
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

        {/* Portal Badge */}
        {activePortal && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${activePortal.lightBg}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activePortal.iconBg}`}>
              <activePortal.Icon className={`h-5 w-5 ${activePortal.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Signing in as</p>
              <p className="text-sm font-bold text-foreground">{activePortal.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPortal(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Change
            </button>
          </div>
        )}

        {/* Login Card */}
        <Card className="border-border/60 shadow-lg bg-card">
          <CardHeader className="text-center pb-5 pt-6">
            <CardTitle className="text-2xl font-display font-bold">
              {forgotMode ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {forgotMode
                ? "Enter your email to receive a reset link"
                : isLogin
                ? "Sign in to access your portal"
                : "Register to get started with the platform"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !forgotMode && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

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
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
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
                      autoComplete={isLogin ? "current-password" : "new-password"}
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

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : forgotMode
                  ? "Send Reset Link"
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              {forgotMode ? (
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ← Back to sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
