'use client';

import React, { useState } from 'react';
import { X, Heart, Trash2, ShoppingCart, Check, ArrowRight, Sparkles } from 'lucide-react';
import { ProductItem } from '@/types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: ProductItem[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: ProductItem, size?: string) => void;
  onQuickViewProduct: (product: ProductItem) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  onRemoveFromWishlist,
  onAddToCart,
  onQuickViewProduct
}) => {
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleMoveToBag = (product: ProductItem) => {
    onAddToCart(product);
    setAddedItemIds(prev => [...prev, product.id]);
    setTimeout(() => {
      setAddedItemIds(prev => prev.filter(id => id !== product.id));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-[#2B231D]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#EAE2D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#9B2242] fill-[#9B2242]" />
            <h3 className="font-display text-xl font-normal text-[#1F1916] tracking-wide">
              Saved Pieces ({wishlistItems.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#A89887]">
              <Heart className="w-8 h-8" />
            </div>
            <h4 className="font-display text-lg font-normal text-[#221C18]">Your Wishlist is Empty</h4>
            <p className="text-xs text-[#7A6D60] max-w-xs">
              Save your favorite couture pieces by clicking the heart icon while browsing our catalog.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistItems.map((product) => {
              const isAdded = addedItemIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="flex gap-4 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EADBCC]"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    onClick={() => {
                      onQuickViewProduct(product);
                      onClose();
                    }}
                    className="w-20 h-26 object-cover rounded-lg bg-[#ECE4D8] shrink-0 cursor-pointer"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          onClick={() => {
                            onQuickViewProduct(product);
                            onClose();
                          }}
                          className="text-xs font-semibold text-[#221C18] line-clamp-2 cursor-pointer hover:text-[#9B2242] transition-colors"
                        >
                          {product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveFromWishlist(product.id)}
                          className="text-[#9E8E7D] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-bold text-sm text-[#1F1916]">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[10px] text-[#9E8E7D] line-through">
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#7A6C5F] mt-1 line-clamp-1">
                        {product.fabric}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleMoveToBag(product)}
                        disabled={isAdded}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#9B2242] hover:bg-[#831B36] text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Bag</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onQuickViewProduct(product);
                          onClose();
                        }}
                        className="py-2 px-2.5 rounded-lg border border-[#D6CBB8] text-[#55473B] hover:bg-white text-[11px] font-semibold transition-colors cursor-pointer"
                        title="View Details"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {wishlistItems.length > 0 && (
          <div className="p-6 border-t border-[#EAE2D5] bg-[#FAF8F5]">
            <div className="flex items-center justify-between text-xs text-[#7A6C5F] mb-3">
              <span>Looking for styling assistance?</span>
              <span className="font-semibold text-[#9B2242]">VIP Concierge</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-[#221C18] hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
