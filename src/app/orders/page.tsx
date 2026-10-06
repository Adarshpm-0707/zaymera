'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Package,
  Truck,
  Ban,
  MapPin,
  CreditCard,
  Printer,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  getOrderByNumber,
  fetchAdminOrders,
  cancelCustomerOrder,
  getCustomerRecentOrders,
  ORDER_CANCELLATION_WINDOW_MINUTES
} from '@/lib/supabase/services';
import { circleLogoImg } from '@/constants/catalog';

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('orderNumber') || '';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchLoading, setSearchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cancellation Modal State
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Timer Tick (force component re-render every second to update countdowns)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all recent customer orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const recentNums = getCustomerRecentOrders();
      const loaded: any[] = [];

      // 1. Fetch by recent order numbers
      for (const num of recentNums) {
        const ord = await getOrderByNumber(num);
        if (ord && !loaded.some(o => o.order_number === ord.order_number)) {
          loaded.push(ord);
        }
      }

      // 2. If recentNums was empty or sparse, also check database for fallback
      if (loaded.length === 0) {
        const { data } = await fetchAdminOrders();
        if (data && data.length > 0) {
          // Show up to 10 latest orders
          loaded.push(...data.slice(0, 10));
        }
      }

      // Sort latest first
      loaded.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(loaded);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleUpdate = () => loadOrders();
    window.addEventListener('zaymera-orders-updated', handleUpdate);
    return () => window.removeEventListener('zaymera-orders-updated', handleUpdate);
  }, []);

  // Search by Order ID or phone or email
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      loadOrders();
      return;
    }

    setSearchLoading(true);
    try {
      const ord = await getOrderByNumber(searchInput.trim());
      if (ord) {
        setOrders([ord]);
        showToast(`Found Order ${ord.order_number}`);
      } else {
        // Search in current orders
        const q = searchInput.trim().toLowerCase();
        const filtered = orders.filter(
          o =>
            o.order_number?.toLowerCase().includes(q) ||
            o.customer_phone?.toLowerCase().includes(q) ||
            o.customer_email?.toLowerCase().includes(q)
        );
        if (filtered.length > 0) {
          setOrders(filtered);
        } else {
          showToast(`No orders found matching "${searchInput.trim()}".`);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle Cancel Order
  const handleConfirmCancel = async () => {
    if (!orderToCancel?.order_number) return;
    setCancelling(true);
    try {
      const res = await cancelCustomerOrder(orderToCancel.order_number, 'Customer cancelled from Orders Portal');
      if (res.success && res.order) {
        setOrders(prev =>
          prev.map(o => (o.order_number === res.order.order_number ? res.order : o))
        );
        showToast(`Order ${orderToCancel.order_number} cancelled. Confirmation emailed & stock restored.`);
        setOrderToCancel(null);
      } else {
        alert(res.message || 'Could not cancel order.');
      }
    } catch (err: any) {
      alert(`Error cancelling order: ${err?.message || 'Failed'}`);
    } finally {
      setCancelling(false);
    }
  };

  // Helper for cancellation countdown
  const getCancellationInfo = (order: any) => {
    if (order.order_status === 'cancelled') {
      return { isCancelled: true, canCancel: false, secondsLeft: 0 };
    }
    if (order.order_status === 'shipped' || order.order_status === 'delivered') {
      return { isCancelled: false, canCancel: false, secondsLeft: 0, dispatched: true };
    }

    const createdAtMs = new Date(order.created_at || order.createdAt || now).getTime();
    const windowMs = ORDER_CANCELLATION_WINDOW_MINUTES * 60 * 1000;
    const elapsed = now - createdAtMs;
    const secondsLeft = Math.max(0, Math.floor((windowMs - elapsed) / 1000));

    return {
      isCancelled: false,
      canCancel: secondsLeft > 0,
      secondsLeft,
      dispatched: false
    };
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#221C18] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#1C1613] text-white shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Top Bar / Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE2D5]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F4E2BD] to-[#9B2242] overflow-hidden">
              <img src={circleLogoImg} alt="Zaymera" className="w-full h-full object-cover rounded-full bg-[#FAF7F2]" />
            </div>
            <div>
              <span className="font-display text-2xl tracking-[0.2em] text-[#1A1412] group-hover:text-[#9B2242] transition-colors">
                ZAYMERA
              </span>
              <span className="block text-[8px] tracking-[0.25em] text-[#8C7A6B] uppercase">
                HAUTE COUTURE ATELIER
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DDD0C0] text-xs font-medium text-[#4A3E34] hover:bg-[#FAF4EA] transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#9B2242]" />
              <span>Refresh Orders</span>
            </button>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <span>Shop Collection</span>
            </Link>
          </div>
        </div>

        {/* ── Page Hero & Search Bar ── */}
        <div className="rounded-3xl bg-gradient-to-r from-[#FAF5EE] via-[#FFF] to-[#FAF6F0] border border-[#E8DFC9] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#9B2242]/10 text-[#9B2242] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Client Purchases & Order Tracking
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#1F1916]">
              My Orders & Couture Purchases
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6D60]">
              Track artisan weaving progress, review reserved couture pieces, or cancel active orders within the 15-minute window.
            </p>
          </div>

          {/* Search Lookup Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#A89887]" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by Order ID (e.g. ZYM-123456) or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8CABE] bg-white text-xs sm:text-sm text-[#1F1916] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20 focus:border-[#9B2242]"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-2.5 rounded-xl bg-[#221C18] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  loadOrders();
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#DDD0C0] bg-white text-xs font-medium text-[#7A6D60] hover:bg-[#FAF8F5] transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* ── Orders Feed ── */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-display text-sm text-[#7A6D60]">Retrieving Order Records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EAE2D5] p-12 text-center shadow-xs space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF5EE] text-[#9B2242] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl text-[#1F1916]">No Orders Found</h3>
            <p className="text-xs text-[#7A6D60] leading-relaxed">
              You do not have any recent orders recorded in this session. If you have an Order Reference number, enter it in the search box above.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#9B2242] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#831B36] transition-all"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const items = order.order_items || order.cartItems || [];
              const { isCancelled, canCancel, secondsLeft, dispatched } = getCancellationInfo(order);

              return (
                <div
                  key={order.id || order.order_number}
                  className="bg-white rounded-3xl border border-[#EAE2D5] shadow-xs overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#EAE2D5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg sm:text-xl text-[#9B2242] font-semibold tracking-wide">
                          {order.order_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : order.order_status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.order_status === 'shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]'
                          }`}
                        >
                          {order.order_status || 'Processing'}
                        </span>
                      </div>
                      <div className="text-xs text-[#7A6D60]">
                        Placed on {new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Live Cancellation Countdown Bar & Cancel Action */}
                    <div className="flex flex-wrap items-center gap-3">
                      {canCancel && (
                        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-900">
                            Cancel Window: {formatCountdown(secondsLeft)}
                          </span>
                          <button
                            onClick={() => setOrderToCancel(order)}
                            className="ml-2 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                          >
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}

                      {!canCancel && !isCancelled && !dispatched && (
                        <div className="text-[11px] text-[#8C7A68] bg-[#FAF5ED] px-3 py-1.5 rounded-xl border border-[#EAE0D1]">
                          Cancellation window closed • Crafting in progress
                        </div>
                      )}

                      {isCancelled && (
                        <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancelled • Stock Restored</span>
                        </div>
                      )}

                      <Link
                        href={`/order-success?orderNumber=${encodeURIComponent(order.order_number)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#DDD0C0] text-xs font-semibold text-[#4A3E34] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-xs"
                      >
                        <span>Full Receipt</span>
                        <ExternalLink className="w-3 h-3 text-[#9B2242]" />
                      </Link>
                    </div>
                  </div>

                  {/* Card Body: Ordered Items */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="divide-y divide-[#F2EDE4]">
                      {items.map((it: any, idx: number) => {
                        const pid = it.product_id || it.product?.id || `it-${idx}`;
                        const title = it.product_name || it.product?.name || 'Couture Design';
                        const img = it.product_image || it.product?.image || circleLogoImg;
                        const price = Number(it.price || it.product?.price || 0);
                        const quantity = Number(it.quantity || 1);
                        const size = it.size || 'M';

                        return (
                          <div key={idx} className="py-3 flex items-center gap-4">
                            <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-[#FAF6F0] border border-[#E8DCCB] shrink-0">
                              <img src={img} alt={title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-[#1F1916] truncate">{title}</h4>
                              <div className="flex items-center gap-3 text-xs text-[#7A6D60] mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-[#FAF5EE] text-[10px] font-medium border border-[#E8DCCB]">
                                  Size: {size}
                                </span>
                                <span>Qty: {quantity}</span>
                                <span className="font-semibold text-[#9B2242]">₹{price.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-[#1F1916]">
                                ₹{(price * quantity).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-4 border-t border-[#EAE2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#7A6D60]">
                      <div className="space-y-0.5">
                        <div>
                          <strong>Deliver to:</strong> {order.customer_name} • {order.shipping_address?.city || 'India'}
                        </div>
                        <div>
                          <strong>Payment:</strong> {order.payment_method || 'COD'} ({order.payment_status || 'pending'})
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm font-bold text-[#1F1916]">
                        <span>Total Paid / Due:</span>
                        <span className="text-[#9B2242] text-base">₹{Number(order.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Cancel Order Confirmation Modal ── */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E5DCCE] shadow-2xl p-6 sm:p-7 text-[#2B231D] space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display text-2xl text-[#1F1916]">Cancel This Order?</h3>
              <p className="text-xs text-[#7A6D60] leading-relaxed">
                Are you sure you want to cancel order <strong className="text-[#9B2242]">{orderToCancel.order_number}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] text-left mt-2">
                ⚡ <strong>Stock Restoration:</strong> All {orderToCancel.order_items?.length || 0} product line(s) will be automatically returned to the inventory stock ledger immediately.
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                onClick={() => setOrderToCancel(null)}
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

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
          <div className="w-10 h-10 border-3 border-[#9B2242] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
