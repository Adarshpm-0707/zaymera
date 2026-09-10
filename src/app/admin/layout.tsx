'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Lock
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // If on login or signup, render standalone authentication container
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup';
  if (isAuthPage) {
    return (
      <div className="admin-theme min-h-screen bg-[#0F0D0C] text-[#FAF8F5]">
        {children}
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="admin-theme h-screen max-h-screen bg-[#0F0D0C] text-[#FAF8F5] flex flex-col font-sans-clean selection:bg-[#C5A059] selection:text-black overflow-hidden">
      
      {/* Top Admin Navigation Header */}
      <header className="admin-header shrink-0 z-40 bg-[#161210]/95 backdrop-blur-md border-b border-[#2A2420] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#221B17] text-[#D4AF37] hover:text-white cursor-pointer active:scale-95"
            aria-label="Toggle menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 shadow-md overflow-hidden"
              style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', maxWidth: '36px', maxHeight: '36px' }}
            >
              <img
                src={circleLogoImg}
                alt="Zaymera Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-full bg-[#1A1412] block"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9999px' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display text-base sm:text-lg tracking-[0.2em] sm:tracking-[0.22em] text-[#FAF8F5] group-hover:text-[#E2B755] transition-colors">
                  ZAYMERA
                </span>
                <span className="text-[8px] sm:text-[9px] bg-[#9B2242] text-white px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Admin
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-[#A89887] tracking-widest uppercase">
                Haute Couture Management Suite
              </p>
            </div>
          </Link>
        </div>

        {/* Right Status Badges & Quick Action Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase status chip */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#201A16] border border-[#3A2E25] text-[10px] sm:text-[11px] text-[#C5A059]">
            <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059]" />
            <span className="hidden xs:inline">{isSupabaseConfigured ? 'Supabase Live' : 'Local Mode'}</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EAB308]'}`} />
          </div>

          <Link
            href="/admin/products/new"
            className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#241D19] hover:bg-[#332A24] border border-[#3D3129] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
            title="Open Live Boutique Storefront"
          >
            <Store className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">Storefront</span>
            <ExternalLink className="w-3 h-3 text-[#A89887]" />
          </Link>
        </div>
      </header>

      {/* Main Container with Sidebar and Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar - Fixed to Screen with Independent Scroll */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#14100E] border-r border-[#26201B] shrink-0 h-full overflow-hidden justify-between">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* Navigation Section */}
            <div>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C7A6B]">
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
                          ? 'bg-gradient-to-r from-[#2B211A] to-[#1F1713] text-[#E2B755] border-l-4 border-[#C5A059] shadow-inner font-semibold'
                          : 'text-[#B8A898] hover:bg-[#1E1815] hover:text-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-[#E2B755]' : 'text-[#8C7A6B]'}`} />
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
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C7A6B]">
                Storefront Links
              </div>
              <div className="space-y-1">
                <Link
                  href="/products"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-[#9E8E7E] hover:text-white hover:bg-[#1C1613] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Catalog Page</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#736353]" />
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-[#9E8E7E] hover:text-white hover:bg-[#1C1613] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-[#9B2242]" />
                    <span>Home Page</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#736353]" />
                </Link>
                <Link
                  href="/admin/login"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-[#9E8E7E] hover:text-white hover:bg-[#1C1613] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#E2B755]" />
                    <span>Executive Auth Portal</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-[#736353]" />
                </Link>
              </div>
            </div>

          </div>

          {/* Bottom Card / System Status */}
          <div className="p-3 m-3 rounded-2xl bg-[#1A1411] border border-[#2D241E] shrink-0 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FAF8F5]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Database Sync Active</span>
            </div>
            <p className="text-[10px] text-[#8A7969] leading-relaxed">
              Added products immediately appear on the Home Page and Catalog.
            </p>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileNavOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <div 
              className="w-[82%] max-w-xs h-full bg-[#14100E] border-r border-[#2B231D] p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#2A221C]">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 overflow-hidden"
                      style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', maxWidth: '28px', maxHeight: '28px' }}
                    >
                      <img 
                        src={circleLogoImg} 
                        alt="Logo" 
                        width={28}
                        height={28}
                        className="w-full h-full rounded-full object-cover block" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9999px' }}
                      />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#C5A059]">Admin Atelier</span>
                  </div>
                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="p-1.5 rounded-lg bg-[#201915] text-[#8C7A6B] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                        onClick={() => setIsMobileNavOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium ${
                          active
                            ? 'bg-[#2A2019] text-[#E2B755] font-semibold border-l-4 border-[#C5A059]'
                            : 'text-[#B8A898] hover:bg-[#1E1815]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${active ? 'text-[#E2B755]' : 'text-[#8C7A6B]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className="text-[9px] bg-[#9B2242] text-white px-1.5 py-0.5 rounded font-bold">
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#736353]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-3 border-t border-[#2A221C] space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#736353] px-2">Storefront</div>
                  <Link
                    href="/products"
                    target="_blank"
                    prefetch={true}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#B8A898] hover:bg-[#1E1815]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Products Catalog Page</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#736353]" />
                  </Link>

                  <Link
                    href="/"
                    target="_blank"
                    prefetch={true}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#B8A898] hover:bg-[#1E1815]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Store className="w-3.5 h-3.5 text-[#9B2242]" />
                      <span>Home Storefront</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#736353]" />
                  </Link>

                  <Link
                    href="/admin/login"
                    prefetch={true}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#B8A898] hover:bg-[#1E1815]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Lock className="w-3.5 h-3.5 text-[#E2B755]" />
                      <span>Executive Auth Portal</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#736353]" />
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1411] border border-[#2B211A] text-[11px] text-[#A89887] text-center">
                Zaymera Atelier v1.0 • Admin Suite
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport with mobile bottom padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 sm:pb-24 lg:pb-8 bg-[#0F0D0C]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>

      {/* Mobile Bottom Quick Dock (App-Like Touch Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#14100E]/95 backdrop-blur-md border-t border-[#2A221C] px-2 py-1.5 flex items-center justify-around">
        
        {/* Overview */}
        <Link
          href="/admin"
          prefetch={true}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[9.5px] font-medium transition-colors ${
            pathname === '/admin' ? 'text-[#E2B755]' : 'text-[#8C7B6C] hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Overview</span>
        </Link>

        {/* Products */}
        <Link
          href="/admin/products"
          prefetch={true}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[9.5px] font-medium transition-colors ${
            pathname === '/admin/products' ? 'text-[#E2B755]' : 'text-[#8C7B6C] hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          <span>Products</span>
        </Link>

        {/* Center Floating Plus Button */}
        <Link
          href="/admin/products/new"
          prefetch={true}
          className="relative -top-3 flex flex-col items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#9B2242] text-white shadow-lg shadow-[#9B2242]/30 active:scale-95 transition-transform"
          title="Add Product"
        >
          <PlusCircle className="w-5 h-5" />
        </Link>

        {/* Orders */}
        <Link
          href="/admin/orders"
          prefetch={true}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[9.5px] font-medium transition-colors ${
            pathname === '/admin/orders' ? 'text-[#E2B755]' : 'text-[#8C7B6C] hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Orders</span>
        </Link>

        {/* Inquiries */}
        <Link
          href="/admin/inquiries"
          prefetch={true}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[9.5px] font-medium transition-colors ${
            pathname === '/admin/inquiries' ? 'text-[#E2B755]' : 'text-[#8C7B6C] hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span>Inquiries</span>
        </Link>

      </nav>

    </div>
  );
}
