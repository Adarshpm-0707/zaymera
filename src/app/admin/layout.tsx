'use client';

import './admin.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Layers,
  Users,
  Tag,
  MessageSquare,
  Megaphone,
  Settings,
  ExternalLink,
  Store,
  Menu,
  X,
  Sparkles,
  Database,
  CheckCircle2,
  ChevronRight,
  Shield,
  Lock,
  LogOut,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { circleLogoImg } from '@/constants/catalog';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: 'All Products',
    href: '/admin/products',
    icon: Package,
    badge: null,
  },
  {
    label: 'Add New Product',
    href: '/admin/products/new',
    icon: PlusCircle,
    badge: 'Live',
  },
  {
    label: 'Orders Control',
    href: '/admin/orders',
    icon: ShoppingBag,
    badge: null,
  },
  {
    label: 'Categories & Lookbooks',
    href: '/admin/categories',
    icon: Layers,
    badge: null,
  },
  {
    label: 'Clients & VIPs',
    href: '/admin/customers',
    icon: Users,
    badge: null,
  },
  {
    label: 'Coupons & Promos',
    href: '/admin/coupons',
    icon: Tag,
    badge: null,
  },
  {
    label: 'Bespoke Inquiries',
    href: '/admin/inquiries',
    icon: MessageSquare,
    badge: null,
  },
  {
    label: 'Banners & Broadcast',
    href: '/admin/banners',
    icon: Megaphone,
    badge: null,
  },
  {
    label: 'Settings & Database',
    href: '/admin/settings',
    icon: Settings,
    badge: null,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [adminAuth, setAdminAuth] = useState<{
    username: string;
    name?: string;
    role?: string;
    email?: string;
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Read admin session from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('zaymera_admin_auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.username || parsed.email)) {
            setAdminAuth(parsed);
          } else {
            setAdminAuth(null);
          }
        } else {
          setAdminAuth(null);
        }
      } catch {
        setAdminAuth(null);
      } finally {
        setIsCheckingAuth(false);
      }
    }
  }, [pathname]);

  // Close mobile navigation drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };
    if (isMobileNavOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('zaymera_admin_auth');
      } catch (e) {
        console.error(e);
      }
    }
    setAdminAuth(null);
    router.push('/admin/login');
  };

  // If on login or signup page, render standalone authentication container
  const isAuthPage = pathname?.startsWith('/admin/login') || pathname?.startsWith('/admin/signup');
  if (isAuthPage) {
    return (
      <div className="admin-theme min-h-[100dvh] bg-[#FAF8F5] text-[#1C1613]">
        {children}
      </div>
    );
  }

  // Authentication Guard: if not authenticated, display luxury login required screen
  if (!isCheckingAuth && !adminAuth) {
    return (
      <div className="admin-theme min-h-[100dvh] bg-[#FAF8F5] text-[#1C1613] flex flex-col justify-between items-center p-4 sm:p-8 font-sans-clean relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-[#9B2242]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="w-full max-w-4xl flex items-center justify-between z-10 py-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 overflow-hidden shadow-xs">
              <img src={circleLogoImg} alt="Logo" width={32} height={32} className="w-full h-full object-cover rounded-full bg-white block" />
            </div>
            <span className="font-display text-base tracking-[0.22em] text-[#1C1613]">ZAYMERA</span>
          </Link>
          <Link href="/" className="text-xs text-[#936718] hover:text-[#1C1613] flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
        </header>

        {/* Access Restricted Prompt */}
        <main className="w-full max-w-md my-auto z-10 py-6 text-center">
          <div className="rounded-3xl bg-white border border-[#EAE2D5] p-6 sm:p-8 shadow-xl space-y-5 relative">
            <div className="w-16 h-16 rounded-full bg-[#FAF6EE] border border-[#E5DAC8] flex items-center justify-center mx-auto text-[#936718] shadow-xs">
              <Lock className="w-7 h-7 text-[#936718]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] text-[10px] font-bold uppercase tracking-widest text-[#936718]">
                <Shield className="w-3 h-3 text-[#936718]" />
                <span>Protected Suite</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#1C1613]">
                Authentication Required
              </h1>
              <p className="text-xs text-[#6B5E52] leading-relaxed max-w-xs mx-auto">
                Please sign in with your administrator username and password to access the store management suite.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/admin/login"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold tracking-wider uppercase shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to Admin</span>
                <ArrowRight className="w-4 h-4" />
              </Link>


              <div className="pt-2 text-center text-xs text-[#6B5E52]">
                <span>New administrator? </span>
                <Link href="/admin/signup" className="text-[#936718] font-bold hover:underline">
                  Register Admin Account
                </Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center py-2 text-[11px] text-[#8A7B6E]">
          Zaymera Haute Couture Management Portal
        </footer>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  const adminDisplayName = adminAuth?.name || adminAuth?.username || 'Admin';
  const adminRole = adminAuth?.role || 'Store Director';

  return (
    <div className="admin-theme min-h-[100dvh] h-[100dvh] max-h-[100dvh] bg-[#FAF8F5] text-[#1C1613] flex flex-col font-sans-clean selection:bg-[#C5A059] selection:text-white overflow-hidden">
      
      {/* Top Admin Navigation Header */}
      <header className="admin-header shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE2D5] px-3 sm:px-5 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl bg-[#F6F1E8] text-[#936718] hover:text-[#1C1613] hover:bg-[#EFE7DA] cursor-pointer active:scale-95 transition-colors shrink-0"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 shadow-xs overflow-hidden"
              style={{ width: '34px', height: '34px', minWidth: '34px', minHeight: '34px' }}
            >
              <img
                src={circleLogoImg}
                alt="Zaymera Logo"
                width={34}
                height={34}
                className="w-full h-full object-cover rounded-full bg-white block"
              />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display text-sm sm:text-lg tracking-[0.18em] sm:tracking-[0.22em] text-[#1C1613] group-hover:text-[#936718] transition-colors">
                  ZAYMERA
                </span>
                <span className="text-[8px] sm:text-[9px] bg-[#9B2242] text-white px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shrink-0">
                  Admin
                </span>
              </div>
              <p className="hidden sm:block text-[9.5px] sm:text-[10px] text-[#7A6959] tracking-widest uppercase truncate">
                Haute Couture Management Suite
              </p>
            </div>
          </Link>
        </div>

        {/* Right Status Badges, Logged-in Profile, & Quick Action Links */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Supabase status chip */}
          <div 
            className="hidden md:flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-[#F7F3EB] border border-[#E5DAC8] text-[10px] sm:text-[11px] text-[#936718]"
            title={isSupabaseConfigured ? 'Connected to Supabase cloud' : 'Running in local mode'}
          >
            <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#936718] shrink-0" />
            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local Mode'}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${isSupabaseConfigured ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EAB308]'}`} />
          </div>

          {/* Logged-in Admin Badge */}
          {adminAuth && (
            <div className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] text-xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#9B2242] text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                {adminDisplayName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-[11px] font-bold text-[#1C1613] truncate max-w-[100px]">
                  {adminDisplayName}
                </span>
                <span className="block text-[9px] text-[#8A7B6E] truncate max-w-[100px]">
                  {adminRole}
                </span>
              </div>
            </div>
          )}

          {/* Add Product Button */}
          <Link
            href="/admin/products/new"
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>

          {/* Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#F7F3EB] hover:bg-[#EFE7DA] border border-[#E0D5C3] text-[#1C1613] text-xs font-medium transition-colors cursor-pointer"
            title="Open Live Boutique Storefront"
          >
            <Store className="w-3.5 h-3.5 text-[#936718] shrink-0" />
            <span className="hidden md:inline">Storefront</span>
            <ExternalLink className="w-3 h-3 text-[#7A6959] shrink-0" />
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Sign Out of Admin"
          >
            <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </header>

      {/* Main Container with Sidebar and Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar - Fixed to Screen with Independent Scroll */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#EAE2D5] shrink-0 h-full overflow-hidden justify-between shadow-xs">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* Navigation Section */}
            <div>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A7B6E]">
                Management
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#F6EEDF] to-[#FCF8F2] text-[#936718] border-l-4 border-[#C5A059] shadow-xs font-semibold'
                          : 'text-[#635345] hover:bg-[#F6F1E8] hover:text-[#1C1613]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-[#936718]' : 'text-[#8A7B6E]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] bg-[#9B2242] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Links Section */}
            <div>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A7B6E]">
                Storefront Links
              </div>
              <div className="space-y-1">
                <Link
                  href="/products"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-[#635345] hover:text-[#1C1613] hover:bg-[#F6F1E8] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#936718]" />
                    <span>Catalog Page</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#8A7B6E]" />
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-[#635345] hover:text-[#1C1613] hover:bg-[#F6F1E8] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-[#9B2242]" />
                    <span>Home Page</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#8A7B6E]" />
                </Link>
              </div>
            </div>

          </div>

          {/* Bottom Card / Logged In Admin Profile & Logout */}
          <div className="p-3 m-3 rounded-2xl bg-[#FBF9F5] border border-[#EBE3D6] shrink-0 space-y-2.5 shadow-xs">
            {adminAuth && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#9B2242] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {adminDisplayName.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#1C1613] truncate">{adminDisplayName}</p>
                    <p className="text-[10px] text-[#8A7B6E] truncate">{adminRole}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1C1613] pt-1 border-t border-[#EBE3D6]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Database Sync Active</span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer (Accessible & Full-Height Scrollable) */}
        {isMobileNavOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileNavOpen(false)}
            aria-modal="true"
            role="dialog"
          >
            <div 
              className="w-[85%] max-w-xs h-full bg-white border-r border-[#EAE2D5] flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Top Header (Sticky) */}
              <div className="flex items-center justify-between p-4 border-b border-[#EAE2D5] shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 overflow-hidden shadow-xs"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <img 
                      src={circleLogoImg} 
                      alt="Logo" 
                      width={28}
                      height={28}
                      className="w-full h-full rounded-full object-cover block bg-white" 
                    />
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase text-[#936718]">Admin Atelier</span>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F6F1E8] text-[#7A6959] hover:text-[#1C1613] cursor-pointer active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Navigation Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <nav className="space-y-1">
                  <div className="px-2 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#8A7B6E]">
                    Control Modules
                  </div>
                  {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={() => setIsMobileNavOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium min-h-[44px] transition-all ${
                          active
                            ? 'bg-gradient-to-r from-[#F6EEDF] to-[#FCF8F2] text-[#936718] font-semibold border-l-4 border-[#C5A059] shadow-xs'
                            : 'text-[#635345] hover:bg-[#F6F1E8] hover:text-[#1C1613]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${active ? 'text-[#936718]' : 'text-[#8A7B6E]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className="text-[9px] bg-[#9B2242] text-white px-1.5 py-0.5 rounded font-bold">
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#8A7B6E]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-3 border-t border-[#EAE2D5] space-y-1">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#8A7B6E] px-2 pb-1">
                    Storefront Links
                  </div>
                  <Link
                    href="/products"
                    target="_blank"
                    prefetch={true}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#635345] hover:text-[#1C1613] hover:bg-[#F6F1E8] min-h-[40px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#936718]" />
                      <span>Products Catalog</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#8A7B6E]" />
                  </Link>

                  <Link
                    href="/"
                    target="_blank"
                    prefetch={true}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#635345] hover:text-[#1C1613] hover:bg-[#F6F1E8] min-h-[40px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Store className="w-3.5 h-3.5 text-[#9B2242]" />
                      <span>Home Storefront</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#8A7B6E]" />
                  </Link>
                </div>
              </div>

              {/* Drawer Bottom Footer with Logout */}
              <div className="p-3.5 border-t border-[#EAE2D5] bg-[#FAF8F5] shrink-0 safe-bottom space-y-2">
                {adminAuth && (
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#1C1613] truncate">{adminDisplayName}</p>
                      <p className="text-[10px] text-[#8A7B6E] truncate">{adminRole}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        handleLogout();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-bold text-[#DC2626] flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-[#7A6959] text-center">
                  Zaymera Atelier v1.0 • Suite
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport with mobile bottom padding that clears dock */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 safe-dock-pb lg:pb-8 bg-[#FAF8F5]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>

      {/* Mobile Bottom Quick Dock */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE2D5] shadow-lg"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around">
          {/* Overview */}
          <Link
            href="/admin"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[9.5px] min-h-[44px] transition-colors ${
              pathname === '/admin' ? 'text-[#936718] font-bold' : 'text-[#7A6959] hover:text-[#1C1613]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Overview</span>
          </Link>

          {/* Products */}
          <Link
            href="/admin/products"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[9.5px] min-h-[44px] transition-colors ${
              pathname === '/admin/products' ? 'text-[#936718] font-bold' : 'text-[#7A6959] hover:text-[#1C1613]'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>Products</span>
          </Link>

          {/* Center Floating Plus Button */}
          <Link
            href="/admin/products/new"
            prefetch={true}
            className="relative -top-3 flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#9B2242] text-white shadow-md shadow-[#9B2242]/25 active:scale-90 transition-transform cursor-pointer"
            title="Add New Piece"
          >
            <PlusCircle className="w-5 h-5" />
          </Link>

          {/* Orders */}
          <Link
            href="/admin/orders"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[9.5px] min-h-[44px] transition-colors ${
              pathname === '/admin/orders' ? 'text-[#936718] font-bold' : 'text-[#7A6959] hover:text-[#1C1613]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            <span>Orders</span>
          </Link>

          {/* Inquiries */}
          <Link
            href="/admin/inquiries"
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[9.5px] min-h-[44px] transition-colors ${
              pathname === '/admin/inquiries' ? 'text-[#936718] font-bold' : 'text-[#7A6959] hover:text-[#1C1613]'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span>Inquiries</span>
          </Link>
        </div>
      </nav>

    </div>
  );
}
