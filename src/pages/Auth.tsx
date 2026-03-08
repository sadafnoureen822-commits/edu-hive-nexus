import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, User, Eye, EyeOff, Shield, School, GraduationCap } from "lucide-react";

const ROLE_CARDS = [
  {
    key: "superadmin",
    label: "Super Admin",
    sub: "Platform control",
    Icon: Shield,
    accent: "hover:border-primary hover:bg-primary/5 hover:shadow-md",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    key: "admin",
    label: "Institution Admin",
    sub: "Manage school",
    Icon: School,
    accent: "hover:border-chart-2 hover:bg-chart-2/5 hover:shadow-md",
    iconColor: "text-chart-2",
    iconBg: "bg-chart-2/10",
  },
  {
    key: "role",
    label: "Teacher / Student",
    sub: "Role portal",
    Icon: GraduationCap,
    accent: "hover:border-chart-3 hover:bg-chart-3/5 hover:shadow-md",
    iconColor: "text-chart-3",
    iconBg: "bg-chart-3/10",
  },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Navigate to the correct portal after login based on role
  const handlePostLogin = async (userId: string) => {
    const { data: platformRole } = await supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (platformRole?.role === "platform_admin") {
      navigate("/admin");
      return;
    }

    const { data: memberships } = await supabase
      .from("institution_members")
      .select("institution_id, role, institutions!institution_id(slug)")
      .eq("user_id", userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      const m = memberships[0] as any;
      const slug = m.institutions?.slug;
      const role = m.role;
      if (slug) {
        if (role === "student") navigate(`/${slug}/student`);
        else if (role === "teacher") navigate(`/${slug}/teacher`);
        else if (role === "parent") navigate(`/${slug}/parent`);
        else navigate(`/${slug}`);
        return;
      }
    }

    navigate("/admin");
  };

  // Role card click: navigate if already signed in, else prompt
  const handleRoleClick = async (roleKey: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Sign in first",
        description: "Enter your email & password above, then click Sign In.",
      });
      return;
    }

    const userId = session.user.id;

    if (roleKey === "superadmin") {
      navigate("/admin");
      return;
    }

    const { data: memberships } = await supabase
      .from("institution_members")
      .select("role, institutions!institution_id(slug)")
      .eq("user_id", userId)
      .limit(1);

    if (!memberships?.length) {
      toast({
        title: "No institution found",
        description: "You are not a member of any institution.",
        variant: "destructive",
      });
      return;
    }

    const m = memberships[0] as any;
    const slug = m.institutions?.slug;
    const role = m.role;
    if (!slug) return;

    if (roleKey === "admin") navigate(`/${slug}`);
    else if (roleKey === "role") {
      // Navigate based on actual role
      if (role === "teacher") navigate(`/${slug}/teacher`);
      else if (role === "parent") navigate(`/${slug}/parent`);
      else navigate(`/${slug}/student`);
    }
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
      } else if (data.user) {
        toast({ title: "Welcome back!" });
        await handlePostLogin(data.user.id);
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
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="feature-icon">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">EduCloud Platform</h1>
        </div>

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

        {/* Role Portal Cards */}
        <div className="grid grid-cols-3 gap-3">
          {ROLE_CARDS.map(({ key, label, sub, Icon, accent, iconColor, iconBg }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleRoleClick(key)}
              className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 bg-card text-center transition-all duration-200 cursor-pointer ${accent}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} transition-colors`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground -mt-2">
          Sign in first · then tap your role to go to your portal
        </p>
      </div>
    </div>
  );
}
