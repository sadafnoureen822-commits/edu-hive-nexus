import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ApiKeysPage() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api_keys", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("api_keys")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!institutionId,
  });

  const createKey = useMutation({
    mutationFn: async (values: any) => {
      // Generate a random API key (in production, hash this server-side)
      const rawKey = `ems_${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      const prefix = rawKey.slice(0, 12);
      // Simple hash simulation (in production use bcrypt/sha256 in edge function)
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from("api_keys").insert({
        institution_id: institutionId,
        created_by: user?.id,
        name: values.name,
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: values.scopes ? [values.scopes] : ["read"],
        expires_at: values.expires_at || null,
        is_active: true,
      });
      if (error) throw error;
      return rawKey;
    },
    onSuccess: (rawKey) => {
      queryClient.invalidateQueries({ queryKey: ["api_keys"] });
      setNewKey(rawKey);
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_keys"] });
      toast.success("API key revoked");
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_keys"] });
      toast.success("API key deleted");
    },
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">API Keys</h1>
          <p className="text-muted-foreground text-sm">Manage API access keys for external integrations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Generate Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate API Key</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((v) => createKey.mutate(v))} className="space-y-4">
              <div className="space-y-1">
                <Label>Key Name *</Label>
                <Input {...register("name", { required: true })} placeholder="e.g. Mobile App Integration" />
              </div>
              <div className="space-y-1">
                <Label>Access Scopes</Label>
                <Select onValueChange={(v) => setValue("scopes", v)} defaultValue="read">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="write">Read & Write</SelectItem>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Expiry Date (optional)</Label>
                <Input type="date" {...register("expires_at")} />
              </div>
              <Button type="submit" className="w-full" disabled={createKey.isPending}>
                {createKey.isPending ? "Generating..." : "Generate API Key"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* New key dialog */}
      <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-yellow-500" />Save Your API Key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is the only time your full API key will be shown. Copy it now and store it securely.
            </p>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border font-mono text-sm break-all">
              <span className="flex-1">{newKey}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => copyKey(newKey!)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button className="w-full" onClick={() => setNewKey(null)}>I've copied it safely</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : keys?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Key className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No API keys yet</p>
          <p className="text-sm">Generate a key to integrate external services</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys?.map((k: any) => (
            <Card key={k.id} className={!k.is_active ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${k.is_active ? "bg-primary/10" : "bg-secondary"}`}>
                    <Key className={`h-5 w-5 ${k.is_active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{k.name}</p>
                      <Badge variant="outline" className={k.is_active
                        ? "text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
                        : "text-[10px] bg-secondary text-muted-foreground"}>
                        {k.is_active ? "Active" : "Revoked"}
                      </Badge>
                      {k.scopes?.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {k.key_prefix}...
                      {k.expires_at && ` · Expires ${format(new Date(k.expires_at), "MMM d, yyyy")}`}
                      {k.last_used_at && ` · Last used ${format(new Date(k.last_used_at), "MMM d")}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {k.is_active && (
                    <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700 text-xs" onClick={() => revokeKey.mutate(k.id)}>
                      Revoke
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteKey.mutate(k.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="flex gap-3 pt-4">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-700">Security Notice</p>
            <p className="text-yellow-600 text-xs mt-0.5">
              API keys grant programmatic access to your institution's data. Never share keys publicly or commit them to code repositories. Rotate keys regularly and revoke any that may be compromised.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
