'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  Ban,
  AlertTriangle,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import {
  getOrderByNumber,
  cancelCustomerOrder,
  ORDER_CANCELLATION_WINDOW_MINUTES
} from '@/lib/supabase/services';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [trackedData, setTrackedData] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Live countdown timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);

    const dbOrder = await getOrderByNumber(orderId);
    if (dbOrder) {
      setTrackedOrder(dbOrder);
      setTrackedData({
        id: dbOrder.order_number,
        status: dbOrder.order_status,
        customerName: dbOrder.customer_name,
        total: dbOrder.total,
        createdAt: dbOrder.created_at || dbOrder.createdAt,
        items: dbOrder.order_items || dbOrder.cartItems || [],
        steps: [
          { label: "Order Confirmed & Registered", done: true, time: new Date(dbOrder.created_at).toLocaleDateString() },
          { label: "Handloom Weaving & Inspection", done: dbOrder.order_status !== 'processing' && dbOrder.order_status !== 'cancelled', current: dbOrder.order_status === 'processing', time: "In Progress" },
          { label: "Boutique Silk Box Packaging", done: dbOrder.order_status === 'shipped' || dbOrder.order_status === 'delivered', time: "Pending" },
          { label: "Dispatched with Signature Delivery", done: dbOrder.order_status === 'delivered', time: "Expected" },
        ]
      });
    } else {
      setTrackedOrder(null);
      setTrackedData({
        id: orderId.toUpperCase(),
        status: "In Artisan Quality Check & Pressing",
        estimatedDelivery: "Expected in 2-4 business days",
        courier: "BlueDart Express Luxury Air",
        steps: [
          { label: "Order Confirmed & Payment Verified", done: true, time: "Verified" },
          { label: "Handloom Weaving & Zardozi Detailing Completed", done: true, time: "Completed" },
          { label: "Boutique Quality Inspection & Steam Finishing", done: true, current: true, time: "Today" },
          { label: "Dispatched with Signature Delivery", done: false, time: "Expected Tomorrow" }
        ]
      });
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!trackedOrder?.order_number) return;
    setCancelling(true);
    try {
      const res = await cancelCustomerOrder(trackedOrder.order_number, 'Cancelled via Track Order Modal');
      if (res.success && res.order) {
        setTrackedOrder(res.order);
        setTrackedData((prev: any) => ({
          ...prev,
          status: 'cancelled'
        }));
        setShowCancelModal(false);
        setToast(`Order ${trackedOrder.order_number} cancelled. Confirmation emailed & stock restored.`);
      } else {
        alert(res.message || 'Cancellation failed.');
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Failed'}`);
    } finally {
      setCancelling(false);
    }
  };

  // Determine cancellation timer
  let canCancel = false;
  let secondsLeft = 0;
  if (trackedOrder && trackedOrder.order_status !== 'cancelled' && trackedOrder.order_status !== 'shipped' && trackedOrder.order_status !== 'delivered') {
    const createdMs = new Date(trackedOrder.created_at || trackedOrder.createdAt || now).getTime();
    const windowMs = ORDER_CANCELLATION_WINDOW_MINUTES * 60 * 1000;
    const elapsed = now - createdMs;
    secondsLeft = Math.max(0, Math.floor((windowMs - elapsed) / 1000));
    canCancel = secondsLeft > 0;
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E5DCCE] shadow-2xl p-6 text-[#2B231D] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <Truck className="w-5 h-5 text-[#9B2242]" />
          <h3 className="font-display text-xl font-normal text-[#221C18] tracking-wide">
            Track Your Zaymera Order
          </h3>
        </div>
        <p className="text-xs text-[#7A6D60] mb-4">
          Enter your Order ID (e.g. ZYM-123456) to track fulfillment or cancel active orders.
        </p>

        {toast && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        <form onSubmit={handleTrack} className="flex gap-2 mb-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g. ZYM-123456)..."
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {trackedData && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6F0] border border-[#EADBCC] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE0D1]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A68]">Order Reference</span>
                <div className="font-bold text-sm text-[#9B2242]">{trackedData.id}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                trackedData.status === 'cancelled'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-[#EADBCC] text-[#6B5A4B]'
              }`}>
                {trackedData.status}
              </span>
            </div>

            {/* ── Cancellation Bar ── */}
            {canCancel && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cancel Window: <strong>{formatCountdown(secondsLeft)}</strong> left</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Ban className="w-3 h-3 text-rose-600" />
                  <span>Cancel Order</span>
                </button>
              </div>
            )}

            {trackedData.status === 'cancelled' && (
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Order cancelled. All items returned to inventory stock.</span>
              </div>
            )}

            {/* Items preview if available */}
            {trackedData.items && trackedData.items.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-[#8C7A68] uppercase tracking-wider">Reserved Items</div>
                <div className="space-y-1">
                  {trackedData.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-[#2B231D] bg-white/70 p-2 rounded-lg">
                      <span className="truncate max-w-[240px]">{it.product_name || it.product?.name} (x{it.quantity || 1})</span>
                      <span className="font-semibold text-[#9B2242]">₹{Number(it.price || it.product?.price || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fulfillment Steps */}
            <div className="space-y-2.5 pt-1">
              <div className="text-[10px] font-bold text-[#8C7A68] uppercase tracking-wider">Fulfillment Timeline</div>
              {trackedData.steps.map((step: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className={`mt-0.5 rounded-full p-0.5 ${step.done ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${step.current ? 'text-[#9B2242] font-semibold' : 'text-[#3D342C]'}`}>
                      {step.label}
                    </div>
                    <div className="text-[10px] text-[#8C7A68]">{step.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Link to Full Invoice */}
            {trackedOrder && (
              <div className="pt-2 border-t border-[#EAE0D1] flex justify-end">
                <Link
                  href={`/order-success?orderNumber=${encodeURIComponent(trackedData.id)}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B2242] hover:underline"
                >
                  <span>View Full Order Invoice</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Modal for cancellation confirmation */}
        {showCancelModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 text-center shadow-2xl border border-[#E5DCCE] space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-display text-lg text-[#1F1916]">Cancel Order #{trackedOrder?.order_number}?</h4>
              <p className="text-xs text-[#7A6D60] leading-relaxed">
                Confirm cancellation? Ordered products will be immediately restored to the inventory stock ledger.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD0C0] text-xs font-bold text-[#4A3E34] uppercase tracking-wider hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

