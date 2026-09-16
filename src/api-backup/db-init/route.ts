import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route uses the SERVICE ROLE key — server-side only, never exposed to browser
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isRealServiceKey =
    rawServiceKey &&
    !rawServiceKey.includes('your-') &&
    !rawServiceKey.includes('placeholder') &&
    rawServiceKey.length > 30;

  const key = isRealServiceKey
    ? rawServiceKey
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
       '');

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export const dynamic = 'force-dynamic';

interface InitReport {
  tables: Record<string, 'created' | 'exists' | 'error'>;
  buckets: Record<string, 'created' | 'exists' | 'error'>;
  errors: string[];
}

// ── Table definitions (ordered by dependency) ────────────────────────────────
const TABLE_SQLS: Record<string, string> = {
  products: `
    CREATE TABLE IF NOT EXISTS public.products (
      id              TEXT        PRIMARY KEY,
      name            TEXT        NOT NULL,
      category        TEXT        NOT NULL DEFAULT '',
      price           NUMERIC     NOT NULL DEFAULT 0,
      original_price  NUMERIC     NOT NULL DEFAULT 0,
      purchased_price NUMERIC,
      image           TEXT        NOT NULL DEFAULT '',
      images          JSONB       NOT NULL DEFAULT '[]',
      tag             TEXT        NOT NULL DEFAULT 'New Arrival',
      description     TEXT        NOT NULL DEFAULT '',
      fabric          TEXT        NOT NULL DEFAULT '',
      work            TEXT        NOT NULL DEFAULT '',
      in_stock        BOOLEAN     NOT NULL DEFAULT TRUE,
      sizes           JSONB       NOT NULL DEFAULT '[]',
      section         TEXT        NOT NULL DEFAULT 'products',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
  `,
  categories: `
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
    ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
  `,
  orders: `
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
    ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
  `,
  order_items: `
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
    ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
  `,
  inquiries: `
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
    ALTER TABLE public.inquiries DISABLE ROW LEVEL SECURITY;
  `,
  coupons: `
    CREATE TABLE IF NOT EXISTS public.coupons (
      id            TEXT        PRIMARY KEY,
      code          TEXT        NOT NULL UNIQUE,
      discount_type TEXT        NOT NULL DEFAULT 'percentage',
      value         NUMERIC     NOT NULL DEFAULT 0,
      min_spend     NUMERIC     NOT NULL DEFAULT 0,
      expiry_date   DATE        NOT NULL DEFAULT (NOW() + INTERVAL '1 year')::DATE,
      usage_limit   INTEGER     NOT NULL DEFAULT 100,
      times_used    INTEGER     NOT NULL DEFAULT 0,
      active        BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
  `,
  banners: `
    CREATE TABLE IF NOT EXISTS public.banners (
      id         TEXT        PRIMARY KEY,
      title      TEXT        NOT NULL,
      subtitle   TEXT        NOT NULL DEFAULT '',
      image      TEXT        NOT NULL DEFAULT '',
      link       TEXT        NOT NULL DEFAULT '',
      sort_order INTEGER     NOT NULL DEFAULT 0,
      active     BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
  `,
  store_settings: `
    CREATE TABLE IF NOT EXISTS public.store_settings (
      id                      TEXT    PRIMARY KEY DEFAULT 'global',
      announcement_text       TEXT    NOT NULL DEFAULT 'Complimentary Express Worldwide Delivery & Handloom Guarantee',
      concierge_phone         TEXT    NOT NULL DEFAULT '+91 73061 15950',
      support_email           TEXT    NOT NULL DEFAULT 'atelier@zaymera.com',
      free_shipping_threshold NUMERIC NOT NULL DEFAULT 0,
      store_timings           TEXT    NOT NULL DEFAULT '10:00 AM – 9:00 PM IST',
      currency_symbol         TEXT    NOT NULL DEFAULT '₹',
      whatsapp_message        TEXT    NOT NULL DEFAULT 'Hello Zaymera Boutique Team, I would like to inquire about couture items.',
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;
    INSERT INTO public.store_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
  `
};

// ── Storage bucket definitions ────────────────────────────────────────────────
const BUCKETS = [
  { id: 'product-images',  name: 'product-images',  public: true, fileSizeLimit: 10 * 1024 * 1024 },
  { id: 'category-images', name: 'category-images', public: true, fileSizeLimit: 10 * 1024 * 1024 },
  { id: 'banner-images',   name: 'banner-images',   public: true, fileSizeLimit: 10 * 1024 * 1024 },
];

export async function GET() {
  const admin = getAdminClient();
  const report: InitReport = { tables: {}, buckets: {}, errors: [] };

  // ── Ensure tables exist ──────────────────────────────────────────────────
  for (const [table, sql] of Object.entries(TABLE_SQLS)) {
    try {
      // Try to select from the table — if it exists, skip creation
      const { error: checkErr } = await admin.from(table).select('id').limit(1);
      if (!checkErr) {
        report.tables[table] = 'exists';
        continue;
      }
      // Table doesn't exist or another error — attempt creation via rpc
      const { error: rpcErr } = await admin.rpc('exec_sql', { sql }) as any;
      if (rpcErr) {
        // exec_sql not available — log and note; user should run schema.sql manually
        report.tables[table] = 'error';
        report.errors.push(`Table "${table}": ${rpcErr.message} — run supabase/schema.sql manually`);
      } else {
        report.tables[table] = 'created';
      }
    } catch (err: any) {
      report.tables[table] = 'error';
      report.errors.push(`Table "${table}": ${err?.message}`);
    }
  }

  // ── Ensure storage buckets exist ─────────────────────────────────────────
  for (const bucket of BUCKETS) {
    try {
      const { data: existing } = await admin.storage.getBucket(bucket.id);
      if (existing) {
        report.buckets[bucket.id] = 'exists';
        continue;
      }
      const { error: createErr } = await admin.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      });
      if (createErr) {
        report.buckets[bucket.id] = 'error';
        report.errors.push(`Bucket "${bucket.id}": ${createErr.message}`);
      } else {
        report.buckets[bucket.id] = 'created';
      }
    } catch (err: any) {
      report.buckets[bucket.id] = 'error';
      report.errors.push(`Bucket "${bucket.id}": ${err?.message}`);
    }
  }

  const hasErrors = report.errors.length > 0;
  return NextResponse.json(
    {
      success: !hasErrors,
      message: hasErrors
        ? 'Partial setup — see errors. Run supabase/schema.sql in SQL Editor for full setup.'
        : 'All tables and buckets are ready!',
      report
    },
    { status: hasErrors ? 207 : 200 }
  );
}
