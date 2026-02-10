import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Users, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
  const { institution, membership, loading, error } = useTenant();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Institution Not Found
          </h1>
          <p className="text-muted-foreground">{error || "This institution does not exist."}</p>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="feature-icon w-10 h-10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">{institution.name}</h1>
              <p className="text-xs text-muted-foreground">/{institution.slug}</p>
            </div>
          </div>
          {membership && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {membership.role}
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!user ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center space-y-4">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-display font-bold">Sign in Required</h2>
              <p className="text-muted-foreground">
                You need to sign in to access this institution's content.
              </p>
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        ) : !membership ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-display font-bold">Access Restricted</h2>
              <p className="text-muted-foreground">
                You are not a member of this institution. Contact an administrator to get access.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold">
                Welcome, {user.user_metadata?.full_name || user.email}
              </h2>
              <p className="text-muted-foreground">
                You're signed in as <span className="font-medium">{membership.role}</span> at{" "}
                {institution.name}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Your Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-display font-bold capitalize">{membership.role}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Institution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-display font-bold">{institution.name}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-lg px-3 py-1">
                    {institution.status}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
