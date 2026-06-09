-- ============================================================
-- COLE ESTE ARQUIVO INTEIRO NO SQL EDITOR DO SUPABASE E CLIQUE RUN
-- https://supabase.com/dashboard/project/eqlhhcnrsbyniacrqrvs/sql/new
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Perfis (clientes + admin)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_digits text NOT NULL UNIQUE,
  phone_display text NOT NULL DEFAULT '',
  birth_date date NOT NULL,
  birth_date_hash text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone_digits);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions (profile_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  "desc" text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Outros',
  price numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text,
  custom_poke boolean NOT NULL DEFAULT false,
  size_prices jsonb,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_active_sort ON menu_items (active, sort_order);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS menu_items_public_read ON menu_items;
CREATE POLICY menu_items_public_read ON menu_items
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS profiles_service_only ON profiles;
CREATE POLICY profiles_service_only ON profiles FOR ALL USING (false);

DROP POLICY IF EXISTS sessions_service_only ON sessions;
CREATE POLICY sessions_service_only ON sessions FOR ALL USING (false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS menu_images_public_read ON storage.objects;
CREATE POLICY menu_images_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

INSERT INTO menu_items (id, name, "desc", category, price, custom_poke, sort_order) VALUES
  ('1', 'Poke Noboru', 'Arroz japonês, salmão fresco, cream cheese, crispe de alho poró, tomate cereja, sunomono, cebola roxa, cebolinha e alga marinha', 'Pokes', 45.0, false, 1),
  ('2', 'Poke Aloha', 'Arroz japonês, camarão tempurá, cream cheese, crispe de couve, manga, cebolinha, lâmina de amêndoas, cenoura e alga marinha', 'Pokes', 45.0, false, 2),
  ('3', 'Poke Ohana', 'Arroz japonês, salmão fresco ou grelhado, camarão tempurá, cream cheese, chips de batata doce, cebolinha, alga marinha, cebola roxa e crispe de couve', 'Pokes', 45.0, false, 3),
  ('4', 'Poke Moana', 'Arroz japonês, salmão fresco ou grelhado, cream cheese, sunomono, crispe de couve e palmito', 'Pokes', 45.0, false, 4),
  ('5', 'Poke Chicken Teriyaki', 'Arroz japonês, frango teriyaki, sunomono, alga marinha, cream cheese, cebolinha, tomate cereja e crispe de cebola', 'Pokes', 29.9, false, 5),
  ('poke-custom', 'Monte seu poke', 'Escolha o tamanho e monte com os ingredientes que preferir', 'Pokes', 35.0, true, 6),
  ('6', 'Temaki Salmão', 'Arroz japonês, salmão fresco, alga marinha e cebolinha', 'Temakis', 29.9, false, 7),
  ('7', 'Temaki Salmão e Cebolinha', 'Salmão fresco, alga marinha e cebolinha (sem arroz)', 'Temakis', 43.9, false, 8),
  ('8', 'Temaki Filadélfia', 'Arroz japonês, salmão fresco, cream cheese, alga marinha e cebolinha', 'Temakis', 29.9, false, 9),
  ('9', 'Temaki Hot', 'Arroz japonês, salmão e alga marinha (empanado e frito)', 'Temakis', 35.0, false, 10),
  ('10', 'Mini Hot', 'Mini temaki hot (unidade)', 'Temakis', 12.9, false, 11),
  ('11', 'Água mineral 500ml', 'Com ou sem gás', 'Bebidas', 4.0, false, 12),
  ('12', 'Fanta Uva lata 350ml', 'Refrigerante lata 350ml', 'Bebidas', 6.0, false, 13),
  ('13', 'Fanta Laranja lata 350ml', 'Refrigerante lata 350ml', 'Bebidas', 6.0, false, 14),
  ('14', 'Fanta Guaraná lata 350ml', 'Refrigerante lata 350ml', 'Bebidas', 6.0, false, 15),
  ('15', 'Coca-Cola Zero lata 350ml', 'Refrigerante lata 350ml', 'Bebidas', 6.0, false, 16),
  ('16', 'Coca-Cola lata 350ml', 'Refrigerante lata 350ml', 'Bebidas', 6.0, false, 17),
  ('17', 'Coca-Cola Zero 600ml', 'Garrafa 600ml', 'Bebidas', 8.0, false, 18),
  ('18', 'Fanta Laranja 600ml', 'Garrafa 600ml', 'Bebidas', 8.0, false, 19),
  ('19', 'Chá gelado 500ml', 'Pêssego, limão ou verde', 'Bebidas', 8.0, false, 20)
ON CONFLICT (id) DO NOTHING;

-- Admin: telefone (48) 9807-8186 | nascimento 2006-03-11
INSERT INTO profiles (
  phone_digits, phone_display, first_name, last_name, role,
  birth_date, birth_date_hash, address
) VALUES (
  '5548998078186',
  '(48) 9807-8186',
  'Noboru',
  'Admin',
  'admin',
  '2006-03-11',
  extensions.crypt('2006-03-11', extensions.gen_salt('bf')),
  '{}'::jsonb
)
ON CONFLICT (phone_digits) DO NOTHING;

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

-- Conferência (deve mostrar 20 e 1 admin)
SELECT count(*) AS itens_cardapio FROM menu_items;
SELECT phone_display, role FROM profiles WHERE role = 'admin';
