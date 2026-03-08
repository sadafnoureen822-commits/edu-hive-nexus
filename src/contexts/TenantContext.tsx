import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Institution = Tables<"institutions">;
type InstitutionMember = Tables<"institution_members">;

interface TenantContextType {
  institution: Institution | null;
  membership: InstitutionMember | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  institution: null,
  membership: null,
  loading: true,
  error: null,
});

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [membership, setMembership] = useState<InstitutionMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before fetching tenant
    if (authLoading) return;

    if (!slug) {
      setLoading(false);
      setError("No institution specified");
      return;
    }

    const fetchTenant = async () => {
      setLoading(true);
      setError(null);

      // Fetch institution by slug
      const { data: inst, error: instError } = await supabase
        .from("institutions")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (instError || !inst) {
        setError("Institution not found or inactive");
        setLoading(false);
        return;
      }

      setInstitution(inst);

      // If user is logged in, check their membership
      if (user) {
        const { data: member } = await supabase
          .from("institution_members")
          .select("*")
          .eq("institution_id", inst.id)
          .eq("user_id", user.id)
          .maybeSingle();

        setMembership(member);
      }

      setLoading(false);
    };

    fetchTenant();
  }, [slug, user, authLoading]);

  return (
    <TenantContext.Provider value={{ institution, membership, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}
