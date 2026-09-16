'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { circleLogoImg } from '@/constants/catalog';

export default function AdminSignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanConfirmPass = confirmPassword.trim();

    if (!cleanUsername || !cleanEmail || !cleanPass || !cleanConfirmPass) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    if (cleanPass !== cleanConfirmPass) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      // 1. Save new admin to local registered admins list
      if (typeof window !== 'undefined') {
        let registeredList: any[] = [];
        try {
          const raw = localStorage.getItem('zaymera_registered_admins');
          if (raw) registeredList = JSON.parse(raw) || [];
        } catch {
          registeredList = [];
        }

        // Check if username or email is already registered
        const existing = registeredList.find(
          (u) =>
            u.username?.toLowerCase() === cleanUsername ||
            u.email?.toLowerCase() === cleanEmail
        );

        if (existing) {
          setErrorMsg('An account with this username or email already exists. Please login instead.');
          setLoading(false);
          return;
        }

        const newAdmin = {
          id: `adm_${Date.now()}`,
          username: cleanUsername,
          name: cleanUsername,
          email: cleanEmail,
          password: cleanPass,
          role: 'Administrator',
          createdAt: new Date().toISOString()
        };

        registeredList.push(newAdmin);
        localStorage.setItem('zaymera_registered_admins', JSON.stringify(registeredList));

        // Save active session
        localStorage.setItem(
          'zaymera_admin_auth',
          JSON.stringify({
            username: cleanUsername,
            name: cleanUsername,
            email: cleanEmail,
            role: 'Administrator',
            loggedInAt: new Date().toISOString()
          })
        );
      }

      // 2. Also register in Supabase Auth if available
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: {
              data: {
                username: cleanUsername,
                full_name: cleanUsername,
                role: 'Administrator',
              },
            },
          });
        } catch {
          // non-blocking
        }
      }

      setSuccessMsg(`Admin account "${cleanUsername}" registered successfully! Entering Dashboard...`);
      setTimeout(() => {
        router.push('/admin');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] text-[#1C1613] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans-clean relative overflow-hidden">
      
      {/* Ambient background glow accents */}
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-[#9B2242]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Storefront Link */}
      <header className="w-full max-w-md flex items-center justify-between z-10 py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div 
            className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 overflow-hidden shadow-sm"
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

      {/* Main Signup Card */}
      <main className="w-full max-w-md my-auto z-10 py-4 sm:py-6">
        <div className="rounded-3xl bg-white border border-[#EAE2D5] p-6 sm:p-8 shadow-xl space-y-5 relative">
          
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <h1 className="font-display text-2xl sm:text-3xl text-[#1C1613] tracking-wide font-normal">
              Admin Register
            </h1>
            <p className="text-xs text-[#6B5E52]">
              Create an administrator account
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

          {/* Signup Form: ONLY Username, Email, Password, Confirm Password, Register Button */}
          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="Enter password (min 4 characters)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7B6E] hover:text-[#1C1613] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7B6E] hover:text-[#1C1613] cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold tracking-wider uppercase shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Registering...' : 'Register'}</span>
            </button>
          </form>

          {/* Clean Link to Sign In */}
          <div className="pt-2 text-center text-xs text-[#6B5E52]">
            <span>Already have an account? </span>
            <Link
              href="/admin/login"
              className="text-[#936718] font-bold hover:underline"
            >
              Login
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
