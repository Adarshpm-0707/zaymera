'use client';

import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Check, ArrowLeft, MapPin, User, Phone, Mail, CreditCard, Truck } from 'lucide-react';
import { CartItem } from '@/types';
import { createOrder } from '@/lib/supabase/services';
import { useAuth } from '@/hooks/useAuth';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onClearCart?: () => void;
}

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: 'COD' | 'Prepaid';
}

type DrawerStep = 'cart' | 'checkout' | 'success';

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<DrawerStep>('cart');
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<CheckoutForm>>({});

  const [form, setForm] = useState<CheckoutForm>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    paymentMethod: 'COD',
  });

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 2999 || subtotal === 0 ? 0 : 150;
  const total = subtotal + shipping;

  const handleFormChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CheckoutForm> = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Valid email required';
    if (!form.phone.trim() || form.phone.length < 8) errors.phone = 'Valid phone number required';
    if (!form.street.trim()) errors.street = 'Street address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State is required';
    if (!form.postalCode.trim()) errors.postalCode = 'Postal code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCheckingOut(true);
    const newOrderNumber = 'ZYM-' + Math.floor(100000 + Math.random() * 900000);

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
        paymentMethod: form.paymentMethod,
      });

      setOrderNumber(newOrderNumber);
      setStep('success');
      if (onClearCart) onClearCart();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClose = () => {
    setStep('cart');
    setOrderNumber(null);
    setFormErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-[#2B231D]">

        {/* Header */}
        <div className="p-5 border-b border-[#EAE2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                onClick={() => setStep('cart')}
                className="p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <ShoppingBag className="w-5 h-5 text-[#9B2242]" />
            <h3 className="font-display text-lg font-normal text-[#1F1916] tracking-wide">
              {step === 'cart' && `Shopping Bag (${cartItems.reduce((acc, i) => acc + i.quantity, 0)})`}
              {step === 'checkout' && 'Checkout Details'}
              {step === 'success' && 'Order Placed!'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── STEP: SUCCESS ─── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display text-2xl font-normal text-[#1F1916]">Order Placed!</h4>
              <p className="text-sm text-[#7A6D60] mt-2 leading-relaxed">
                Your order <strong className="text-[#9B2242]">{orderNumber}</strong> has been placed successfully.
              </p>
              <p className="text-xs text-[#A89887] mt-1">
                An email confirmation will be sent to <span className="font-semibold">{form.email}</span>
              </p>
            </div>
            <div className="bg-[#FAF5ED] border border-[#E8D9C0] rounded-2xl p-4 w-full text-left space-y-1">
              <div className="text-xs font-bold text-[#7A6959] uppercase tracking-wider mb-2">Delivery To</div>
              <div className="text-sm font-semibold text-[#221C18]">{form.fullName}</div>
              <div className="text-xs text-[#7A6D60]">{form.street}, {form.city}, {form.state} - {form.postalCode}</div>
              <div className="text-xs text-[#7A6D60]">{form.phone}</div>
              <div className="text-xs font-semibold text-[#9B2242] mt-1">Payment: {form.paymentMethod}</div>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* ─── STEP: CHECKOUT FORM ─── */}
        {step === 'checkout' && (
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Order Summary Mini */}
              <div className="bg-[#FAF5ED] border border-[#E8D9C0] rounded-xl p-3 text-xs">
                <div className="flex justify-between font-semibold text-[#1F1916]">
                  <span>{cartItems.length} Item(s)</span>
                  <span>₹{total.toLocaleString()} {shipping === 0 ? '• Free Shipping' : `• +₹${shipping} shipping`}</span>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#8C7A68] tracking-wider mb-2.5">
                  <User className="w-3.5 h-3.5" /> Personal Details
                </div>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={form.fullName}
                      onChange={e => handleFormChange('fullName', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.fullName ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
                    />
                    {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.fullName}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={form.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.email ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
                    />
                    {formErrors.email && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={form.phone}
                      onChange={e => handleFormChange('phone', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.phone ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#8C7A68] tracking-wider mb-2.5">
                  <MapPin className="w-3.5 h-3.5" /> Shipping Address
                </div>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Street / House No / Area *"
                      value={form.street}
                      onChange={e => handleFormChange('street', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.street ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
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
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.city ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
                      />
                      {formErrors.city && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.city}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State *"
                        value={form.state}
                        onChange={e => handleFormChange('state', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.state ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
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
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 ${formErrors.postalCode ? 'border-red-400 bg-red-50' : 'border-[#DDD0C0] bg-[#FAF8F5]'}`}
                      />
                      {formErrors.postalCode && <p className="text-red-500 text-[10px] mt-1 ml-1">{formErrors.postalCode}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Country"
                        value={form.country}
                        onChange={e => handleFormChange('country', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD0C0] bg-[#FAF8F5] text-sm text-[#1F1916] placeholder-[#B0A090] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#8C7A68] tracking-wider mb-2.5">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Method
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['COD', 'Prepaid'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handleFormChange('paymentMethod', method)}
                      className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                        form.paymentMethod === method
                          ? 'border-[#9B2242] bg-[#9B2242]/5 text-[#9B2242]'
                          : 'border-[#DDD0C0] text-[#7A6959] hover:border-[#C5A059]'
                      }`}
                    >
                      {method === 'COD' ? <Truck className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      <span>{method === 'COD' ? 'Cash on Delivery' : 'Prepaid (UPI/Card)'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Footer */}
            <div className="p-5 border-t border-[#EAE2D5] bg-[#FAF8F5] space-y-3 shrink-0">
              <div className="flex justify-between text-sm font-bold text-[#1F1916]">
                <span>Total Amount</span>
                <span className="text-[#9B2242]">₹{total.toLocaleString()}</span>
              </div>
              <button
                type="submit"
                disabled={checkingOut}
                className="w-full py-4 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C7A68]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Secure & Encrypted Checkout</span>
              </div>
            </div>
          </form>
        )}

        {/* ─── STEP: CART ─── */}
        {step === 'cart' && (
          <>
            {cartItems.length === 0 ? (
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
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.size}-${index}`}
                    className="flex gap-3.5 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EADBCC]"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-20 object-cover rounded-lg bg-[#ECE4D8] shrink-0"
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
                            className="px-2 py-1 text-xs font-bold text-[#55473B] hover:bg-[#FAF4EA] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-semibold text-[#221C18]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(index, 1)}
                            className="px-2 py-1 text-xs font-bold text-[#55473B] hover:bg-[#FAF4EA] cursor-pointer"
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

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-[#EAE2D5] bg-[#FAF8F5] space-y-4 shrink-0">
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
                  onClick={() => setStep('checkout')}
                  className="w-full py-4 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C7A68]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Encrypted & Safe Boutique Checkout</span>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
