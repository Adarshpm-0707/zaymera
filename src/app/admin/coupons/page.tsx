'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  PlusCircle,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  Percent,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp
} from 'lucide-react';
import {
  fetchCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
  CouponItem
} from '@/lib/supabase/services';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Add Coupon Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(10);
  const [minSpend, setMinSpend] = useState(1500);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState(500);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await fetchCoupons();
      if (data) setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCopy = (couponCode: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(couponCode);
      showToast(`Promo Code "${couponCode}" copied!`);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const res = await createCoupon({
        code: code.toUpperCase().trim(),
        discountType,
        value: Number(value),
        minSpend: Number(minSpend),
        expiryDate,
        usageLimit: Number(usageLimit),
        active: true
      });

      if (res.success) {
        setCoupons(prev => [res.data, ...prev]);
        setIsAddModalOpen(false);
        setCode('');
        setValue(10);
        showToast(`Promo Code ${res.data.code} is now active!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string) => {
    await toggleCouponStatus(id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    showToast('Promo code status toggled');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this coupon code permanently?')) {
      await deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      showToast('Promo code deleted');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);
  const activeCoupons = coupons.filter(c => c.active).length;

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-16">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#162E19] border border-[#22C55E] text-[#4ADE80] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#26201B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#FAF8F5] tracking-wide">
              Coupons & Promotions
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#291F18] border border-[#3E3025] text-[#E2B755] px-2.5 py-0.5 rounded-full font-bold">
              {coupons.length} Promo Codes
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-1 font-normal">
            Configure discount incentives, festive promotional vouchers, and VIP campaign redemption limits.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#15110F] border border-[#2B211A] space-y-1">
          <div className="flex items-center justify-between text-[#8C7B6C] text-[11px] font-semibold uppercase tracking-wider">
            <span>Active Codes</span>
            <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#FAF8F5]">
            {activeCoupons}
          </div>
          <p className="text-[10px] text-[#A89887]">Live at checkout</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#15110F] border border-[#2B211A] space-y-1">
          <div className="flex items-center justify-between text-[#8C7B6C] text-[11px] font-semibold uppercase tracking-wider">
            <span>Redemptions</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#E2B755]">
            {totalRedemptions}
          </div>
          <p className="text-[10px] text-[#A89887]">Total successful orders</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#15110F] border border-[#2B211A] space-y-1">
          <div className="flex items-center justify-between text-[#8C7B6C] text-[11px] font-semibold uppercase tracking-wider">
            <span>Top Offer</span>
            <Sparkles className="w-3.5 h-3.5 text-[#9B2242]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#FAF8F5]">
            15% OFF
          </div>
          <p className="text-[10px] text-[#A89887]">FIRSTCOUTURE code</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#15110F] border border-[#2B211A] space-y-1">
          <div className="flex items-center justify-between text-[#8C7B6C] text-[11px] font-semibold uppercase tracking-wider">
            <span>Avg Min Spend</span>
            <Percent className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#FAF8F5]">
            ₹1,990
          </div>
          <p className="text-[10px] text-[#A89887]">Cart qualification</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6959]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search promo codes..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#171210] border border-[#2D231C] text-xs text-[#FAF8F5] placeholder-[#7A6959] focus:outline-none focus:border-[#C5A059]"
        />
      </div>

      {/* Mobile Card List (< sm screens) */}
      <div className="sm:hidden space-y-3">
        {filteredCoupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8C7B6C] bg-[#14100E] border border-[#26201B] rounded-2xl">
            No promo codes found.
          </div>
        ) : (
          filteredCoupons.map((coupon) => {
            const usagePercent = Math.min(100, Math.round((coupon.timesUsed / coupon.usageLimit) * 100));

            return (
              <div
                key={coupon.id}
                className={`p-4 rounded-2xl bg-[#14100E] border transition-all space-y-3 shadow-lg ${
                  coupon.active ? 'border-[#2D231C]' : 'border-[#2D1B1B] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold tracking-wider px-2.5 py-1 rounded-lg bg-[#201814] border border-[#3D3026] text-[#E2B755]">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="p-1.5 rounded-lg bg-[#1F1713] text-[#A89887] hover:text-white"
                      title="Copy Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggle(coupon.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                      coupon.active
                        ? 'bg-[#18301B] text-[#4ADE80] border border-[#25502A]'
                        : 'bg-[#291717] text-[#EF4444] border border-[#482222]'
                    }`}
                  >
                    {coupon.active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] py-2 px-3 rounded-xl bg-[#1A1411] border border-[#241C16]">
                  <div>
                    <span className="text-[#736353] block text-[9.5px]">Discount Benefit</span>
                    <span className="font-bold text-[#FAF8F5]">
                      {coupon.discountType === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#736353] block text-[9.5px]">Min Cart Spend</span>
                    <span className="font-bold text-[#E2B755]">₹{coupon.minSpend}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#8C7B6C]">
                    <span>Redemptions</span>
                    <span>{coupon.timesUsed} / {coupon.usageLimit} used ({usagePercent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#201814] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C5A059] to-[#9B2242] rounded-full"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10.5px] text-[#736353]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C5A059]" />
                    <span>Expires {coupon.expiryDate}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-[#EF4444] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (≥ sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-[#14100E] border border-[#26201B] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAF8F5]">
            <thead className="bg-[#181310] border-b border-[#26201B] text-[10.5px] uppercase tracking-wider text-[#8C7B6C] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Benefit</th>
                <th className="py-3.5 px-4">Min Spend</th>
                <th className="py-3.5 px-4">Usage Analytics</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#201915]">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#8C7B6C]">
                    No coupons found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const usagePercent = Math.min(100, Math.round((coupon.timesUsed / coupon.usageLimit) * 100));

                  return (
                    <tr key={coupon.id} className="hover:bg-[#1A1411] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#201814] border border-[#3E3026] text-[#E2B755]">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="p-1 rounded-md text-[#736353] hover:text-[#E2B755] transition-colors"
                            title="Copy Code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#FAF8F5]">
                        {coupon.discountType === 'percentage' ? (
                          <span className="text-[#4ADE80]">{coupon.value}% OFF</span>
                        ) : (
                          <span className="text-[#E2B755]">₹{coupon.value} FLAT</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#A89887]">
                        ₹{coupon.minSpend.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[#8C7B6C]">
                            <span>{coupon.timesUsed} used</span>
                            <span>Limit {coupon.usageLimit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#201814] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#C5A059] to-[#9B2242] rounded-full"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#8C7B6C] text-[11px]">
                        {coupon.expiryDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggle(coupon.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider cursor-pointer ${
                            coupon.active
                              ? 'bg-[#18301B] text-[#4ADE80] border border-[#25502A]'
                              : 'bg-[#291717] text-[#EF4444] border border-[#482222]'
                          }`}
                        >
                          {coupon.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 rounded-xl bg-[#201814] text-[#EF4444] hover:bg-[#3D1A1A] transition-colors cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#15110F] border border-[#3A2E25] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#FAF8F5]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#201915] text-[#8C7B6C] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h2 className="font-display text-lg sm:text-xl text-[#FAF8F5] tracking-wide">
                Create Promotion Voucher
              </h2>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALIFESTIVE20"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] font-mono text-xs text-[#E2B755] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    placeholder={discountType === 'percentage' ? '15%' : '₹500'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                    Min Cart Spend (₹)
                  </label>
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                    Usage Cap Limit
                  </label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#2A211B]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#201915] text-xs font-semibold text-[#A89887] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold"
                >
                  Publish Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
