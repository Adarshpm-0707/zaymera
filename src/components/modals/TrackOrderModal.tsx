'use client';

import React, { useState } from 'react';
import { X, Search, Package, CheckCircle2, Truck, Clock } from 'lucide-react';
import { getOrderByNumber } from '@/lib/supabase/services';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackedData, setTrackedData] = useState<any>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);

    const dbOrder = await getOrderByNumber(orderId);
    if (dbOrder) {
      setTrackedData({
        id: dbOrder.order_number,
        status: dbOrder.order_status,
        customerName: dbOrder.customer_name,
        total: dbOrder.total,
        steps: [
          { label: "Order Confirmed & Placed", done: true, time: new Date(dbOrder.created_at).toLocaleDateString() },
          { label: "Handloom Weaving & Inspection", done: dbOrder.order_status !== 'processing', current: dbOrder.order_status === 'processing', time: "In Progress" },
          { label: "Dispatched with Signature Delivery", done: dbOrder.order_status === 'delivered' || dbOrder.order_status === 'shipped', time: "Expected" },
        ]
      });
    } else {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E5DCCE] shadow-2xl p-6 text-[#2B231D]">
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
          Enter your Order ID (e.g., ZAYMERA-8842) or registered mobile number.
        </p>

        <form onSubmit={handleTrack} className="flex gap-2 mb-5">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID / AWB Tracking..."
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
          <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EADBCC] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE0D1]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A68]">Order ID</span>
                <div className="font-bold text-sm text-[#221C18]">{trackedData.id}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EADBCC] text-[#6B5A4B] uppercase tracking-wider">
                {trackedData.status}
              </span>
            </div>

            <div className="space-y-3">
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
          </div>
        )}
      </div>
    </div>
  );
};
