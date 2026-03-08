import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPlatformAdmin: boolean;
  isPlatformAdminLoading: boolean; // true until the DB role check resolves
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isPlatformAdmin: false,
  isPlatformAdminLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isPlatformAdminLoading, setIsPlatformAdminLoading] = useState(true);
  // Track which userId we've already checked to avoid duplicate DB hits
  const adminChecked = useRef<string | null>(null);

  const checkPlatformAdmin = (userId: string) => {
    // Skip if we already checked this user
    if (adminChecked.current === userId) return;
    adminChecked.current = userId;
    setIsPlatformAdminLoading(true);
    supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setIsPlatformAdmin(data?.role === "platform_admin");
        setIsPlatformAdminLoading(false);
      });
  };

  useEffect(() => {
    // 1. Restore session from storage immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkPlatformAdmin(session.user.id);
      } else {
        // No user — admin loading is done (not an admin)
        setIsPlatformAdminLoading(false);
      }
      setLoading(false);
    });

    // 2. Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkPlatformAdmin(session.user.id);
        } else {
          adminChecked.current = null;
          setIsPlatformAdmin(false);
          setIsPlatformAdminLoading(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    adminChecked.current = null;
    setIsPlatformAdmin(false);
    setIsPlatformAdminLoading(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isPlatformAdmin, isPlatformAdminLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
