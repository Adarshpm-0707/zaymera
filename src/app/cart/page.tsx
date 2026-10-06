'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Check,
  CreditCard,
  Truck,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Sparkles,
  Tag,
  Phone,
  Mail,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppWidget } from '@/components/widgets/WhatsAppWidget';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { createOrder } from '@/lib/supabase/services';
import { openRazorpayCheckout } from '@/lib/razorpay-client';

interface CartCheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: 'Prepaid' | 'COD';
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cartItems,
    totalCartCount,
    removeCartItem,
    updateCartQuantity,
    clearCart
  } = useCart();

  const { wishlistCount } = useWishlist();

  // Checkout Form State
  const [form, setForm] = useState<CartCheckoutForm>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    paymentMethod: 'Prepaid',
  });

  const [formErrors, setFormErrors] = useState<Partial<CartCheckoutForm>>({});
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync user info if user logs in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.user_metadata?.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.user_metadata?.phone || '',
      }));
    }
  }, [user]);

  // Pricing calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const freeShippingThreshold = 2999;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 150;
  const total = subtotal + shipping;
  const progressToFreeShipping = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleFormChange = (field: keyof CartCheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (paymentError) {
      setPaymentError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CartCheckoutForm> = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Valid email is required';
    if (!form.phone.trim() || form.phone.length < 8) errors.phone = 'Valid phone number is required';
    if (!form.street.trim()) errors.street = 'Street address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State is required';
    if (!form.postalCode.trim()) errors.postalCode = 'Postal code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Primary Checkout Handler
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!validateForm()) return;

    setPaymentError(null);
    setCheckingOut(true);
    const newOrderNumber = 'ZYM-' + Math.floor(100000 + Math.random() * 900000);

    // Online Prepaid via Razorpay Standard Checkout
    if (form.paymentMethod === 'Prepaid') {
      try {
        await openRazorpayCheckout({
          amountInPaise: Math.round(total * 100),
          currency: 'INR',
          receipt: newOrderNumber,
          name: 'Zaymera Boutique',
          description: `Order ${newOrderNumber}`,
          prefill: {
            name: form.fullName.trim(),
            email: form.email.trim(),
            contact: form.phone.trim(),
          },
          onSuccess: async (paymentData) => {
            try {
              await createOrder({
                userId: user?.id,
                orderNumber: newOrderNumber,
                customerName: form.fullName.trim(),
                customerEmail: form.email.trim(),
                customerPhone: form.phone.trim(),
                shippingAddress: {
                  street: form.street.trim(),
                  city: form.city.trim(),
                  state: form.state.trim(),
                  postalCode: form.postalCode.trim(),
                  country: form.country.trim() || 'India',
                },
                cartItems,
                subtotal,
                shippingFee: shipping,
                total,
                paymentMethod: 'Prepaid (Razorpay)',
                paymentStatus: 'paid',
                razorpayPaymentId: paymentData.razorpay_payment_id,
                razorpayOrderId: paymentData.razorpay_order_id,
              });

              clearCart();
              router.push(`/order-success?order=${encodeURIComponent(newOrderNumber)}`);
            } catch (err: any) {
              console.error('[CartPage] Save order error:', err);
              setPaymentError('Payment verified, but saving your order encountered an issue. Ref ID: ' + paymentData.razorpay_payment_id);
              setCheckingOut(false);
            }
          },
          onError: (errMsg) => {
            setPaymentError(errMsg);
            setCheckingOut(false);
          },
          onDismiss: () => {
            setCheckingOut(false);
          },
        });
      } catch (err: any) {
        setPaymentError(err?.message || 'Failed to initialize Razorpay checkout.');
        setCheckingOut(false);
      }
      return;
    }

    // Cash on Delivery (COD)
    try {
      await createOrder({
        userId: user?.id,
        orderNumber: newOrderNumber,
        customerName: form.fullName.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        shippingAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || 'India',
        },
        cartItems,
        subtotal,
        shippingFee: shipping,
        total,
        paymentMethod: 'COD',
        paymentStatus: 'pending',
      });

      clearCart();
      router.push(`/order-success?order=${encodeURIComponent(newOrderNumber)}`);
    } catch (err) {
      console.error('[CartPage] COD order error:', err);
      setPaymentError('Failed to place COD order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  // Developer / Sandbox Simulation Fallback
  const handleSimulatePayment = async () => {
    if (!validateForm()) return;
    setCheckingOut(true);
    setPaymentError(null);
    const newOrderNumber = 'ZYM-' + Math.floor(100000 + Math.random() * 900000);
    const mockPaymentId = 'pay_sim_' + Date.now().toString(36);
    const mockOrderId = 'order_sim_' + Date.now().toString(36);

    try {
      await createOrder({
        userId: user?.id,
        orderNumber: newOrderNumber,
        customerName: form.fullName.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        shippingAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || 'India',
        },
        cartItems,
        subtotal,
        shippingFee: shipping,
        total,
        paymentMethod: 'Prepaid (Simulated Test)',
        paymentStatus: 'paid',
        razorpayPaymentId: mockPaymentId,
        razorpayOrderId: mockOrderId,
      });

      clearCart();
      router.push(`/order-success?order=${encodeURIComponent(newOrderNumber)}`);
    } catch (err: any) {
      console.error('[CartPage] Simulated payment error:', err);
      setPaymentError('Failed to complete simulated test order.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#221C18] font-sans-clean">
      {/* 1. Header */}
      <Header
        cartCount={totalCartCount}
        wishlistCount={wishlistCount}
      />

      {/* 2. Breadcrumbs Bar */}
      <div className="border-b border-[#EAE2D5] bg-[#FAF8F5]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-[#7A6A5D]">
          <div className="flex items-center gap-2 truncate">
            <Link href="/" className="hover:text-[#9B2242] transition-colors flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5 sm:hidden" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B7A6] shrink-0" />
            <Link href="/products" className="hover:text-[#9B2242] transition-colors font-medium">
              Catalog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B7A6] shrink-0" />
            <span className="text-[#1F1916] font-semibold truncate">
              Shopping Bag & Checkout ({totalCartCount})
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#8C7A68]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">100% Encrypted Razorpay Checkout</span>
          </div>
        </div>
      </div>

      {/* 3. Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {cartItems.length === 0 ? (
          /* Empty Bag State */
          <div className="py-20 text-center bg-white rounded-3xl border border-[#EAE2D5] p-8 max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#9B2242] mx-auto shadow-inner">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="font-display text-2xl font-normal text-[#221C18]">Your Shopping Bag is Empty</h2>
            <p className="text-xs text-[#7A6D60] max-w-xs mx-auto leading-relaxed">
              Explore our new casual co-ord sets, royal anarkalis, and ceremonial silks to add to your collection.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Two-Column Bag & Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* ── LEFT COLUMN: BAG ITEMS (7 cols) ── */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Header & Item Count */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl text-[#1F1916]">Shopping Bag</h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#9B2242]/10 text-[#9B2242]">
                    {totalCartCount} {totalCartCount === 1 ? 'Piece' : 'Pieces'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-[#8A7868] hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Bag</span>
                </button>
              </div>

              {/* Free Shipping Meter */}
              <div className="bg-white rounded-2xl border border-[#EAE2D5] p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6E5D4F] font-medium flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#9B2242]" />
                    {shipping === 0 ? (
                      <span className="text-emerald-700 font-bold">You qualify for Free Atelier Courier!</span>
                    ) : (
                      <span>Add <strong className="text-[#9B2242]">₹{amountNeededForFreeShipping.toLocaleString()}</strong> more for Free Shipping</span>
                    )}
                  </span>
                  <span className="font-bold text-[#8C7A68] text-[11px]">{progressToFreeShipping}%</span>
                </div>
                <div className="w-full bg-[#FAF5ED] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#9B2242] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.size}-${index}`}
                    className="bg-white rounded-2xl border border-[#EAE2D5] p-4 sm:p-5 flex gap-4 sm:gap-5 shadow-2xs group hover:border-[#D9CCBA] transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden bg-[#F2ECE1] shrink-0 border border-[#EBE3D6]">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-jakarta text-xs sm:text-sm font-bold text-[#221C18] line-clamp-2 leading-snug">
                            {item.product.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeCartItem(index)}
                            className="text-[#A39282] hover:text-red-600 transition-colors p-1 cursor-pointer"
                            title="Remove Piece"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-[#7A6B5C] bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#EAE0D0] font-medium">
                            Size: <strong>{item.size}</strong>
                          </span>
                          {item.product.fabric && (
                            <span className="text-[10px] text-[#8C7A68] hidden sm:inline">
                              {item.product.fabric}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper & Price */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#F5EFE6] mt-2">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#DDD0C0] rounded-lg bg-[#FAF8F5]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(index, -1)}
                            className="w-7 h-7 flex items-center justify-center text-[#6B5A4D] hover:bg-[#EFE7DC] rounded-l-lg transition-colors cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#1F1916]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(index, 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#6B5A4D] hover:bg-[#EFE7DC] rounded-r-lg transition-colors cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#1F1916]">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-[#8C7B6D]">
                              ₹{item.product.price.toLocaleString()} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Button */}
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8A7868] hover:text-[#9B2242] font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Exploring Ensembles</span>
                </Link>
              </div>
            </div>

            {/* ── RIGHT COLUMN: CHECKOUT & PAYMENT (5 cols) ── */}
            <div className="lg:col-span-5 sticky top-16">
              <form onSubmit={handleProceedToPayment} className="bg-white rounded-3xl border border-[#EAE2D5] p-6 sm:p-7 shadow-sm space-y-6">
                
                <div className="pb-3 border-b border-[#EAE2D5] flex items-center justify-between">
                  <h2 className="font-display text-xl text-[#1F1916]">Checkout Details</h2>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <Lock className="w-3 h-3" /> Secure Order
                  </span>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-xl text-red-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-semibold block">{paymentError}</span>
                        <p className="text-[11px] text-red-700 leading-relaxed">
                          Payment could not be processed. Please try again or switch to Cash on Delivery.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-red-200/80 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleFormChange('paymentMethod', 'COD')}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
                      >
                        Switch to COD
                      </button>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A796A] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#9B2242]" /> Customer Contact
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={form.fullName}
                      onChange={e => handleFormChange('fullName', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                        formErrors.fullName ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                      }`}
                    />
                    {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={form.email}
                        onChange={e => handleFormChange('email', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                          formErrors.email ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                        }`}
                      />
                      {formErrors.email && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        value={form.phone}
                        onChange={e => handleFormChange('phone', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                          formErrors.phone ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                        }`}
                      />
                      {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A796A] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9B2242]" /> Shipping Destination
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Street Address, House/Flat No. *"
                      value={form.street}
                      onChange={e => handleFormChange('street', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                        formErrors.street ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                      }`}
                    />
                    {formErrors.street && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.street}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="City *"
                        value={form.city}
                        onChange={e => handleFormChange('city', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                          formErrors.city ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                        }`}
                      />
                      {formErrors.city && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.city}</p>}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="State *"
                        value={form.state}
                        onChange={e => handleFormChange('state', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                          formErrors.state ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                        }`}
                      />
                      {formErrors.state && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="Postal Code *"
                        value={form.postalCode}
                        onChange={e => handleFormChange('postalCode', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${
                          formErrors.postalCode ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'
                        }`}
                      />
                      {formErrors.postalCode && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.postalCode}</p>}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Country"
                        value={form.country}
                        onChange={e => handleFormChange('country', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD0C0] bg-[#FAF8F5] text-xs text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A796A] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#9B2242]" /> Payment Settlement
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleFormChange('paymentMethod', 'Prepaid')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer text-center ${
                        form.paymentMethod === 'Prepaid'
                          ? 'border-[#9B2242] bg-[#9B2242]/5 text-[#9B2242]'
                          : 'border-[#DDD0C0] text-[#7A6959] hover:border-[#C5A059]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1" />
                      <span>Razorpay Online</span>
                      <span className="text-[9px] text-[#8C7A68] font-normal">UPI, Cards, NetBanking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFormChange('paymentMethod', 'COD')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer text-center ${
                        form.paymentMethod === 'COD'
                          ? 'border-[#9B2242] bg-[#9B2242]/5 text-[#9B2242]'
                          : 'border-[#DDD0C0] text-[#7A6959] hover:border-[#C5A059]'
                      }`}
                    >
                      <Truck className="w-4 h-4 mb-1" />
                      <span>Cash on Delivery</span>
                      <span className="text-[9px] text-[#8C7A68] font-normal">Pay on doorstep</span>
                    </button>
                  </div>
                </div>

                {/* Price Summary Breakdown */}
                <div className="pt-4 border-t border-[#EAE2D5] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6D5E51]">
                    <span>Catalog Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6D5E51]">
                    <span>Atelier Courier Shipping</span>
                    <span>{shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#1F1916] pt-2 border-t border-[#F2ECE1]">
                    <span>Final Amount</span>
                    <span className="text-[#9B2242]">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Payment Button */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="w-full py-4 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingOut ? (
                      <span>{form.paymentMethod === 'Prepaid' ? 'Opening Razorpay Modal...' : 'Submitting Order...'}</span>
                    ) : (
                      <>
                        <span>{form.paymentMethod === 'Prepaid' ? `Pay with Razorpay • ₹${total.toLocaleString()}` : `Place COD Order • ₹${total.toLocaleString()}`}</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[#8C7A68]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>100% Encrypted & Authenticated Transaction</span>
                  </div>
                </div>

              </form>
            </div>

          </div>
        )}
      </main>

      {/* 4. Footer & WhatsApp Widget */}
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}
