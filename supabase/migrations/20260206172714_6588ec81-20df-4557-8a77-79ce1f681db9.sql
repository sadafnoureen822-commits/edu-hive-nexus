
-- =============================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- =============================================

-- 1. ENUMS
CREATE TYPE public.institution_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE public.domain_status AS ENUM ('active', 'inactive', 'pending_verification');
CREATE TYPE public.institution_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.platform_role AS ENUM ('platform_admin');

-- 2. BASE TABLES

-- Institutions (tenants)
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status public.institution_status NOT NULL DEFAULT 'active',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- Domain mappings
CREATE TABLE public.institution_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status public.domain_status NOT NULL DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Institution membership (links users to institutions with roles)
CREATE TABLE public.institution_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.institution_role NOT NULL DEFAULT 'student',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, user_id)
);

-- Platform-level roles (separate table per security requirements)
CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.platform_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX idx_institution_domains_institution ON public.institution_domains(institution_id);
CREATE INDEX idx_institution_domains_domain ON public.institution_domains(domain);
CREATE INDEX idx_institution_members_user ON public.institution_members(user_id);
CREATE INDEX idx_institution_members_institution ON public.institution_members(institution_id);
CREATE INDEX idx_institutions_slug ON public.institutions(slug);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);

-- 4. SECURITY DEFINER HELPER FUNCTIONS (avoid RLS recursion)

-- Check if user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  );
$$;

-- Check if user is a member of an institution
CREATE OR REPLACE FUNCTION public.is_institution_member(_user_id UUID, _institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE user_id = _user_id AND institution_id = _institution_id
  );
$$;

-- Check if user is an admin of an institution
CREATE OR REPLACE FUNCTION public.is_institution_admin(_user_id UUID, _institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE user_id = _user_id 
      AND institution_id = _institution_id 
      AND role = 'admin'
  );
$$;

-- Get all institution IDs a user belongs to
CREATE OR REPLACE FUNCTION public.get_user_institution_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.institution_members
  WHERE user_id = _user_id;
$$;

-- 5. ENABLE RLS ON ALL TABLES
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- === INSTITUTIONS ===
-- Platform admins can do everything
CREATE POLICY "Platform admins full access to institutions"
  ON public.institutions FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Members can read their own institution
CREATE POLICY "Members can view their institution"
  ON public.institutions FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_institution_ids(auth.uid())));

-- Public can read active institutions (for slug lookup during routing)
CREATE POLICY "Anyone can view active institutions by slug"
  ON public.institutions FOR SELECT TO anon
  USING (status = 'active');

-- === INSTITUTION DOMAINS ===
-- Platform admins full access
CREATE POLICY "Platform admins full access to domains"
  ON public.institution_domains FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Institution admins can manage their domains
CREATE POLICY "Institution admins can manage their domains"
  ON public.institution_domains FOR ALL TO authenticated
  USING (public.is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));

-- Members can view their institution's domains
CREATE POLICY "Members can view their institution domains"
  ON public.institution_domains FOR SELECT TO authenticated
  USING (public.is_institution_member(auth.uid(), institution_id));

-- Public can read active domains (for domain lookup)
CREATE POLICY "Anyone can view active domains"
  ON public.institution_domains FOR SELECT TO anon
  USING (status = 'active');

-- === PROFILES ===
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Platform admins can view all profiles
CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Institution admins can view profiles of their members
CREATE POLICY "Institution admins can view member profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT im.user_id FROM public.institution_members im
      WHERE im.institution_id IN (SELECT public.get_user_institution_ids(auth.uid()))
    )
  );

-- === INSTITUTION MEMBERS ===
-- Platform admins full access
CREATE POLICY "Platform admins full access to members"
  ON public.institution_members FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Members can view other members in their institution
CREATE POLICY "Members can view institution members"
  ON public.institution_members FOR SELECT TO authenticated
  USING (public.is_institution_member(auth.uid(), institution_id));

-- Institution admins can manage members
CREATE POLICY "Institution admins can insert members"
  ON public.institution_members FOR INSERT TO authenticated
  WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Institution admins can update members"
  ON public.institution_members FOR UPDATE TO authenticated
  USING (public.is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Institution admins can delete members"
  ON public.institution_members FOR DELETE TO authenticated
  USING (public.is_institution_admin(auth.uid(), institution_id));

-- === PLATFORM ROLES ===
-- Only platform admins can view platform roles
CREATE POLICY "Platform admins can view platform roles"
  ON public.platform_roles FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR user_id = auth.uid());

-- No insert/update/delete via client - managed via service role only

-- 7. TRIGGERS

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institution_domains_updated_at
  BEFORE UPDATE ON public.institution_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institution_members_updated_at
  BEFORE UPDATE ON public.institution_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
