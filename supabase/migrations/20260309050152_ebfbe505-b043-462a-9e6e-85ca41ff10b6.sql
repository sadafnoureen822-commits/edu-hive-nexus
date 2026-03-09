
-- Drop duplicate policies if they exist, then recreate safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'timetables' AND policyname = 'Members view timetables'
  ) THEN
    EXECUTE 'CREATE POLICY "Members view timetables" ON public.timetables FOR SELECT USING (is_institution_member(auth.uid(), institution_id))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'timetables' AND policyname = 'Platform admins full access timetables'
  ) THEN
    EXECUTE 'CREATE POLICY "Platform admins full access timetables" ON public.timetables FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()))';
  END IF;
END $$;

-- Revoke anon execute on sensitive functions
REVOKE EXECUTE ON FUNCTION public.admin_list_auth_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon;
