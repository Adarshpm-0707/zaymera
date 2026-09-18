import { createClient } from '@supabase/supabase-js';

// Support both the standard anon key name and the publishable key alias used in .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== PLACEHOLDER_URL &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== PLACEHOLDER_KEY &&
  supabaseAnonKey !== 'your-anon-key-here'
);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '⚠️ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

const serviceRoleKey =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  supabaseUrl !== PLACEHOLDER_URL &&
  serviceRoleKey !== 'your-service-role-key-here'
);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
