'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SLIDES_DATA } from '@/constants/slides';
import { PRODUCTS_CATALOG } from '@/constants/catalog';
import { SlideData, ProductItem } from '@/types';
import { fetchProducts, getInitialProducts, getLocalProducts, fetchCategories, CategoryItem } from '@/lib/supabase/services';

// Modular Layout Components
import { Header } from '@/components/layout/Header';
import { CategoryMegaMenu } from '@/components/layout/CategoryMegaMenu';

// Sections
import { HeroMinimal } from '@/components/sections/HeroMinimal';
import { StoreExperienceSection } from '@/components/sections/StoreExperienceSection';

// Modals
import { ProductQuickView } from '@/components/modals/ProductQuickView';
import { SearchModal } from '@/components/modals/SearchModal';
import { TrackOrderModal } from '@/components/modals/TrackOrderModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { ContactModal } from '@/components/modals/ContactModal';

// Drawers
import { CartDrawer } from '@/components/drawers/CartDrawer';
import { WishlistDrawer } from '@/components/drawers/WishlistDrawer';

// Widgets
import { WhatsAppWidget } from '@/components/widgets/WhatsAppWidget';

// Custom Hooks
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

export default function Home() {
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 0. Fetch categories
    fetchCategories().then(res => {
      if (res.data) {
        setCategoriesList(res.data);
      }
    }).catch(() => {});
    // 1. Immediately hydrate from local cache on client mount (avoids hydration mismatch)
    const local = getLocalProducts();
    if (local && local.length > 0) {
      setProductsList(local);
      setIsLoading(false);
    }

    // 2. Fetch latest data from database/API
    fetchProducts().then(res => {
      if (res.data && res.data.length > 0) {
        setProductsList(res.data);
      }
    }).catch(err => {
      console.error('Failed to load products:', err);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Cart & Wishlist hooks
  const {
    cartItems,
    totalCartCount,
    addToCart,
    addCustomToCart,
    removeCartItem,
    updateCartQuantity,
    clearCart
  } = useCart();


  const {
    wishlistItems,
    wishlistCount,
    wishlistIds,
    toggleWishlist,
    removeWishlistItem,
    isProductWishlisted
  } = useWishlist();

  // Modal & Navigation States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [selectedSlideProduct, setSelectedSlideProduct] = useState<SlideData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const router = useRouter();

  const handleAddDirectProduct = (product: ProductItem, size?: string) => {
    addToCart(product, size);
    setIsCartOpen(true);
  };

  const handleBuyNowDirect = (product: ProductItem, size?: string) => {
    addToCart(product, size);
    setIsCartOpen(true);
  };

  const handleShopNow = (slide: SlideData) => {
    if (slide.productSlug) {
      router.push(`/products/detail?id=${encodeURIComponent(slide.productSlug)}`);
    } else {
      router.push('/products');
    }
  };

  const handleSelectProductForView = (product: ProductItem) => {
    router.push(`/products/detail?id=${encodeURIComponent(product.id)}`);
  };

  const handleExploreCategory = (category: string) => {
    setSelectedCategory(category);
    const catalogElem = document.getElementById('store-catalog');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#221C18] font-sans-clean">
      {/* Main Navigation Header */}
      <div className="relative">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={totalCartCount}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          wishlistCount={wishlistCount}
          onSelectCategory={handleExploreCategory}
          onToggleMegaMenu={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
          isMegaMenuOpen={isMegaMenuOpen}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          categories={categoriesList}
        />

        {/* Mega Menu Dropdown */}
        <CategoryMegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={handleExploreCategory}
          categories={categoriesList}
        />
      </div>

      {/* 3. Hero Section */}
      <main className="flex-1">
        <HeroMinimal
          slides={SLIDES_DATA}
          onShopNow={handleShopNow}
          onExploreCategory={handleExploreCategory}
        />

        {/* 4. Curated Store Experience & Arrivals */}
        <div id="store-catalog">
          <StoreExperienceSection
            products={productsList}
            isLoading={isLoading}
            onQuickViewProduct={handleSelectProductForView}
            onAddToCart={handleAddDirectProduct}
            onBuyNow={handleBuyNowDirect}
            selectedCategory={selectedCategory}
            onSelectCategory={handleExploreCategory}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            categories={categoriesList}
          />
        </div>
      </main>

      {/* 5. Floating WhatsApp Concierge Widget */}
      <WhatsAppWidget />

      {/* 6. Modals & Drawers */}

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={removeWishlistItem}
        onAddToCart={handleAddDirectProduct}
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
}
