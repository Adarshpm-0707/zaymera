'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Eye
} from 'lucide-react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryItem,
  getInitialCategories
} from '@/lib/supabase/services';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [count, setCount] = useState('50+ Styles');
  const [image, setImage] = useState('/images/royal_blue_anarkali_1788292199640.jpg');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);

  const loadCategories = async () => {
    try {
      const { data } = await fetchCategories();
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await createCategory({
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/\s+/g, '-'),
        count,
        image,
        description,
        featured
      });

      if (res.success) {
        setCategories(prev => [...prev, res.data]);
        setIsAddModalOpen(false);
        setTitle('');
        setSlug('');
        showToast(`Category "${title}" created successfully!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, editingCategory);
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
      setEditingCategory(null);
      showToast('Collection updated successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this collection?')) {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Collection removed');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-16">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#EAE2D5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#1C1613] tracking-wide">
              Categories & Collections
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] px-2.5 py-0.5 rounded-full font-bold">
              {categories.length} Collections
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#6B5E52] mt-1 font-normal">
            Organize atelier navigation, showcase category lookbook banners, and manage boutique catalog tags.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Collection</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search collections..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] shadow-xs"
        />
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="group rounded-3xl bg-white border border-[#EAE2D5] overflow-hidden shadow-xs hover:border-[#C5A059]/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Banner Image */}
              <div className="relative h-44 sm:h-48 overflow-hidden bg-[#FAF7F2]">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E2B755]">
                    {cat.count}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white line-clamp-1">
                    {cat.title}
                  </h3>
                </div>

                {cat.featured && (
                  <span className="absolute top-3 right-3 text-[9.5px] bg-[#9B2242] text-white font-bold uppercase px-2 py-0.5 rounded-full shadow-md">
                    Featured
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="p-4 space-y-2 text-xs">
                <div className="text-[11px] font-mono text-[#6B5E52]">
                  Slug: <span className="text-[#1C1613] font-semibold">{cat.slug}</span>
                </div>
                {cat.description && (
                  <p className="text-[#6B5E52] line-clamp-2 leading-relaxed text-[11.5px]">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 pt-2 border-t border-[#EAE2D5] flex items-center justify-between">
              <Link
                href={`/products`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] text-[#936718] font-semibold hover:underline"
              >
                <span>View on Store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditingCategory({ ...cat })}
                  className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] hover:bg-[#F3ECE1] transition-colors cursor-pointer"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-4 h-4 text-[#936718]" />
              <h2 className="font-display text-lg sm:text-xl text-[#1C1613] tracking-wide font-normal">
                Add New Collection
              </h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Organza Dupattas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. organza-dupattas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    Item Count Tag
                  </label>
                  <input
                    type="text"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="e.g. 45+ Designs"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Banner Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Collection aesthetic summary..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="feat"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[#936718]"
                />
                <label htmlFor="feat" className="text-xs font-semibold text-[#1C1613] cursor-pointer">
                  Feature on Mega Menu & Home Catalog
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-4 h-4 text-[#936718]" />
              <h2 className="font-display text-lg sm:text-xl text-[#1C1613] tracking-wide font-normal">
                Edit Collection
              </h2>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.title}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    Item Count Tag
                  </label>
                  <input
                    type="text"
                    value={editingCategory.count}
                    onChange={(e) => setEditingCategory({ ...editingCategory, count: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Banner Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.image}
                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editFeat"
                  checked={editingCategory.featured ?? false}
                  onChange={(e) => setEditingCategory({ ...editingCategory, featured: e.target.checked })}
                  className="rounded text-[#936718]"
                />
                <label htmlFor="editFeat" className="text-xs font-semibold text-[#1C1613] cursor-pointer">
                  Feature on Mega Menu & Home Catalog
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
