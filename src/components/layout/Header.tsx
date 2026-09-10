'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, ChevronDown, Sparkles, MapPin, Phone, Heart, Shield } from 'lucide-react';
import { NAV_CATEGORIES, circleLogoImg } from '@/constants/catalog';

interface HeaderProps {
  onOpenCart: () => void;
  cartCount: number;
  onOpenWishlist: () => void;
  wishlistCount: number;
  onSelectCategory: (category: string) => void;
  onToggleMegaMenu: () => void;
  isMegaMenuOpen: boolean;
  onOpenTrackOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  cartCount,
  onOpenWishlist,
  wishlistCount,
  onSelectCategory,
  onToggleMegaMenu,
  isMegaMenuOpen,
  onOpenTrackOrder
}) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getHrefForSlug = (slug: string): string | null => {
    if (slug === 'products-page') return '/products';
    if (slug === 'new-arrivals') return '/products?filter=new-arrivals';
    if (slug === 'most-selling') return '/products?filter=bestseller';
    if (slug === 'customized') return '/products?category=customized';
    if (slug === 'tops') return '/products?category=tops';
    if (slug === 'top-dupatta') return '/products?category=top-dupatta';
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
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE2D5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Slogan - Fast Client Link to Home */}
          <Link
            href="/"
            prefetch={true}
            onClick={() => onSelectCategory('all')} 
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] shadow-sm shrink-0 transition-transform group-hover:scale-105 overflow-hidden" style={{ width: '48px', height: '48px', minWidth: '40px', minHeight: '40px' }}>
              <img
                src={circleLogoImg}
                alt="Zaymera Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col">
              <div className="flex items-center tracking-[0.22em] sm:tracking-[0.28em]">
                <span className="font-display text-xl sm:text-[24px] lg:text-[26px] font-normal text-[#1A1412] leading-none group-hover:text-[#9B2242] transition-colors">
                  ZAYMERA
                </span>
              </div>
              <span className="text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-sans-clean font-medium tracking-[0.2em] sm:tracking-[0.3em] text-[#8C7A6B] uppercase mt-0.5 sm:mt-1 truncate max-w-[170px] sm:max-w-none">
                CLOTHING THAT SPEAK ELEGANCE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {NAV_CATEGORIES.map((item) => {
              const href = getHrefForSlug(item.slug);

              if (href) {
                return (
                  <Link
                    key={item.name}
                    href={href}
                    prefetch={true}
                    className="relative text-[11px] xl:text-[11.5px] font-sans-clean font-medium tracking-[0.14em] text-[#3D352E] hover:text-[#9B2242] transition-colors py-2 flex items-center gap-1 cursor-pointer uppercase"
                  >
                    <span>{item.name}</span>
                    {item.slug === 'new-arrivals' && (
                      <span className="absolute -top-1 -right-2 flex h-1.5 w-1.5">
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
                  className={`relative text-[11px] xl:text-[11.5px] font-sans-clean font-medium tracking-[0.14em] text-[#3D352E] hover:text-[#9B2242] transition-colors py-2 flex items-center gap-1 cursor-pointer uppercase ${
                    item.slug === 'all' && isMegaMenuOpen ? 'text-[#9B2242]' : ''
                  }`}
                >
                  <span>{item.name}</span>
                  {item.hasDropdown && (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180 text-[#9B2242]' : 'text-[#8C7A6B]'}`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-[#3D352E] hover:text-[#9B2242] transition-colors rounded-full hover:bg-[#FAF4EA] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center group"
              aria-label="Wishlist"
              title="View Wishlist"
            >
              <Heart className={`w-5 h-5 stroke-[1.75] transition-transform group-hover:scale-110 ${wishlistCount > 0 ? 'text-[#9B2242] fill-[#9B2242]/20' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#9B2242] text-white text-[10px] font-bold h-4 min-w-[1rem] px-1 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50 duration-200">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#3D352E] hover:text-[#9B2242] transition-colors rounded-full hover:bg-[#FAF4EA] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center group"
              aria-label="Shopping Cart"
              title="View Shopping Bag"
            >
              <ShoppingCart className="w-5 h-5 stroke-[1.75] transition-transform group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#9B2242] text-white text-[10px] font-bold h-4 min-w-[1rem] px-1 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#3D352E] hover:text-[#9B2242] focus:outline-none rounded-lg hover:bg-[#FAF4EA] min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#9B2242]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#EAE2D5] px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <div className="mb-2 pb-2 border-b border-[#F0EAE1] flex items-center justify-between text-xs text-[#8C7C6D]">
            <span className="font-medium tracking-wider uppercase text-[10px] text-[#9B2242]">Boutique Navigation</span>
            <span>4 Collections Ready</span>
          </div>

          {NAV_CATEGORIES.map((item) => {
            const href = getHrefForSlug(item.slug);

            if (href) {
              return (
                <Link
                  key={item.name}
                  href={href}
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left py-3 px-3.5 rounded-xl text-sm font-sans-clean font-medium text-[#2B231D] hover:bg-[#FAF4EA] hover:text-[#9B2242] active:bg-[#F5EDE0] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="tracking-wide uppercase text-xs">{item.name}</span>
                  {item.slug === 'new-arrivals' && (
                    <span className="text-[10px] text-[#9B2242] font-semibold uppercase bg-[#FAF0E6] px-2 py-0.5 rounded-full">
                      New
                    </span>
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
                className="w-full text-left py-3 px-3.5 rounded-xl text-sm font-sans-clean font-medium text-[#2B231D] hover:bg-[#FAF4EA] hover:text-[#9B2242] active:bg-[#F5EDE0] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="tracking-wide uppercase text-xs">{item.name}</span>
                {item.hasDropdown && (
                  <ChevronDown className="w-4 h-4 text-[#8C7A6B]" />
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8C7A68]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#9B2242]" />
              <span>Flagship Boutique Open</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#9B2242]" />
              <span>10 AM – 9 PM</span>
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
