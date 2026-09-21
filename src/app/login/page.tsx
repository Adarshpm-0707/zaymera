'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { circleLogoImg } from '@/constants/catalog';

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const { user, signIn, signUp, signOut } = useAuth();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Read error parameter if redirected from OAuth callback error
  useEffect(() => {
    const urlError = searchParams.get('error_description') || searchParams.get('error');
    if (urlError) {
      setErrorMsg(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  // Handle Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is not configured. Please check your Supabase credentials in .env.');
      setGoogleLoading(false);
      return;
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`
        : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to initiate Google sign-in. Please try again.');
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        // Immediately navigate browser to Google's authentication page
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred during Google sign-in.');
      setGoogleLoading(false);
    }
  };

  // Handle Standard Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          setErrorMsg(error.message || 'Registration failed. Please check your credentials.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Welcome to Zaymera Atelier! Your account is created.');
        setTimeout(() => {
          router.push(redirectTo);
        }, 1200);
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message || 'Invalid email or password. Please try again.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  // If customer is already authenticated, show logged-in account overview card
  if (user) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2D5] shadow-xl p-6 sm:p-8 text-center animate-in fade-in duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] shadow-md mb-4 overflow-hidden">
          <img
            src={circleLogoImg}
            alt="Zaymera"
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E5DCCE] text-[#9B2242] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          VIP Patron Account
        </div>

        <h2 className="font-display text-2xl font-normal text-[#1A1412] mt-1">
          Welcome Back
        </h2>
        <p className="text-xs text-[#7A6D60] mt-1 font-light">
          You are currently signed in to Zaymera Haute Couture Atelier.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-left">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C7A6B]">
            Logged In As
          </div>
          <div className="text-sm font-semibold text-[#1A1412] mt-0.5 truncate">
            {user.email}
          </div>
          {user.user_metadata?.full_name && (
            <div className="text-xs text-[#5D5042] mt-1">
              Patron: <span className="font-medium text-[#1A1412]">{user.user_metadata.full_name}</span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>

          <button
            type="button"
            onClick={async () => {
              await signOut();
            }}
            className="w-full py-2.5 rounded-xl border border-[#DCD1BF] text-[#7A6D60] hover:text-[#1A1412] hover:bg-[#FAF4EA] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-[#EAE2D5] shadow-2xl p-6 sm:p-9 text-[#221C18] relative transition-all">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] shadow-md mb-3 transition-transform hover:scale-105 overflow-hidden"
        >
          <img
            src={circleLogoImg}
            alt="Zaymera Logo"
            width={56}
            height={56}
            className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
          />
        </Link>

        <h1 className="font-display text-2.5xl sm:text-3xl font-normal text-[#1A1412] tracking-wide">
          {mode === 'signin' ? 'Customer Sign In' : 'Create Customer Account'}
        </h1>
        <p className="text-xs text-[#7A6D60] mt-1.5 font-light font-sans-clean">
          {mode === 'signin'
            ? 'Sign in to access VIP bridal orders, fitting records & wishlist.'
            : 'Join Zaymera Atelier for bespoke privileges, previews & fast checkout.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex rounded-xl bg-[#FAF6F0] p-1 border border-[#EADBCC] mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'signin'
              ? 'bg-white text-[#9B2242] shadow-sm'
              : 'text-[#8C7A68] hover:text-[#1A1412]'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-[#9B2242] shadow-sm'
              : 'text-[#8C7A68] hover:text-[#1A1412]'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── GOOGLE ACCOUNT SIGN-IN BUTTON ── */}
      <div className="mb-6">
        <button
          type="button"
          disabled={googleLoading || loading}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#DCD1BF] bg-white hover:bg-[#FAF8F5] hover:border-[#9B2242]/40 text-[#221C18] text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#9B2242]" />
              <span>Connecting with Google...</span>
            </>
          ) : (
            <>
              {/* Google 4-Color Official SVG Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="tracking-wide">Sign in with Google</span>
            </>
          )}
        </button>
      </div>

      {/* Or Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="grow border-t border-[#EADBCC]" />
        <span className="shrink-0 px-3 text-[11px] uppercase tracking-wider text-[#A39281] bg-white">
          Or with email
        </span>
        <div className="grow border-t border-[#EADBCC]" />
      </div>

      {/* Customer Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-[#A89887]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#DCD1BF] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:border-[#9B2242] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#A89887]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#DCD1BF] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:border-[#9B2242] transition-all"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#A89887]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#DCD1BF] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:border-[#9B2242] transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034]">
              Password
            </label>
            {mode === 'signin' && (
              <span className="text-[11px] text-[#9B2242] hover:underline cursor-pointer">
                Forgot password?
              </span>
            )}
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#A89887]" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-[#DCD1BF] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:border-[#9B2242] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-[#A89887] hover:text-[#221C18] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mode === 'signin' && (
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#5D5042]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#DCD1BF] text-[#9B2242] focus:ring-[#9B2242]"
              />
              <span className="text-[11px]">Remember my device</span>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full mt-2 py-3 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? mode === 'signup'
              ? 'Creating Account...'
              : 'Authenticating...'
            : mode === 'signup'
            ? 'Join Zaymera Atelier'
            : 'Sign In to Account'}
        </button>
      </form>

      {/* Trust & Security Badge */}
      <div className="mt-6 pt-5 border-t border-[#EADBCC] flex items-center justify-center gap-1.5 text-[#8C7A68] text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
        <span>256-Bit SSL Encrypted & Secure Portal</span>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-[#F6EFE6] to-[#FAF8F5] flex flex-col justify-between px-4 py-8 sm:py-12">
      {/* Top Bar Navigation */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#7A6D60] hover:text-[#9B2242] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Boutique</span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-[#8C7A68]">
          <span>Need assistance?</span>
          <Link
            href="/#contact"
            className="text-[#9B2242] font-semibold hover:underline"
          >
            Concierge Desk
          </Link>
        </div>
      </div>

      {/* Main Login Area */}
      <main className="my-auto py-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto bg-white/80 p-12 rounded-2xl border border-[#EAE2D5] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#9B2242]" />
              <span className="text-xs text-[#7A6D60]">Loading Zaymera Portal...</span>
            </div>
          }
        >
          <CustomerLoginForm />
        </Suspense>
      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full max-w-md mx-auto text-center text-[11px] text-[#A39281] space-y-2">
        <p>© {new Date().getFullYear()} Zaymera Haute Couture Atelier. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-[#8C7A6B]">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <span>•</span>
          <Link href="/admin/login" className="hover:text-[#9B2242] transition-colors">Admin Portal</Link>
        </div>
      </footer>
    </div>
  );
}
