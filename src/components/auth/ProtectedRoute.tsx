import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePlatformAdmin?: boolean;
}

export default function ProtectedRoute({ children, requirePlatformAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isPlatformAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requirePlatformAdmin && !isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You don't have platform admin privileges.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
