'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Scissors, Truck, Award, Eye, ShoppingCart, Check, Heart } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { PRODUCTS_CATALOG, circleLogoImg } from '@/constants/catalog';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { Footer } from '@/components/layout/Footer';
import { ProductItem } from '@/types';
import { fetchCategories, CategoryItem } from '@/lib/supabase/services';

interface StoreExperienceSectionProps {
  products?: ProductItem[];
  isLoading?: boolean;
  onQuickViewProduct: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem, size?: string) => void;
  onBuyNow?: (product: ProductItem, size?: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: ProductItem) => void;
  categories?: CategoryItem[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

// Interactive Single Product Card with Sizes, Add to Cart & Buy Now
const ProductCard: React.FC<{
  product: ProductItem;
  index: number;
  onQuickView: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem, size?: string) => void;
  onBuyNow?: (product: ProductItem, size?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: ProductItem) => void;
}> = ({ product, index, onQuickView, onAddToCart, onBuyNow, isWishlisted, onToggleWishlist }) => {
  const availableSizes = product.sizes || [
    { size: 'XL', inStock: true },
    { size: 'XXL', inStock: true }
  ];

  const defaultSize = availableSizes.find(s => s.inStock)?.size || availableSizes[0]?.size || 'XL';
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(product, selectedSize);
    } else {
      onAddToCart(product, selectedSize);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.55,
        delay: (index % 4) * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ y: -4 }}
      className="group rounded-xl sm:rounded-2xl bg-white border border-[#E8DFCE] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Product Visual Lookbook Container */}
        <div 
          onClick={() => onQuickView(product)}
          className="relative aspect-[3/4] overflow-hidden bg-[#ECE4D8] cursor-pointer"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          
          {/* Top Tag Badge */}
          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
            <span className="bg-white/95 backdrop-blur-sm text-[#9B2242] text-[8px] sm:text-[9.5px] md:text-[10px] font-jakarta font-bold uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm">
              {product.tag}
            </span>
          </div>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-90 cursor-pointer ${
              isWishlisted
                ? 'bg-[#9B2242] text-white ring-2 ring-white/80 scale-105'
                : 'bg-white/90 backdrop-blur-sm text-[#5C4E43] hover:text-[#9B2242] hover:bg-white'
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            title={isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
          </button>

          {/* Quick Look Hover Button */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="pointer-events-auto p-1.5 sm:p-2 rounded-full bg-white/95 text-[#221C18] hover:bg-[#9B2242] hover:text-white shadow-lg transition-transform transform hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs font-jakarta font-semibold px-2.5 sm:px-3.5"
              aria-label="Quick View"
            >
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">View Details</span>
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-3.5 sm:p-2 md:p-3 lg:p-4 pb-2 sm:pb-1.5 flex flex-col items-center text-center">
          
          {/* Size Selection Boxes */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-1 md:gap-1.5 lg:gap-2 mb-2 sm:mb-1.5 md:mb-2.5">
            {availableSizes.map((sizeOpt) => {
              const isSelected = selectedSize === sizeOpt.size;
              const isAvailable = sizeOpt.inStock;

              if (!isAvailable) {
                return (
                  <div
                    key={sizeOpt.size}
                    title={`${sizeOpt.size} is currently out of stock`}
                    className="relative inline-flex items-center justify-center min-w-[34px] sm:min-w-[26px] md:min-w-[32px] lg:min-w-[38px] h-7 sm:h-5 md:h-6 lg:h-7 px-2 sm:px-1 md:px-2 text-[11px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-jakarta font-semibold text-gray-400 bg-gray-50 border border-gray-300 rounded cursor-not-allowed select-none overflow-hidden"
                  >
                    <span>{sizeOpt.size}</span>
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="100"
                        y2="100"
                        stroke="#EF4444"
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                      <line
                        x1="100"
                        y1="0"
                        x2="0"
                        y2="100"
                        stroke="#EF4444"
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                    </svg>
                  </div>
                );
              }

              return (
                <button
                  key={sizeOpt.size}
                  type="button"
                  onClick={() => setSelectedSize(sizeOpt.size)}
                  className={`min-w-[34px] sm:min-w-[26px] md:min-w-[32px] lg:min-w-[38px] h-7 sm:h-5 md:h-6 lg:h-7 px-2 sm:px-1 md:px-2 text-[11px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-jakarta font-semibold rounded border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#1C1613] text-white border-[#1C1613] shadow-sm'
                      : 'bg-white text-[#4A3F35] border-[#D6CBB8] hover:border-[#9B2242] hover:text-[#9B2242]'
                  }`}
                >
                  {sizeOpt.size}
                </button>
              );
            })}
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-jakarta text-xs sm:text-[9.5px] md:text-[11px] lg:text-xs font-semibold uppercase text-[#2B231D] hover:text-[#9B2242] transition-colors line-clamp-2 leading-snug cursor-pointer min-h-[2.1rem] sm:min-h-[1.7rem] md:min-h-[2rem] tracking-wide"
          >
            {product.name}
          </h3>

          {/* Product Price */}
          <div className="mt-1 sm:mt-1.5 flex items-center justify-center gap-1.5 sm:gap-1 md:gap-1.5 flex-wrap">
            <span className="font-jakarta text-sm sm:text-xs md:text-sm lg:text-base font-bold text-[#1F1916]">
              ₹{product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10.5px] sm:text-[9px] md:text-[10.5px] lg:text-[11px] text-[#9E8E7D] line-through font-normal font-jakarta">
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Dual Bottom Action Buttons (Add to Cart & Buy Now) */}
      <div className="p-3 sm:p-1.5 md:p-2.5 lg:p-3 pt-1.5 sm:pt-1 md:pt-1.5 grid grid-cols-2 gap-2 sm:gap-1 md:gap-1.5 lg:gap-2 border-t border-[#F2ECE1] mt-1 bg-[#FAF8F5]/60">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-2 sm:py-1.5 md:py-2 px-2 sm:px-1 rounded-lg sm:rounded md:rounded-lg bg-[#D81B60] hover:bg-[#C2185B] text-white text-[11px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-jakarta font-bold tracking-normal sm:tracking-tight md:tracking-wide flex items-center justify-center gap-1 sm:gap-0.5 md:gap-1 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[34px] sm:min-h-[28px] md:min-h-[34px]"
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="truncate">Add to Cart</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuy}
          className="w-full py-2 sm:py-1.5 md:py-2 px-2 sm:px-1 rounded-lg sm:rounded md:rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-jakarta font-bold tracking-normal sm:tracking-tight md:tracking-wide flex items-center justify-center gap-1 sm:gap-0.5 md:gap-1 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[34px] sm:min-h-[28px] md:min-h-[34px] truncate"
        >
          <span>Buy Now</span>
        </button>
      </div>
    </motion.div>
  );
};

export const StoreExperienceSection: React.FC<StoreExperienceSectionProps> = ({
  products,
  isLoading = false,
  onQuickViewProduct,
  onAddToCart,
  onBuyNow,
  selectedCategory,
  onSelectCategory,
  wishlistIds,
  onToggleWishlist,
  categories
}) => {
  const [activeTab, setActiveTab] = useState(selectedCategory || 'all');
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

  React.useEffect(() => {
    if (selectedCategory) {
      setActiveTab(selectedCategory);
    }
  }, [selectedCategory]);

  const allProductsList = products ?? PRODUCTS_CATALOG;

  const filteredProducts = activeTab === 'all' 
    ? allProductsList 
    : allProductsList.filter(p => p.category === activeTab || p.category?.toLowerCase() === activeTab.toLowerCase());

  const categoryTabs = [
    { label: "All Collections", key: "all" },
    ...dynCategories.map(c => ({ label: c.title, key: c.slug }))
  ];

  return (
    <div className="w-full bg-[#FAF8F5] text-[#221C18] overflow-hidden">
      
      {/* 1. Value Pillars Strip */}
      <motion.div 
        className="border-b border-[#E8DFCE] bg-white py-6 sm:py-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemFadeUpVariants} className="flex items-start gap-3.5 p-1 sm:p-0">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#9B2242] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-tenor text-sm sm:text-base font-bold text-[#221C18]">100% Pure Handloom</h4>
                <p className="font-jakarta text-[11px] sm:text-xs text-[#7A6D60] mt-0.5 leading-snug">Certified cotton, georgette & Chanderi silk</p>
              </div>
            </motion.div>

            <motion.div variants={itemFadeUpVariants} className="flex items-start gap-3.5 p-1 sm:p-0">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#9B2242] shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-tenor text-sm sm:text-base font-bold text-[#221C18]">Bespoke Custom Fit</h4>
                <p className="font-jakarta text-[11px] sm:text-xs text-[#7A6D60] mt-0.5 leading-snug">Master boutique tailoring & custom cuts</p>
              </div>
            </motion.div>

            <motion.div variants={itemFadeUpVariants} className="flex items-start gap-3.5 p-1 sm:p-0">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#9B2242] shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-tenor text-sm sm:text-base font-bold text-[#221C18]">Global Express Delivery</h4>
                <p className="font-jakarta text-[11px] sm:text-xs text-[#7A6D60] mt-0.5 leading-snug">Tamper-proof luxury packaging to your door</p>
              </div>
            </motion.div>

            <motion.div variants={itemFadeUpVariants} className="flex items-start gap-3.5 p-1 sm:p-0">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#9B2242] shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-tenor text-sm sm:text-base font-bold text-[#221C18]">Authentic Craft Guarantee</h4>
                <p className="font-jakarta text-[11px] sm:text-xs text-[#7A6D60] mt-0.5 leading-snug">Original Zardozi, Aari & Resham work</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Curated New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <motion.div 
          className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#FAF4EA] px-3 py-1 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9B2242]" />
              <span className="text-[9px] sm:text-[9.5px] font-jakarta font-semibold uppercase tracking-[0.25em] text-[#9B2242]">
                Zaymera Signature Edit
              </span>
            </div>
            <h2 className="font-tenor text-2xl sm:text-3xl lg:text-4xl font-normal text-[#221C18] tracking-wide">
              New Arrivals & Ready-To-Wear
            </h2>
            <p className="font-jakarta text-xs sm:text-sm text-[#7A6C5F] max-w-xl mt-1.5 font-normal leading-relaxed">
              Explore imported casual polka dots co-ords, royal sapphire anarkalis, and ceremonial bridal troussaus.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categoryTabs.map((tab, idx) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`px-3.5 sm:px-4 py-2 rounded-full font-jakarta text-[10.5px] sm:text-[11px] font-medium tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-[#1C1613] text-white shadow-md'
                    : 'bg-white border border-[#E0D5C3] text-[#55473B] hover:border-[#1C1613] hover:text-[#1C1613]'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-3 md:gap-4 lg:gap-6 max-w-sm sm:max-w-none mx-auto">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl sm:rounded-2xl bg-white border border-[#E8DFCE] overflow-hidden shadow-sm flex flex-col justify-between animate-pulse"
              >
                <div className="aspect-[3/4] bg-[#ECE4D8]/60" />
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div className="h-4 bg-[#ECE4D8]/70 rounded w-3/4" />
                  <div className="h-3 bg-[#ECE4D8]/50 rounded w-1/2" />
                  <div className="h-8 bg-[#ECE4D8]/40 rounded-lg mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-3 md:gap-4 lg:gap-6 max-w-sm sm:max-w-none mx-auto">
            {filteredProducts.map((prod, index) => (
              <ProductCard
                key={prod.id}
                product={prod}
                index={index}
                onQuickView={onQuickViewProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isWishlisted={wishlistIds.includes(prod.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#EAE2D5] p-8 max-w-lg mx-auto shadow-sm">
            <Sparkles className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
            <h3 className="font-tenor text-xl text-[#221C18]">New Collection Arriving Soon</h3>
            <p className="font-jakarta text-xs text-[#7A6D60] mt-1.5 leading-relaxed">
              Our master artisans are currently tailoring upcoming seasonal ensembles. Explore bespoke designs or consult with our concierge.
            </p>
          </div>
        )}
      </section>

      {/* 3. Category Tiles (Admin-Added Only) */}
      {dynCategories.length > 0 && (
        <section className="bg-white border-y border-[#EAE2D5] py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-[9.5px] sm:text-[10px] font-jakarta font-semibold uppercase tracking-[0.28em] text-[#9B2242] block mb-1.5">
                THE ATELIER CATALOG
              </span>
              <h2 className="font-tenor text-2xl sm:text-3xl lg:text-4xl font-normal text-[#1A1412] tracking-wide">
                Explore By Curated Category
              </h2>
              <p className="font-jakarta text-xs sm:text-sm text-[#736557] mt-2 font-normal">
                Discover timeless silhouettes tailored from pure handloom weaves, festive ensembles, and bridal troussaus.
              </p>
            </motion.div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${dynCategories.length >= 3 ? 'md:grid-cols-3 lg:grid-cols-4' : ''} gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto`}>
              {dynCategories.map((cat, idx) => (
                <motion.div
                  key={cat.id || cat.slug}
                  onClick={() => onSelectCategory(cat.slug)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: idx * 0.1,
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  whileHover={{ y: -6 }}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer bg-[#ECE4D8] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E8DFCE]"
                >
                  <img
                    src={cat.image || '/images/royal_blue_anarkali_1788292199640.jpg'}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                    <h4 className="font-tenor text-base sm:text-lg font-medium leading-snug group-hover:text-[#E2B755] transition-colors">
                      {cat.title}
                    </h4>
                    {cat.count && (
                      <span className="font-jakarta text-xs text-white/75 mt-1 tracking-wider">
                        {cat.count}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Atelier Craftsmanship Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div 
          className="relative rounded-3xl bg-[#1C1613] text-white overflow-hidden p-6 sm:p-10 lg:p-14 border border-[#3A2F28] shadow-2xl"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative z-10 max-w-2xl">
            <span className="font-jakarta text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[#E2B755] block mb-2">
              BESPOKE BRIDAL & CUSTOM ATELIER
            </span>
            <h3 className="font-tenor text-2xl sm:text-3xl lg:text-4xl font-normal leading-tight tracking-wide mb-3">
              Need a Custom Measurement or Custom Resham Embroidery?
            </h3>
            <p className="font-jakarta text-xs sm:text-sm text-white/80 font-normal leading-relaxed mb-6">
              Our master artisans and stylists provide personalized fittings, neck pattern adjustments, and bespoke dupatta handwork tailored exclusively for your special occasions.
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href={`https://wa.me/${SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || '917306115950'}?text=${encodeURIComponent('Hi Zaymera Team, I would like to inquire about a custom order and sizing.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BE5C] text-white font-jakarta text-xs font-semibold px-5 py-3 rounded-full transition-all duration-300 shadow-lg active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp ({SITE_CONFIG.conciergePhone})</span>
              </a>
              <Link
                href="/products"
                prefetch={true}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-jakarta text-xs font-medium px-5 py-3 rounded-full border border-white/20 transition-all duration-300 cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. Editorial Footer with Contact & WhatsApp Concierge */}
      <Footer />

    </div>
  );
};
