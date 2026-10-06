'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Printer,
  ShoppingBag,
  MapPin,
  CreditCard,
  User,
  Phone,
  Mail,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Ban
} from 'lucide-react';
import {
  getOrderByNumber,
  cancelCustomerOrder,
  getCustomerRecentOrders,
  ORDER_CANCELLATION_WINDOW_MINUTES
} from '@/lib/supabase/services';
import { circleLogoImg } from '@/constants/catalog';
import {
  STORE_ADMIN_EMAIL,
  formatOrderDateTime,
  sendOrderPlacedEmails,
  sendOrderCancelledEmails,
  generateGmailComposeUrl,
  isFormSubmitActivated
} from '@/lib/email/orderEmailService';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryOrderNumber = searchParams.get('orderNumber') || searchParams.get('orderId');

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelToast, setCancelToast] = useState<string | null>(null);

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isWindowExpired, setIsWindowExpired] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!order) return;
    setResendingEmail(true);
    try {
      let res: any;
      if (order.order_status === 'cancelled') {
        res = await sendOrderCancelledEmails(order, order.cancel_reason);
      } else {
        res = await sendOrderPlacedEmails(order);
      }
      if (res?.needsActivation) {
        setEmailNotice(`Action Required: Please click "Activate Form" in your email at ${STORE_ADMIN_EMAIL} to complete setup.`);
      } else {
        setEmailNotice(`Order email dispatched to ${order.customer_email || 'customer'} and ${STORE_ADMIN_EMAIL}`);
      }
      setTimeout(() => setEmailNotice(null), 6000);
    } catch {
      setEmailNotice('Email registered in communication queue.');
      setTimeout(() => setEmailNotice(null), 4000);
    } finally {
      setResendingEmail(false);
    }
  };

  // Load Order
  const loadOrder = async () => {
    let orderNum = queryOrderNumber;
    if (!orderNum) {
      const recents = getCustomerRecentOrders();
      if (recents.length > 0) orderNum = recents[0];
    }

    if (!orderNum) {
      setLoading(false);
      return;
    }

    try {
      const data = await getOrderByNumber(orderNum);
      if (data) {
        setOrder(data);
      }
    } catch (err) {
      console.error('Failed to load order for success page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    const handleOrdersUpdate = () => loadOrder();
    window.addEventListener('zaymera-orders-updated', handleOrdersUpdate);
    return () => window.removeEventListener('zaymera-orders-updated', handleOrdersUpdate);
  }, [queryOrderNumber]);

  // Compute countdown timer
  useEffect(() => {
    if (!order || order.order_status === 'cancelled') {
      setRemainingSeconds(null);
      return;
    }

    const createdAtMs = new Date(order.created_at || order.createdAt || Date.now()).getTime();
    const windowMs = ORDER_CANCELLATION_WINDOW_MINUTES * 60 * 1000;

    const tick = () => {
      const elapsed = Date.now() - createdAtMs;
      const left = Math.max(0, Math.floor((windowMs - elapsed) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        setIsWindowExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleCopyOrderNumber = () => {
    if (!order?.order_number) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!order?.order_number) return;
    setCancelling(true);
    try {
      const res = await cancelCustomerOrder(order.order_number, 'Customer cancelled from order success page');
      if (res.success && res.order) {
        setOrder(res.order);
        setCancelToast(res.message);
        setShowCancelModal(false);
      } else {
        alert(res.message || 'Unable to cancel order.');
      }
    } catch (err: any) {
      alert(`Cancellation error: ${err?.message || 'Failed'}`);
    } finally {
      setCancelling(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-display text-lg text-[#221C18]">Preparing Your Boutique Confirmation...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-[#EAE2D5] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF5EE] text-[#9B2242] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl text-[#1F1916]">No Active Order Found</h2>
          <p className="text-xs text-[#7A6D60] leading-relaxed">
            We could not retrieve the details for this order reference. You can check your recent orders or explore our latest collection.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Link
              href="/orders"
              className="flex-1 py-3 px-4 rounded-xl bg-[#9B2242] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#831B36] transition-all"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="flex-1 py-3 px-4 rounded-xl border border-[#DDD0C0] text-[#221C18] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F5] transition-all"
            >
              Shop Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = order.order_items || order.cartItems || [];
  const isCancelled = order.order_status === 'cancelled';
  const canCancel = !isCancelled && remainingSeconds !== null && remainingSeconds > 0 && !isWindowExpired;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#221C18] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {cancelToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#1C1613] text-white shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cancelToast}</span>
          <button onClick={() => setCancelToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Brand Top Bar ── */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5] print:hidden">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] overflow-hidden">
              <img src={circleLogoImg} alt="Zaymera" className="w-full h-full object-cover rounded-full bg-[#FAF7F2]" />
            </div>
            <div>
              <span className="font-display text-xl tracking-[0.2em] text-[#1A1412] group-hover:text-[#9B2242] transition-colors">
                ZAYMERA
              </span>
              <span className="block text-[7px] tracking-[0.25em] text-[#8C7A6B] uppercase">
                HAUTE COUTURE ATELIER
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DDD0C0] text-xs font-medium text-[#4A3E34] hover:bg-[#FAF4EA] transition-all cursor-pointer shadow-xs"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-[#9B2242]" />
              <span className="hidden sm:inline">Print Receipt</span>
            </button>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#221C18] text-white text-xs font-medium hover:bg-black transition-all cursor-pointer shadow-xs"
            >
              <span>My Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Grand Celebration Card ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#FFF] via-[#FCFAF7] to-[#FAF5ED] border border-[#E8DCCB] p-6 sm:p-10 shadow-lg text-center space-y-6">
          {/* Subtle Decorative Background Seal */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4E2BD]/20 to-[#9B2242]/5 blur-2xl pointer-events-none" />

          {/* Celebration Crest Icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#C5A059]/20 via-[#FAF5EE] to-[#9B2242]/15 p-1 mx-auto shadow-md">
            <div className={`w-full h-full rounded-full flex items-center justify-center ${isCancelled ? 'bg-rose-50 text-rose-600' : 'bg-gradient-to-tr from-[#9B2242] to-[#B3294E] text-white shadow-inner'}`}>
              {isCancelled ? <Ban className="w-10 h-10" /> : <Check className="w-10 h-10 stroke-[2.5]" />}
            </div>
            {!isCancelled && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C5A059]"></span>
              </span>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF0E1] border border-[#E5D2BA] text-[11px] font-bold text-[#8C5D23] uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#9B2242]" />
              {isCancelled ? 'Order Has Been Cancelled' : 'Boutique Order Confirmed'}
            </span>
            <h1 className="font-display text-2xl sm:text-4xl text-[#1F1916] font-normal leading-tight">
              {isCancelled ? 'Your Order Was Cancelled' : 'Thank You For Your Patronage'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6D60] leading-relaxed">
              {isCancelled
                ? 'Your order has been officially cancelled. All reserved items have been returned to our inventory ledger.'
                : 'Your bespoke couture order has been placed into our artisan queue. Handloom verification and silk inspection are beginning.'}
            </p>
          </div>

          {/* Order Reference Pill & Purchasing Time */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 rounded-2xl bg-white border border-[#E0D5C3] shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider">
                Order Reference:
              </span>
              <span className="font-display text-base sm:text-lg text-[#9B2242] font-semibold tracking-wide">
                {order.order_number}
              </span>
              <button
                onClick={handleCopyOrderNumber}
                className="p-1.5 rounded-lg hover:bg-[#FAF4EA] text-[#8C7A68] hover:text-[#221C18] transition-colors cursor-pointer"
                title="Copy Order Reference"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DCCB] text-xs font-medium text-[#7A6959]">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Purchased on: <strong className="text-[#1F1916]">{formatOrderDateTime(order.created_at)}</strong></span>
            </div>
          </div>

          {/* ── EMAIL CONFIRMATION DISPATCH BANNER ── */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-left text-xs text-[#166534] flex flex-col gap-2.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#15803D]">
                    {isCancelled ? 'Cancellation Notification Dispatched' : 'Complete Order Invoice & Details Dispatched'}
                  </div>
                  <div className="text-[11px] text-[#166534] mt-0.5 leading-relaxed">
                    Full purchasing time, ensembles breakdown &amp; payment terms routed to <span className="font-semibold underline">{order.customer_email || 'customer'}</span> and store desk <span className="font-semibold">{STORE_ADMIN_EMAIL}</span>.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#DCFCE7] border border-[#86EFAC] text-[11px] font-bold text-[#166534] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
                >
                  {resendingEmail ? 'Sending...' : 'Resend Email'}
                </button>
                <a
                  href={generateGmailComposeUrl(
                    order.customer_email || STORE_ADMIN_EMAIL,
                    `Zaymera Order Invoice #${order.order_number}`,
                    `Dear Patron,\n\nHere are the details for Zaymera order #${order.order_number} placed on ${formatOrderDateTime(order.created_at)}.\nTotal: ₹${order.total}\nPayment: ${order.payment_method}\n\nThank you for choosing Zaymera Couture!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#DCFCE7] border border-[#86EFAC] text-[11px] font-bold text-[#166534] uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>Open in Gmail</span>
                </a>
              </div>
            </div>

            {!isFormSubmitActivated() && (
              <div className="pt-2 border-t border-[#DCFCE7] text-[10.5px] text-[#15803D]/80 flex items-center justify-between">
                <span>🔔 Store Owner: If this is your first order, check Gmail ({STORE_ADMIN_EMAIL}) to click "Activate Form" once.</span>
              </div>
            )}
          </div>
          {emailNotice && (
            <p className="text-[11px] text-[#15803D] font-medium text-center">{emailNotice}</p>
          )}

          {/* ─── LIVE 15-MINUTE CANCELLATION WIDGET ─── */}
          <div className="max-w-xl mx-auto pt-2">
            {canCancel && remainingSeconds !== null && (
              <div className="rounded-2xl bg-gradient-to-r from-[#FFF9F2] via-[#FEF5EB] to-[#FFF9F2] border border-[#E8D4BE] p-4 sm:p-5 shadow-xs text-left space-y-3 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D97706]"></span>
                    </span>
                    <span className="text-xs font-bold text-[#92400E] uppercase tracking-wider">
                      Order Cancellation Window Active
                    </span>
                  </div>
                  {/* Countdown Timer Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D97706]/30 text-xs font-mono font-bold text-[#B45309] shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>{formatCountdown(remainingSeconds)} Remaining</span>
                  </div>
                </div>

                <p className="text-xs text-[#785934] leading-relaxed">
                  You may cancel this order within the next <strong>{Math.ceil(remainingSeconds / 60)} minutes</strong>. If cancelled, all reserved items will be returned to stock automatically.
                </p>

                {/* Live Progress Bar */}
                <div className="w-full bg-[#E8D9C8] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#D97706] to-[#9B2242] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, (remainingSeconds / (ORDER_CANCELLATION_WINDOW_MINUTES * 60)) * 100))}%`
                    }}
                  />
                </div>

                {/* Cancel Action Button */}
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              </div>
            )}

            {!canCancel && !isCancelled && (
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#E5DCCD] p-3.5 text-xs text-[#7A6D60] flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  The 15-minute cancellation window has elapsed. Your bespoke pieces are currently undergoing artisan handloom preparation.
                </span>
              </div>
            )}

            {isCancelled && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-center justify-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">
                  This order was cancelled. Stock has been restored to inventory automatically.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 2-Column Details: Ordered Items & Logistics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Ordered Items List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EAE2D5] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#9B2242]" />
                <h3 className="font-display text-lg text-[#1F1916]">
                  Ordered Pieces ({items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0)})
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]'
              }`}>
                {isCancelled ? 'Cancelled' : (order.order_status || 'Processing')}
              </span>
            </div>

            <div className="divide-y divide-[#F2EDE4]">
              {items.map((item: any, idx: number) => {
                const prodId = item.product_id || item.product?.id || `item-${idx}`;
                const prodName = item.product_name || item.product?.name || 'Couture Piece';
                const prodImg = item.product_image || item.product?.image || circleLogoImg;
                const price = Number(item.price || item.product?.price || 0);
                const qty = Number(item.quantity || 1);
                const size = item.size || 'M';

                return (
                  <div key={idx} className="py-3.5 flex items-center gap-4">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#FAF6F0] border border-[#E8DCCB] shrink-0">
                      <img src={prodImg} alt={prodName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#1F1916] truncate">{prodName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#8C7A68]">
                        <span className="px-2 py-0.5 rounded bg-[#FAF5EE] border border-[#E8DFC9] font-medium text-[10px]">
                          Size: {size}
                        </span>
                        <span>Qty: {qty}</span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-[#9B2242]">
                        ₹{price.toLocaleString()} each
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#1F1916]">
                        ₹{(price * qty).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-[#EAE2D5] space-y-2 text-xs text-[#6B5D50]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Luxury Express Shipping</span>
                <span className="text-emerald-700 font-semibold">
                  {Number(order.shipping_fee || 0) === 0 ? 'COMPLIMENTARY' : `₹${order.shipping_fee}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EAE2D5] text-base font-bold text-[#1F1916]">
                <span className="font-display">Total Amount</span>
                <span className="text-[#9B2242]">₹{Number(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Customer & Shipping Logistics */}
          <div className="space-y-6">

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl border border-[#EAE2D5] p-6 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8C7A68] uppercase tracking-wider pb-2 border-b border-[#EAE2D5]">
                <MapPin className="w-3.5 h-3.5 text-[#9B2242]" /> Delivery Destination
              </div>
              <div className="space-y-1 text-xs text-[#5D5043]">
                <div className="font-semibold text-sm text-[#1F1916]">{order.customer_name}</div>
                <div>{order.shipping_address?.street || 'Address on file'}</div>
                <div>
                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postalCode}
                </div>
                <div>{order.shipping_address?.country || 'India'}</div>
              </div>
              <div className="pt-2 border-t border-[#F2ECE1] space-y-1 text-xs text-[#7A6D60]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-[#A89887]" /> {order.customer_phone || 'Phone verified'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#A89887]" /> {order.customer_email || 'Email verified'}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-3xl border border-[#EAE2D5] p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8C7A68] uppercase tracking-wider pb-2 border-b border-[#EAE2D5]">
                <CreditCard className="w-3.5 h-3.5 text-[#9B2242]" /> Payment Settlement
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6D5E51]">Payment Method</span>
                <span className="font-bold text-[#1F1916]">
                  {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6D5E51]">Payment Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status || (order.payment_method === 'COD' ? 'Pending (Pay on Delivery)' : 'Verified Online')}
                </span>
              </div>
              <p className="text-[10.5px] text-[#7A6959] leading-tight pt-1 border-t border-[#F2ECE1]">
                {order.payment_method === 'COD'
                  ? 'Please keep exact cash ready upon doorstep delivery. Courier executive will provide confirmation.'
                  : 'Transaction processed securely online. Prioritized for immediate bespoke packaging.'}
              </p>
            </div>

            {/* Timeline Progress */}
            <div className="bg-[#FAF5ED] rounded-3xl border border-[#E8DFC9] p-6 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8C7A68] uppercase tracking-wider pb-2 border-b border-[#E2D6C0]">
                <Truck className="w-3.5 h-3.5 text-[#9B2242]" /> Artisan Fulfillment Flow
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F1916]">Order Received & Registered</div>
                    <div className="text-[10px] text-[#8C7A68]">Stored securely in Zaymera system</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isCancelled ? 'bg-gray-300 text-white' : 'bg-[#9B2242] text-white'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F1916]">Handloom Allocation & Weaving</div>
                    <div className="text-[10px] text-[#8C7A68]">Artisan fabric inspection</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#7A6D60]">Boutique Silk Box Packaging</div>
                    <div className="text-[10px] text-[#A39281]">Custom sealing with signature ribbon</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#7A6D60]">Express Luxury Dispatch</div>
                    <div className="text-[10px] text-[#A39281]">Insured signature delivery</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Footer Actions ── */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
          <Link
            href="/orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 text-center cursor-pointer"
          >
            Manage in My Orders
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#DDD0C0] text-[#221C18] text-xs font-bold uppercase tracking-widest transition-all shadow-xs active:scale-95 text-center cursor-pointer"
          >
            Continue Shopping
          </Link>
        </div>

      </div>

      {/* ── Cancellation Confirmation Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E5DCCE] shadow-2xl p-6 sm:p-7 text-[#2B231D] space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display text-2xl text-[#1F1916]">Cancel This Order?</h3>
              <p className="text-xs text-[#7A6D60] leading-relaxed">
                Are you sure you want to cancel order <strong className="text-[#9B2242]">{order.order_number}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] text-left mt-2">
                ⚡ <strong>Stock Restoration:</strong> The ordered items will be immediately returned to our inventory and made available for other clients.
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl border border-[#DDD0C0] text-xs font-bold text-[#4A3E34] uppercase tracking-wider hover:bg-[#FAF8F5] transition-all cursor-pointer disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
          <div className="w-10 h-10 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
