-- Corrige login admin no banco (cole no SQL Editor e Run)
-- Login: 48998078186 → (48) 99807-8186 | nascimento 2006-03-11

UPDATE profiles SET role = 'customer'
WHERE phone_digits IN ('5548991636944', '5548998078186')
   OR role = 'admin';

INSERT INTO profiles (
  phone_digits, phone_display, first_name, last_name, role,
  birth_date, birth_date_hash, address
) VALUES (
  '55489998078186',
  '(48) 99807-8186',
  'Noboru',
  'Admin',
  'admin',
  '2006-03-11',
  extensions.crypt('2006-03-11', extensions.gen_salt('bf')),
  '{}'::jsonb
)
ON CONFLICT (phone_digits) DO UPDATE SET
  phone_display = EXCLUDED.phone_display,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = 'admin',
  birth_date = EXCLUDED.birth_date,
  birth_date_hash = EXCLUDED.birth_date_hash;

SELECT phone_digits, phone_display, role, birth_date FROM profiles WHERE role = 'admin';
