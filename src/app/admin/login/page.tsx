'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { circleLogoImg } from '@/constants/catalog';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in, redirect to admin dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const existingAuth = localStorage.getItem('zaymera_admin_auth');
        if (existingAuth) {
          const parsed = JSON.parse(existingAuth);
          if (parsed && (parsed.username || parsed.email)) {
            setSuccessMsg(`Welcome back, ${parsed.username || parsed.name || 'Admin'}!`);
            const timer = setTimeout(() => router.push('/admin'), 600);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [router]);

  const saveAdminSession = (userData: {
    username: string;
    email?: string;
    name?: string;
    role?: string;
  }) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'zaymera_admin_auth',
          JSON.stringify({
            username: userData.username,
            name: userData.name || userData.username,
            email: userData.email || `${userData.username.toLowerCase()}@zaymera.com`,
            role: userData.role || 'Administrator',
            loggedInAt: new Date().toISOString()
          })
        );
      } catch (e) {
        console.error('Session save error:', e);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const input = usernameOrEmail.trim();
    const pass = password.trim();

    if (!input || !pass) {
      setErrorMsg('Please enter both username or email and password.');
      setLoading(false);
      return;
    }

    try {
      // 1. Check local registered admin storage first
      let matchedRegisteredUser: any = null;
      if (typeof window !== 'undefined') {
        try {
          const registeredAdminsRaw = localStorage.getItem('zaymera_registered_admins');
          if (registeredAdminsRaw) {
            const list = JSON.parse(registeredAdminsRaw);
            if (Array.isArray(list)) {
              matchedRegisteredUser = list.find(
                (u: any) =>
                  (u.username?.toLowerCase() === input.toLowerCase() ||
                   u.email?.toLowerCase() === input.toLowerCase()) &&
                  u.password === pass
              );
            }
          }
        } catch {
          // ignore
        }
      }

      if (matchedRegisteredUser) {
        saveAdminSession({
          username: matchedRegisteredUser.username || input,
          name: matchedRegisteredUser.name || matchedRegisteredUser.username,
          email: matchedRegisteredUser.email,
          role: matchedRegisteredUser.role || 'Administrator',
        });
        setSuccessMsg(`Welcome, ${matchedRegisteredUser.username}! Entering Dashboard...`);
        setTimeout(() => router.push('/admin'), 600);
        return;
      }

      // 2. Default master administrative credentials (admin / admin, admin / admin123, zaymera / admin)
      const isDefaultAdmin =
        (input.toLowerCase() === 'admin' && (pass === 'admin' || pass === 'admin123' || pass === 'Atelier2026!Royal')) ||
        (input.toLowerCase() === 'zaymera' && (pass === 'admin' || pass === 'admin123' || pass === 'zaymera123')) ||
        (input.toLowerCase() === 'director' && (pass === 'admin' || pass === 'director123')) ||
        (input.toLowerCase() === 'executive@zaymera.com' && (pass === 'admin' || pass === 'Atelier2026!Royal'));

      if (isDefaultAdmin) {
        saveAdminSession({
          username: input,
          name: input.toUpperCase(),
          email: `${input.toLowerCase()}@zaymera.com`,
          role: 'Administrator'
        });
        setSuccessMsg(`Welcome, ${input}! Redirecting to Dashboard...`);
        setTimeout(() => router.push('/admin'), 600);
        return;
      }

      // 3. Try Supabase Auth if input is an email and Supabase is configured
      if (input.includes('@') && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: input,
          password: pass,
        });

        if (!error && data.user) {
          saveAdminSession({
            username: input.split('@')[0],
            name: data.user.user_metadata?.full_name || input.split('@')[0],
            email: data.user.email,
            role: data.user.user_metadata?.role || 'Administrator'
          });
          setSuccessMsg('Welcome! Entering Dashboard...');
          setTimeout(() => router.push('/admin'), 600);
          return;
        }
      }

      setErrorMsg('Invalid username or password.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] text-[#1C1613] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans-clean relative overflow-hidden">
      
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#9B2242]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between z-10 py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div 
            className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 overflow-hidden shadow-xs"
            style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
          >
            <img
              src={circleLogoImg}
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full bg-[#1A1412] block"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span className="font-display text-base tracking-[0.22em] text-[#1C1613] group-hover:text-[#936718] transition-colors">
            ZAYMERA
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#EAE2D5] text-xs text-[#936718] hover:text-[#1C1613] transition-colors shadow-xs"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Store</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto z-10 py-4 sm:py-6">
        <div className="rounded-3xl bg-white border border-[#EAE2D5] p-6 sm:p-8 shadow-xl space-y-5 relative">
          
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <h1 className="font-display text-2xl sm:text-3xl text-[#1C1613] tracking-wide font-normal">
              Admin Login
            </h1>
            <p className="text-xs text-[#6B5E52]">
              Enter your credentials to access the admin portal
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form: ONLY Username or Email, Password, and Login Button */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username or Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7B6E] hover:text-[#1C1613] transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold tracking-wider uppercase shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Logging in...' : 'Login'}</span>
            </button>
          </form>

          {/* Clean Link to Register */}
          <div className="pt-2 text-center text-xs text-[#6B5E52]">
            <span>Don&apos;t have an admin account? </span>
            <Link
              href="/admin/signup"
              className="text-[#936718] font-bold hover:underline"
            >
              Register
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-2 z-10 text-[11px] text-[#8A7B6E]">
        <span>Zaymera Boutique Admin</span>
      </footer>

    </div>
  );
}
