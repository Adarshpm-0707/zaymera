'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { circleLogoImg } from '@/constants/catalog';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, user, signOut, isConfigured } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          setErrorMessage(error.message || 'Registration failed. Please check your details.');
        } else {
          setSuccessMessage('Account created successfully! Check your email or sign in.');
          setTimeout(() => {
            onClose();
            setSuccessMessage(null);
          }, 1800);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error.message || 'Invalid credentials. Please try again.');
        } else {
          setSuccessMessage('✨ Welcome back to Zaymera Atelier!');
          setTimeout(() => {
            onClose();
            setSuccessMessage(null);
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E5DCCE] shadow-2xl p-6 sm:p-8 text-[#2B231D]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] shadow-md mb-3 overflow-hidden" style={{ width: '56px', height: '56px' }}>
            <img
              src={circleLogoImg}
              alt="Zaymera Logo"
              width={56}
              height={56}
              className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <h3 className="font-display text-2xl font-normal text-[#221C18] tracking-wide">
            {user
              ? 'Your Zaymera Account'
              : isRegister
              ? 'Create Zaymera Account'
              : 'Welcome to Zaymera Atelier'}
          </h3>
          <p className="text-xs text-[#7A6D60] mt-1 font-light font-sans-clean">
            {user
              ? 'Manage your orders, bespoke fitting records, and VIP bridal privileges.'
              : 'Access VIP bridal previews, bespoke custom fitting records, and fast order tracking.'}
          </p>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Supabase Setup Notice:</strong> Add your real Supabase credentials in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.env</code> to connect live auth & database.
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EADBCC] text-left">
              <div className="text-[11px] text-[#8C7A68] uppercase tracking-wider font-semibold">Logged in as</div>
              <div className="font-semibold text-sm text-[#221C18] mt-0.5">{user.email}</div>
              {user.user_metadata?.full_name && (
                <div className="text-xs text-[#5D5042] mt-1">Name: {user.user_metadata.full_name}</div>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-[#221C18] hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-[#A89887]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-[#A89887]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#A89887]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#A89887]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? isRegister
                  ? 'Creating Account...'
                  : 'Signing In...'
                : isRegister
                ? 'Register & Join'
                : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMessage(null);
                }}
                className="text-xs text-[#9B2242] font-semibold hover:underline cursor-pointer"
              >
                {isRegister
                  ? 'Already have an account? Sign In'
                  : 'New to Zaymera? Create an Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
