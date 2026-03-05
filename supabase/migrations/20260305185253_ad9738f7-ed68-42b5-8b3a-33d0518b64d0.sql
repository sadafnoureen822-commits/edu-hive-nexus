
-- Assign platform_admin role and set up institution data for testing
INSERT INTO public.platform_roles (user_id, role)
VALUES ('2ffca5ea-0cbe-486a-a769-8d6a89b366c6', 'platform_admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.institutions (id, name, slug, status)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Test Academy', 'test-academy', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO public.institution_members (user_id, institution_id, role)
VALUES ('2ffca5ea-0cbe-486a-a769-8d6a89b366c6', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.certificate_templates (id, institution_id, name, template_type, is_active, template_html)
VALUES (
  'cccccccc-dddd-eeee-ffff-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Course Completion Certificate',
  'certificate',
  true,
  '<div style="text-align:center;padding:40px;border:4px solid gold;"><h1>Certificate of Completion</h1><p>Awarded to <strong>{{student_name}}</strong></p></div>'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.issued_certificates (id, institution_id, template_id, student_id, serial_number, is_revoked, certificate_data)
VALUES (
  'dddddddd-eeee-ffff-0000-111111111111',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'cccccccc-dddd-eeee-ffff-000000000001',
  '2ffca5ea-0cbe-486a-a769-8d6a89b366c6',
  'CERT-2026-000001',
  false,
  '{"student_name": "Test Admin", "course": "Introduction to Testing", "issued_date": "2026-03-05"}'::jsonb
)
ON CONFLICT DO NOTHING;
