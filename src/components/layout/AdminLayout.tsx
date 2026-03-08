import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Globe, Users, LayoutDashboard, LogOut,
  Shield, CreditCard, UserCog, ChevronLeft, ChevronRight,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/admin",              label: "Dashboard",         icon: LayoutDashboard },
    ],
  },
  {
    label: "Institutions",
    items: [
      { href: "/admin/institutions", label: "All Institutions",  icon: Building2 },
      { href: "/admin/domains",      label: "Domain Mapping",    icon: Globe },
      { href: "/admin/modules",      label: "Module Control",    icon: Settings2 },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/admin/members",         label: "All Members",     icon: Users },
      { href: "/admin/role-assignment", label: "Role Assignment", icon: UserCog },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/billing",      label: "Billing & Revenue", icon: CreditCard },
    ],
  },
];

export default function AdminLayout() {
  const { user, signOut, isPlatformAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const isActive = (href: string) =>
    href === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-sm truncate">EduCloud Admin</h2>
                {isPlatformAdmin && (
                  <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                    Super Admin
                  </Badge>
                )}
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
                      to={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
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

        {/* User & collapse */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-1.5 rounded-lg bg-secondary/50">
              <p className="text-xs font-medium truncate">{user.user_metadata?.full_name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full gap-2 text-muted-foreground hover:text-destructive", collapsed ? "justify-center px-0" : "justify-start")}
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

      {/* Main */}
      <main className={cn("flex-1 transition-all duration-300 min-h-screen", collapsed ? "ml-[68px]" : "ml-64")}>
        <Outlet />
      </main>
    </div>
  );
}
