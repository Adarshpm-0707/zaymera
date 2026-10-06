'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductItem, CartItem } from '@/types';
import { PRODUCTS_CATALOG } from '@/constants/catalog';

const CART_STORAGE_KEY = 'zaymera_cart';

export function useCart(initialItems?: CartItem[]) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems || []);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (e) {
      console.warn('[useCart] Failed to read cart from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Persist to LocalStorage whenever cartItems change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      // Broadcast to other components in this window
      window.dispatchEvent(new CustomEvent('zaymera-cart-updated', { detail: cartItems }));
    } catch (e) {
      console.warn('[useCart] Failed to save cart to localStorage:', e);
    }
  }, [cartItems, isInitialized]);

  // 3. Listen to external updates (cross-tab or sibling components)
  useEffect(() => {
    const handleCartSync = (e: Event) => {
      const customEvent = e as CustomEvent<CartItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setCartItems(customEvent.detail);
      } else {
        try {
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            setCartItems(JSON.parse(saved));
          }
        } catch {
          // ignore
        }
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          setCartItems(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('zaymera-cart-updated', handleCartSync);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('zaymera-cart-updated', handleCartSync);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((product: ProductItem, size?: string) => {
    // Prevent adding out-of-stock products
    if (product.stock !== undefined && product.stock <= 0) {
      console.warn(`[useCart] Blocked add to cart: "${product.name}" is out of stock.`);
      return;
    }
    if (product.inStock === false) {
      console.warn(`[useCart] Blocked add to cart: "${product.name}" is unavailable.`);
      return;
    }

    const chosenSize = size || (product.sizes?.find(s => s.inStock)?.size) || 'Standard (M)';
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === chosenSize);
      if (existing) {
        const maxStock = product.stock !== undefined ? product.stock : Infinity;
        const newQuantity = Math.min(existing.quantity + 1, maxStock);
        return prev.map(item =>
          item.product.id === product.id && item.size === chosenSize
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size: chosenSize }];
    });
  }, []);

  const addCustomToCart = useCallback((productName: string, priceStr: string, size: string, fallbackImage?: string) => {
    const matched = PRODUCTS_CATALOG.find(p => p.name.includes(productName) || productName.includes(p.name)) || {
      id: 'custom-' + Date.now(),
      name: productName,
      category: 'festive-wear',
      price: parseInt(priceStr.replace(/[^0-9]/g, '')) || 3999,
      originalPrice: 4999,
      image: fallbackImage || (PRODUCTS_CATALOG.length > 0 ? PRODUCTS_CATALOG[0].image : '/images/zaymera_circle_logo_1788315549876.jpg'),
      tag: 'Couture Selection',
      description: 'Exclusive handcrafted designer ensemble from Zaymera Haute Couture & Designer Hub.',
      fabric: 'Handloom Cotton & Silk',
      work: 'Resham & Zardozi Threadwork',
      inStock: true
    };

    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === matched.id && item.size === size);
      if (existing) {
        return prev.map(item =>
          item.product.id === matched.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product: matched, quantity: 1, size }];
    });
  }, []);

  const removeCartItem = useCallback((index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateCartQuantity = useCallback((index: number, delta: number) => {
    setCartItems(prev =>
      prev
        .map((item, i) => {
          if (i === index) {
            const maxStock = item.product.stock !== undefined ? item.product.stock : Infinity;
            const newQty = Math.min(item.quantity + delta, maxStock);
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('zaymera-cart-updated', { detail: [] }));
    } catch {
      // ignore
    }
  }, []);

  return {
    cartItems,
    totalCartCount,
    addToCart,
    addCustomToCart,
    removeCartItem,
    updateCartQuantity,
    clearCart
  };
}

/**
 * Helper to trigger opening the global cart drawer in either 'cart' or 'checkout' step from anywhere.
 */
export function triggerOpenCartDrawer(step: 'cart' | 'checkout' = 'cart') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaymera-open-cart-drawer', { detail: { step } }));
  }
}
