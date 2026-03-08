import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { institution, membership } = useTenant();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (user) {
      // Load profile from DB
      supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const { error: authErr } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    const { error: profileErr } = await supabase.from("profiles").upsert({ user_id: user!.id, full_name: fullName }, { onConflict: "user_id" });
    setSaving(false);
    if (authErr || profileErr) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated!");
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated!");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>

      {/* Avatar & basic info */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {(fullName || user?.email || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{fullName || user?.email}</p>
              <p className="text-sm text-muted-foreground">{membership?.role} · {institution?.name}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {user?.email}
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin for help.</p>
          </div>
          <Button onClick={saveProfile} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
          </div>
          <Button onClick={changePassword} disabled={changingPw || !newPassword} variant="outline" className="gap-1.5">
            {changingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
