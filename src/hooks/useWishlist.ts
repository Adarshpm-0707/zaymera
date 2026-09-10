'use client';

import { useState, useEffect } from 'react';
import { ProductItem } from '@/types';
import { PRODUCTS_CATALOG } from '@/constants/catalog';

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<ProductItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('zaymera_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0]?.id) {
          setWishlistItems(parsed);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('zaymera_wishlist', JSON.stringify(wishlistItems));
    } catch {
      // ignore
    }
  }, [wishlistItems, isLoaded]);

  const toggleWishlist = (product: ProductItem) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const removeWishlistItem = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  const isProductWishlisted = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  return {
    wishlistItems,
    wishlistCount: wishlistItems.length,
    wishlistIds: wishlistItems.map(p => p.id),
    toggleWishlist,
    removeWishlistItem,
    isProductWishlisted
  };
}
