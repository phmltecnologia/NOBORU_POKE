-- Cole no SQL Editor (projeto eqlhhcnrsbyniacrqrvs) após 001_initial.sql
-- https://supabase.com/dashboard/project/eqlhhcnrsbyniacrqrvs/sql/new

-- (conteúdo idêntico a supabase/migrations/002_menu_categories_layers.sql)

CREATE TABLE IF NOT EXISTS menu_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON menu_categories (active, sort_order);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id text REFERENCES menu_categories (id);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS option_layers jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS menu_categories_public_read ON menu_categories;
CREATE POLICY menu_categories_public_read ON menu_categories
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS menu_categories_service_only ON menu_categories;
CREATE POLICY menu_categories_service_only ON menu_categories
  FOR ALL USING (false);

INSERT INTO menu_categories (id, name, sort_order) VALUES
  ('pokes', 'Pokes', 1),
  ('temakis', 'Temakis', 2),
  ('bebidas', 'Bebidas', 3),
  ('outros', 'Outros', 99)
ON CONFLICT (id) DO NOTHING;

UPDATE menu_items SET category_id = 'pokes' WHERE category = 'Pokes' AND category_id IS NULL;
UPDATE menu_items SET category_id = 'temakis' WHERE category = 'Temakis' AND category_id IS NULL;
UPDATE menu_items SET category_id = 'bebidas' WHERE category = 'Bebidas' AND category_id IS NULL;
UPDATE menu_items SET category_id = 'outros' WHERE category_id IS NULL;

UPDATE menu_items SET option_layers = '[
  {"id":"tamanho","label":"Tamanho","type":"single","required":true,"priceMode":"replace",
   "choices":[
     {"id":"medio","label":"Médio","subtitle":"350g","price":38},
     {"id":"grande","label":"Grande","subtitle":"550g","price":45}
   ]}
]'::jsonb
WHERE id IN ('1','2','3','4');

UPDATE menu_items SET option_layers = '[
  {"id":"tamanho","label":"Tamanho","type":"single","required":true,"priceMode":"replace",
   "choices":[
     {"id":"medio","label":"Médio","subtitle":"350g","price":24.9},
     {"id":"grande","label":"Grande","subtitle":"550g","price":29.9}
   ]}
]'::jsonb
WHERE id = '5';

UPDATE menu_items SET option_layers = '[
  {"id":"tamanho","label":"Tamanho","type":"single","required":true,"priceMode":"replace",
   "choices":[
     {"id":"medio","label":"Médio","subtitle":"350g","price":38},
     {"id":"grande","label":"Grande","subtitle":"550g","price":45}
   ]},
  {"id":"salmao","label":"Salmão","type":"single","required":false,"priceMode":"delta",
   "choices":[
     {"id":"fresco","label":"Fresco","priceDelta":0},
     {"id":"grelhado","label":"Grelhado","priceDelta":0}
   ]}
]'::jsonb
WHERE id IN ('3','4');

UPDATE menu_items SET option_layers = '[
  {"id":"tamanho","label":"Tamanho","type":"single","required":true,"priceMode":"base",
   "choices":[
     {"id":"medio","label":"Médio","subtitle":"350g","price":35,"meta":{"maxChoices":4}},
     {"id":"grande","label":"Grande","subtitle":"550g","price":45,"meta":{"maxChoices":6}}
   ]},
  {"id":"proteinas","label":"Proteínas","type":"multi","required":false,"min":0,"max":2,"priceMode":"delta",
   "choices":[
     {"id":"salmao-fresco","label":"Salmão fresco","priceDelta":10},
     {"id":"salmao-grelhado","label":"Salmão grelhado","priceDelta":9},
     {"id":"camarao-tempura","label":"Camarão tempurá","priceDelta":10},
     {"id":"frango-teriyaki","label":"Frango teriyaki","priceDelta":5}
   ]},
  {"id":"complementos","label":"Complementos","type":"multi","priceMode":"delta","maxChoicesFromLayer":"tamanho",
   "choices":[
     {"id":"cream-cheese","label":"Cream cheese","priceDelta":3},
     {"id":"crispe-alho-poro","label":"Crispe de alho poró","priceDelta":2},
     {"id":"tomate-cereja","label":"Tomate cereja","priceDelta":2},
     {"id":"sunomono","label":"Sunomono","priceDelta":2},
     {"id":"cebola-roxa","label":"Cebola roxa","priceDelta":1},
     {"id":"cebolinha","label":"Cebolinha","priceDelta":0},
     {"id":"crispe-couve","label":"Crispe de couve","priceDelta":2},
     {"id":"manga","label":"Manga","priceDelta":3},
     {"id":"amendoas","label":"Lâmina de amêndoas","priceDelta":3},
     {"id":"cenoura","label":"Cenoura","priceDelta":1},
     {"id":"batata-doce","label":"Chips de batata doce","priceDelta":2},
     {"id":"palmito","label":"Palmito","priceDelta":2},
     {"id":"crispe-cebola","label":"Crispe de cebola","priceDelta":2}
   ]}
]'::jsonb,
custom_poke = true
WHERE id = 'poke-custom';

SELECT count(*) AS categorias FROM menu_categories WHERE active = true;
SELECT id, name, jsonb_array_length(option_layers) AS camadas FROM menu_items WHERE active = true ORDER BY sort_order;
