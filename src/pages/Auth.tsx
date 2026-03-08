import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

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

  // Handle role card click: navigate if logged in, else prompt sign-in
  const handleRoleClick = async (roleKey: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({ title: "Sign in first", description: "Enter your credentials above and click Sign In." });
      return;
    }

    const userId = session.user.id;

    if (roleKey === "superadmin") {
      navigate("/admin");
      return;
    }

    // For institution roles, find their membership
    const { data: memberships } = await supabase
      .from("institution_members")
      .select("role, institutions!institution_id(slug)")
      .eq("user_id", userId)
      .limit(1);

    if (!memberships?.length) {
      toast({ title: "No institution found", description: "You are not a member of any institution.", variant: "destructive" });
      return;
    }

    const m = memberships[0] as any;
    const slug = m.institutions?.slug;
    const role = m.role;

    if (!slug) return;

    if (roleKey === "admin") navigate(`/${slug}`);
    else if (roleKey === "teacher") navigate(`/${slug}/teacher`);
    else if (roleKey === "student") navigate(`/${slug}/student`);
    else if (roleKey === "parent") navigate(`/${slug}/parent`);
    else navigate(`/${slug}`);
  };

  // After login: detect role and redirect accordingly
  const handlePostLogin = async (userId: string) => {
    // Check if platform admin
    const { data: platformRole } = await supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (platformRole?.role === "platform_admin") {
      navigate("/admin");
      return;
    }

    // Check institution membership
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
        else navigate(`/${slug}`); // admin / staff
        return;
      }
    }

    // Fallback: go to admin (they'll see "no institution" message)
    navigate("/admin");
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
        toast({ title: "Email sent!", description: "Check your inbox for the password reset link." });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="feature-icon">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">EduCloud Platform</h1>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display">
              {forgotMode ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {forgotMode
                ? "Enter your email to receive a reset link"
                : isLogin
                ? "Sign in to access your portal"
                : "Register to get started with the platform"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !forgotMode && (
                <div className="space-y-2">
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

              <div className="space-y-2">
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
                  />
                </div>
              </div>

              {!forgotMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-primary hover:underline"
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : forgotMode
                  ? "Send Reset Link"
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              {forgotMode ? (
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role access cards */}
        <div className="space-y-2">
          <p className="text-center text-xs text-muted-foreground">Sign in as</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                role: "Super Admin",
                hint: "Platform control",
                icon: "🛡️",
                description: "Full platform access. Manage all institutions, revenue & subscription plans. After login → redirected to /admin.",
                color: "hover:border-destructive/50 hover:bg-destructive/5",
              },
              {
                role: "Institution Admin",
                hint: "Manage school",
                icon: "🏫",
                description: "Manage your school: students, teachers, exams, fees, LMS & more. After login → redirected to your school dashboard.",
                color: "hover:border-primary/50 hover:bg-primary/5",
              },
              {
                role: "Teacher",
                hint: "Courses & attendance",
                icon: "📚",
                description: "Access your teaching portal: courses, assignments, quizzes, attendance marking & student marks.",
                color: "hover:border-chart-2/50 hover:bg-chart-2/5",
              },
              {
                role: "Student",
                hint: "Learning portal",
                icon: "🎓",
                description: "Access your learning portal: courses, quizzes, results, attendance records & certificates.",
                color: "hover:border-chart-3/50 hover:bg-chart-3/5",
              },
              {
                role: "Parent",
                hint: "Child progress",
                icon: "👨‍👩‍👧",
                description: "Monitor your child's attendance, exam results, course enrollments & school announcements.",
                color: "hover:border-chart-4/50 hover:bg-chart-4/5",
              },
            ].map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setForgotMode(false);
                  toast({
                    title: `${r.icon} ${r.role}`,
                    description: r.description,
                  });
                }}
                className={`p-3 rounded-xl border border-border/50 bg-card text-left transition-all cursor-pointer ${r.color}`}
              >
                <p className="text-lg">{r.icon}</p>
                <p className="text-xs font-semibold text-foreground mt-1">{r.role}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.hint}</p>
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            Tap a role to see what it can access, then sign in with your credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
