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
  // Prevent duplicate platform_roles queries when both getSession + onAuthStateChange fire
  const adminChecked = useRef<string | null>(null);

  const checkPlatformAdmin = async (userId: string) => {
    if (adminChecked.current === userId) return;
    adminChecked.current = userId;
    const { data } = await supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setIsPlatformAdmin(data?.role === "platform_admin");
  };

  useEffect(() => {
    // Set up listener FIRST before getSession to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkPlatformAdmin(session.user.id);
        } else {
          adminChecked.current = null;
          setIsPlatformAdmin(false);
        }
        setLoading(false);
      }
    );

    // Get initial session (onAuthStateChange will also fire for this, ref prevents double query)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    adminChecked.current = null;
    await supabase.auth.signOut();
    setIsPlatformAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isPlatformAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
