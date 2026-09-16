'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Check,
  Star,
  ShieldCheck,
  Scissors,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
  ChevronRight,
  ArrowLeft,
  Ruler,
  Clock,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Lock
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
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Footer } from '@/components/layout/Footer';
import { SITE_CONFIG } from '@/constants/siteConfig';

import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { fetchProductById, fetchProducts, getLocalProducts } from '@/lib/supabase/services';
import { PRODUCTS_CATALOG } from '@/constants/catalog';
import { ProductItem } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Size Chart Data
// ─────────────────────────────────────────────────────────────────────────────
const SIZE_CHART = [
  { size: 'XS',  bust: '32-33"', waist: '26-27"', hip: '35-36"', length: '46"' },
  { size: 'S',   bust: '34-35"', waist: '28-29"', hip: '37-38"', length: '46"' },
  { size: 'M',   bust: '36-37"', waist: '30-31"', hip: '39-40"', length: '47"' },
  { size: 'L',   bust: '38-39"', waist: '32-33"', hip: '41-42"', length: '47"' },
  { size: 'XL',  bust: '40-41"', waist: '34-35"', hip: '43-44"', length: '48"' },
  { size: 'XXL', bust: '42-43"', waist: '36-37"', hip: '45-46"', length: '48"' },
];

// Initial customer reviews
const INITIAL_REVIEWS = [
  {
    id: 1,
    author: 'Aanya Sharma',
    rating: 5,
    date: '2 weeks ago',
    verified: true,
    title: 'Exquisite craftsmanship and perfect fit!',
    comment: 'The fabric feels so luxurious and the handwork detailing around the neckline is immaculate. Wore it for an intimate evening gala and received compliments all night. Fits true to size!',
    likes: 14
  },
  {
    id: 2,
    author: 'Priyanka Kapoor',
    rating: 5,
    date: '1 month ago',
    verified: true,
    title: 'Worth every single penny',
    comment: 'The drape of this ensemble is royal. Express shipping was quick (received in 3 days in Mumbai), and the packaging with the garment bag was a lovely touch.',
    likes: 9
  },
  {
    id: 3,
    author: 'Meera Deshmukh',
    rating: 4,
    date: '1 month ago',
    verified: true,
    title: 'Beautiful color, very elegant',
    comment: 'Color is rich and exactly as photographed. Fabric is pure quality. Minor alteration needed on sleeve length for my petite frame, but overall gorgeous.',
    likes: 5
  }
];

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Purchase state
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryResult, setDeliveryResult] = useState<string | null>(null);

  // Modals & Drawers
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'care' | 'shipping'>('description');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Cart & Wishlist hooks
  const {
    cartItems,
    totalCartCount,
    addToCart,
    removeCartItem,
    updateCartQuantity,
    clearCart
  } = useCart();

  const {
    wishlistItems,
    wishlistCount,
    wishlistIds,
    toggleWishlist,
    removeWishlistItem
  } = useWishlist();

  // Load product data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadData() {
      // 1. First fetch catalog products for related items and fallback
      const local = getLocalProducts();
      let catalog: ProductItem[] = local.length > 0 ? local : PRODUCTS_CATALOG;

      try {
        const { data: remote } = await fetchProducts();
        if (remote && remote.length > 0) {
          catalog = remote;
        }
      } catch (err) {
        console.warn('Could not fetch products catalog:', err);
      }

      if (isMounted) {
        setAllProducts(catalog);
      }

      // 2. Resolve target product
      if (productId) {
        try {
          const { data } = await fetchProductById(productId);
          if (isMounted && data) {
            setProduct(data);
            if (data.sizes && data.sizes.length > 0) {
              const defaultSize = data.sizes.find(s => s.inStock)?.size || data.sizes[0].size;
              setSelectedSize(defaultSize);
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to fetch product by id:', e);
        }

        // Fallback from catalog
        const match = catalog.find(p => p.id === productId);
        if (isMounted && match) {
          setProduct(match);
          if (match.sizes && match.sizes.length > 0) {
            const defaultSize = match.sizes.find(s => s.inStock)?.size || match.sizes[0].size;
            setSelectedSize(defaultSize);
          }
        }
      } else if (catalog.length > 0 && isMounted) {
        // Fallback to first catalog item if no ID provided
        setProduct(catalog[0]);
        if (catalog[0].sizes && catalog[0].sizes.length > 0) {
          setSelectedSize(catalog[0].sizes[0].size);
        }
      }

      if (isMounted) setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Gallery images list (supports multi-image arrays with fallback)
  const galleryImages: string[] = React.useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    return product.image ? [product.image] : [];
  }, [product]);

  // Active image safely clamped
  const activeImage = galleryImages[selectedImageIndex] || product?.image || '';

  // Calculate pricing & discount
  const price = product?.price || 0;
  const originalPrice = product?.originalPrice && product.originalPrice > price
    ? product.originalPrice
    : Math.round(price * 1.35);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  const savingsAmount = originalPrice - price;

  const isWishlisted = product ? wishlistIds.includes(product.id) : false;

  const availableSizes = product?.sizes && product.sizes.length > 0
    ? product.sizes
    : [
        { size: 'S', inStock: true },
        { size: 'M', inStock: true },
        { size: 'L', inStock: true },
        { size: 'XL', inStock: true },
        { size: 'XXL', inStock: true },
      ];

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize);
    }
    setIsAddedToCart(true);
    setIsCartOpen(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  // Handle Buy Now
  const handleBuyNow = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize);
    }
    setIsCartOpen(true);
  };

  // Handle Share Link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Pincode delivery check
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 5) {
      setDeliveryResult('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    setDeliveryResult('Verified! Complimentary Express Delivery in 3-5 business days.');
  };

  // WhatsApp concierge inquiry
  const handleWhatsAppInquiry = () => {
    if (!product) return;
    const rawPhone = SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || "917306115950";
    const msg = encodeURIComponent(
      `Hello Zaymera Boutique, I'm inquiring about "${product.name}" (Ref: ${product.id}, ₹${product.price.toLocaleString()}). Could you share custom sizing or tailoring availability? Link: ${typeof window !== 'undefined' ? window.location.href : ''}`
    );
    window.open(`https://wa.me/${rawPhone}?text=${msg}`, '_blank');
  };

  // Add review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    const newRev = {
      id: Date.now(),
      author: reviewName.trim(),
      rating: reviewRating,
      date: 'Just now',
      verified: true,
      title: reviewTitle.trim() || 'Verified Customer Review',
      comment: reviewComment.trim(),
      likes: 0
    };

    setReviews([newRev, ...reviews]);
    setReviewName('');
    setReviewTitle('');
    setReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  // Related products
  const relatedProducts = allProducts
    .filter(p => p.id !== product?.id)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8C7A68] tracking-widest uppercase font-medium">
            Loading Atelier Piece...
          </span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#221C18] flex flex-col">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={totalCartCount}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          wishlistCount={wishlistCount}
          onSelectCategory={() => {}}
          onToggleMegaMenu={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
          isMegaMenuOpen={isMegaMenuOpen}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3ECE0] flex items-center justify-center text-[#9B2242] mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif text-[#1F1916] mb-2">Piece Not Found</h1>
          <p className="text-sm text-[#6C5E53] max-w-md mb-6">
            The artisanal design you are looking for may have been archived or moved to our bespoke private collection.
          </p>
          <Link
            href="/products"
            className="px-6 py-3 bg-[#9B2242] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#7E1B35] transition shadow-md"
          >
            Explore Complete Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#221C18] font-sans antialiased selection:bg-[#9B2242] selection:text-white">
      
      {/* ── 1. Main Storefront Header ── */}
      <div className="relative z-30">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={totalCartCount}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          wishlistCount={wishlistCount}
          onSelectCategory={() => {}}
          onToggleMegaMenu={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
          isMegaMenuOpen={isMegaMenuOpen}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <CategoryMegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={(cat) => {
            setIsMegaMenuOpen(false);
            router.push(`/products?cat=${cat}`);
          }}
        />
      </div>

      {/* ── 2. Breadcrumbs & Back Bar ── */}
      <div className="border-b border-[#EAE2D5] bg-[#FAF8F5]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-[#7A6A5D]">
          
          <div className="flex items-center gap-2 truncate">
            <Link
              href="/"
              className="hover:text-[#9B2242] transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:hidden" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B7A6] shrink-0" />
            <Link
              href="/products"
              className="hover:text-[#9B2242] transition-colors font-medium truncate"
            >
              Catalog
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#C4B7A6] shrink-0" />
                <Link
                  href={`/products?cat=${encodeURIComponent(product.category)}`}
                  className="hover:text-[#9B2242] transition-colors font-medium truncate hidden sm:inline"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B7A6] shrink-0" />
            <span className="text-[#1F1916] font-semibold truncate max-w-[180px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          {/* Quick Actions in Top Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleShare}
              title="Share piece"
              className="flex items-center gap-1.5 text-xs text-[#5C4D41] hover:text-[#9B2242] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className="flex items-center gap-1.5 text-xs text-[#5C4D41] hover:text-[#9B2242] transition-colors cursor-pointer"
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#9B2242] text-[#9B2242]' : ''}`} />
              <span className="hidden sm:inline">{isWishlisted ? 'Wishlisted' : 'Save'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── 3. Main Product Details Suite ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">

          {/* ── Left Column: Media Gallery (6 cols) ── */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            
            {/* Primary Featured Image View */}
            <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-[#ECE4D8] border border-[#E5DCCE] shadow-lg group">
              
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#9E8E7D] gap-2">
                  <Sparkles className="w-8 h-8 text-[#C4B7A6]" />
                  <span className="text-xs uppercase tracking-wider font-medium">Artisanal Design</span>
                </div>
              )}

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.tag && (
                  <span className="px-3.5 py-1.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#9B2242] shadow-sm border border-[#9B2242]/10">
                    {product.tag}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#9B2242] text-white shadow-sm self-start">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              {/* Wishlist Button on Image */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
                  isWishlisted
                    ? 'bg-[#9B2242] text-white ring-2 ring-white/80 scale-105'
                    : 'bg-white/90 backdrop-blur-md text-[#4A3F35] hover:text-[#9B2242] hover:bg-white'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
              </button>

              {/* Hover Zoom Prompt */}
              <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white/90 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Atelier Handcraft Finish
              </div>

            </div>

            {/* Thumbnail Navigation Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-[#ECE4D8] ${
                      selectedImageIndex === idx
                        ? 'border-[#9B2242] shadow-md scale-102 ring-2 ring-[#9B2242]/20'
                        : 'border-[#E2D6C6] opacity-75 hover:opacity-100 hover:border-[#9B2242]/50'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Value Guarantees Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#EAE2D5] text-[#5C4D41]">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#EAE2D5]">
                <ShieldCheck className="w-5 h-5 text-[#9B2242] mb-1.5" />
                <span className="text-[11px] font-bold text-[#1F1916]">100% Authentic</span>
                <span className="text-[9.5px] text-[#8C7A68]">Pure Artisan Craft</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#EAE2D5]">
                <Truck className="w-5 h-5 text-[#9B2242] mb-1.5" />
                <span className="text-[11px] font-bold text-[#1F1916]">Free Shipping</span>
                <span className="text-[9.5px] text-[#8C7A68]">Across all India</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#EAE2D5]">
                <RotateCcw className="w-5 h-5 text-[#9B2242] mb-1.5" />
                <span className="text-[11px] font-bold text-[#1F1916]">7-Day Exchange</span>
                <span className="text-[9.5px] text-[#8C7A68]">Hassle-free policy</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#EAE2D5]">
                <Scissors className="w-5 h-5 text-[#9B2242] mb-1.5" />
                <span className="text-[11px] font-bold text-[#1F1916]">Custom Fit</span>
                <span className="text-[9.5px] text-[#8C7A68]">Tailoring concierge</span>
              </div>
            </div>

          </div>

          {/* ── Right Column: Product Details & Purchase Suite (6 cols) ── */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            
            {/* Category / Collection Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#9B2242]">
                Zaymera Haute Couture
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4B7A6]" />
              <span className="text-[11px] font-semibold text-[#8C7A68] tracking-wider uppercase">
                {product.category || 'Atelier Collection'}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1F1916] font-normal leading-tight">
              {product.name}
            </h1>

            {/* Rating & Social Proof */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-[#9B2242]/10 px-2.5 py-1 rounded-md">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#9B2242] ml-1">4.9</span>
              </div>
              <span className="text-xs text-[#8C7A68]">
                Based on <a href="#reviews" className="underline hover:text-[#9B2242]">{reviews.length + 124} verified artisan reviews</a>
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ● In Stock & Ready to Dispatch
              </span>
            </div>

            {/* Pricing Section */}
            <div className="mt-5 p-4 rounded-xl bg-white/80 border border-[#EAE2D5] shadow-xs">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1916]">
                  ₹{price.toLocaleString()}
                </span>
                {originalPrice > price && (
                  <>
                    <span className="text-base text-[#9E8E7D] line-through font-normal">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-[#9B2242] bg-[#9B2242]/10 px-2 py-0.5 rounded">
                      SAVE ₹{savingsAmount.toLocaleString()} ({discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-[#8C7A68]">
                Inclusive of all taxes. Free express domestic delivery & premium luxury dust bag packaging included.
              </p>
            </div>

            {/* Brief Description */}
            <p className="mt-5 text-sm text-[#5C4D41] leading-relaxed font-light">
              {product.description ||
                'Impeccably tailored from premium fabric with traditional artisanal detailing. Designed for effortless sophistication at festivities, soirees, and formal gatherings.'}
            </p>

            {/* ── Size Selector ── */}
            <div className="mt-6 pt-5 border-t border-[#EAE2D5]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2B231D]">
                    Select Size:
                  </span>
                  <span className="text-xs font-semibold text-[#9B2242] bg-[#9B2242]/10 px-2 py-0.5 rounded">
                    {selectedSize}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs font-semibold text-[#9B2242] hover:text-[#7E1B35] flex items-center gap-1 cursor-pointer transition"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {availableSizes.map((sizeOpt) => {
                  const isSelected = selectedSize === sizeOpt.size;
                  const isAvailable = sizeOpt.inStock;

                  if (!isAvailable) {
                    return (
                      <div
                        key={sizeOpt.size}
                        title="Sold Out"
                        className="w-12 h-11 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 text-xs font-semibold flex items-center justify-center line-through cursor-not-allowed select-none"
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
                      className={`min-w-[48px] h-11 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#9B2242] text-white border-2 border-[#9B2242] shadow-sm scale-102 ring-2 ring-[#9B2242]/20'
                          : 'bg-white text-[#3D322A] border border-[#D9CEBF] hover:border-[#9B2242] hover:text-[#9B2242]'
                      }`}
                    >
                      {sizeOpt.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Quantity & Actions ── */}
            <div className="mt-6 pt-5 border-t border-[#EAE2D5] space-y-4">
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2B231D]">
                  Quantity:
                </span>
                <div className="flex items-center border border-[#D9CEBF] rounded-lg bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-[#5C4D41] hover:bg-[#FAF4EA] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-[#1F1916]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                    className="w-9 h-9 flex items-center justify-center text-[#5C4D41] hover:bg-[#FAF4EA] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-4 px-6 rounded-xl bg-[#9B2242] hover:bg-[#7E1B35] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAddedToCart ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-4 px-6 rounded-xl bg-[#1F1916] hover:bg-[#342B25] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Buy Now • ₹{(price * quantity).toLocaleString()}</span>
                </button>
              </div>

              {/* WhatsApp Concierge Button */}
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="w-full py-3 px-4 rounded-xl border border-emerald-600/30 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Need custom tailoring or urgent dispatch? Chat on WhatsApp ({SITE_CONFIG.conciergePhone})</span>
              </button>

            </div>

            {/* ── Delivery Pincode Checker ── */}
            <div className="mt-6 p-4 rounded-xl bg-white border border-[#EAE2D5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2B231D] uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-[#9B2242]" />
                <span>Estimated Delivery</span>
              </div>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#D9CEBF] focus:outline-none focus:border-[#9B2242] bg-[#FAF8F5] text-[#221C18]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2B231D] text-white text-xs font-semibold rounded-lg hover:bg-[#9B2242] transition cursor-pointer"
                >
                  Check
                </button>
              </form>
              {deliveryResult && (
                <p className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 p-2 rounded-md border border-emerald-200">
                  {deliveryResult}
                </p>
              )}
            </div>

          </div>

        </div>

        {/* ── 4. Detailed Specification Tabs ── */}
        <section className="mt-16 sm:mt-24 pt-10 border-t border-[#EAE2D5]">
          <div className="flex items-center justify-center gap-2 sm:gap-6 border-b border-[#EAE2D5] overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'description'
                  ? 'border-[#9B2242] text-[#9B2242]'
                  : 'border-transparent text-[#7A6A5D] hover:text-[#1F1916]'
              }`}
            >
              Product Story & Details
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'specifications'
                  ? 'border-[#9B2242] text-[#9B2242]'
                  : 'border-transparent text-[#7A6A5D] hover:text-[#1F1916]'
              }`}
            >
              Fabric & Craftsmanship
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'care'
                  ? 'border-[#9B2242] text-[#9B2242]'
                  : 'border-transparent text-[#7A6A5D] hover:text-[#1F1916]'
              }`}
            >
              Wash & Care Guide
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'shipping'
                  ? 'border-[#9B2242] text-[#9B2242]'
                  : 'border-transparent text-[#7A6A5D] hover:text-[#1F1916]'
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="py-8 max-w-4xl mx-auto text-[#4A3E35] text-sm leading-relaxed">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-[#1F1916] font-normal">
                  The Design Narrative
                </h3>
                <p>
                  {product.description ||
                    'Handcrafted with meticulous attention to silhouette, drape, and texture. Each garment in the Zaymera atelier is designed to elevate celebratory dressing with understated grandeur and effortless grace.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#EAE2D5]">
                  <div className="p-4 rounded-xl bg-white border border-[#EAE2D5]">
                    <span className="text-xs font-bold text-[#9B2242] uppercase tracking-wider block mb-1">
                      Styling Notes
                    </span>
                    <p className="text-xs text-[#6B5C50]">
                      Pair with statement polki or kundan earrings, antique gold juttis, and an embellished potli clutch for festive revelry.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#EAE2D5]">
                    <span className="text-xs font-bold text-[#9B2242] uppercase tracking-wider block mb-1">
                      Artisan Authenticity
                    </span>
                    <p className="text-xs text-[#6B5C50]">
                      Small slubs and variations in weave and hand embroidery are hallmarks of genuine handcraft, celebrating the human artisan touch.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-[#1F1916] font-normal">
                  Technical Specifications
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 bg-white p-6 rounded-2xl border border-[#EAE2D5]">
                  <div className="border-b border-[#F2ECE1] pb-3">
                    <dt className="text-xs text-[#8C7A68] uppercase tracking-wider font-semibold">Primary Fabric</dt>
                    <dd className="text-sm font-bold text-[#1F1916] mt-0.5">{product.fabric || 'Pure Artisan Silk Blend'}</dd>
                  </div>
                  <div className="border-b border-[#F2ECE1] pb-3">
                    <dt className="text-xs text-[#8C7A68] uppercase tracking-wider font-semibold">Embroidery / Work</dt>
                    <dd className="text-sm font-bold text-[#1F1916] mt-0.5">{product.work || 'Intricate Zari & Sequin Handwork'}</dd>
                  </div>
                  <div className="border-b border-[#F2ECE1] pb-3">
                    <dt className="text-xs text-[#8C7A68] uppercase tracking-wider font-semibold">Collection Category</dt>
                    <dd className="text-sm font-bold text-[#1F1916] mt-0.5">{product.category || 'Atelier Signature'}</dd>
                  </div>
                  <div className="border-b border-[#F2ECE1] pb-3">
                    <dt className="text-xs text-[#8C7A68] uppercase tracking-wider font-semibold">Lining</dt>
                    <dd className="text-sm font-bold text-[#1F1916] mt-0.5">Premium Mulmul Cotton Lining</dd>
                  </div>
                  <div className="border-b border-[#F2ECE1] pb-3">
                    <dt className="text-xs text-[#8C7A68] uppercase tracking-wider font-semibold">Silhouette / Cut</dt>
                    <dd className="text-sm font-bold text-[#1F1916] mt-0.5">Flared Anarkali / Tailored Co-Ord Fit</dd>
                  </div>
                  <div className="border-b border-[#F2ECE1] pb-3">
                    <dt className="text-xs text-[#8C7A68] uppercase tracking-wider font-semibold">Country of Origin</dt>
                    <dd className="text-sm font-bold text-[#1F1916] mt-0.5">India (Handcrafted)</dd>
                  </div>
                </dl>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-[#1F1916] font-normal">
                  Caring for Your Zaymera Garment
                </h3>
                <div className="space-y-3 bg-white p-6 rounded-2xl border border-[#EAE2D5]">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#9B2242]/10 text-[#9B2242] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <p className="text-sm text-[#4A3E35]"><strong>Dry Clean Only:</strong> We recommend professional dry cleaning to protect the artisanal hand-embroidery and delicate weave.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#9B2242]/10 text-[#9B2242] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <p className="text-sm text-[#4A3E35]"><strong>Storage:</strong> Always store in a breathable cotton or muslin bag. Avoid hanging heavy embroidery outfits for extended periods.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#9B2242]/10 text-[#9B2242] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <p className="text-sm text-[#4A3E35]"><strong>Ironing:</strong> Steam iron on reverse at low temperature. Do not spray water directly on silk or zari threads.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-[#1F1916] font-normal">
                  Complimentary Shipping & Hassle-Free Returns
                </h3>
                <div className="space-y-3 bg-white p-6 rounded-2xl border border-[#EAE2D5]">
                  <p><strong>Domestic Shipping:</strong> All orders are packaged in custom luxury dust bags and shipped via premium express couriers (Blue Dart / Delhivery). Dispatched within 24 to 48 hours.</p>
                  <p><strong>Tracking:</strong> Live real-time tracking link will be sent to your WhatsApp and registered email as soon as the courier scans the parcel.</p>
                  <p><strong>Easy 7-Day Exchange:</strong> If you require a different size or wish to exchange for another atelier design, initiate a return within 7 calendar days of delivery.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 5. Customer Reviews Section ── */}
        <section id="reviews" className="mt-16 pt-12 border-t border-[#EAE2D5]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9B2242]">
                Artisan Patron Experiences
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1F1916] mt-1">
                Customer Reviews
              </h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-sm text-[#1F1916]">4.9 out of 5</span>
                <span className="text-xs text-[#8C7A68]">({reviews.length + 124} reviews)</span>
              </div>
            </div>

            {/* Existing Reviews List */}
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1F1916]">{rev.author}</span>
                      {rev.verified && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8C7A68]">{rev.date}</span>
                  </div>

                  <div className="flex text-amber-500 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  <h4 className="text-sm font-bold text-[#2B231D] mb-1">{rev.title}</h4>
                  <p className="text-xs sm:text-sm text-[#5C4D41] leading-relaxed font-light">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>

            {/* Write a Review Form */}
            <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white border border-[#EAE2D5] shadow-sm">
              <h3 className="font-serif text-lg font-normal text-[#1F1916] mb-1">
                Write a Review for this Piece
              </h3>
              <p className="text-xs text-[#8C7A68] mb-5">
                Share your experience on fabric handfeel, fit, and elegance to assist fellow patrons.
              </p>

              {reviewSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Thank you! Your verified review has been published.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A3F35] uppercase tracking-wider mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="e.g. Shalini Roy"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9B2242]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A3F35] uppercase tracking-wider mb-1">
                        Rating *
                      </label>
                      <div className="flex items-center gap-2 h-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-amber-500 hover:scale-125 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewRating ? 'fill-current' : 'stroke-current fill-transparent'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4A3F35] uppercase tracking-wider mb-1">
                      Review Headline
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Stunning anarkali, perfect festive outfit"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9B2242]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4A3F35] uppercase tracking-wider mb-1">
                      Your Detailed Review *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How did the garment drape? How was the sizing and artisan embroidery?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9B2242]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#9B2242] hover:bg-[#7E1B35] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>

        {/* ── 6. Related Products Carousel / Grid ── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-12 border-t border-[#EAE2D5]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9B2242]">
                  Complete The Ensemble
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1F1916] mt-1">
                  You May Also Admire
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#9B2242] hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/products/detail?id=${item.id}`)}
                  className="group rounded-2xl bg-white border border-[#E5DCCE] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#ECE4D8]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    {item.tag && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-white/95 text-[#9B2242] text-[9.5px] font-bold uppercase px-2.5 py-1 rounded-full shadow-xs">
                          {item.tag}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <span className="text-[10px] text-[#8C7A68] uppercase tracking-wider font-semibold">
                        {item.category || 'Atelier'}
                      </span>
                      <h3 className="font-serif text-sm font-semibold text-[#1F1916] line-clamp-1 group-hover:text-[#9B2242] transition-colors mt-0.5">
                        {item.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#F2ECE1] flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1F1916]">
                        ₹{item.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-[#9B2242] uppercase tracking-wider">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── 7. Mobile Sticky Bottom Action Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE2D5] px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 truncate max-w-[45%]">
          {activeImage && (
            <img
              src={activeImage}
              alt={product.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#EAE2D5]"
            />
          )}
          <div className="truncate">
            <div className="text-xs font-bold text-[#1F1916] truncate">{product.name}</div>
            <div className="text-xs font-bold text-[#9B2242]">₹{price.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="py-2.5 px-3 rounded-lg bg-[#9B2242] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isAddedToCart ? 'Added' : 'Add to Bag'}</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="py-2.5 px-3 rounded-lg bg-[#1F1916] text-white text-xs font-bold uppercase tracking-wider active:scale-95 cursor-pointer"
          >
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      {/* ── 8. Size Guide Modal ── */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E5DCCE] shadow-2xl p-6 text-[#2B231D]">
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#8C7A68] hover:text-[#1F1916] hover:bg-[#FAF4EA] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-[#9B2242]" />
              <h3 className="font-serif text-lg font-normal text-[#1F1916]">
                Zaymera Sizing & Measurement Guide
              </h3>
            </div>

            <p className="text-xs text-[#6B5C50] mb-4">
              All measurements are garment dimensions provided in inches. For custom tailoring, select your closest size and reach out via WhatsApp concierge ({SITE_CONFIG.conciergePhone}).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE2D5] text-[#8C7A68] uppercase font-bold">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Bust</th>
                    <th className="py-2.5 px-3">Waist</th>
                    <th className="py-2.5 px-3">Hip</th>
                    <th className="py-2.5 px-3">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE1]">
                  {SIZE_CHART.map((row) => (
                    <tr
                      key={row.size}
                      className={`hover:bg-[#FAF8F5]/60 ${selectedSize === row.size ? 'bg-[#9B2242]/5 font-bold text-[#9B2242]' : ''}`}
                    >
                      <td className="py-2.5 px-3">{row.size}</td>
                      <td className="py-2.5 px-3">{row.bust}</td>
                      <td className="py-2.5 px-3">{row.waist}</td>
                      <td className="py-2.5 px-3">{row.hip}</td>
                      <td className="py-2.5 px-3">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-[11px] text-[#6B5C50]">
              💡 <strong>Fitting Tip:</strong> If you are between sizes, we recommend ordering one size larger as artisanal fabrics can be easily altered.
            </div>
          </div>
        </div>
      )}

      {/* Editorial Footer with Contact & WhatsApp Concierge */}
      <Footer />

      {/* ── 9. Modals & Drawers ── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeCartItem}
        onUpdateQuantity={updateCartQuantity}
        onClearCart={clearCart}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={removeWishlistItem}
        onAddToCart={(prod, size) => {
          addToCart(prod, size);
          setIsCartOpen(true);
        }}
        onQuickViewProduct={(prod) => {
          setIsWishlistOpen(false);
          router.push(`/products/detail?id=${encodeURIComponent(prod.id)}`);
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={allProducts}
        onSelectProduct={(prod) => {
          setIsSearchOpen(false);
          router.push(`/products/detail?id=${encodeURIComponent(prod.id)}`);
        }}
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

      <WhatsAppWidget />

    </div>
  );
}

export function ProductDetailView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#8C7A68] tracking-widest uppercase font-medium">
              Loading Atelier Experience...
            </span>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
