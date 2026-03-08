import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPlatformAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isPlatformAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  // Track which userId we've already checked to avoid duplicate DB hits
  const adminChecked = useRef<string | null>(null);

  // Fire-and-forget — never await inside onAuthStateChange
  const checkPlatformAdmin = (userId: string) => {
    if (adminChecked.current === userId) return;
    adminChecked.current = userId;
    supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setIsPlatformAdmin(data?.role === "platform_admin");
      });
  };

  useEffect(() => {
    // 1. Restore session from storage immediately — sets loading=false right away
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkPlatformAdmin(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for subsequent sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // fire-and-forget — no await here
          checkPlatformAdmin(session.user.id);
        } else {
          adminChecked.current = null;
          setIsPlatformAdmin(false);
        }
        // Only clear loading if it's still true (prevents double-set)
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    adminChecked.current = null;
    setIsPlatformAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isPlatformAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
