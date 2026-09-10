'use client';

import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Check } from 'lucide-react';
import { CartItem } from '@/types';
import { createOrder } from '@/lib/supabase/services';
import { useAuth } from '@/hooks/useAuth';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity
}) => {
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 2999 || subtotal === 0 ? 0 : 150;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    setCheckingOut(true);
    const orderNumber = 'ZYM-' + Math.floor(100000 + Math.random() * 900000);
    
    await createOrder({
      userId: user?.id,
      orderNumber,
      customerName: user?.user_metadata?.full_name || 'Boutique Guest',
      customerEmail: user?.email || 'guest@zaymeracouture.com',
      customerPhone: user?.user_metadata?.phone || '+91 98765 43210',
      shippingAddress: {
        street: 'Express Delivery Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India'
      },
      cartItems,
      subtotal,
      shippingFee: shipping,
      total,
      paymentMethod: 'COD'
    });

    setCheckingOut(false);
    setOrderSuccess(orderNumber);
    setTimeout(() => {
      setOrderSuccess(null);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-[#2B231D]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#EAE2D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#9B2242]" />
            <h3 className="font-display text-xl font-normal text-[#1F1916] tracking-wide">
              Shopping Bag ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="font-display text-2xl font-normal text-[#1F1916]">Order Placed!</h4>
            <p className="text-xs text-[#7A6D60]">
              Your order ID is <strong className="text-[#9B2242]">{orderSuccess}</strong>. An email confirmation is on its way.
            </p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#A89887]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="font-display text-lg font-normal text-[#221C18]">Your Bag is Empty</h4>
            <p className="text-xs text-[#7A6D60] max-w-xs">
              Explore our new casual co-ord sets, royal anarkalis, and ceremonial silks.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={`${item.product.id}-${item.size}-${index}`}
                className="flex gap-4 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EADBCC]"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-18 h-22 object-cover rounded-lg bg-[#ECE4D8] shrink-0"
                />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#221C18] line-clamp-2">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-[#9E8E7D] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[11px] text-[#7A6C5F] mt-1">
                      Size: <span className="font-semibold text-[#221C18]">{item.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-[#D6CBB8] rounded-lg bg-white">
                      <button
                        onClick={() => onUpdateQuantity(index, -1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#55473B] hover:bg-[#FAF4EA] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-semibold text-[#221C18]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(index, 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#55473B] hover:bg-[#FAF4EA] cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-bold text-sm text-[#1F1916]">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {cartItems.length > 0 && !orderSuccess && (
          <div className="p-6 border-t border-[#EAE2D5] bg-[#FAF8F5] space-y-4">
            <div className="space-y-2 text-xs text-[#6B5E52]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#221C18]">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span>{shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shipping}`}</span>
              </div>
              <div className="pt-2 border-t border-[#EAE0D1] flex justify-between text-sm font-bold text-[#1F1916]">
                <span>Total Amount</span>
                <span className="text-[#9B2242] text-base">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-4 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{checkingOut ? 'Placing Order...' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C7A68]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Encrypted & Safe Boutique Checkout</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
