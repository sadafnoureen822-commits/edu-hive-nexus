
-- Allow public to view active certificate templates (needed for public certificate verification)
CREATE POLICY "Public can view active certificate templates"
  ON public.certificate_templates FOR SELECT
  USING (is_active = true);
