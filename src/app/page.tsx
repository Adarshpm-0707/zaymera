'use client';

import React, { useState, useEffect } from 'react';
import { SLIDES_DATA } from '@/constants/slides';
import { PRODUCTS_CATALOG } from '@/constants/catalog';
import { SlideData, ProductItem } from '@/types';
import { fetchProducts, getInitialProducts, getLocalProducts } from '@/lib/supabase/services';

// Modular Layout Components
import { TopBar } from '@/components/layout/TopBar';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    updateCartQuantity
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

  const handleAddToCartFromQuickView = (productName: string, priceStr: string, size: string) => {
    addCustomToCart(productName, priceStr, size, selectedSlideProduct?.image);
    setIsCartOpen(true);
  };

  const handleAddDirectProduct = (product: ProductItem, size?: string) => {
    addToCart(product, size);
    setIsCartOpen(true);
  };

  const handleBuyNowDirect = (product: ProductItem, size?: string) => {
    addToCart(product, size);
    setIsCartOpen(true);
  };

  const handleShopNow = (slide: SlideData) => {
    setSelectedSlideProduct(slide);
  };

  const handleSelectProductForView = (product: ProductItem) => {
    const slideAdapted: SlideData = {
      id: 99,
      tag: product.tag,
      headlineStart: product.name,
      headlineItalic: "Artisan Collection",
      description: product.description,
      primaryCta: "Shop Piece",
      primaryHref: "#",
      image: product.image,
      theme: 'dark-gold',
      productName: product.name,
      productPrice: `₹${product.price.toLocaleString()}`,
      productSlug: product.id,
      badge: product.fabric,
      accent: product.work
    };
    setSelectedSlideProduct(slideAdapted);
  };

  const handleExploreCategory = (category: string) => {
    setSelectedCategory(category);
    const catalogElem = document.getElementById('store-catalog');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeQuickViewProduct = selectedSlideProduct
    ? (productsList.find(p => p.id === selectedSlideProduct.productSlug || p.name === selectedSlideProduct.productName) ||
       PRODUCTS_CATALOG.find(p => p.id === selectedSlideProduct.productSlug || p.name === selectedSlideProduct.productName))
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#221C18] font-sans-clean">
   

      {/* 2. Main Navigation Header */}
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
        />

        {/* Mega Menu Dropdown */}
        <CategoryMegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={handleExploreCategory}
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
          />
        </div>
      </main>

      {/* 5. Floating WhatsApp Concierge Widget */}
      <WhatsAppWidget />

      {/* 6. Modals & Drawers */}
      <ProductQuickView
        slide={selectedSlideProduct}
        onClose={() => setSelectedSlideProduct(null)}
        onAddToCart={handleAddToCartFromQuickView}
        isWishlisted={activeQuickViewProduct ? isProductWishlisted(activeQuickViewProduct.id) : false}
        onToggleWishlist={() => {
          if (activeQuickViewProduct) {
            toggleWishlist(activeQuickViewProduct);
          }
        }}
      />

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
