'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Filter,
  Search,
  ArrowRight,
  Eye,
  ShoppingCart,
  Check,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Store
} from 'lucide-react';
import { fetchProducts, getInitialProducts, getLocalProducts, fetchCategories, CategoryItem } from '@/lib/supabase/services';
import { ProductItem, SlideData } from '@/types';
import { Header } from '@/components/layout/Header';
import { CategoryMegaMenu } from '@/components/layout/CategoryMegaMenu';
import { ProductQuickView } from '@/components/modals/ProductQuickView';
import { SearchModal } from '@/components/modals/SearchModal';
import { TrackOrderModal } from '@/components/modals/TrackOrderModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { ContactModal } from '@/components/modals/ContactModal';
import { CartDrawer } from '@/components/drawers/CartDrawer';
import { WishlistDrawer } from '@/components/drawers/WishlistDrawer';
import { WhatsAppWidget } from '@/components/widgets/WhatsAppWidget';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading]   = useState(true);

  // Dynamic categories — loaded exclusively from admin
  const [categoryList, setCategoryList] = useState<{ label: string; slug: string }[]>([
    { label: 'All Ensembles', slug: 'all' }
  ]);
  const [dynCategories, setDynCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    fetchCategories().then(({ data }) => {
      if (data) {
        setDynCategories(data);
        setCategoryList([
          { label: 'All Ensembles', slug: 'all' },
          ...data.map(c => ({ label: c.title, slug: c.slug }))
        ]);
      }
    }).catch(() => {});
  }, []);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Sync URL search params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const search = searchParams.get('search');
    if (search !== null) setSearchQuery(search);
  }, [searchParams]);

  // Hooks
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

  // Modals & Navigation
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [selectedSlideProduct, setSelectedSlideProduct] = useState<SlideData | null>(null);

  const loadAllProducts = async () => {
    try {
      const { data } = await fetchProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const local = getLocalProducts();
    if (local && local.length > 0) {
      setProducts(local);
      setLoading(false);
    }
    loadAllProducts();
  }, []);

  const router = useRouter();

  const handleSelectProductForView = (product: ProductItem) => {
    router.push(`/products/detail?id=${encodeURIComponent(product.id)}`);
  };

  // Filter & Sort Logic
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || 
      p.category === selectedCategory || 
      p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.work.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock = !inStockOnly || p.inStock;

    return matchesCategory && matchesSearch && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#221C18] font-sans-clean">
      
      {/* Main Header */}
      <div className="relative">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={totalCartCount}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          wishlistCount={wishlistCount}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onToggleMegaMenu={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
          isMegaMenuOpen={isMegaMenuOpen}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          categories={dynCategories}
        />

        <CategoryMegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          categories={dynCategories}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setIsMegaMenuOpen(false);
          }}
        />
      </div>

      {/* 3. Hero / Breadcrumbs Banner */}
      <div className="bg-[#1F1915] text-white py-10 sm:py-14 border-b border-[#3A2F28] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex items-center gap-2 text-xs text-[#A89887] uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#C5A059]">Atelier Products Catalog</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#FAF4EA]/10 px-3 py-1 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#E2B755]" />
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.25em] text-[#E2B755]">
                  Haute Couture & Ready-to-Wear
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-wide text-white">
                The Complete Catalog
              </h1>
              <p className="text-xs sm:text-sm text-white/75 max-w-xl mt-2 font-normal leading-relaxed">
                Discover artisan handcrafted Anarkalis, pure handloom silks, casual crepe co-ord sets, and ceremonial bridal troussaus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all"
              >
                <Store className="w-3.5 h-3.5 text-[#E2B755]" />
                <span>Admin Atelier Portal</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Products Filter & Grid Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        
        {/* Filter Controls Strip */}
        <div className="bg-white rounded-2xl border border-[#EAE3D5] p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          
          {/* Top Categories Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categoryList.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-[#1C1613] text-white shadow-md'
                    : 'bg-[#FAF8F5] border border-[#E2D8C7] text-[#55473B] hover:border-[#1C1613] hover:text-[#1C1613]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search, Sort & In-Stock Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#F2ECE1]">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B6C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by fabric, embroidery, style..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E0D5C3] text-[#221C18] placeholder-[#8C7B6C] focus:outline-none focus:border-[#9B2242]"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* In-Stock Only Toggle */}
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#4A3F35] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-[#9B2242] focus:ring-[#9B2242]"
                />
                <span>In Stock Only</span>
              </label>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E0D5C3] text-[#221C18] focus:outline-none focus:border-[#9B2242] cursor-pointer"
              >
                <option value="featured">Featured Collection</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#7A6C5F]">
          <span>Showing <strong className="text-[#221C18]">{filteredProducts.length}</strong> creations</span>
          <button
            onClick={loadAllProducts}
            className="flex items-center gap-1 hover:text-[#9B2242] cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            const availableSizes = product.sizes || [
              { size: 'XL', inStock: true },
              { size: 'XXL', inStock: true }
            ];
            const defaultSize = availableSizes.find(s => s.inStock)?.size || availableSizes[0]?.size || 'XL';

            return (
              <ProductCatalogCard
                key={product.id}
                product={product}
                isWishlisted={isWishlisted}
                onQuickView={() => handleSelectProductForView(product)}
                onAddToCart={(size) => {
                  addToCart(product, size);
                  setIsCartOpen(true);
                }}
                onBuyNow={(size) => {
                  addToCart(product, size);
                  setIsCartOpen(true);
                }}
                onToggleWishlist={() => toggleWishlist(product)}
              />
            );
          })}
        </div>

        {products.length === 0 && !loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#EAE3D5] p-8 max-w-md mx-auto shadow-sm">
            <Sparkles className="w-10 h-10 text-[#C5A059] mx-auto mb-3" />
            <h3 className="font-display text-xl text-[#221C18]">No Ensembles Available</h3>
            <p className="text-xs text-[#7A6C5F] mt-1.5 leading-relaxed">
              Our atelier catalog is currently being updated with new bespoke collections. Please check back soon or consult our concierge.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-full bg-[#1C1613] text-white text-xs font-semibold cursor-pointer shadow-md hover:bg-[#332720] transition-colors"
              >
                Return to Sanctuary
              </Link>
            </div>
          </div>
        ) : filteredProducts.length === 0 && !loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#EAE3D5] p-8 max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-[#C5A059] mx-auto mb-3" />
            <h3 className="font-display text-xl text-[#221C18]">No Ensembles Found</h3>
            <p className="text-xs text-[#7A6C5F] mt-1.5 leading-relaxed">
              We couldn’t find any pieces matching your current filter selections.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setInStockOnly(false); }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#1C1613] text-white text-xs font-semibold cursor-pointer shadow-md"
            >
              Reset Filters
            </button>
          </div>
        ) : null}

      </main>

      {/* 5. Editorial Footer with Contact & WhatsApp Concierge */}
      <Footer />

      {/* 6. Floating WhatsApp Concierge */}
      <WhatsAppWidget />

      {/* 6. Modals & Drawers */}

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

// Single Catalog Product Card
const ProductCatalogCard: React.FC<{
  product: ProductItem;
  isWishlisted: boolean;
  onQuickView: () => void;
  onAddToCart: (size: string) => void;
  onBuyNow: (size: string) => void;
  onToggleWishlist: () => void;
}> = ({ product, isWishlisted, onQuickView, onAddToCart, onBuyNow, onToggleWishlist }) => {
  const availableSizes = product.sizes || [
    { size: 'XL', inStock: true },
    { size: 'XXL', inStock: true }
  ];

  const defaultSize = availableSizes.find(s => s.inStock)?.size || availableSizes[0]?.size || 'XL';
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(selectedSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(selectedSize);
  };

  return (
    <div className="group rounded-2xl bg-white border border-[#E8DFCE] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <div
          onClick={onQuickView}
          className="relative aspect-[3/4] overflow-hidden bg-[#ECE4D8] cursor-pointer"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />

          {/* Tag */}
          {product.tag && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="bg-white/95 backdrop-blur-sm text-[#9B2242] text-[9.5px] font-jakarta font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                {product.tag}
              </span>
            </div>
          )}

          {/* Wishlist Heart */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer ${
              isWishlisted
                ? 'bg-[#9B2242] text-white ring-2 ring-white/80 scale-105'
                : 'bg-white/90 backdrop-blur-sm text-[#5C4E43] hover:text-[#9B2242] hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Quick Look Hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
              className="pointer-events-auto p-2 rounded-full bg-white/95 text-[#221C18] hover:bg-[#9B2242] hover:text-white shadow-lg transition-transform transform hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-4"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-2 flex flex-col items-center text-center">
          
          {/* Sizes */}
          <div className="flex items-center justify-center gap-1.5 mb-2.5 flex-wrap">
            {availableSizes.map((sizeOpt) => {
              const isSelected = selectedSize === sizeOpt.size;
              const isAvailable = sizeOpt.inStock;

              if (!isAvailable) {
                return (
                  <div
                    key={sizeOpt.size}
                    title="Out of stock"
                    className="min-w-[32px] h-6 px-1.5 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-300 rounded line-through flex items-center justify-center select-none"
                  >
                    {sizeOpt.size}
                  </div>
                );
              }

              return (
                <button
                  key={sizeOpt.size}
                  type="button"
                  onClick={() => setSelectedSize(sizeOpt.size)}
                  className={`min-w-[32px] h-6 px-1.5 text-[10px] font-semibold rounded border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#1C1613] text-white border-[#1C1613]'
                      : 'bg-white text-[#4A3F35] border-[#D6CBB8] hover:border-[#9B2242]'
                  }`}
                >
                  {sizeOpt.size}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <h3
            onClick={onQuickView}
            className="font-jakarta text-xs font-semibold uppercase text-[#2B231D] hover:text-[#9B2242] transition-colors line-clamp-2 leading-snug cursor-pointer min-h-[2rem]"
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <span className="font-jakarta text-base font-bold text-[#1F1916]">
              ₹{product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-[#9E8E7D] line-through font-normal font-jakarta">
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-3 pt-1.5 grid grid-cols-2 gap-2 border-t border-[#F2ECE1] mt-1 bg-[#FAF8F5]/60">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-2 px-2 rounded-lg bg-[#D81B60] hover:bg-[#C2185B] text-white text-[11px] font-jakarta font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Add to Cart</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuy}
          className="w-full py-2 px-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-jakarta font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm truncate"
        >
          <span>Buy Now</span>
        </button>
      </div>

    </div>
  );
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#8C7A6B] tracking-widest uppercase font-medium">Loading Atelier Catalog...</span>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
