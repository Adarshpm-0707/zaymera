'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Printer, 
  Search, 
  ChevronRight, 
  Phone, 
  Mail, 
  Clock, 
  FileText,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CategoryMegaMenu } from '@/components/layout/CategoryMegaMenu';
import { CartDrawer } from '@/components/drawers/CartDrawer';
import { WishlistDrawer } from '@/components/drawers/WishlistDrawer';
import { SearchModal } from '@/components/modals/SearchModal';
import { TrackOrderModal } from '@/components/modals/TrackOrderModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { ContactModal } from '@/components/modals/ContactModal';
import { WhatsAppWidget } from '@/components/widgets/WhatsAppWidget';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { fetchCategories, fetchProducts, CategoryItem } from '@/lib/supabase/services';
import { ProductItem } from '@/types';
import './legal.css';

export interface PolicySection {
  id: string;
  number: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface LegalPageShellProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  activeTab: 'privacy' | 'terms';
  sections: PolicySection[];
}

export const LegalPageShell: React.FC<LegalPageShellProps> = ({
  title,
  subtitle,
  lastUpdated,
  activeTab,
  sections,
}) => {
  const router = useRouter();

  // Navigation & Drawers state
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);

  // Search filter inside the legal document
  const [searchFilter, setSearchFilter] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || '');

  const {
    cartItems,
    totalCartCount,
    addToCart,
    removeCartItem,
    updateCartQuantity,
    clearCart,
  } = useCart();

  const {
    wishlistItems,
    wishlistCount,
    removeWishlistItem,
  } = useWishlist();

  useEffect(() => {
    fetchCategories().then(res => {
      if (res.data) setCategoriesList(res.data);
    }).catch(() => {});

    fetchProducts().then(res => {
      if (res.data) setProductsList(res.data);
    }).catch(() => {});
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSectionId(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const cleanPhone = SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || '917306115950';

  const filteredSections = sections.filter(sec => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      sec.title.toLowerCase().includes(query) ||
      sec.number.toLowerCase().includes(query)
    );
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSectionId(id);
    }
  };

  const handleSelectProductForView = (product: ProductItem) => {
    router.push(`/products/detail?id=${encodeURIComponent(product.id)}`);
  };

  return (
    <div className="legal-page-container min-h-screen bg-[#FAF8F5] text-[#221C18] flex flex-col font-jakarta">
      {/* 1. Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={totalCartCount}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlistCount}
        onSelectCategory={(category) => {
          router.push(`/products?category=${encodeURIComponent(category)}`);
        }}
        onToggleMegaMenu={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
        isMegaMenuOpen={isMegaMenuOpen}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        categories={categoriesList}
      />

      {/* 2. Mega Menu */}
      <div className="relative z-40">
        <CategoryMegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={(category) => {
            setIsMegaMenuOpen(false);
            router.push(`/products?category=${encodeURIComponent(category)}`);
          }}
          categories={categoriesList}
        />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="legal-hero-section relative overflow-hidden bg-gradient-to-b from-[#F4EFE6] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#EAE2D2] pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-[#8C7A6B] mb-6 font-medium">
              <Link href="/" className="hover:text-[#9B2242] transition-colors">
                Atelier Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#C5B5A1]" />
              <span className="text-[#8C7A6B]">Legal Governance</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#C5B5A1]" />
              <span className="text-[#9B2242] font-semibold">{title}</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="legal-charter-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border border-[#E5DBCA] text-[11px] font-semibold text-[#8A5A1E]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Official Atelier Legal Charter</span>
                  <span className="text-[#D6CBB8]">•</span>
                  <span>{lastUpdated}</span>
                </div>

                <h1 className="legal-title font-tenor text-3xl sm:text-4xl lg:text-5xl text-[#1C1613] tracking-wide font-normal">
                  {title}
                </h1>
                
                <p className="legal-subtitle text-sm sm:text-base text-[#6B5E52] leading-relaxed max-w-2xl font-normal">
                  {subtitle}
                </p>
              </div>

              {/* Action Buttons & Tabs Switcher */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Switcher Tab Pill */}
                <div className="legal-tabs-pill inline-flex p-1 rounded-xl bg-white border border-[#E5DBCA]">
                  <Link
                    href="/privacy"
                    className={`legal-tab-link ${
                      activeTab === 'privacy'
                        ? 'legal-tab-link-active'
                        : 'legal-tab-link-inactive'
                    }`}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className={`legal-tab-link ${
                      activeTab === 'terms'
                        ? 'legal-tab-link-active'
                        : 'legal-tab-link-inactive'
                    }`}
                  >
                    Terms & Conditions
                  </Link>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="legal-action-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#E5DBCA] text-xs font-medium text-[#4A3F35] transition-all cursor-pointer"
                  title="Print this policy document"
                >
                  <Printer className="w-3.5 h-3.5 text-[#9B2242]" />
                  <span className="hidden sm:inline">Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Column: Sticky Table of Contents & Support Box */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              {/* Search Bar inside Policy */}
              <div className="legal-card bg-white rounded-2xl p-4 border border-[#EAE2D2]">
                <label htmlFor="policy-search" className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6C5F] mb-2">
                  Search Within Clauses
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A39281]" />
                  <input
                    id="policy-search"
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search keywords (e.g. refunds, data)..."
                    className="legal-search-input w-full pl-9 pr-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DBCA] text-xs text-[#1C1613] placeholder-[#A89886]"
                  />
                  {searchFilter && (
                    <button 
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#A89886] hover:text-[#1C1613]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Contents Box */}
              <div className="legal-card bg-white rounded-2xl p-5 border border-[#EAE2D2]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0E9DC]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B2242] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Table of Contents
                  </span>
                  <span className="text-[10px] text-[#A39281] font-mono">
                    {filteredSections.length} sections
                  </span>
                </div>

                <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredSections.length === 0 ? (
                    <p className="text-xs text-[#8C7A6B] py-2">No clauses match your search.</p>
                  ) : (
                    filteredSections.map((sec) => {
                      const isActive = activeSectionId === sec.id;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => scrollToSection(sec.id)}
                          className={`legal-toc-item ${isActive ? 'legal-toc-item-active' : ''}`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-mono text-[#C5A059] shrink-0 font-medium">
                              {sec.number}
                            </span>
                            <span className="truncate">{sec.title}</span>
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                            isActive ? 'text-[#9B2242]' : 'text-[#D6CBB8]'
                          }`} />
                        </button>
                      );
                    })
                  )}
                </nav>
              </div>

              {/* Concierge Assistance Card */}
              <div className="legal-concierge-box rounded-2xl p-5 border border-[#E5DBCA]">
                <div className="flex items-center gap-2 text-[#9B2242] mb-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="font-tenor text-sm font-medium tracking-wide text-[#1C1613]">
                    Atelier Legal Counsel
                  </h4>
                </div>
                <p className="text-xs text-[#6B5E52] leading-relaxed mb-4">
                  Have inquiries regarding our custom sizing covenants, intellectual property, or privacy security?
                </p>

                <div className="space-y-2 text-xs">
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello Zaymera Concierge, I am reviewing the ${title} and have a legal question.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#25D366]/30 hover:bg-[#25D366]/10 text-[#128C7E] font-semibold transition-all shadow-sm"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span className="truncate">Concierge WhatsApp</span>
                  </a>

                  <a
                    href={`mailto:${SITE_CONFIG.conciergeEmail}?subject=${encodeURIComponent(`Legal Inquiry: ${title}`)}`}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2D8C7] hover:bg-[#FAF8F5] text-[#4A3F35] font-medium transition-all shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-[#9B2242] shrink-0" />
                    <span className="truncate">{SITE_CONFIG.conciergeEmail}</span>
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Column: Policy Content Clauses */}
            <div className="lg:col-span-8 space-y-6">
              {/* Summary Highlight Box */}
              <div className="legal-card p-5 sm:p-6 rounded-2xl bg-white border border-[#EAE2D2] relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAF6EE] border border-[#E2D8C7] text-[#C5A059] shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#9B2242]" />
                  </div>
                  <div>
                    <h3 className="font-tenor text-base sm:text-lg text-[#1C1613] font-medium">
                      Executive Summary & Commitment
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#6B5E52] mt-1.5 leading-relaxed">
                      At ZAYMERA Haute Couture, we treat our clients with the utmost discretion, transparency, and integrity. This document sets out the legal principles governing your relationship with our atelier, your digital privacy, our bespoke tailor covenant, and order fulfillment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Policy Sections */}
              {filteredSections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="legal-section-card p-6 sm:p-8 rounded-2xl bg-white border border-[#EAE2D2]"
                >
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F5EFEB]">
                    <span className="legal-section-number">
                      {sec.number}
                    </span>
                    <h2 className="legal-section-title font-tenor text-lg sm:text-xl text-[#1C1613] font-normal tracking-wide">
                      {sec.title}
                    </h2>
                  </div>

                  <div className="legal-clause-content text-xs sm:text-[13px] text-[#554D46] leading-relaxed space-y-3">
                    {sec.content}
                  </div>
                </article>
              ))}

              {/* Bottom Clarification & Related Legal Link */}
              <div className="legal-card p-6 rounded-2xl bg-white border border-[#EAE2D2] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-tenor text-sm text-[#1C1613] font-medium">
                    Explore Complementary Policies
                  </h4>
                  <p className="text-xs text-[#7A6D60] mt-0.5">
                    {activeTab === 'privacy'
                      ? 'Read our client service terms, bespoke crafting timelines, and delivery covenants.'
                      : 'Learn how we secure your personal measurements, authentication credentials, and privacy.'}
                  </p>
                </div>

                <Link
                  href={activeTab === 'privacy' ? '/terms' : '/privacy'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1613] hover:bg-[#332720] text-white text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0"
                >
                  <span>{activeTab === 'privacy' ? 'View Terms & Conditions' : 'View Privacy Policy'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* 5. Editorial Footer */}
      <Footer />

      {/* 6. Floating WhatsApp Concierge */}
      <WhatsAppWidget />

      {/* 7. Drawers & Modals */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={removeWishlistItem}
        onAddToCart={(prod, size) => {
          addToCart(prod, size);
          setIsCartOpen(true);
        }}
        onQuickViewProduct={handleSelectProductForView}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeCartItem}
        onUpdateQuantity={updateCartQuantity}
        onClearCart={clearCart}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleSelectProductForView}
        products={productsList}
      />

      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};
