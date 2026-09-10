-- =============================================================
--  ZAYMERA BOUTIQUE — Supabase Database Schema
--  Run this once in the Supabase SQL Editor:
--  Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================

-- ─────────────────────────────────────────
-- 1. PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT '',
  price          NUMERIC     NOT NULL DEFAULT 0,
  original_price NUMERIC     NOT NULL DEFAULT 0,
  purchased_price NUMERIC,
  image          TEXT        NOT NULL DEFAULT '',
  images         JSONB       NOT NULL DEFAULT '[]',
  tag            TEXT        NOT NULL DEFAULT 'New Arrival',
  description    TEXT        NOT NULL DEFAULT '',
  fabric         TEXT        NOT NULL DEFAULT '',
  work           TEXT        NOT NULL DEFAULT '',
  in_stock       BOOLEAN     NOT NULL DEFAULT TRUE,
  sizes          JSONB       NOT NULL DEFAULT '[]',
  section        TEXT        NOT NULL DEFAULT 'products',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  count       TEXT        NOT NULL DEFAULT '0 Styles',
  image       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  featured    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id          TEXT,
  order_number     TEXT        NOT NULL UNIQUE,
  customer_name    TEXT        NOT NULL,
  customer_email   TEXT        NOT NULL,
  customer_phone   TEXT        NOT NULL DEFAULT '',
  shipping_address JSONB       NOT NULL DEFAULT '{}',
  subtotal         NUMERIC     NOT NULL DEFAULT 0,
  shipping_fee     NUMERIC     NOT NULL DEFAULT 0,
  total            NUMERIC     NOT NULL DEFAULT 0,
  payment_method   TEXT        NOT NULL DEFAULT 'COD',
  payment_status   TEXT        NOT NULL DEFAULT 'pending',
  order_status     TEXT        NOT NULL DEFAULT 'processing',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────
-- 4. ORDER ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id      TEXT        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    TEXT,
  product_name  TEXT        NOT NULL,
  product_image TEXT        NOT NULL DEFAULT '',
  size          TEXT        NOT NULL DEFAULT '',
  price         NUMERIC     NOT NULL DEFAULT 0,
  quantity      INTEGER     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. INQUIRIES / BESPOKE REQUESTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inquiries (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT        NOT NULL DEFAULT '',
  service_type TEXT        NOT NULL DEFAULT 'General Inquiry',
  message      TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'new',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS inquiries_updated_at ON public.inquiries;
CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────
-- 6. COUPONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id            TEXT        PRIMARY KEY,
  code          TEXT        NOT NULL UNIQUE,
  discount_type TEXT        NOT NULL DEFAULT 'percentage',
  value         NUMERIC     NOT NULL DEFAULT 0,
  min_spend     NUMERIC     NOT NULL DEFAULT 0,
  expiry_date   DATE        NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  usage_limit   INTEGER     NOT NULL DEFAULT 100,
  times_used    INTEGER     NOT NULL DEFAULT 0,
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 7. BANNERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  subtitle    TEXT        NOT NULL DEFAULT '',
  image       TEXT        NOT NULL DEFAULT '',
  link        TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 8. STORE SETTINGS (single row, id='global')
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_settings (
  id                       TEXT    PRIMARY KEY DEFAULT 'global',
  announcement_text        TEXT    NOT NULL DEFAULT 'Complimentary Express Worldwide Delivery & Handloom Guarantee',
  concierge_phone          TEXT    NOT NULL DEFAULT '+91 98765 43210',
  support_email            TEXT    NOT NULL DEFAULT 'atelier@zaymera.com',
  free_shipping_threshold  NUMERIC NOT NULL DEFAULT 0,
  store_timings            TEXT    NOT NULL DEFAULT '10:00 AM – 9:00 PM IST',
  currency_symbol          TEXT    NOT NULL DEFAULT '₹',
  whatsapp_message         TEXT    NOT NULL DEFAULT 'Hello Zaymera Boutique Team, I would like to inquire about couture items.',
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if not present
INSERT INTO public.store_settings (id) VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- 9. DISABLE RLS & GRANT PERMISSIONS
-- ─────────────────────────────────────────
ALTER TABLE public.products       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ─────────────────────────────────────────
-- 10. STORAGE BUCKETS & POLICIES
-- ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images',  'product-images',  TRUE, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('category-images', 'category-images', TRUE, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('banner-images',   'banner-images',   TRUE, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Product images policies
DROP POLICY IF EXISTS "Public select product-images" ON storage.objects;
CREATE POLICY "Public select product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public insert product-images" ON storage.objects;
CREATE POLICY "Public insert product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public update product-images" ON storage.objects;
CREATE POLICY "Public update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public delete product-images" ON storage.objects;
CREATE POLICY "Public delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Category images policies
DROP POLICY IF EXISTS "Public select category-images" ON storage.objects;
CREATE POLICY "Public select category-images" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Public insert category-images" ON storage.objects;
CREATE POLICY "Public insert category-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Public update category-images" ON storage.objects;
CREATE POLICY "Public update category-images" ON storage.objects FOR UPDATE USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Public delete category-images" ON storage.objects;
CREATE POLICY "Public delete category-images" ON storage.objects FOR DELETE USING (bucket_id = 'category-images');

-- Banner images policies
DROP POLICY IF EXISTS "Public select banner-images" ON storage.objects;
CREATE POLICY "Public select banner-images" ON storage.objects FOR SELECT USING (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "Public insert banner-images" ON storage.objects;
CREATE POLICY "Public insert banner-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "Public update banner-images" ON storage.objects;
CREATE POLICY "Public update banner-images" ON storage.objects FOR UPDATE USING (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "Public delete banner-images" ON storage.objects;
CREATE POLICY "Public delete banner-images" ON storage.objects FOR DELETE USING (bucket_id = 'banner-images');

-- ─────────────────────────────────────────
-- 11. RELOAD SCHEMA CACHE
-- ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
