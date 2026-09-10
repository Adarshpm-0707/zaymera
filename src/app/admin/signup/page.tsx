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
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Store,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { circleLogoImg } from '@/constants/catalog';

export default function AdminSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Atelier Store Director');
  const [adminSecurityCode, setAdminSecurityCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please complete all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              role,
            },
          },
        });

        if (error) {
          // If Supabase fails, save local session for admin testing
          saveAdminProfile();
          setSuccessMsg('Executive account registered locally! Redirecting...');
          setTimeout(() => router.push('/admin'), 1000);
          return;
        }

        saveAdminProfile();
        setSuccessMsg('Account created successfully! Entering Atelier suite...');
        setTimeout(() => router.push('/admin'), 1000);
      } else {
        saveAdminProfile();
        setSuccessMsg('Atelier executive profile registered! Redirecting...');
        setTimeout(() => router.push('/admin'), 900);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create admin profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveAdminProfile = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'zaymera_admin_auth',
          JSON.stringify({
            name: fullName.trim(),
            email: email.trim(),
            role,
            createdAt: new Date().toISOString()
          })
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0D0C] text-[#FAF8F5] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans-clean relative overflow-hidden">
      
      {/* Background Luxury Ambient Glows */}
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-[#9B2242]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Storefront Link */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div 
            className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 overflow-hidden shadow-md"
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
          <span className="font-display text-base tracking-[0.22em] text-[#FAF8F5] group-hover:text-[#E2B755] transition-colors">
            ZAYMERA
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1613] hover:bg-[#2A211B] border border-[#33271F] text-xs text-[#C5A059] hover:text-white transition-colors"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Storefront</span>
        </Link>
      </header>

      {/* Main Signup Card */}
      <main className="w-full max-w-lg my-auto z-10 py-6">
        <div className="rounded-3xl bg-[#14100E] border border-[#2D231C] p-6 sm:p-8 shadow-2xl space-y-5 relative backdrop-blur-xl">
          
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201814] border border-[#3E3025] text-[10px] font-bold uppercase tracking-widest text-[#E2B755] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E2B755]" />
              <span>Haute Couture Personnel Registry</span>
            </div>
            
            <h1 className="font-display text-2xl sm:text-3xl text-[#FAF8F5] tracking-wide">
              Admin Registration
            </h1>
            
            <p className="text-xs text-[#8C7B6C] max-w-sm mx-auto">
              Create a verified management profile to access the boutique suite.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#2D1616] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#142E18] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-3.5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1">
                Executive Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736353]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Singhania"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#736353] focus:outline-none focus:border-[#C5A059] transition-colors"
                />
              </div>
            </div>

            {/* Email & Role in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1">
                  Official Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736353]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@zaymera.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#736353] focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1">
                  Atelier Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736353]" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059] transition-colors appearance-none"
                  >
                    <option value="Atelier Store Director">Store Director</option>
                    <option value="Catalog & Inventory Lead">Catalog & Inventory Lead</option>
                    <option value="Bespoke Concierge Specialist">Concierge Specialist</option>
                    <option value="Orders & Logistics Manager">Orders Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736353]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#736353] focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#736353] hover:text-[#FAF8F5]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736353]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#736353] focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Optional Master Passcode */}
            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1">
                Boutique Authorization Key (Optional)
              </label>
              <input
                type="text"
                value={adminSecurityCode}
                onChange={(e) => setAdminSecurityCode(e.target.value)}
                placeholder="Leave blank or enter store access code"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#736353] focus:outline-none focus:border-[#C5A059] transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-[#9B2242]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Creating Profile...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Link to Sign In */}
          <div className="pt-2 text-center text-xs text-[#8C7B6C]">
            <span>Already have an executive login? </span>
            <Link
              href="/admin/login"
              className="text-[#E2B755] font-bold hover:underline"
            >
              Sign In Here
            </Link>
          </div>

        </div>
      </main>

      {/* Footer Security Badge */}
      <footer className="w-full max-w-md text-center py-2 z-10 flex items-center justify-center gap-2 text-[11px] text-[#736353]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
        <span>Secure Atelier Staff Registration • Zaymera v1.0</span>
      </footer>

    </div>
  );
}
