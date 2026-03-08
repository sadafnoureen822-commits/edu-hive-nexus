CREATE OR REPLACE FUNCTION public.admin_list_auth_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email::text, au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
$$;