-- Cole SOMENTE isto se as tabelas já existem mas as funções falharam
-- (erro gen_salt does not exist)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION hash_birth_date(p_birth_date text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT extensions.crypt(p_birth_date, extensions.gen_salt('bf'));
$$;

CREATE OR REPLACE FUNCTION login_with_birth(p_phone_digits text, p_birth_date text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE phone_digits = p_phone_digits LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_profile.birth_date_hash = extensions.crypt(p_birth_date, v_profile.birth_date_hash) THEN
    RETURN v_profile.id;
  END IF;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION hash_birth_date(text) TO service_role;
GRANT EXECUTE ON FUNCTION login_with_birth(text, text) TO service_role;

INSERT INTO profiles (
  phone_digits, phone_display, first_name, last_name, role,
  birth_date, birth_date_hash, address
) VALUES (
  '5548991636944',
  '(48) 99163-6944',
  'Noboru',
  'Admin',
  'admin',
  '2006-03-11',
  extensions.crypt('2006-03-11', extensions.gen_salt('bf')),
  '{}'::jsonb
)
ON CONFLICT (phone_digits) DO NOTHING;
