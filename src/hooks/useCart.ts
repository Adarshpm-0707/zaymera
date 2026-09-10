'use client';

import { useState } from 'react';
import { ProductItem, CartItem } from '@/types';
import { PRODUCTS_CATALOG } from '@/constants/catalog';

export function useCart(initialItems?: CartItem[]) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems || []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: ProductItem, size?: string) => {
    const chosenSize = size || (product.sizes?.find(s => s.inStock)?.size) || 'Standard (M)';
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === chosenSize);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.size === chosenSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size: chosenSize }];
    });
  };

  const addCustomToCart = (productName: string, priceStr: string, size: string, fallbackImage?: string) => {
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
  };

  const removeCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCartItems(prev =>
      prev
        .map((item, i) => {
          if (i === index) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCartItems([]);

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
