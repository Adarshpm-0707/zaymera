'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Check,
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Clock,
  Ban,
  AlertTriangle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CartItem } from '@/types';
import { createOrder, cancelCustomerOrder, ORDER_CANCELLATION_WINDOW_MINUTES, STORE_ADMIN_EMAIL } from '@/lib/supabase/services';
import { useAuth } from '@/hooks/useAuth';
import { openRazorpayCheckout } from '@/lib/razorpay-client';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onClearCart?: () => void;
  initialStep?: 'cart' | 'checkout';
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
  onClearCart,
  initialStep = 'cart'
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<DrawerStep>(initialStep || 'cart');
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<CheckoutForm>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync initialStep when isOpen changes
  useEffect(() => {
    if (isOpen && initialStep) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Global event listener for opening cart drawer from any product card or component
  useEffect(() => {
    const handleOpenDrawerEvent = (e: Event) => {
      const custom = e as CustomEvent<{ step?: 'cart' | 'checkout' }>;
      if (custom.detail?.step) {
        setStep(custom.detail.step);
      }
    };
    window.addEventListener('zaymera-open-cart-drawer', handleOpenDrawerEvent);
    return () => {
      window.removeEventListener('zaymera-open-cart-drawer', handleOpenDrawerEvent);
    };
  }, []);

  // Cancellation State
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelRemaining, setCancelRemaining] = useState<number>(ORDER_CANCELLATION_WINDOW_MINUTES * 60);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Cancellation Timer
  useEffect(() => {
    if (step !== 'success' || isCancelled) return;
    setCancelRemaining(ORDER_CANCELLATION_WINDOW_MINUTES * 60);
    const interval = setInterval(() => {
      setCancelRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, isCancelled]);

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
    if (paymentError) {
      setPaymentError(null);
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

              setOrderNumber(newOrderNumber);
              setStep('success');
              if (onClearCart) onClearCart();
            } catch (err: any) {
              console.error('Checkout error saving order:', err);
              setPaymentError('Payment verified, but saving your order encountered an issue. Payment ID: ' + paymentData.razorpay_payment_id);
            } finally {
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
        setPaymentError(err?.message || 'Failed to initialize Razorpay checkout');
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
        paymentMethod: form.paymentMethod,
        paymentStatus: 'pending',
      });

      setOrderNumber(newOrderNumber);
      setStep('success');
      if (onClearCart) onClearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentError('Failed to place order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

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

      setOrderNumber(newOrderNumber);
      setStep('success');
      if (onClearCart) onClearCart();
    } catch (err: any) {
      console.error('Simulated order error:', err);
      setPaymentError('Failed to simulate order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClose = () => {
    setStep('cart');
    setOrderNumber(null);
    setIsCancelled(false);
    setCancelModalOpen(false);
    setFormErrors({});
    setPaymentError(null);
    onClose();
  };

  const handleCancelFromDrawer = async () => {
    if (!orderNumber) return;
    setCancellingOrder(true);
    try {
      const res = await cancelCustomerOrder(orderNumber, 'Cancelled from Cart Drawer');
      if (res.success) {
        setIsCancelled(true);
        setCancelModalOpen(false);
      } else {
        alert(res.message || 'Could not cancel order.');
      }
    } catch (err: any) {
      alert(`Cancellation error: ${err?.message || 'Failed'}`);
    } finally {
      setCancellingOrder(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
              {step === 'success' && (isCancelled ? 'Order Cancelled' : 'Order Placed!')}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── STEP: SUCCESS (LUXURY REDESIGN) ─── */}
        {step === 'success' && (
          <div className="flex-1 overflow-y-auto p-6 text-center space-y-4">
            {/* Celebration Emblem */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
              isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-gradient-to-tr from-[#9B2242] to-[#B3294E] text-white'
            }`}>
              {isCancelled ? <Ban className="w-8 h-8" /> : <Check className="w-8 h-8 stroke-[2.5]" />}
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0E1] border border-[#E5D2BA] text-[10px] font-bold text-[#8C5D23] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#9B2242]" />
                {isCancelled ? 'Order Cancelled' : 'Order Confirmed'}
              </span>
              <h4 className="font-display text-2xl font-normal text-[#1F1916] mt-1.5">
                {isCancelled ? 'Order Was Cancelled' : 'Haute Couture Order Placed!'}
              </h4>
              <p className="text-xs text-[#7A6D60] mt-1 leading-relaxed">
                {isCancelled
                  ? 'Your order has been cancelled and products have been returned to our inventory stock.'
                  : `Your order has been registered in our bespoke artisan queue.`}
              </p>
            </div>

            {/* Order Reference Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8DCCB]">
              <span className="text-[10px] uppercase font-bold text-[#8C7A68] tracking-wider">Reference:</span>
              <span className="font-display text-sm font-semibold text-[#9B2242]">{orderNumber}</span>
            </div>

            {/* ── LIVE 15-MINUTE CANCELLATION WIDGET ── */}
            {!isCancelled && cancelRemaining > 0 && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>Cancellation Window Active</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-300 text-[11px] font-mono font-bold text-amber-800">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{formatCountdown(cancelRemaining)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800/90 leading-tight">
                  You can cancel this order within the next {Math.ceil(cancelRemaining / 60)} minutes. If cancelled, reserved items are immediately returned to inventory.
                </p>

                <div className="w-full bg-amber-200/60 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, (cancelRemaining / (ORDER_CANCELLATION_WINDOW_MINUTES * 60)) * 100))}%`
                    }}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <Ban className="w-3 h-3 text-rose-600" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-left flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>This order was cancelled. Stock has been auto-restored in inventory.</span>
              </div>
            )}

            {/* Delivery Card */}
            <div className="bg-[#FAF5ED] border border-[#E8D9C0] rounded-2xl p-4 text-left space-y-1">
              <div className="text-[10px] font-bold text-[#7A6959] uppercase tracking-wider mb-1">Delivery Destination</div>
              <div className="text-sm font-semibold text-[#221C18]">{form.fullName}</div>
              <div className="text-xs text-[#7A6D60]">{form.street}, {form.city}, {form.state} - {form.postalCode}</div>
              <div className="text-xs text-[#7A6D60]">{form.phone}</div>
              <div className="text-xs font-semibold text-[#9B2242] mt-1">
                Payment Method: {form.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)'}
              </div>
            </div>

            {/* ── EMAIL DISPATCH NOTIFICATION CARD ── */}
            <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-left text-xs text-[#166534] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Mail className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>{isCancelled ? 'Cancellation Notification Dispatched' : 'Complete Order Details Emailed'}</span>
              </div>
              <p className="text-[11px] text-[#15803D] leading-relaxed">
                {isCancelled
                  ? `Cancellation confirmation has been sent to ${form.email} and ${STORE_ADMIN_EMAIL}.`
                  : `Full invoice, purchasing time & items breakdown have been sent to ${form.email} and our atelier at ${STORE_ADMIN_EMAIL}.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  if (orderNumber) {
                    router.push(`/order-success?orderNumber=${encodeURIComponent(orderNumber)}`);
                  }
                  handleClose();
                }}
                className="w-full py-3 rounded-xl bg-[#221C18] hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <span>View Full Invoice & Tracking</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
              </button>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#DDD0C0] text-[#221C18] text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal in Drawer */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 text-center shadow-2xl border border-[#E5DCCE] space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-display text-lg text-[#1F1916]">Cancel Order #{orderNumber}?</h4>
              <p className="text-xs text-[#7A6D60] leading-relaxed">
                Confirm order cancellation? All items in this order will be automatically returned to inventory stock.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  disabled={cancellingOrder}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD0C0] text-xs font-bold text-[#4A3E34] uppercase tracking-wider hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Keep
                </button>
                <button
                  onClick={handleCancelFromDrawer}
                  disabled={cancellingOrder}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
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
                  <span>{form.paymentMethod === 'Prepaid' ? 'Opening Razorpay...' : 'Placing Order...'}</span>
                ) : (
                  <>
                    <span>{form.paymentMethod === 'Prepaid' ? 'Pay with Razorpay' : 'Place Order'}</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C7A68]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Secure & Encrypted Razorpay Checkout</span>
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

                <div className="flex items-center justify-between text-[11px] text-[#8C7A68]">
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="hover:text-[#9B2242] font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Full Cart Page</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1 text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Safe Boutique Checkout</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
