
-- Confirm the test user's email only
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'admin@testplatform.com';
