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
  Database,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import {
  fetchProducts,
  fetchAdminOrders,
  fetchAdminInquiries,
  seedInitialCatalogToSupabase,
  getInitialProducts,
  getLocalProducts,
  getInitialOrders,
  getInitialInquiries,
  checkDatabaseConnection
} from '@/lib/supabase/services';
import { ProductItem } from '@/types';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');
  const [adminName, setAdminName] = useState('Executive');
  const [dbTableExists, setDbTableExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('zaymera_admin_auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.name || parsed.username) {
            setAdminName(parsed.name || parsed.username);
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

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
    checkDatabaseConnection()
      .then(res => setDbTableExists(res.tableExists))
      .catch(() => setDbTableExists(false));
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
      <div className="relative rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#F4ECE0] to-[#EFE7D8] border border-[#E5DAC8] p-4 sm:p-6 lg:p-8 overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-white px-2.5 sm:px-3 py-1 mb-2 sm:mb-2.5 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-widest text-[#936718] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#936718]" />
              <span>Zaymera Executive Suite</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#1C1613] tracking-wide">
              Welcome, {adminName} 👋
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-[#6B5E52] mt-1 max-w-2xl font-normal leading-relaxed">
              Add new designer ensembles, manage live product catalog, track incoming customer orders, and respond to bespoke measurement inquiries.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-[#F6F1E8] border border-[#DDD4C5] text-xs font-semibold text-[#1C1613] transition-all active:scale-95 cursor-pointer shadow-xs min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#7A6959] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer min-h-[40px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {seedSuccessMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{seedSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Cloud Database Missing Alert Banner */}
      {dbTableExists === false && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] shadow-sm animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#B45309]">Database Setup Required for Live Deployment</p>
                <p className="text-xs text-[#78350F] mt-0.5">
                  The <code className="bg-[#FEF3C7] px-1 py-0.5 rounded font-mono font-bold">products</code> table has not been created yet in your Supabase project. Products added right now will only appear locally and will <strong>not be visible after deployment</strong>.
                </p>
              </div>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>Setup Database & Sync</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats Grid (2-Cols Mobile / 4-Cols Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        
        {/* Total Products */}
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8A7B6E]">Catalog</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FAF5EC] text-[#936718] flex items-center justify-center">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold font-display text-[#1C1613] truncate">
              {products.length}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-[#7A6959] flex-wrap">
              <span className="text-[#16A34A] font-semibold">{inStockCount} In Stock</span>
              {outOfStockCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#DC2626] font-medium">{outOfStockCount} Out</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8A7B6E]">Orders</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFF1F2] text-[#9B2242] flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold font-display text-[#1C1613] truncate">
              {orders.length}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-[#7A6959] flex-wrap">
              <span className="text-[#D97706] font-semibold">
                {orders.filter(o => o.order_status === 'processing').length} Process
              </span>
              <span>•</span>
              <span className="text-[#16A34A]">
                {orders.filter(o => o.order_status === 'delivered').length} Done
              </span>
            </div>
          </div>
        </div>

        {/* Bespoke Inquiries */}
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8A7B6E]">Inquiries</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#EFF6FF] text-[#0284C7] flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold font-display text-[#1C1613] truncate">
              {inquiries.length}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-[#7A6959] flex-wrap">
              <span className="text-[#0284C7] font-semibold">
                {inquiries.filter(i => i.status === 'new').length} New
              </span>
              <span>•</span>
              <span>{inquiries.filter(i => i.status === 'contacted').length} Replied</span>
            </div>
          </div>
        </div>

        {/* Orders Value */}
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8A7B6E]">Gross Sales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold font-display text-[#1C1613] truncate">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] text-[#7A6959] truncate">
              Catalog: ₹{totalCatalogValue.toLocaleString()}
            </div>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Quick Actions & Recent Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Left 2 Cols: Latest Products & Quick Stock Status */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <div className="rounded-3xl bg-white border border-[#EAE2D5] p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#EAE2D5]">
              <div>
                <h2 className="font-display text-base sm:text-lg text-[#1C1613] tracking-wide">
                  Active Products Atelier
                </h2>
                <p className="text-[11px] sm:text-xs text-[#7A6959] mt-0.5">
                  Live pieces currently featured in your storefront
                </p>
              </div>

              <Link
                href="/admin/products"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#936718] hover:text-[#734F11] font-semibold tracking-wider uppercase transition-colors"
              >
                <span>All ({products.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 sm:mt-4 divide-y divide-[#F2ECE2]">
              {products.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF7F2] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-12 sm:w-12 sm:h-14 object-cover rounded-lg bg-[#FAF7F2] border border-[#EAE2D5] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#1C1613] line-clamp-1 uppercase tracking-wide">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10.5px] sm:text-[11px] text-[#6B5E52]">
                        <span className="text-[#936718] font-bold">₹{prod.price.toLocaleString()}</span>
                        <span>•</span>
                        <span className="capitalize truncate max-w-[90px] sm:max-w-none">{prod.category.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        prod.inStock
                          ? 'bg-[#ECFDF5] text-[#15803D] border border-[#86EFAC]'
                          : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                      }`}
                    >
                      {prod.inStock ? 'In Stock' : 'Sold Out'}
                    </span>
                    <Link
                      href="/admin/products"
                      className="p-1 sm:p-1.5 rounded-lg text-[#8A7B6E] hover:text-[#1C1613] hover:bg-[#F2ECE2] transition-colors"
                      title="Manage Product"
                    >
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {products.length === 0 && !loading && (
                <div className="text-center py-8 text-xs text-[#8A7B6E]">
                  <Package className="w-8 h-8 text-[#BAAC9C] mx-auto mb-2" />
                  <p>No products found in database.</p>
                  <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="mt-3 text-xs bg-[#C5A059] hover:bg-[#B58F47] text-white font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-xs"
                  >
                    {isSeeding ? 'Seeding...' : 'Seed Sample Catalog'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="rounded-3xl bg-white border border-[#EAE2D5] p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#EAE2D5]">
              <div>
                <h2 className="font-display text-base sm:text-lg text-[#1C1613] tracking-wide">
                  Recent Orders
                </h2>
                <p className="text-[11px] sm:text-xs text-[#7A6959] mt-0.5">
                  Latest customer purchases and checkout transactions
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#936718] hover:text-[#734F11] font-semibold tracking-wider uppercase transition-colors"
              >
                <span>Orders ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2.5">
              {orders.slice(0, 3).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#936718]">{ord.order_number}</span>
                      <span className="text-[9.5px] bg-[#FEF9EE] border border-[#F3E0B5] text-[#936718] px-2 py-0.5 rounded-full uppercase font-bold">
                        {ord.order_status}
                      </span>
                    </div>
                    <div className="text-xs text-[#1C1613] font-medium mt-0.5">
                      {ord.customer_name}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#EAE2D5]">
                    <span className="text-xs sm:text-sm font-bold text-[#1C1613]">
                      ₹{ord.total?.toLocaleString() || ord.subtotal?.toLocaleString()}
                    </span>
                    <Link
                      href="/admin/orders"
                      className="text-xs text-[#936718] hover:underline font-semibold"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}

              {orders.length === 0 && !loading && (
                <div className="text-center py-6 text-xs text-[#8A7B6E]">
                  No orders recorded yet. Place a test order from the storefront!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Control Hub & Actions */}
        <div className="space-y-5 sm:space-y-6">
          
          {/* Quick Shortcuts Box */}
          <div className="rounded-3xl bg-white border border-[#EAE2D5] p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <h3 className="font-display text-sm sm:text-base text-[#1C1613] tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#936718]" />
              <span>eCommerce Control Modules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE4] border border-[#EAE2D5] text-xs font-semibold text-[#1C1613] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF9EE] text-[#936718] flex items-center justify-center border border-[#F3E0B5]">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <span>Add New Product</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A7B6E] group-hover:text-[#1C1613] transition-colors" />
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE4] border border-[#EAE2D5] text-xs font-semibold text-[#1C1613] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF5EC] text-[#936718] flex items-center justify-center border border-[#EBDCC5]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Collections & Categories</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A7B6E] group-hover:text-[#1C1613] transition-colors" />
              </Link>

              <Link
                href="/admin/customers"
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE4] border border-[#EAE2D5] text-xs font-semibold text-[#1C1613] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center border border-[#A7F3D0]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Clients & VIP Patrons</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A7B6E] group-hover:text-[#1C1613] transition-colors" />
              </Link>

              <Link
                href="/admin/coupons"
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE4] border border-[#EAE2D5] text-xs font-semibold text-[#1C1613] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#9B2242] flex items-center justify-center border border-[#FECDD3]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>Coupons & Discount Codes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A7B6E] group-hover:text-[#1C1613] transition-colors" />
              </Link>

              <Link
                href="/admin/banners"
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE4] border border-[#EAE2D5] text-xs font-semibold text-[#1C1613] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF9EE] text-[#936718] flex items-center justify-center border border-[#F3E0B5]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Store Banners & Concierge</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A7B6E] group-hover:text-[#1C1613] transition-colors" />
              </Link>

              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE4] border border-[#EAE2D5] text-xs font-semibold text-[#1C1613] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center border border-[#A7F3D0]">
                    <Database className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div>Sync Default Catalog</div>
                    <div className="text-[10px] text-[#7A6959] font-normal">Push 8 core pieces to database</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A7B6E] group-hover:text-[#1C1613] transition-colors" />
              </button>
            </div>
          </div>

          {/* Bespoke Leads Preview */}
          <div className="rounded-3xl bg-white border border-[#EAE2D5] p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm sm:text-base text-[#1C1613] tracking-wide">
                Concierge Leads
              </h3>
              <Link href="/admin/inquiries" className="text-xs text-[#936718] hover:underline font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {inquiries.slice(0, 2).map((inq) => (
                <div
                  key={inq.id}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1613]">{inq.name}</span>
                    <span className={`text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                      inq.status === 'new' ? 'bg-[#9B2242] text-white' : 'bg-[#EAE2D5] text-[#635345]'
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5E52] line-clamp-2">
                    {inq.message}
                  </p>
                  <div className="text-[10px] text-[#8A7B6E]">
                    {inq.phone || inq.email}
                  </div>
                </div>
              ))}

              {inquiries.length === 0 && (
                <div className="text-center py-4 text-xs text-[#8A7B6E]">
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
