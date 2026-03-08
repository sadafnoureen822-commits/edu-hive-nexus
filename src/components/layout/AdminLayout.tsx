import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  Users,
  LayoutDashboard,
  LogOut,
  Shield,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/institutions", label: "Institutions", icon: Building2 },
  { href: "/admin/domains", label: "Domains", icon: Globe },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/billing", label: "Billing & Revenue", icon: CreditCard },
];

export default function AdminLayout() {
  const { user, signOut, isPlatformAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — fixed so it doesn't scroll with content */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card flex flex-col z-30">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="feature-icon w-8 h-8">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Platform Admin</h2>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          {isPlatformAdmin && (
            <span className="mt-2 inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Platform Admin
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-64 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
