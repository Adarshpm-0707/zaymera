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

// ── Multi-Device Auth Helpers ────────────────────────────────────────────────

export interface CreateCloudUserParams {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
  phone?: string;
  role?: 'Administrator' | 'customer' | 'vip';
}

/**
 * Creates a new user in Supabase with auto-confirmed email (email_confirm: true).
 * This eliminates "Email not confirmed" lockouts and allows immediate login across all devices.
 */
export async function createCloudUserConfirmed(params: CreateCloudUserParams): Promise<{ user: any; error: Error | null }> {
  const { email, password, username, fullName, phone, role = 'customer' } = params;
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username?.trim().toLowerCase();

  // If supabaseAdmin (service role) is available, use admin API for instant pre-confirmation
  if (supabaseAdmin) {
    try {
      // Check if username or email already exists in Supabase Auth
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (userList?.users) {
        const existing = (userList.users as any[]).find((u: any) => {
          const uEmail = u.email?.toLowerCase();
          const uUsername = (u.user_metadata?.username as string | undefined)?.toLowerCase();
          return (
            uEmail === cleanEmail ||
            (cleanUsername && uUsername === cleanUsername)
          );
        });

        if (existing) {
          const isEmailMatch = existing.email?.toLowerCase() === cleanEmail;
          return {
            user: null,
            error: new Error(
              isEmailMatch
                ? 'An account with this email address already exists. Please login instead.'
                : 'An account with this username already exists. Please choose a different username.'
            )
          };
        }
      }

      // Create pre-confirmed user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: username?.trim() || cleanEmail,
          full_name: fullName?.trim() || username?.trim() || cleanEmail,
          phone: phone?.trim() || '',
          role
        }
      });

      if (error) return { user: null, error: new Error(error.message) };
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: new Error(err?.message || 'Failed to create cloud user') };
    }
  }

  // Fallback: standard client signUp
  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: username?.trim() || cleanEmail,
          full_name: fullName?.trim() || username?.trim() || cleanEmail,
          phone: phone?.trim() || '',
          role
        }
      }
    });

    if (error) return { user: null, error: new Error(error.message) };
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: new Error(err?.message || 'Failed to sign up') };
  }
}

/**
 * Resolves a login input (which could be a Username, Phone Number, or Email)
 * to the registered user's email address and ensures their email is confirmed in Supabase.
 */
export async function resolveUserLoginIdentifier(identifier: string): Promise<{ email: string; user: any } | null> {
  const clean = identifier.trim();
  if (!clean) return null;

  if (clean.includes('@')) {
    // If input is an email, ensure it is confirmed so login succeeds across devices
    if (supabaseAdmin) {
      try {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const matched = (list?.users as any[] | undefined)?.find((u: any) => u.email?.toLowerCase() === clean.toLowerCase());
        if (matched) {
          if (!matched.email_confirmed_at) {
            await supabaseAdmin.auth.admin.updateUserById(matched.id, { email_confirm: true });
          }
          return { email: matched.email || clean, user: matched };
        }
      } catch {
        // non-blocking
      }
    }
    return { email: clean, user: null };
  }

  // Input is a Username or Phone Number — look up in Supabase Auth
  if (supabaseAdmin) {
    try {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (list?.users) {
        const matched = (list.users as any[]).find((u: any) => {
          const uUsername = (u.user_metadata?.username as string | undefined)?.toLowerCase();
          const uPhone = (u.user_metadata?.phone as string | undefined)?.replace(/[\s\-+]/g, '');
          const cleanPhone = clean.replace(/[\s\-+]/g, '');
          const uName = (u.user_metadata?.full_name as string | undefined)?.toLowerCase();
          return (
            (uUsername && uUsername === clean.toLowerCase()) ||
            (cleanPhone.length >= 7 && uPhone && uPhone === cleanPhone) ||
            (uName && uName === clean.toLowerCase())
          );
        });

        if (matched && matched.email) {
          if (!matched.email_confirmed_at) {
            await supabaseAdmin.auth.admin.updateUserById(matched.id, { email_confirm: true });
          }
          return { email: matched.email, user: matched };
        }
      }
    } catch (err) {
      console.warn('Error resolving login identifier:', err);
    }
  }

  return null;
}

/**
 * Ensures a user's email is confirmed so they can log in without "Email not confirmed" error.
 */
export async function ensureUserEmailConfirmed(emailOrId: string): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = (list?.users as any[] | undefined)?.find(
      (u: any) => u.id === emailOrId || u.email?.toLowerCase() === emailOrId.toLowerCase()
    );
    if (user && !user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    }
  } catch (err) {
    console.warn('Failed to ensure email confirmed:', err);
  }
}

