
-- Module control table: tracks which modules are enabled per institution
CREATE TABLE IF NOT EXISTS public.institution_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(institution_id, module_name)
);

ALTER TABLE public.institution_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access modules"
  ON public.institution_modules FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Institution admins view own modules"
  ON public.institution_modules FOR SELECT
  USING (is_institution_admin(auth.uid(), institution_id) OR is_institution_member(auth.uid(), institution_id));

CREATE TRIGGER update_institution_modules_updated_at
  BEFORE UPDATE ON public.institution_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default modules for existing institutions
INSERT INTO public.institution_modules (institution_id, module_name, is_enabled)
SELECT i.id, m.module_name, true
FROM public.institutions i
CROSS JOIN (
  VALUES ('lms'), ('cms'), ('exams'), ('fees'), ('attendance'), ('admissions'), ('certificates'), ('communication')
) AS m(module_name)
ON CONFLICT (institution_id, module_name) DO NOTHING;
