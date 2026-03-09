
-- Fix 1: Revoke public RPC access to auth-enumeration functions
REVOKE EXECUTE ON FUNCTION public.admin_list_auth_users() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon, authenticated;

-- Fix 2: Replace the overly permissive admission_applications SELECT policy
DROP POLICY IF EXISTS "Applicants view own application by email" ON public.admission_applications;

-- Allow institution members (staff) to view applications for their institution
CREATE POLICY "Members view institution applications"
  ON public.admission_applications FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

-- Allow applicants to track their own application via email match to their auth account
CREATE POLICY "Applicants track own application"
  ON public.admission_applications FOR SELECT
  USING (
    email IS NOT NULL
    AND email = (
      SELECT au.email FROM auth.users au WHERE au.id = auth.uid() LIMIT 1
    )
  );
