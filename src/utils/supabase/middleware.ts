import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. If this is a Next.js prefetch request, bypass auth roundtrip to make navigation instant
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch') === '1' ||
    request.headers.get('next-router-prefetch') === '1';

  if (isPrefetch) {
    return response;
  }

  // 2. Check if Supabase URL and Key are available
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  // 3. Ultra-fast check: Check if client has any Supabase auth cookies
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && (c.name.includes('auth-token') || c.name.includes('token'))
  );

  // If no auth cookie exists, skip external Supabase Auth network call completely (<1ms response)
  if (!hasAuthCookie) {
    return response;
  }

  let supabaseResponse = response;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh auth token with a fast timeout guard (max 1.5s) to prevent slow network stalls
  try {
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
    await Promise.race([authPromise, timeoutPromise]);
  } catch (err) {
    // Ignore auth refresh errors in middleware to keep navigation resilient
  }

  return supabaseResponse;
};

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  return supabaseResponse;
};
