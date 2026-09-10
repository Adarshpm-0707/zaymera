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
  AlertCircle
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
  CategoryItem
} from '@/lib/supabase/services';
import { ProductItem } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');

  // Dynamic categories
  const [dynCategories, setDynCategories] = useState<CategoryItem[]>([]);
  useEffect(() => {
    fetchCategories().then(({ data }) => { if (data) setDynCategories(data); });
  }, []);

  const HARDCODED_CATS = [
    { id: 'casual-wear',         title: 'Casual Co-Ord Sets',  slug: 'casual-wear'         },
    { id: 'festive-wear',        title: 'Festive Anarkalis',    slug: 'festive-wear'        },
    { id: 'wedding-collection',  title: 'Wedding & Ceremonial', slug: 'wedding-collection'  },
    { id: 'unstitched-material', title: 'Unstitched Silks',     slug: 'unstitched-material' },
    { id: 'tops',                title: 'Tops & Tunics',        slug: 'tops'                },
    { id: 'top-dupatta',         title: 'Top and Dupatta',      slug: 'top-dupatta'         },
    { id: 'customized',          title: 'Customized Atelier',   slug: 'customized'          },
  ];
  const allCategories: CategoryItem[] = dynCategories.length > 0
    ? [
        ...dynCategories,
        ...HARDCODED_CATS.filter(h => !dynCategories.some(d => d.slug === h.slug)) as any
      ]
    : HARDCODED_CATS as any;
  
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

  useEffect(() => {
    const local = getLocalProducts();
    if (local && local.length > 0) {
      setProducts(local);
      setLoading(false);
    }
    loadProducts();
  }, []);

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
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#162E19] border border-[#22C55E] text-[#4ADE80] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#26201B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#FAF8F5] tracking-wide">
              Product Atelier & Inventory
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#291F18] border border-[#3E3025] text-[#E2B755] px-2.5 py-0.5 rounded-full font-bold">
              {products.length} Items
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-1 font-normal">
            Manage your boutique creations, adjust pricing, toggle stock availability, or add new couture pieces.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="p-2 sm:p-2.5 rounded-xl bg-[#201915] hover:bg-[#2C221D] border border-[#362A21] text-[#A89887] hover:text-white transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {products.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#2D1616] hover:bg-[#3D1A1A] border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              title="Delete all products"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
          )}

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Piece</span>
          </Link>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6959]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, category, fabric..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171210] border border-[#2D231C] text-xs text-[#FAF8F5] placeholder-[#7A6959] focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#171210] border border-[#2D231C] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all" className="bg-[#1C1613] text-[#FAF8F5]">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.slug} className="bg-[#1C1613] text-[#FAF8F5]">
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#171210] border border-[#2D231C] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all" className="bg-[#1C1613] text-[#FAF8F5]">All Stock Statuses</option>
            <option value="inStock" className="bg-[#1C1613] text-[#FAF8F5]">In Stock Only</option>
            <option value="outOfStock" className="bg-[#1C1613] text-[#FAF8F5]">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* 1. Mobile Cards View (< sm screens) */}
      <div className="block sm:hidden space-y-3">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="p-3.5 rounded-2xl bg-[#14100E] border border-[#26201B] shadow-lg space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#241B16] border border-[#3A2D23] shrink-0">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#291F18] text-[#C5A059] px-2 py-0.2 rounded">
                    {prod.category?.replace('-', ' ')}
                  </span>
                  {prod.tag && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#2B1B19] text-[#E28383] px-2 py-0.2 rounded">
                      {prod.tag}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-semibold text-[#FAF8F5] line-clamp-2 uppercase tracking-wide mt-1">
                  {prod.name}
                </h3>

                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-sm font-bold text-[#E2B755]">
                    ₹{prod.price?.toLocaleString()}
                  </span>
                  {prod.originalPrice && prod.originalPrice > prod.price && (
                    <span className="text-[10px] text-[#7A6959] line-through">
                      ₹{prod.originalPrice?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sizing Tags */}
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[#201814]">
              <span className="text-[10px] text-[#7A6959] font-medium mr-1">Sizes:</span>
              {(prod.sizes || []).map((s: any) => (
                <span
                  key={s.size}
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    s.inStock !== false
                      ? 'bg-[#291F18] text-[#D1C3B4] border border-[#3E3025]'
                      : 'bg-[#211717] text-[#7A5A5A] line-through border border-[#3A2222]'
                  }`}
                >
                  {s.size}
                </span>
              ))}
            </div>

            {/* Bottom Row Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#201814]">
              <button
                onClick={() => handleToggleStock(prod)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  prod.inStock
                    ? 'bg-[#15341C] text-[#4ADE80] border border-[#22C55E]/40'
                    : 'bg-[#3A1414] text-[#F87171] border border-[#EF4444]/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                <span>{prod.inStock ? 'In Stock' : 'Sold Out'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/products/new?edit=${encodeURIComponent(prod.id)}`}
                  className="p-2 rounded-xl bg-[#201814] text-[#C5A059] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title="Edit Piece (Full Section Editor)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setDeletingProductId(prod.id)}
                  className="p-2 rounded-xl bg-[#201814] text-[#EF4444] hover:bg-[#3D1A1A] transition-colors"
                  title="Delete Piece"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Desktop Table View (>= sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-[#14100E] border border-[#26201B] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAF8F5]">
            <thead className="bg-[#1C1613] text-[#A89887] uppercase tracking-wider text-[10px] font-bold border-b border-[#2B221B]">
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
            <tbody className="divide-y divide-[#221A16]">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#1A1411] transition-colors">
                  
                  {/* Image & Title */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[#241B16] border border-[#3A2D23] shrink-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="max-w-xs">
                        <div className="font-semibold text-[#FAF8F5] line-clamp-1 uppercase tracking-wide">
                          {prod.name}
                        </div>
                        {prod.tag && (
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-[#2B1B19] text-[#E28383] px-2 py-0.2 rounded-md">
                            {prod.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 text-[#B8A898] capitalize">
                    {prod.category?.replace('-', ' ') || 'General'}
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#E2B755]">
                      ₹{prod.price?.toLocaleString()}
                    </div>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <div className="text-[10px] text-[#7A6959] line-through">
                        ₹{prod.originalPrice?.toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* Fabric / Work */}
                  <td className="py-3.5 px-4 text-[#A89887] max-w-[160px]">
                    <div className="truncate font-medium text-[#D1C3B4]">{prod.fabric || 'Pure Handloom'}</div>
                    <div className="truncate text-[10.5px] text-[#8C7B6C]">{prod.work || 'Hand Embroidered'}</div>
                  </td>

                  {/* Sizes */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 flex-wrap max-w-[130px]">
                      {(prod.sizes || []).map((s: any) => (
                        <span
                          key={s.size}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            s.inStock !== false
                              ? 'bg-[#291F18] text-[#D1C3B4] border border-[#3E3025]'
                              : 'bg-[#211717] text-[#7A5A5A] line-through border border-[#3A2222]'
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
                          ? 'bg-[#15341C] text-[#4ADE80] border border-[#22C55E]/40 hover:bg-[#1E4A28]'
                          : 'bg-[#3A1414] text-[#F87171] border border-[#EF4444]/40 hover:bg-[#4E1C1C]'
                      }`}
                      title="Click to toggle stock status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                      <span>{prod.inStock ? 'In Stock' : 'Sold Out'}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/products/new?edit=${encodeURIComponent(prod.id)}`}
                        className="p-2 rounded-lg bg-[#201814] hover:bg-[#2F231D] text-[#C5A059] transition-colors cursor-pointer flex items-center justify-center"
                        title="Edit Piece (Full Section Editor)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => setDeletingProductId(prod.id)}
                        className="p-2 rounded-lg bg-[#201814] hover:bg-[#3D1A1A] text-[#EF4444] transition-colors cursor-pointer"
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
        <div className="py-16 text-center text-[#8C7B6C] bg-[#14100E] rounded-3xl border border-[#26201B] p-6 sm:p-10 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#201915] border border-[#30251E] text-[#C5A059] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-display text-lg sm:text-xl text-[#FAF8F5] font-normal">Catalog is Empty</h3>
          <p className="text-xs sm:text-sm text-[#8C7B6C] mt-2 leading-relaxed">
            All products have been deleted from your inventory. You can start fresh and add new couture pieces to showcase in the atelier.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Your First Product</span>
            </Link>
          </div>
        </div>
      ) : filteredProducts.length === 0 && !loading ? (
        <div className="py-12 text-center text-[#8C7B6C] bg-[#14100E] rounded-3xl border border-[#26201B]">
          <Package className="w-10 h-10 mx-auto mb-2 text-[#4A3C32]" />
          <p className="text-sm font-medium">No products match your filter criteria.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setStockFilter('all'); }}
            className="mt-3 text-xs text-[#C5A059] underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : null}



      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#16110F] border border-[#3A2424] rounded-3xl p-6 shadow-2xl text-[#FAF8F5] space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display text-lg text-white">Delete Product</h3>
            </div>
            <p className="text-xs text-[#A89887] leading-relaxed">
              Are you sure you want to permanently remove this piece from the catalog? This action will remove it from the online store.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 rounded-xl bg-[#221B17] text-xs font-semibold text-[#A89887] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingProductId)}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Products Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#171110] border border-[#4A2020] rounded-3xl p-6 shadow-2xl text-[#FAF8F5] space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <AlertCircle className="w-6 h-6 shrink-0 text-[#EF4444]" />
              <h3 className="font-display text-lg text-white">Delete All Products</h3>
            </div>
            <p className="text-xs text-[#C4B5A5] leading-relaxed">
              Are you sure you want to <strong className="text-[#EF4444]">delete ALL {products.length} products</strong> from your atelier? This will clear the customer-facing products page and admin products list completely.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded-xl bg-[#221B17] text-xs font-semibold text-[#A89887] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer shadow-lg disabled:opacity-50"
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
