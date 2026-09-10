'use client';

import React, { useState } from 'react';
import { X, Star, ShieldCheck, Scissors, Heart, ShoppingBag, Check } from 'lucide-react';
import { SlideData } from '@/types';

interface ProductQuickViewProps {
  slide: SlideData | null;
  onClose: () => void;
  onAddToCart: (name: string, price: string, size: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  slide,
  onClose,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAdded, setIsAdded] = useState(false);

  if (!slide) return null;

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleAdd = () => {
    onAddToCart(slide.productName, slide.productPrice, selectedSize);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white border border-[#E5DCCE] shadow-2xl overflow-hidden flex flex-col md:flex-row text-[#2B231D] max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/90 text-[#8C7A68] hover:text-[#221C18] hover:bg-white shadow cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="w-full md:w-1/2 relative bg-[#ECE4D8] min-h-[280px] sm:min-h-[380px]">
          <img
            src={slide.image}
            alt={slide.productName}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#9B2242] shadow-sm">
              {slide.badge || 'Haute Couture'}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B2242] mb-1">
              {slide.tag || 'Zaymera Signature'}
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-normal leading-snug text-[#1F1916]">
              {slide.productName}
            </h3>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-xl sm:text-2xl font-bold text-[#1F1916]">
                {slide.productPrice}
              </span>
              <span className="text-xs text-[#8C7A68] line-through">
                ₹{(parseInt(slide.productPrice.replace(/[^0-9]/g, '')) * 1.3 || 4999).toFixed(0)}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                In Stock
              </span>
            </div>

            <p className="mt-4 text-xs text-[#6B5E52] leading-relaxed font-light">
              {slide.description}
            </p>

            {/* Size Selector */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4A3F35] mb-2">
                <span>Select Size</span>
                <span className="text-[10px] text-[#9B2242] normal-case cursor-pointer hover:underline">
                  Size Guide
                </span>
              </div>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-[#1C1613] text-white border-[#1C1613]'
                        : 'bg-white text-[#4A3F35] border-[#D6CBB8] hover:border-[#9B2242]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Value Points */}
            <div className="mt-6 pt-4 border-t border-[#F0EAE1] space-y-2 text-xs text-[#7A6C5F]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9B2242]" />
                <span>100% Pure Handloom & Authentic Craft</span>
              </div>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#9B2242]" />
                <span>Custom tailor measurements on request</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-[#F0EAE1] flex gap-3">
            <button
              onClick={handleAdd}
              disabled={isAdded}
              className="flex-1 py-3.5 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Shopping Bag</span>
                </>
              )}
            </button>

            {onToggleWishlist && (
              <button
                onClick={onToggleWishlist}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isWishlisted
                    ? 'bg-[#9B2242] text-white border-[#9B2242]'
                    : 'bg-[#FAF5ED] text-[#4A3F35] border-[#D6CBB8] hover:border-[#9B2242]'
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
