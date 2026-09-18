'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Database,
  CloudUpload,
  Copy,
  Download
} from 'lucide-react';
import {
  fetchProducts,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  seedInitialCatalogToSupabase,
  getInitialProducts,
  getLocalProducts,
  fetchCategories,
  CategoryItem,
  checkDatabaseConnection,
  syncLocalProductsToSupabase
} from '@/lib/supabase/services';
import { ProductItem } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');

  // Supabase Database Connection & Sync Status
  const [dbStatus, setDbStatus] = useState<{
    checked: boolean;
    checking: boolean;
    tableExists: boolean;
    error: string | null;
  }>({
    checked: false,
    checking: true,
    tableExists: false,
    error: null
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamic categories
  const [dynCategories, setDynCategories] = useState<CategoryItem[]>([]);
  useEffect(() => {
    fetchCategories().then(({ data }) => { if (data) setDynCategories(data); });
  }, []);

  const allCategories: CategoryItem[] = dynCategories;
  
  const [toastMessage, setToastMessage] = useState('');

  // Delete Confirmation State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const loadProducts = async () => {
    try {
      const { data } = await fetchProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const [dismissedDbBanner, setDismissedDbBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('zaymera_dismiss_db_banner');
      if (dismissed === 'true') setDismissedDbBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    setDismissedDbBanner(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zaymera_dismiss_db_banner', 'true');
    }
  };

  const handleRestoreBanner = () => {
    setDismissedDbBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zaymera_dismiss_db_banner');
    }
  };

  const checkDb = async (manual = false) => {
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await checkDatabaseConnection();
      setDbStatus({
        checked: true,
        checking: false,
        tableExists: res.tableExists,
        error: res.error
      });
      if (manual) {
        if (res.tableExists) {
          showToast('✅ Live Supabase table verified! Syncing local products to cloud...');
          await handleSyncLocalToDb();
        } else {
          showToast('⚠️ Table not found in Supabase yet. Please paste the SQL and click "Run" in Supabase.');
        }
      }
    } catch {
      setDbStatus({
        checked: true,
        checking: false,
        tableExists: false,
        error: 'Failed to verify Supabase connection'
      });
      if (manual) {
        showToast('❌ Could not connect to Supabase. Please verify your connection.');
      }
    }
  };

  useEffect(() => {
    const local = getLocalProducts();
    if (local && local.length > 0) {
      setProducts(local);
      setLoading(false);
    }
    loadProducts();
    checkDb();
  }, []);

  const handleCopySql = () => {
    const sql = `-- =============================================================
--  ZAYMERA BOUTIQUE — Supabase Products & Storage Schema
--  Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

-- 1. ENSURE PUBLIC SCHEMA USAGE
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  category        TEXT        NOT NULL DEFAULT '',
  price           NUMERIC     NOT NULL DEFAULT 0,
  original_price  NUMERIC     NOT NULL DEFAULT 0,
  purchased_price NUMERIC,
  image           TEXT        NOT NULL DEFAULT '',
  images          JSONB       NOT NULL DEFAULT '[]',
  tag             TEXT        NOT NULL DEFAULT 'New Arrival',
  description     TEXT        NOT NULL DEFAULT '',
  fabric          TEXT        NOT NULL DEFAULT '',
  work            TEXT        NOT NULL DEFAULT '',
  in_stock        BOOLEAN     NOT NULL DEFAULT TRUE,
  sizes           JSONB       NOT NULL DEFAULT '[]',
  section         TEXT        NOT NULL DEFAULT 'products',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DISABLE RLS FOR PRODUCTS (Permit Public Storefront Access)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. STORAGE BUCKET FOR PRODUCT IMAGES (Safe execution)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('product-images', 'product-images', TRUE, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
  ON CONFLICT (id) DO UPDATE SET public = TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Bucket notice: %', SQLERRM;
END $$;

-- 4. STORAGE POLICIES (Safe execution against 42501 permission errors)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public select product-images" ON storage.objects;
  CREATE POLICY "Public select product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Select policy notice: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public insert product-images" ON storage.objects;
  CREATE POLICY "Public insert product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Insert policy notice: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public update product-images" ON storage.objects;
  CREATE POLICY "Public update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Update policy notice: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public delete product-images" ON storage.objects;
  CREATE POLICY "Public delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Delete policy notice: %', SQLERRM;
END $$;

-- 5. RELOAD SCHEMA CACHE (Immediate recognition in Supabase API)
NOTIFY pgrst, 'reload schema';
`;
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      showToast('SQL Schema copied to clipboard! Paste it into Supabase SQL Editor.');
      setTimeout(() => setCopiedSql(false), 4000);
    });
  };

  const handleSyncLocalToDb = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLocalProductsToSupabase();
      if (res.success) {
        showToast(`Successfully synced ${res.syncedCount} products to live Supabase!`);
        await loadProducts();
        await checkDb();
      } else {
        alert(`Failed to sync products: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Sync error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zaymera_products_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Products exported as JSON backup.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Toggle Stock Status
  const handleToggleStock = async (product: ProductItem) => {
    const newStock = !product.inStock;
    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: newStock } : p));
    try {
      await updateProduct(product.id, { inStock: newStock });
      showToast(`Updated stock status for "${product.name}"`);
    } catch (err) {
      console.error('Failed to toggle stock:', err);
      // Revert on error
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: product.inStock } : p));
    }
  };



  // Delete Product
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeletingProductId(null);
      showToast('Product deleted successfully');
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Delete All Products
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllProducts();
      setProducts([]);
      setShowDeleteAllModal(false);
      showToast('All products deleted successfully!');
    } catch (err) {
      console.error('Failed to delete all products:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fabric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tag?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStock = 
      stockFilter === 'all' || 
      (stockFilter === 'inStock' && p.inStock) || 
      (stockFilter === 'outOfStock' && !p.inStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#EAE2D5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#1C1613] tracking-wide">
              Product Atelier & Inventory
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#FEF9EE] border border-[#F3E0B5] text-[#936718] px-2.5 py-0.5 rounded-full font-bold">
              {products.length} Items
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#7A6959] mt-1 font-normal">
            Manage your boutique creations, adjust pricing, toggle stock availability, or add new couture pieces.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-[#F6F1E8] border border-[#EAE2D5] text-[#7A6959] hover:text-[#1C1613] transition-colors cursor-pointer shadow-xs flex items-center justify-center shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {products.length > 0 && (
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F6F1E8] border border-[#EAE2D5] text-[#7A6959] hover:text-[#1C1613] text-xs font-bold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              title="Download backup of all products as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Backup JSON</span>
            </button>
          )}

          {products.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#FFF1F2] hover:bg-[#FEE2E2] border border-[#FECDD3] text-[#DC2626] text-xs font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
              title="Delete all products"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Delete All</span>
            </button>
          )}

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Piece</span>
          </Link>
        </div>
      </div>

      {/* Database Diagnostic & Sync Banner */}
      {dbStatus.checked && !dbStatus.tableExists && (
        dismissedDbBanner ? (
          /* Compact discreet indicator when dismissed */
          <div className="px-4 py-2.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] shadow-xs flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
              <span className="text-[11px] sm:text-xs">
                <strong>Local Storage Active:</strong> Products are saved in this browser. Cloud &apos;products&apos; table is not set up yet.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRestoreBanner}
              className="text-[11px] font-bold text-[#B45309] hover:text-[#78350F] underline cursor-pointer shrink-0"
            >
              Setup Database
            </button>
          </div>
        ) : (
          /* Full setup banner with quick guide & dismiss button */
          <div className="relative p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] shadow-sm animate-in fade-in">
            {/* Top Close / Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissBanner}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-[#B45309] hover:text-[#78350F] hover:bg-[#FEF3C7] transition-colors cursor-pointer"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-3 pr-6">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#B45309]">
                <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
                <span>Supabase Database Setup Required (Products Table Missing)</span>
              </div>

              <p className="text-xs text-[#78350F] leading-relaxed max-w-3xl">
                The <code className="bg-[#FEF3C7] px-1.5 py-0.5 rounded font-mono font-bold text-[#92400E]">products</code> table does not exist in your Supabase database yet. Products added right now are saved in this browser&apos;s offline cache only, and <strong>will not be visible after deployment</strong> until you create the table.
              </p>

              {/* Quick Step Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 pb-1">
                <div className="p-2.5 rounded-xl bg-white/70 border border-[#FDE68A] text-[11px] text-[#78350F]">
                  <span className="font-bold text-[#B45309] block mb-0.5">Step 1</span>
                  Click <strong>&quot;Copy SQL Schema&quot;</strong> below
                </div>
                <div className="p-2.5 rounded-xl bg-white/70 border border-[#FDE68A] text-[11px] text-[#78350F]">
                  <span className="font-bold text-[#B45309] block mb-0.5">Step 2</span>
                  Open <strong>&quot;Supabase SQL Editor&quot;</strong>, paste &amp; click <strong>Run</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/70 border border-[#FDE68A] text-[11px] text-[#78350F]">
                  <span className="font-bold text-[#B45309] block mb-0.5">Step 3</span>
                  Return here and click <strong>&quot;Verify&quot;</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/hvhxdjkhodjdqysqziew/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Supabase SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => checkDb(true)}
                  disabled={dbStatus.checking}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-semibold transition-all cursor-pointer"
                  title="Recheck table existence"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.checking ? 'animate-spin' : ''}`} />
                  <span>Verify</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="text-xs text-[#92400E] hover:text-[#78350F] px-2.5 py-1.5 rounded-lg hover:bg-white/50 cursor-pointer ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* When Table Exists: Show Live Sync Bar */}
      {dbStatus.checked && dbStatus.tableExists && (
        <div className="px-4 py-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span><strong>Live Supabase Connected:</strong> Cloud database table is active. All added and synced products will appear on the deployed site.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncLocalToDb}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Local Products to Live DB'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, category, fabric..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#C5A059] shadow-xs"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#1C1613] focus:outline-none focus:border-[#C5A059] cursor-pointer shadow-xs"
          >
            <option value="all" className="bg-white text-[#1C1613]">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.slug} className="bg-white text-[#1C1613]">
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div>
          <select
            value={stockFilter}
            onChange={(e: any) => setStockFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#1C1613] focus:outline-none focus:border-[#C5A059] cursor-pointer shadow-xs"
          >
            <option value="all" className="bg-white text-[#1C1613]">All Stock Statuses</option>
            <option value="inStock" className="bg-white text-[#1C1613]">In Stock Only</option>
            <option value="outOfStock" className="bg-white text-[#1C1613]">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* 1. Mobile Cards View (< sm screens) */}
      <div className="block sm:hidden space-y-3">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="p-3.5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D5] shrink-0">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FAF5EC] text-[#936718] px-2 py-0.5 rounded-full border border-[#EBDCC5]">
                    {prod.category?.replace('-', ' ')}
                  </span>
                  {prod.tag && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFF1F2] text-[#BE123C] px-2 py-0.5 rounded-full border border-[#FECDD3]">
                      {prod.tag}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-semibold text-[#1C1613] line-clamp-2 uppercase tracking-wide mt-1">
                  {prod.name}
                </h3>

                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-sm font-bold text-[#936718]">
                    ₹{prod.price?.toLocaleString()}
                  </span>
                  {prod.originalPrice && prod.originalPrice > prod.price && (
                    <span className="text-[10px] text-[#8A7B6E] line-through">
                      ₹{prod.originalPrice?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sizing Tags */}
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[#F0E9DF]">
              <span className="text-[10px] text-[#7A6959] font-medium mr-1">Sizes:</span>
              {(prod.sizes || []).map((s: any) => (
                <span
                  key={s.size}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    s.inStock !== false
                      ? 'bg-[#FAF7F2] text-[#6B5E52] border border-[#EAE2D5]'
                      : 'bg-[#FEE2E2] text-[#991B1B] line-through border border-[#FECACA]'
                  }`}
                >
                  {s.size}
                </span>
              ))}
            </div>

            {/* Bottom Row Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F0E9DF]">
              <button
                onClick={() => handleToggleStock(prod)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  prod.inStock
                    ? 'bg-[#ECFDF5] text-[#15803D] border border-[#86EFAC]'
                    : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                <span>{prod.inStock ? 'In Stock' : 'Sold Out'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/products/new?edit=${encodeURIComponent(prod.id)}`}
                  className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#936718] transition-colors flex items-center justify-center cursor-pointer border border-[#EAE2D5]"
                  title="Edit Piece (Full Section Editor)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setDeletingProductId(prod.id)}
                  className="p-2 rounded-xl bg-[#FFF1F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECDD3] transition-colors"
                  title="Delete Piece"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Desktop & Tablet Table View (>= sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-white border border-[#EAE2D5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto admin-responsive-table">
          <table className="w-full min-w-[760px] text-left text-xs text-[#1C1613]">
            <thead className="bg-[#FAF6EE] text-[#7A6959] uppercase tracking-wider text-[10px] font-bold border-b border-[#EAE2D5]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Piece & Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Fabric / Work</th>
                <th className="py-3.5 px-4">Sizes</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE2]">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#FAF7F2] transition-colors">
                  
                  {/* Image & Title */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[#FAF7F2] border border-[#EAE2D5] shrink-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="max-w-xs">
                        <div className="font-semibold text-[#1C1613] line-clamp-1 uppercase tracking-wide">
                          {prod.name}
                        </div>
                        {prod.tag && (
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] px-2 py-0.5 rounded-md">
                            {prod.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 text-[#6B5E52] capitalize">
                    {prod.category?.replace('-', ' ') || 'General'}
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#936718]">
                      ₹{prod.price?.toLocaleString()}
                    </div>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <div className="text-[10px] text-[#8A7B6E] line-through">
                        ₹{prod.originalPrice?.toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* Fabric / Work */}
                  <td className="py-3.5 px-4 text-[#6B5E52] max-w-[160px]">
                    <div className="truncate font-medium text-[#1C1613]">{prod.fabric || 'Pure Handloom'}</div>
                    <div className="truncate text-[10.5px] text-[#7A6959]">{prod.work || 'Hand Embroidered'}</div>
                  </td>

                  {/* Sizes */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 flex-wrap max-w-[130px]">
                      {(prod.sizes || []).map((s: any) => (
                        <span
                          key={s.size}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            s.inStock !== false
                              ? 'bg-[#FAF7F2] text-[#6B5E52] border border-[#EAE2D5]'
                              : 'bg-[#FEE2E2] text-[#991B1B] line-through border border-[#FECACA]'
                          }`}
                        >
                          {s.size}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Stock Toggle Switch */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleStock(prod)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        prod.inStock
                          ? 'bg-[#ECFDF5] text-[#15803D] border border-[#86EFAC] hover:bg-[#D1FAE5]'
                          : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5] hover:bg-[#FEE2E2]'
                      }`}
                      title="Click to toggle stock status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                      <span>{prod.inStock ? 'In Stock' : 'Sold Out'}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/products/new?edit=${encodeURIComponent(prod.id)}`}
                        className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#936718] border border-[#EAE2D5] transition-colors cursor-pointer flex items-center justify-center"
                        title="Edit Piece (Full Section Editor)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => setDeletingProductId(prod.id)}
                        className="p-2 rounded-lg bg-[#FFF1F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECDD3] transition-colors cursor-pointer"
                        title="Delete Piece"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {products.length === 0 && !loading ? (
        <div className="py-16 text-center text-[#7A6959] bg-white rounded-3xl border border-[#EAE2D5] p-6 sm:p-10 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5EC] border border-[#EBDCC5] text-[#936718] flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-display text-lg sm:text-xl text-[#1C1613] font-normal">Catalog is Empty</h3>
          <p className="text-xs sm:text-sm text-[#7A6959] mt-2 leading-relaxed">
            All products have been deleted from your inventory. You can start fresh and add new couture pieces to showcase in the atelier.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Your First Product</span>
            </Link>
          </div>
        </div>
      ) : filteredProducts.length === 0 && !loading ? (
        <div className="py-12 text-center text-[#7A6959] bg-white rounded-3xl border border-[#EAE2D5]">
          <Package className="w-10 h-10 mx-auto mb-2 text-[#BAAC9C]" />
          <p className="text-sm font-medium text-[#1C1613]">No products match your filter criteria.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setStockFilter('all'); }}
            className="mt-3 text-xs text-[#936718] font-semibold underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#EAE2D5] rounded-3xl p-6 shadow-2xl text-[#1C1613] space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display text-lg text-[#1C1613]">Delete Product</h3>
            </div>
            <p className="text-xs text-[#6B5E52] leading-relaxed">
              Are you sure you want to permanently remove this piece from the catalog? This action will remove it from the online store.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#DDD4C5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingProductId)}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#EAE2D5] rounded-3xl p-6 shadow-2xl text-[#1C1613] space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertCircle className="w-6 h-6 shrink-0 text-[#DC2626]" />
              <h3 className="font-display text-lg text-[#1C1613]">Delete All Products</h3>
            </div>
            <p className="text-xs text-[#6B5E52] leading-relaxed">
              Are you sure you want to <strong className="text-[#DC2626]">delete ALL {products.length} products</strong> from your atelier? This will clear the customer-facing products page and admin products list completely.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#DDD4C5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
