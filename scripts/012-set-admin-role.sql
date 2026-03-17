-- Set admin role via app_metadata for admin users.
-- Works for both email and wallet logins.
-- Run once per admin user. Idempotent: safe to re-run.

-- Admin: djamel@nuwai.ch (email login)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'djamel@nuwai.ch';

-- To grant admin to a wallet user, find their ID first:
--   SELECT id, email FROM auth.users WHERE email LIKE '%@wallet.planetloga.ai';
-- Then:
--   UPDATE auth.users
--   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
--   WHERE id = '<wallet-user-uuid>';
