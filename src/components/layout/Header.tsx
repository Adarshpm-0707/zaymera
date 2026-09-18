'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Heart,
  Shield,
  Search,
  User,
  Package,
  ArrowRight
} from 'lucide-react';
import { NAV_CATEGORIES, circleLogoImg } from '@/constants/catalog';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { fetchCategories, CategoryItem } from '@/lib/supabase/services';

interface HeaderProps {
  onOpenCart: () => void;
  cartCount: number;
  onOpenWishlist: () => void;
  wishlistCount: number;
  onSelectCategory: (category: string) => void;
  onToggleMegaMenu: () => void;
  isMegaMenuOpen: boolean;
  onOpenTrackOrder: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  categories?: CategoryItem[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  cartCount,
  onOpenWishlist,
  wishlistCount,
  onSelectCategory,
  onToggleMegaMenu,
  isMegaMenuOpen,
  onOpenTrackOrder,
  onOpenSearch,
  onOpenAuth,
  categories
}) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [dynCategories, setDynCategories] = useState<CategoryItem[]>(categories || []);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setDynCategories(categories);
    } else {
      fetchCategories().then(({ data }) => {
        if (data) setDynCategories(data);
      }).catch(() => {});
    }
  }, [categories]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const getHrefForSlug = (slug: string): string | null => {
    if (slug === 'products-page') return '/products';
    if (slug === 'new-arrivals') return '/products?filter=new-arrivals';
    if (slug === 'most-selling') return '/products?filter=bestseller';
    return null;
  };

  const handleNavClick = (slug: string) => {
    if (slug === 'all') {
      onToggleMegaMenu();
    } else if (slug === 'products-page') {
      router.push('/products');
    } else if (slug === 'track-order') {
      onOpenTrackOrder();
    } else {
      onSelectCategory(slug);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE2D5] transition-all">
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4 lg:gap-6 xl:gap-8">
            
            {/* ── 1. Brand Logo & Tagline (Fully Responsive) ── */}
            <Link
              href="/"
              prefetch={true}
              onClick={() => {
                onSelectCategory('all');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
            >
              {/* Circular Emblem */}
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-105 overflow-hidden flex items-center justify-center">
                <img
                  src={circleLogoImg}
                  alt="Zaymera Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
                />
              </div>

              {/* Brand Typography */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center tracking-[0.18em] sm:tracking-[0.24em] lg:tracking-[0.26em]">
                  <span className="font-display text-lg sm:text-2xl lg:text-[25px] font-normal text-[#1A1412] leading-none group-hover:text-[#9B2242] transition-colors whitespace-nowrap">
                    ZAYMERA
                  </span>
                </div>
                <span className="hidden sm:block text-[7.5px] sm:text-[8px] lg:text-[8.5px] font-sans-clean font-medium tracking-[0.16em] sm:tracking-[0.24em] lg:tracking-[0.28em] text-[#8C7A6B] uppercase mt-0.5 sm:mt-1 whitespace-nowrap">
                  CLOTHING THAT SPEAK ELEGANCE
                </span>
              </div>
            </Link>

            {/* ── 2. Desktop & Laptop Navigation Bar ── */}
            <nav className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2 lg:px-4 xl:px-6">
              <div className="flex items-center space-x-2.5 xl:space-x-4 2xl:space-x-6 max-w-full">
                {NAV_CATEGORIES.map((item) => {
                  const href = getHrefForSlug(item.slug);

                  if (href) {
                    return (
                      <Link
                        key={item.name}
                        href={href}
                        prefetch={true}
                        className="relative text-[10.5px] xl:text-[11.5px] 2xl:text-[12.5px] font-sans-clean font-medium tracking-[0.09em] xl:tracking-[0.13em] text-[#3D352E] hover:text-[#9B2242] transition-colors py-2 px-1 xl:px-1.5 flex items-center gap-1 cursor-pointer uppercase whitespace-nowrap shrink-0"
                      >
                        <span>{item.name}</span>
                        {item.slug === 'new-arrivals' && (
                          <span className="relative flex h-1.5 w-1.5 ml-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9B2242] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#9B2242]"></span>
                          </span>
                        )}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.slug)}
                      className={`relative text-[10.5px] xl:text-[11.5px] 2xl:text-[12.5px] font-sans-clean font-medium tracking-[0.09em] xl:tracking-[0.13em] text-[#3D352E] hover:text-[#9B2242] transition-colors py-2 px-1 xl:px-1.5 flex items-center gap-1 cursor-pointer uppercase whitespace-nowrap shrink-0 ${
                        item.slug === 'all' && isMegaMenuOpen ? 'text-[#9B2242] font-semibold' : ''
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.hasDropdown && (
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200 ${
                            isMegaMenuOpen ? 'rotate-180 text-[#9B2242]' : 'text-[#8C7A6B]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* ── 3. Right Action Icons (Optimized for Mobile, Tablet & Laptop) ── */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {/* Search Button */}
              {onOpenSearch && (
                <button
                  onClick={onOpenSearch}
                  className="p-2 text-[#3D352E] hover:text-[#9B2242] transition-colors rounded-full hover:bg-[#FAF4EA] cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center group"
                  aria-label="Search"
                  title="Search Catalog"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75] transition-transform group-hover:scale-110" />
                </button>
              )}

        

              {/* Account / Login Button (Visible on sm+ screens, in mobile drawer on small screens) */}
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:flex p-2 text-[#3D352E] hover:text-[#9B2242] transition-colors rounded-full hover:bg-[#FAF4EA] cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] items-center justify-center group"
                  aria-label="Account"
                  title="My Account"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75] transition-transform group-hover:scale-110" />
                </button>
              )}

              {/* Wishlist Button with Badge */}
              <button
                onClick={onOpenWishlist}
                className="relative p-2 text-[#3D352E] hover:text-[#9B2242] transition-colors rounded-full hover:bg-[#FAF4EA] cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center group"
                aria-label="Wishlist"
                title="View Wishlist"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75] transition-transform group-hover:scale-110 ${wishlistCount > 0 ? 'text-[#9B2242] fill-[#9B2242]/20' : ''}`} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-[#9B2242] text-white text-[9px] sm:text-[10px] font-bold h-3.5 min-w-[0.9rem] sm:h-4 sm:min-w-[1rem] px-0.5 sm:px-1 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50 duration-200">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button with Badge */}
              <button
                onClick={onOpenCart}
                className="relative p-2 text-[#3D352E] hover:text-[#9B2242] transition-colors rounded-full hover:bg-[#FAF4EA] cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center group"
                aria-label="Shopping Cart"
                title="View Shopping Bag"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75] transition-transform group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-[#9B2242] text-white text-[9px] sm:text-[10px] font-bold h-3.5 min-w-[0.9rem] sm:h-4 sm:min-w-[1rem] px-0.5 sm:px-1 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile / Tablet Menu Toggle (lg:hidden) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#3D352E] hover:text-[#9B2242] focus:outline-none rounded-lg hover:bg-[#FAF4EA] min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center cursor-pointer transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#9B2242]" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* ── 4. Mobile & Tablet Navigation Drawer ── */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay (Tap to close) */}
            <div
              className="fixed inset-0 top-16 sm:top-20 bg-black/40 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-down Drawer Panel */}
            <div className="fixed top-16 sm:top-20 left-0 right-0 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto bg-[#FAF8F5] border-b border-[#EAE2D5] shadow-2xl z-40 lg:hidden px-4 sm:px-6 pt-3 pb-8 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
              
              {/* Drawer Header Badge */}
              <div className="pb-2 border-b border-[#EAE2D5] flex items-center justify-between text-xs text-[#8C7C6D]">
                <span className="font-semibold tracking-wider uppercase text-[10px] text-[#9B2242] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Boutique Collection Directory
                </span>
                <span className="text-[11px] text-[#8C7A68]">Curated Haute Couture</span>
              </div>

              {/* Quick Search inside Drawer */}
              {onOpenSearch && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSearch();
                  }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white text-[#55473B] text-xs font-sans-clean font-medium flex items-center justify-between border border-[#EAE1D2] hover:border-[#9B2242] shadow-sm transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Search className="w-3.5 h-3.5 text-[#9B2242]" />
                    <span className="text-[#6D5D51]">Search Collections & Ensembles...</span>
                  </span>
                  <span className="text-[10px] text-[#8C7A6B] bg-[#FAF6EE] px-2 py-0.5 rounded-md border border-[#E0D5C3]">Search</span>
                </button>
              )}

              {/* Category Links List */}
              <div className="space-y-1 pt-1">
                {NAV_CATEGORIES.map((item) => {
                  if (item.slug === 'all') {
                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                          className="w-full text-left py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-sans-clean font-medium text-[#2B231D] hover:bg-[#FAF4EA] hover:text-[#9B2242] active:bg-[#F5EDE0] flex items-center justify-between transition-colors cursor-pointer border border-transparent hover:border-[#E8DFC8]"
                        >
                          <span className="tracking-wide uppercase">{item.name}</span>
                          <ChevronDown className={`w-4 h-4 text-[#8C7A6B] transition-transform duration-200 ${mobileCategoriesOpen ? 'rotate-180 text-[#9B2242]' : ''}`} />
                        </button>
                        {mobileCategoriesOpen && (
                          <div className="pl-3 pr-2 py-1.5 space-y-1 bg-[#FAF6EE] rounded-xl border border-[#EBE3D5] my-1">
                            {dynCategories.length > 0 ? (
                              dynCategories.map(cat => (
                                <button
                                  key={cat.id || cat.slug}
                                  onClick={() => {
                                    onSelectCategory(cat.slug);
                                    setMobileMenuOpen(false);
                                  }}
                                  className="w-full text-left py-2 px-3 text-xs font-medium text-[#4A3E34] hover:text-[#9B2242] flex items-center justify-between rounded-lg hover:bg-white/60 cursor-pointer"
                                >
                                  <span>{cat.title}</span>
                                  {cat.count && <span className="text-[10px] text-[#8C7A6B]">{cat.count}</span>}
                                </button>
                              ))
                            ) : (
                              <span className="text-xs text-[#8C7A6B] py-2 px-3 block">No collections added yet</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const href = getHrefForSlug(item.slug);

                  if (href) {
                    return (
                      <Link
                        key={item.name}
                        href={href}
                        prefetch={true}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-left py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-sans-clean font-medium text-[#2B231D] hover:bg-[#FAF4EA] hover:text-[#9B2242] active:bg-[#F5EDE0] flex items-center justify-between transition-colors cursor-pointer border border-transparent hover:border-[#E8DFC8]"
                      >
                        <span className="tracking-wide uppercase">{item.name}</span>
                        {item.slug === 'new-arrivals' ? (
                          <span className="text-[9.5px] text-[#9B2242] font-bold uppercase bg-[#FAF0E6] px-2 py-0.5 rounded-full border border-[#F0D5BE]">
                            New
                          </span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-[#C4B5A5] opacity-70" />
                        )}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleNavClick(item.slug);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-sans-clean font-medium text-[#2B231D] hover:bg-[#FAF4EA] hover:text-[#9B2242] active:bg-[#F5EDE0] flex items-center justify-between transition-colors cursor-pointer border border-transparent hover:border-[#E8DFC8]"
                    >
                      <span className="tracking-wide uppercase">{item.name}</span>
                      {item.hasDropdown ? (
                        <ChevronDown className="w-4 h-4 text-[#8C7A6B]" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-[#C4B5A5] opacity-70" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* User Account & Orders Fast Access on Mobile */}
              <div className="pt-3 border-t border-[#EAE2D5] space-y-2">
                {/* WhatsApp Concierge direct button */}
                <a
                  href={`https://wa.me/${SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || '917306115950'}?text=${encodeURIComponent('Hello Zaymera Stylist, I would like to inquire about couture designs.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] font-semibold text-xs flex items-center justify-between hover:bg-[#25D366]/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp Concierge ({SITE_CONFIG.conciergePhone})</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#128C7E]" />
                </a>

                {onOpenAuth && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white border border-[#EAE1D2] text-[#3D352E] font-medium text-xs flex items-center justify-between hover:border-[#9B2242] hover:text-[#9B2242] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#9B2242]" />
                      <span>My Boutique Account / Login</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8C7A68]" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTrackOrder();
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white border border-[#EAE1D2] text-[#3D352E] font-medium text-xs flex items-center justify-between hover:border-[#9B2242] hover:text-[#9B2242] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C5A059]" />
                    <span>Track Your Atelier Order</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8C7A68]" />
                </button>
              </div>

              {/* Bottom Utility Bar */}
              <div className="pt-3 border-t border-[#EAE2D5] flex items-center justify-between text-xs text-[#8C7A68]">
                <span className="text-[11px] text-[#A39282]">
                  ✨ Bespoke Elegance
                </span>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[#9B2242] font-semibold hover:underline text-[11px]"
                >
                  <Shield className="w-3.5 h-3.5 text-[#9B2242]" />
                  <span>Admin Atelier</span>
                </Link>
              </div>

            </div>
          </>
        )}
      </header>
    </>
  );
};
