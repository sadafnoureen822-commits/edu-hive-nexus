import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePlatformAdmin?: boolean;
}

export default function ProtectedRoute({ children, requirePlatformAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isPlatformAdmin, isPlatformAdminLoading } = useAuth();
  const location = useLocation();

  // Wait for auth session to load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated → go to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Platform admin check: wait for the DB role lookup to finish before deciding
  if (requirePlatformAdmin) {
    if (isPlatformAdminLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (!isPlatformAdmin) {
      // Authenticated but not a platform admin → bounce back to home
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
