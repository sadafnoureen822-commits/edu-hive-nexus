-- Make sadaf a platform admin so she can access Super Admin panel
INSERT INTO public.platform_roles (user_id, role)
VALUES ('67f60012-1309-47e4-82ea-2f73c26ba979', 'platform_admin')
ON CONFLICT DO NOTHING;

-- Make admin@testplatform.com a platform admin too
INSERT INTO public.platform_roles (user_id, role)
VALUES ('2ffca5ea-0cbe-486a-a769-8d6a89b366c6', 'platform_admin')
ON CONFLICT DO NOTHING;

-- Add sadaf as institution admin of Test Academy
INSERT INTO public.institution_members (user_id, institution_id, role)
VALUES ('67f60012-1309-47e4-82ea-2f73c26ba979', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'admin')
ON CONFLICT DO NOTHING;

-- Add sadaf as institution admin of Greenfield Academy too
INSERT INTO public.institution_members (user_id, institution_id, role)
VALUES ('67f60012-1309-47e4-82ea-2f73c26ba979', 'b1000001-0000-0000-0000-000000000001', 'admin')
ON CONFLICT DO NOTHING;

-- Ensure profiles exist for both users
INSERT INTO public.profiles (user_id, full_name)
VALUES 
  ('67f60012-1309-47e4-82ea-2f73c26ba979', 'Sadaf Noureen'),
  ('2ffca5ea-0cbe-486a-a769-8d6a89b366c6', 'Platform Admin')
ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;