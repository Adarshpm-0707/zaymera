'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  MessageSquare,
  DollarSign,
  PlusCircle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  Clock,
  ExternalLink,
  Layers,
  Database
} from 'lucide-react';
import {
  fetchProducts,
  fetchAdminOrders,
  fetchAdminInquiries,
  seedInitialCatalogToSupabase,
  getInitialProducts,
  getLocalProducts,
  getInitialOrders,
  getInitialInquiries
} from '@/lib/supabase/services';
import { ProductItem } from '@/types';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [prodRes, ordRes, inqRes] = await Promise.all([
        fetchProducts(),
        fetchAdminOrders(),
        fetchAdminInquiries(),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (ordRes.data) setOrders(ordRes.data);
      if (inqRes.data) setInquiries(inqRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const local = getLocalProducts();
    if (local && local.length > 0) {
      setProducts(local);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedSuccessMsg('');
    try {
      const res = await seedInitialCatalogToSupabase();
      setSeedSuccessMsg(`Successfully synced ${res.count} products to the catalog!`);
      await loadData();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedSuccessMsg(''), 4000);
    }
  };

  const totalCatalogValue = products.reduce((acc, p) => acc + (p.price || 0), 0);
  const inStockCount = products.filter(p => p.inStock).length;
  const outOfStockCount = products.length - inStockCount;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1E1713] via-[#2A2019] to-[#161210] border border-[#3A2E25] p-4 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#251D18] px-2.5 sm:px-3 py-1 mb-2 sm:mb-3 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-widest text-[#E2B755]">
              <Sparkles className="w-3.5 h-3.5 text-[#E2B755]" />
              <span>Zaymera Executive Suite</span>
            </div>
            <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-normal text-[#FAF8F5] tracking-wide">
             Management Dashboard
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-[#A89887] mt-1 max-w-2xl font-normal leading-relaxed">
              Add new designer ensembles, manage live product catalog, track incoming customer orders, and respond to bespoke measurement inquiries.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#29201A] hover:bg-[#382C24] border border-[#423328] text-xs font-semibold text-[#E6D7C8] transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Product</span>
            </Link>
          </div>
        </div>

        {seedSuccessMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-[#142918] border border-[#22C55E]/40 text-[#4ADE80] text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{seedSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid (2-Cols Mobile / 4-Cols Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* Total Products */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#15110F] border border-[#28211C] shadow-lg flex flex-col justify-between hover:border-[#3E322A] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#A39281]">Catalog</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#281F19] text-[#E2B755] flex items-center justify-center">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold font-display text-[#FAF8F5]">
              {products.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#8C7B6C] flex-wrap">
              <span className="text-[#22C55E] font-semibold">{inStockCount} In Stock</span>
              {outOfStockCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#EF4444] font-medium">{outOfStockCount} Out</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#15110F] border border-[#28211C] shadow-lg flex flex-col justify-between hover:border-[#3E322A] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#A39281]">Orders</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#281F19] text-[#9B2242] flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold font-display text-[#FAF8F5]">
              {orders.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#8C7B6C] flex-wrap">
              <span className="text-[#F59E0B] font-semibold">
                {orders.filter(o => o.order_status === 'processing').length} Process
              </span>
              <span>•</span>
              <span className="text-[#22C55E]">
                {orders.filter(o => o.order_status === 'delivered').length} Done
              </span>
            </div>
          </div>
        </div>

        {/* Bespoke Inquiries */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#15110F] border border-[#28211C] shadow-lg flex flex-col justify-between hover:border-[#3E322A] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#A39281]">Inquiries</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#281F19] text-[#38BDF8] flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold font-display text-[#FAF8F5]">
              {inquiries.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#8C7B6C] flex-wrap">
              <span className="text-[#38BDF8] font-semibold">
                {inquiries.filter(i => i.status === 'new').length} New
              </span>
              <span>•</span>
              <span>{inquiries.filter(i => i.status === 'contacted').length} Replied</span>
            </div>
          </div>
        </div>

        {/* Orders Value */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#15110F] border border-[#28211C] shadow-lg flex flex-col justify-between hover:border-[#3E322A] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#A39281]">Gross Sales</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#281F19] text-[#22C55E] flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold font-display text-[#FAF8F5] truncate">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] text-[#8C7B6C] truncate">
              Catalog: ₹{totalCatalogValue.toLocaleString()}
            </div>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Quick Actions & Recent Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Left 2 Cols: Latest Products & Quick Stock Status */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <div className="rounded-3xl bg-[#14100E] border border-[#26201B] p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#26201B]">
              <div>
                <h2 className="font-display text-base sm:text-lg text-[#FAF8F5] tracking-wide">
                  Active Products Atelier
                </h2>
                <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-0.5">
                  Live pieces currently featured in your storefront
                </p>
              </div>

              <Link
                href="/admin/products"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#C5A059] hover:text-[#E2B755] font-semibold tracking-wider uppercase transition-colors"
              >
                <span>All ({products.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 sm:mt-4 divide-y divide-[#221B17]">
              {products.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-[#1C1613] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-12 sm:w-12 sm:h-14 object-cover rounded-lg bg-[#221A15] border border-[#33271F] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#FAF8F5] line-clamp-1 uppercase tracking-wide">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10.5px] sm:text-[11px] text-[#A89887]">
                        <span className="text-[#C5A059] font-bold">₹{prod.price.toLocaleString()}</span>
                        <span>•</span>
                        <span className="capitalize truncate max-w-[90px] sm:max-w-none">{prod.category.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        prod.inStock
                          ? 'bg-[#15341C] text-[#4ADE80] border border-[#22C55E]/30'
                          : 'bg-[#3A1414] text-[#F87171] border border-[#EF4444]/30'
                      }`}
                    >
                      {prod.inStock ? 'In Stock' : 'Sold Out'}
                    </span>
                    <Link
                      href="/admin/products"
                      className="p-1 sm:p-1.5 rounded-lg text-[#8C7B6C] hover:text-white hover:bg-[#2A211B] transition-colors"
                      title="Manage Product"
                    >
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {products.length === 0 && !loading && (
                <div className="text-center py-8 text-xs text-[#8C7B6C]">
                  <Package className="w-8 h-8 text-[#54463A] mx-auto mb-2" />
                  <p>No products found in database.</p>
                  <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="mt-3 text-xs bg-[#C5A059] text-black font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    {isSeeding ? 'Seeding...' : 'Seed Sample Catalog'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="rounded-3xl bg-[#14100E] border border-[#26201B] p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#26201B]">
              <div>
                <h2 className="font-display text-base sm:text-lg text-[#FAF8F5] tracking-wide">
                  Recent Orders
                </h2>
                <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-0.5">
                  Latest customer purchases and checkout transactions
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#C5A059] hover:text-[#E2B755] font-semibold tracking-wider uppercase transition-colors"
              >
                <span>Orders ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2.5">
              {orders.slice(0, 3).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-[#191310] border border-[#28201A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#E2B755]">{ord.order_number}</span>
                      <span className="text-[9.5px] bg-[#291F18] text-[#C5A059] px-2 py-0.2 rounded uppercase font-semibold">
                        {ord.order_status}
                      </span>
                    </div>
                    <div className="text-xs text-[#FAF8F5] font-medium mt-0.5">
                      {ord.customer_name}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#221B17]">
                    <span className="text-xs sm:text-sm font-bold text-[#FAF8F5]">
                      ₹{ord.total?.toLocaleString() || ord.subtotal?.toLocaleString()}
                    </span>
                    <Link
                      href="/admin/orders"
                      className="text-xs text-[#C5A059] hover:underline font-medium"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}

              {orders.length === 0 && !loading && (
                <div className="text-center py-6 text-xs text-[#8C7B6C]">
                  No orders recorded yet. Place a test order from the storefront!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Control Hub & Actions */}
        <div className="space-y-5 sm:space-y-6">
          
          {/* Quick Shortcuts Box */}
          <div className="rounded-3xl bg-[#14100E] border border-[#26201B] p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
            <h3 className="font-display text-sm sm:text-base text-[#FAF8F5] tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A059]" />
              <span>eCommerce Control Modules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-3 rounded-xl bg-[#1F1814] hover:bg-[#2C211B] border border-[#30251D] text-xs font-semibold text-[#FAF8F5] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <span>Add New Product</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6A5A] group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-3 rounded-xl bg-[#1F1814] hover:bg-[#2C211B] border border-[#30251D] text-xs font-semibold text-[#FAF8F5] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E2B755]/20 text-[#E2B755] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Collections & Categories</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6A5A] group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/customers"
                className="flex items-center justify-between p-3 rounded-xl bg-[#1F1814] hover:bg-[#2C211B] border border-[#30251D] text-xs font-semibold text-[#FAF8F5] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Clients & VIP Patrons</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6A5A] group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/coupons"
                className="flex items-center justify-between p-3 rounded-xl bg-[#1F1814] hover:bg-[#2C211B] border border-[#30251D] text-xs font-semibold text-[#FAF8F5] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#9B2242]/20 text-[#9B2242] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>Coupons & Discount Codes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6A5A] group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/banners"
                className="flex items-center justify-between p-3 rounded-xl bg-[#1F1814] hover:bg-[#2C211B] border border-[#30251D] text-xs font-semibold text-[#FAF8F5] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Store Banners & Concierge</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6A5A] group-hover:text-white transition-colors" />
              </Link>

              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1F1814] hover:bg-[#2C211B] border border-[#30251D] text-xs font-semibold text-[#FAF8F5] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center">
                    <Database className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div>Sync Default Catalog</div>
                    <div className="text-[10px] text-[#8C7B6C] font-normal">Push 8 core pieces to database</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6A5A] group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Bespoke Leads Preview */}
          <div className="rounded-3xl bg-[#14100E] border border-[#26201B] p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm sm:text-base text-[#FAF8F5] tracking-wide">
                Concierge Leads
              </h3>
              <Link href="/admin/inquiries" className="text-xs text-[#C5A059] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {inquiries.slice(0, 2).map((inq) => (
                <div
                  key={inq.id}
                  className="p-3 rounded-xl bg-[#1A1411] border border-[#2B221B] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FAF8F5]">{inq.name}</span>
                    <span className={`text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      inq.status === 'new' ? 'bg-[#9B2242] text-white' : 'bg-[#292019] text-[#A89887]'
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A89887] line-clamp-2">
                    {inq.message}
                  </p>
                  <div className="text-[10px] text-[#7A6959]">
                    {inq.phone || inq.email}
                  </div>
                </div>
              ))}

              {inquiries.length === 0 && (
                <div className="text-center py-4 text-xs text-[#8C7B6C]">
                  No inquiries received yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
