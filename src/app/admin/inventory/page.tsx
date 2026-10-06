'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Search,
  Filter,
  PlusCircle,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit2,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  SlidersHorizontal,
  Info,
  Check,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  fetchProducts,
  updateProductStock,
  fetchCategories,
  CategoryItem
} from '@/lib/supabase/services';
import { ProductItem } from '@/types';

type StockTab = 'all' | 'inStock' | 'lowStock' | 'outOfStock';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<StockTab>('all');
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Track editable stock numbers per product: { [productId]: number }
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  // Track updating state per product ID
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Track save success flash per product ID
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [{ data: prodData }, { data: catData }] = await Promise.all([
        fetchProducts(),
        fetchCategories()
      ]);

      if (prodData) {
        setProducts(prodData);
        // Initialize stockInputs
        const initialInputs: Record<string, number> = {};
        prodData.forEach((p) => {
          const s = p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0);
          initialInputs[p.id] = s;
        });
        setStockInputs(initialInputs);
      }

      if (catData) {
        setCategories(catData);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleStockUpdate = () => {
      loadData(true);
    };
    window.addEventListener('zaymera-stock-updated', handleStockUpdate);
    return () => window.removeEventListener('zaymera-stock-updated', handleStockUpdate);
  }, []);

  // Inline Stock Change Handler
  const handleStockInputChange = (id: string, value: string) => {
    if (value === '') {
      setStockInputs((prev) => ({ ...prev, [id]: 0 }));
      return;
    }
    const num = parseInt(value, 10);
    setStockInputs((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  // Inline Stock Quick Step (increment/decrement)
  const handleStockStep = (id: string, delta: number) => {
    const product = products.find((p) => p.id === id);
    const fallback = product?.stock !== undefined ? product.stock : (product?.inStock ? 10 : 0);
    const current = stockInputs[id] !== undefined ? stockInputs[id] : fallback;
    const nextVal = Math.max(0, current + delta);
    setStockInputs((prev) => ({ ...prev, [id]: nextVal }));
  };

  // Save Stock Function
  const handleSaveStock = async (id: string, overrideStock?: number) => {
    const product = products.find((p) => p.id === id);
    const fallback = product?.stock !== undefined ? product.stock : (product?.inStock ? 10 : 0);
    const targetStock = overrideStock !== undefined ? overrideStock : (stockInputs[id] !== undefined ? stockInputs[id] : fallback);
    setUpdatingId(id);

    try {
      const res = await updateProductStock(id, targetStock);
      if (res.success || res.data) {
        // Update local products list
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, stock: targetStock, inStock: targetStock > 0 }
              : p
          )
        );
        setStockInputs((prev) => ({ ...prev, [id]: targetStock }));
        setSavedSuccessId(id);
        showToast(`Stock updated to ${targetStock} units`);
        setTimeout(() => setSavedSuccessId(null), 2500);
      } else {
        showToast('Error updating stock');
      }
    } catch (err: any) {
      showToast(`Update error: ${err?.message || 'Failed'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick Restock Preset
  const handleQuickAdd = async (id: string, addAmount: number) => {
    const product = products.find((p) => p.id === id);
    const fallback = product?.stock !== undefined ? product.stock : (product?.inStock ? 10 : 0);
    const current = stockInputs[id] !== undefined ? stockInputs[id] : fallback;
    const nextVal = current + addAmount;
    await handleSaveStock(id, nextVal);
  };

  // Quick Mark Out of Stock
  const handleMarkOutOfStock = async (id: string) => {
    await handleSaveStock(id, 0);
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    products.forEach((p) => {
      const s = p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0);
      totalUnits += s;
      if (s === 0 || !p.inStock) {
        outOfStockCount++;
      } else if (s <= 5) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      inStockCount
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesId) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = (p.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (cat !== sel && !cat.includes(sel) && !sel.includes(cat)) {
          return false;
        }
      }

      // Stock Tab Filter
      const s = p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0);
      if (activeTab === 'inStock') {
        return s > 5 && p.inStock;
      }
      if (activeTab === 'lowStock') {
        return s > 0 && s <= 5 && p.inStock;
      }
      if (activeTab === 'outOfStock') {
        return s === 0 || !p.inStock;
      }

      return true;
    });
  }, [products, searchTerm, selectedCategory, activeTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1613] text-white shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#FAF6EE] to-[#F5ECE1] p-5 sm:p-6 rounded-3xl border border-[#EAE2D5] shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#9B2242]/10 text-[#9B2242] text-[11px] font-bold uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock Ledger & Warehouse</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#1C1613]">
            Inventory & Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6959]">
            Manage stock counts, monitor low supply items, and configure storefront sales restrictions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E0D5C3] text-xs font-semibold text-[#635345] hover:bg-[#F6F1E8] transition-colors shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#936718]' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E0D5C3] text-xs font-semibold text-[#635345] hover:bg-[#F6F1E8] transition-colors shadow-xs"
          >
            <Package className="w-3.5 h-3.5 text-[#936718]" />
            <span>Products List</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Piece</span>
          </Link>
        </div>
      </div>

      {/* Real-time Business Rules Info Callout */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5DAC8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF4E6] border border-[#E0D5C3] text-[#936718] flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs text-[#635345]">
            <p className="font-bold text-[#1C1613]">Automated Customer Storefront Rules:</p>
            <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                <strong className="text-[#B45309]">Low Stock Alert (1 to 5 units):</strong> Displays a dynamic <span className="bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.2 rounded font-bold">Only X Left!</span> urgency tag on customer catalog cards and product pages.
              </li>
              <li>
                <strong className="text-[#DC2626]">Out of Stock (0 units):</strong> Product card is blocked with an <span className="bg-[#FEE2E2] text-[#B91C1C] px-1.5 py-0.2 rounded font-bold">Out of Stock</span> overlay, disabling Add to Cart & Buy Now buttons.
              </li>
            </ul>
          </div>
        </div>
        <div className="text-[11px] text-[#8A7B6E] shrink-0 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EAE2D5]">
          Cloud & Local Dual-Layer Synced
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Catalog Products */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8A7B6E]">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Items</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#936718]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl text-[#1C1613]">
            {loading ? '—' : metrics.totalProducts}
          </p>
          <p className="text-[11px] text-[#7A6959]">Active dress and couture pieces</p>
        </div>

        {/* Total Units in Stock */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8A7B6E]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Units</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#C5A059]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl text-[#1C1613]">
            {loading ? '—' : metrics.totalUnits.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#7A6959]">Units available across inventory</p>
        </div>

        {/* Low Stock (<= 5) */}
        <div
          onClick={() => setActiveTab('lowStock')}
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition-all ${
            activeTab === 'lowStock'
              ? 'bg-[#FEF3C7]/40 border-[#F59E0B] ring-2 ring-[#F59E0B]/30'
              : 'bg-white border-[#EAE2D5] hover:border-[#F59E0B]/50'
          }`}
        >
          <div className="flex items-center justify-between text-[#B45309]">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock (≤5)</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl text-[#B45309]">
            {loading ? '—' : metrics.lowStockCount}
          </p>
          <p className="text-[11px] text-[#92400E]">Urgent restock advised</p>
        </div>

        {/* Out of Stock (0) */}
        <div
          onClick={() => setActiveTab('outOfStock')}
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition-all ${
            activeTab === 'outOfStock'
              ? 'bg-[#FEE2E2]/40 border-[#EF4444] ring-2 ring-[#EF4444]/30'
              : 'bg-white border-[#EAE2D5] hover:border-[#EF4444]/50'
          }`}
        >
          <div className="flex items-center justify-between text-[#DC2626]">
            <span className="text-xs font-bold uppercase tracking-wider">Out of Stock (0)</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl text-[#DC2626]">
            {loading ? '—' : metrics.outOfStockCount}
          </p>
          <p className="text-[11px] text-[#B91C1C]">Purchases currently blocked</p>
        </div>
      </div>

      {/* Filter Toolbar & Tab Bar */}
      <div className="bg-white rounded-2xl border border-[#EAE2D5] p-4 space-y-3.5 shadow-xs">
        {/* Top Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#1C1613] text-white shadow-xs'
                : 'bg-[#F6F1E8] text-[#635345] hover:bg-[#ECE4D8]'
            }`}
          >
            All Products ({metrics.totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('inStock')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeTab === 'inStock'
                ? 'bg-[#15803D] text-white shadow-xs'
                : 'bg-[#F0FDF4] text-[#166534] hover:bg-[#DCFCE7]'
            }`}
          >
            In Stock ({metrics.inStockCount})
          </button>
          <button
            onClick={() => setActiveTab('lowStock')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeTab === 'lowStock'
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]'
            }`}
          >
            Low Stock (≤5) ({metrics.lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab('outOfStock')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              activeTab === 'outOfStock'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]'
            }`}
          >
            Out of Stock (0) ({metrics.outOfStockCount})
          </button>
        </div>

        {/* Search & Category Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7B6E]" />
            <input
              type="text"
              placeholder="Search by product name, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E0D5C3] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A7B6E] hover:text-[#1C1613]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="sm:col-span-5 md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E0D5C3] text-xs text-[#635345] focus:outline-none focus:border-[#C5A059]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug || c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory List / Table */}
      <div className="bg-white rounded-2xl border border-[#EAE2D5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#C5A059]" />
            <p className="text-xs text-[#7A6959]">Loading stock records from database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-10 h-10 mx-auto text-[#C5A059]/40" />
            <p className="font-display text-base text-[#1C1613]">No products match this filter</p>
            <p className="text-xs text-[#8A7B6E]">
              Try adjusting your search criteria or switch to another stock tab.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setActiveTab('all');
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#936718] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE2D5] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#8A7B6E]">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category & Price</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Adjust Stock Units</th>
                    <th className="py-3 px-4 text-right">Quick Presets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE2D5] text-xs">
                  {filteredProducts.map((p) => {
                    const currentStock = stockInputs[p.id] !== undefined
                      ? stockInputs[p.id]
                      : (p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0));
                    const isUpdating = updatingId === p.id;
                    const isSuccess = savedSuccessId === p.id;

                    const isOut = currentStock === 0;
                    const isLow = currentStock > 0 && currentStock <= 5;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        {/* Product Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 rounded-lg bg-[#FAF6EE] border border-[#EAE2D5] overflow-hidden shrink-0 relative">
                              <img
                                src={p.image || '/images/royal_blue_anarkali_1788292199640.jpg'}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                              {isOut && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-[7.5px] font-bold text-white uppercase tracking-wider text-center leading-none">
                                    Sold Out
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5 max-w-xs">
                              <p className="font-bold text-[#1C1613] line-clamp-1 hover:text-[#936718] transition-colors">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-[#8A7B6E]">
                                <span>ID: {p.id.slice(0, 14)}...</span>
                                {p.tag && (
                                  <span className="bg-[#FAF0E6] text-[#9B2242] px-1.5 py-0.2 rounded font-semibold">
                                    {p.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Price */}
                        <td className="py-3.5 px-4 text-[#635345]">
                          <p className="font-semibold">{p.category}</p>
                          <p className="text-xs font-bold text-[#1C1613]">
                            ₹{Number(p.price).toLocaleString()}
                          </p>
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                              <XCircle className="w-3 h-3" />
                              <span>0 Units (Out)</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Only {currentStock} Left!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{currentStock} in stock</span>
                            </span>
                          )}
                        </td>

                        {/* Adjust Stock Units Counter & Save */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {/* Decrement Button */}
                            <button
                              onClick={() => handleStockStep(p.id, -1)}
                              disabled={isUpdating || currentStock <= 0}
                              className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#D5C7B5] text-[#635345] font-bold text-sm hover:bg-[#ECE4D8] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                              title="Decrease by 1"
                            >
                              -
                            </button>

                            {/* Stock Input */}
                            <input
                              type="number"
                              min="0"
                              max="9999"
                              value={currentStock}
                              onChange={(e) => handleStockInputChange(p.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveStock(p.id);
                                }
                              }}
                              className="w-16 py-1 px-2 text-center rounded-lg bg-white border border-[#D5C7B5] text-xs font-bold text-[#1C1613] focus:outline-none focus:border-[#C5A059]"
                            />

                            {/* Increment Button */}
                            <button
                              onClick={() => handleStockStep(p.id, 1)}
                              disabled={isUpdating}
                              className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#D5C7B5] text-[#635345] font-bold text-sm hover:bg-[#ECE4D8] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                              title="Increase by 1"
                            >
                              +
                            </button>

                            {/* Save Button */}
                            <button
                              onClick={() => handleSaveStock(p.id)}
                              disabled={isUpdating}
                              className={`ml-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                isSuccess
                                  ? 'bg-[#15803D] text-white'
                                  : 'bg-[#1C1613] hover:bg-[#936718] text-white shadow-xs'
                              } disabled:opacity-50`}
                              title="Save Stock Level"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : isSuccess ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <span>Save</span>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Quick Presets & Link to Editor */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickAdd(p.id, 5)}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded-md bg-[#FAF6EE] hover:bg-[#F2E8D8] border border-[#E0D5C3] text-[10px] font-bold text-[#936718] cursor-pointer"
                              title="Add +5 units to stock"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleQuickAdd(p.id, 10)}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded-md bg-[#FAF6EE] hover:bg-[#F2E8D8] border border-[#E0D5C3] text-[10px] font-bold text-[#936718] cursor-pointer"
                              title="Add +10 units to stock"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleMarkOutOfStock(p.id)}
                              disabled={isUpdating || currentStock === 0}
                              className="px-2 py-1 rounded-md bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[10px] font-bold text-[#DC2626] cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                              title="Set Stock to 0 (Block Customer Purchases)"
                            >
                              Set 0
                            </button>
                            <Link
                              href={`/admin/products/edit?id=${p.id}`}
                              className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F2E8D8] text-[#635345] hover:text-[#1C1613] transition-colors"
                              title="Full Product Editor"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="md:hidden divide-y divide-[#EAE2D5]">
              {filteredProducts.map((p) => {
                const currentStock = stockInputs[p.id] !== undefined
                  ? stockInputs[p.id]
                  : (p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0));
                const isUpdating = updatingId === p.id;
                const isSuccess = savedSuccessId === p.id;
                const isOut = currentStock === 0;
                const isLow = currentStock > 0 && currentStock <= 5;

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    {/* Top Row: Product Details & Status */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-16 rounded-xl bg-[#FAF6EE] border border-[#EAE2D5] overflow-hidden shrink-0 relative">
                        <img
                          src={p.image || '/images/royal_blue_anarkali_1788292199640.jpg'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        {isOut && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-[#1C1613] text-xs truncate">{p.name}</p>
                          <Link
                            href={`/admin/products/edit?id=${p.id}`}
                            className="text-[#936718] p-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                        <p className="text-[11px] text-[#7A6959]">
                          {p.category} • ₹{Number(p.price).toLocaleString()}
                        </p>
                        <div className="pt-1">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FEE2E2] text-[#DC2626]">
                              <XCircle className="w-3 h-3" />
                              <span>0 Units (Blocked)</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#B45309]">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Only {currentStock} Left!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F0FDF4] text-[#16A34A]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{currentStock} in stock</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls Row: Counter & Quick Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F2EBE0]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStockStep(p.id, -1)}
                          disabled={isUpdating || currentStock <= 0}
                          className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#D5C7B5] font-bold text-sm flex items-center justify-center disabled:opacity-30"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={currentStock}
                          onChange={(e) => handleStockInputChange(p.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveStock(p.id);
                            }
                          }}
                          className="w-14 py-1 px-1 text-center rounded-lg bg-white border border-[#D5C7B5] text-xs font-bold"
                        />
                        <button
                          onClick={() => handleStockStep(p.id, 1)}
                          disabled={isUpdating}
                          className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#D5C7B5] font-bold text-sm flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleSaveStock(p.id)}
                          disabled={isUpdating}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isSuccess ? 'bg-[#15803D] text-white' : 'bg-[#1C1613] text-white'
                          }`}
                        >
                          {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Save'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickAdd(p.id, 5)}
                          className="px-2 py-1 rounded bg-[#FAF6EE] text-[10px] font-bold text-[#936718]"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickAdd(p.id, 10)}
                          className="px-2 py-1 rounded bg-[#FAF6EE] text-[10px] font-bold text-[#936718]"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleMarkOutOfStock(p.id)}
                          className="px-2 py-1 rounded bg-[#FEF2F2] text-[10px] font-bold text-[#DC2626]"
                        >
                          Set 0
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
