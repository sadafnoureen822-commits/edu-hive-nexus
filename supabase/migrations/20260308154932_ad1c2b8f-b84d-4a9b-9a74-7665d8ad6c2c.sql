
-- Fix overly permissive policies flagged by linter

-- 1. Admission applications: public INSERT is intentional (anonymous applicants),
--    but restrict to active institutions only
DROP POLICY IF EXISTS "Public can submit applications" ON public.admission_applications;
CREATE POLICY "Public can submit applications"
  ON public.admission_applications FOR INSERT
  WITH CHECK (
    institution_id IN (SELECT id FROM public.institutions WHERE status = 'active')
  );

-- 2. Activity logs: only authenticated users or service role should insert
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "Members can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    (user_id = auth.uid()) OR is_institution_member(auth.uid(), institution_id)
  );
