/**
 * Role-specific login/signup page.
 * Mounted at /:portal/login (super-admin, admin, teacher, student, parent)
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
  GraduationCap, Users, ArrowLeft, AlertCircle, CheckCircle2, Info, ShieldCheck,
} from "lucide-react";

type PortalSlug = "super-admin" | "admin" | "teacher" | "student" | "parent" | "principal";
type Mode = "login" | "signup" | "forgot";

const PORTAL_META: Record<PortalSlug, {
  label: string; sub: string; Icon: React.ElementType;
  lightBg: string; iconColor: string; iconBg: string;
  dbRoles: string[];
  allowSignup: boolean;
  signupNote?: string;
}> = {
  "super-admin": {
    label: "Super Admin", sub: "Platform control",
    Icon: Shield,
    lightBg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", iconBg: "bg-blue-100",
    dbRoles: [],
    allowSignup: true,
    signupNote: "Your account will be granted full Super Admin privileges immediately after sign up.",
  },
  admin: {
    label: "Institution Admin", sub: "Manage school",
    Icon: School,
    lightBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600", iconBg: "bg-emerald-100",
    dbRoles: ["admin", "principal", "exam_controller"],
    allowSignup: true,
    signupNote: "After signing up, a Super Admin must assign you to an institution as Admin.",
  },
  teacher: {
    label: "Teacher", sub: "Classroom portal",
    Icon: GraduationCap,
    lightBg: "bg-violet-50 border-violet-200", iconColor: "text-violet-600", iconBg: "bg-violet-100",
    dbRoles: ["teacher"],
    allowSignup: true,
    signupNote: "After signing up, your Institution Admin must assign you as a Teacher.",
  },
  student: {
    label: "Student", sub: "Learning portal",
    Icon: User,
    lightBg: "bg-orange-50 border-orange-200", iconColor: "text-orange-500", iconBg: "bg-orange-100",
    dbRoles: ["student"],
    allowSignup: true,
    signupNote: "After signing up, your Institution Admin must enroll you as a Student.",
  },
  parent: {
    label: "Parent", sub: "Child progress",
    Icon: Users,
    lightBg: "bg-rose-50 border-rose-200", iconColor: "text-rose-500", iconBg: "bg-rose-100",
    dbRoles: ["parent"],
    allowSignup: true,
    signupNote: "After signing up, your Institution Admin must link your account to your child.",
  },
  principal: {
    label: "Principal", sub: "School oversight",
    Icon: ShieldCheck,
    lightBg: "bg-teal-50 border-teal-200", iconColor: "text-teal-600", iconBg: "bg-teal-100",
    dbRoles: ["principal"],
    allowSignup: true,
    signupNote: "After signing up, a Super Admin must assign you as Principal of an institution.",
  },
};

export default function PortalLogin() {
  const { portal } = useParams<{ portal: PortalSlug }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

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

  // ── Forgot password ──────────────────────────────────────────────────────
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
      setMode("login");
    }
    setLoading(false);
  };

  // ── Sign up ──────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Full name required", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      // User already exists — guide them to login instead
      if (error.message.toLowerCase().includes("already registered") || error.status === 422) {
        toast({
          title: "Account already exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
        switchMode("login");
      } else {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      }
    } else {
      setSignupDone(true);
    }
    setLoading(false);
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      const msg = authError?.message ?? "Unknown error";
      const isWrongPassword =
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credentials") ||
        msg.toLowerCase().includes("password");
      toast({
        title: "Login failed",
        description: isWrongPassword
          ? "Incorrect email or password. Please try again or use 'Forgot password?' to reset it."
          : msg,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    if (portal === "super-admin") {
      const { data: pr } = await supabase.from("platform_roles").select("role").eq("user_id", userId).maybeSingle();
      if (pr?.role !== "platform_admin") {
        await supabase.auth.signOut();
        toast({ title: "Access Denied", description: "Your account does not have Super Admin privileges.", variant: "destructive" });
        setLoading(false);
        return;
      }
      navigate("/admin", { replace: true });
      return;
    }

    const { data: memberships } = await supabase
      .from("institution_members")
      .select("role, institution_id")
      .eq("user_id", userId);

    if (!memberships?.length) {
      await supabase.auth.signOut();
      toast({
        title: "Not assigned to an institution",
        description: "Your account exists but you haven't been assigned to any institution yet. Please contact your administrator.",
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
        admin: "/admin/login", exam_controller: "/admin/login",
        principal: "/principal/login",
        teacher: "/teacher/login", student: "/student/login", parent: "/parent/login",
      };
      toast({
        title: "Wrong portal",
        description: `Your role is "${actualRole}". Redirecting you to the correct portal…`,
        variant: "destructive",
      });
      setTimeout(() => navigate(portalForRole[actualRole] || "/auth"), 1500);
      setLoading(false);
      return;
    }

    const { data: institution } = await supabase
      .from("institutions")
      .select("slug")
      .eq("id", match.institution_id)
      .maybeSingle();

    const slug = institution?.slug;
    if (!slug) {
      toast({ title: "Institution not found", description: "Could not locate your institution. Contact support.", variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);
    toast({ title: "Welcome!", description: "Redirecting to your portal…" });

    if (match.role === "student") navigate(`/${slug}/student`, { replace: true });
    else if (match.role === "teacher") navigate(`/${slug}/teacher`, { replace: true });
    else if (match.role === "parent") navigate(`/${slug}/parent`, { replace: true });
    else if (match.role === "principal") navigate(`/${slug}/principal`, { replace: true });
    else navigate(`/${slug}`, { replace: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "forgot") return handleForgot(e);
    if (mode === "signup") return handleSignup(e);
    return handleLogin(e);
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword(""); setFullName("");
    setShowPassword(false); setShowConfirm(false); setSignupDone(false);
  };

  const switchMode = (m: Mode) => { resetForm(); setMode(m); };

  // ── Signup success screen ────────────────────────────────────────────────
  if (signupDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/40 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5">
          <div className="flex items-center justify-center gap-2.5">
            <div className="feature-icon"><Building2 className="w-5 h-5" /></div>
            <h1 className="text-xl font-display font-bold text-foreground">EduCloud Platform</h1>
          </div>
          <Card className="border-border/60 shadow-lg bg-card text-center">
            <CardContent className="px-6 py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">Account Created!</h2>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.
                Please verify your email before signing in.
              </p>
              {meta.signupNote && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">{meta.signupNote}</p>
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={() => switchMode("login")}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const titles: Record<Mode, string> = {
    login: "Welcome Back",
    signup: `Create ${meta.label} Account`,
    forgot: "Reset Password",
  };
  const subs: Record<Mode, string> = {
    login: `Sign in to your ${meta.label} portal`,
    signup: `Register as ${meta.label}`,
    forgot: "Enter your email to receive a reset link",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="feature-icon"><Building2 className="w-5 h-5" /></div>
          <h1 className="text-xl font-display font-bold text-foreground">EduCloud Platform</h1>
        </div>

        {/* Portal badge */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${meta.lightBg}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
            <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              {mode === "signup" ? "Creating account as" : "Signing in as"}
            </p>
            <p className="text-sm font-bold text-foreground">{meta.label}</p>
          </div>
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Change
          </Link>
        </div>

        {/* Login / Signup tabs (only for portals that allow signup) */}
        {meta.allowSignup && mode !== "forgot" && (
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Card */}
        <Card className="border-border/60 shadow-lg bg-card">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-display font-bold">{titles[mode]}</CardTitle>
            <CardDescription className="text-sm mt-1">{subs[mode]}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name — signup only */}
              {mode === "signup" && (
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
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-primary hover:underline font-medium">
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
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
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

              {/* Confirm Password — signup only */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 ${confirmPassword && password !== confirmPassword ? "border-destructive" : ""}`}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "forgot"
                  ? "Send Reset Link"
                  : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
              </Button>
            </form>

            {/* Back to login from forgot */}
            {mode === "forgot" && (
              <div className="mt-4 text-center">
                <button type="button" onClick={() => switchMode("login")} className="text-sm text-primary hover:underline font-medium">
                  ← Back to sign in
                </button>
              </div>
            )}

            {/* Signup note for institution portals */}
            {mode === "signup" && meta.signupNote && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">{meta.signupNote}</p>
                </div>
              </div>
            )}

            {/* Role access info box */}
            {mode === "login" && (
              <div className="mt-5 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Only <span className="font-semibold text-foreground">{meta.label}</span> accounts can sign in here.
                    If your role doesn't match, you'll be redirected automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Super Admin: no signup allowed */}
            {!meta.allowSignup && mode === "login" && (
              <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Super Admin accounts are created directly by the platform team.
                    Contact support if you need access.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to portal selection
          </Link>
        </div>
      </div>
    </div>
  );
}
