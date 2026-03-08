import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, Check, CheckCheck, Filter, Megaphone, AlertCircle, Info, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: any; className: string }> = {
  info:         { icon: Info, className: "text-blue-500 bg-blue-500/10" },
  success:      { icon: CheckCircle, className: "text-green-500 bg-green-500/10" },
  warning:      { icon: AlertCircle, className: "text-yellow-500 bg-yellow-500/10" },
  error:        { icon: AlertCircle, className: "text-red-500 bg-red-500/10" },
  announcement: { icon: Megaphone, className: "text-primary bg-primary/10" },
};

export default function NotificationCenter() {
  const { institution } = useTenant();
  const { user } = useAuth();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id, institutionId, showUnreadOnly, typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user!.id)
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (showUnreadOnly) q = q.eq("is_read", false);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user?.id && !!institutionId,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_id", user!.id)
        .eq("institution_id", institutionId!)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm">Stay updated on institution activities</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">{unreadCount} new</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0}>
          <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch checked={showUnreadOnly} onCheckedChange={setShowUnreadOnly} id="unread-toggle" />
          <label htmlFor="unread-toggle" className="text-sm cursor-pointer">Unread only</label>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{showUnreadOnly ? "No unread notifications" : "No notifications yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n: any) => {
            const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const Icon = tc.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  n.is_read ? "bg-card opacity-70" : "bg-card border-primary/20 shadow-sm"
                }`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${tc.className}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markRead.mutate(n.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{n.type}</Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{n.channel}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
