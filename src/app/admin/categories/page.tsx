'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  UploadCloud,
  ImageIcon,
  Loader2,
  Database,
  RefreshCw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  checkCategoriesDatabase,
  syncCategoriesToDatabase,
  uploadImageFile,
  CategoryItem
} from '@/lib/supabase/services';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Database Connection Status
  const [dbStatus, setDbStatus] = useState<{
    checked: boolean;
    checking: boolean;
    tableExists: boolean;
    bucketExists: boolean;
    count: number;
    error: string | null;
  }>({
    checked: false,
    checking: false,
    tableExists: false,
    bucketExists: false,
    count: 0,
    error: null,
  });
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State (Add Modal)
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [count, setCount] = useState('50+ Styles');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);

  // Photo Upload State (Add Modal)
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState<string>('');
  const [isAddPhotoUploading, setIsAddPhotoUploading] = useState<boolean>(false);
  const [addPhotoUploadError, setAddPhotoUploadError] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Form State (Edit Modal)
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>('');
  const [isEditPhotoUploading, setIsEditPhotoUploading] = useState<boolean>(false);
  const [editPhotoUploadError, setEditPhotoUploadError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  const verifyDatabase = async (showToastNotice = false) => {
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await checkCategoriesDatabase();
      setDbStatus({
        checked: true,
        checking: false,
        tableExists: res.tableExists,
        bucketExists: res.bucketExists,
        count: res.count,
        error: res.error,
      });
      if (showToastNotice) {
        if (res.tableExists) {
          showToast(`✅ Database verified! 'categories' table live (${res.count} records).`);
        } else {
          showToast(`⚠️ Database table 'categories' not found. View SQL Schema below.`);
        }
      }
    } catch (err: any) {
      setDbStatus({
        checked: true,
        checking: false,
        tableExists: false,
        bucketExists: false,
        count: 0,
        error: err?.message || 'Database check failed',
      });
    }
  };

  useEffect(() => {
    loadCategories();
    verifyDatabase();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSyncToDb = async () => {
    setIsSyncingDb(true);
    try {
      const res = await syncCategoriesToDatabase();
      if (res.success) {
        showToast(`✅ Successfully synced ${res.syncedCount} collections to Supabase database!`);
        verifyDatabase();
      } else {
        showToast(`❌ Database sync issue: ${res.error}`);
      }
    } catch (err: any) {
      showToast(`❌ Sync error: ${err?.message || 'Failed'}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // ── Photo Upload Handler: Add Modal ──────────────────────────────────────────
  const handleAddPhotoSelect = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAddPhotoUploadError('Please select a valid image file (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAddPhotoUploadError('Image size exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setAddPhotoFile(file);
    setAddPhotoUploadError(null);

    // Fast local preview immediately
    const localUrl = URL.createObjectURL(file);
    setAddPhotoPreview(localUrl);

    // Upload immediately to category-images bucket
    setIsAddPhotoUploading(true);
    try {
      const result = await uploadImageFile(file, 'category-images', 'categories');
      if (result.publicUrl) {
        setAddPhotoPreview(result.publicUrl);
        setIsAddPhotoUploading(false);
        setAddPhotoUploadError(null);
      } else {
        setIsAddPhotoUploading(false);
        setAddPhotoUploadError(result.error || 'Failed to upload photo to storage bucket');
      }
    } catch (err: any) {
      setIsAddPhotoUploading(false);
      setAddPhotoUploadError(err?.message || 'Upload error');
    }
  };

  const clearAddPhoto = () => {
    setAddPhotoFile(null);
    setAddPhotoPreview('');
    setAddPhotoUploadError(null);
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  // ── Photo Upload Handler: Edit Modal ─────────────────────────────────────────
  const handleEditPhotoSelect = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditPhotoUploadError('Please select a valid image file (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setEditPhotoUploadError('Image size exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setEditPhotoFile(file);
    setEditPhotoUploadError(null);

    const localUrl = URL.createObjectURL(file);
    setEditPhotoPreview(localUrl);

    setIsEditPhotoUploading(true);
    try {
      const result = await uploadImageFile(file, 'category-images', 'categories');
      if (result.publicUrl) {
        setEditPhotoPreview(result.publicUrl);
        if (editingCategory) {
          setEditingCategory({ ...editingCategory, image: result.publicUrl });
        }
        setIsEditPhotoUploading(false);
        setEditPhotoUploadError(null);
      } else {
        setIsEditPhotoUploading(false);
        setEditPhotoUploadError(result.error || 'Failed to upload photo to storage bucket');
      }
    } catch (err: any) {
      setIsEditPhotoUploading(false);
      setEditPhotoUploadError(err?.message || 'Upload error');
    }
  };

  const clearEditPhoto = () => {
    setEditPhotoFile(null);
    setEditPhotoPreview('');
    setEditPhotoUploadError(null);
    if (editingCategory) {
      setEditingCategory({ ...editingCategory, image: '' });
    }
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // ── Open Edit Modal ──────────────────────────────────────────────────────────
  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory({ ...cat });
    setEditPhotoFile(null);
    setEditPhotoPreview(cat.image || '');
    setEditPhotoUploadError(null);
    setIsEditPhotoUploading(false);
  };

  // ── Create Collection ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isAddPhotoUploading) {
      showToast('Please wait for photo upload to finish.');
      return;
    }

    try {
      const res = await createCategory({
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        count: count.trim() || '40+ Styles',
        image: addPhotoPreview || '/images/royal_blue_anarkali_1788292199640.jpg',
        imageFile: addPhotoFile,
        description: description.trim(),
        featured
      });

      if (res.success) {
        setCategories(prev => {
          const exists = prev.some(c => c.id === res.data.id || c.slug === res.data.slug);
          return exists ? prev.map(c => c.id === res.data.id ? res.data : c) : [...prev, res.data];
        });
        setIsAddModalOpen(false);
        setTitle('');
        setSlug('');
        setCount('50+ Styles');
        setDescription('');
        setFeatured(false);
        clearAddPhoto();
        showToast(`Category "${title}" saved to database successfully!`);
        verifyDatabase();
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating category.');
    }
  };

  // ── Update Collection ────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (isEditPhotoUploading) {
      showToast('Please wait for photo upload to finish.');
      return;
    }

    try {
      const updatedCat: CategoryItem = {
        ...editingCategory,
        image: editPhotoPreview || editingCategory.image || '/images/royal_blue_anarkali_1788292199640.jpg'
      };

      await updateCategory(editingCategory.id, {
        ...updatedCat,
        imageFile: editPhotoFile
      });

      setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCat : c));
      setEditingCategory(null);
      clearEditPhoto();
      showToast('Collection updated & saved to database successfully!');
      verifyDatabase();
    } catch (err) {
      console.error(err);
      showToast('Error updating collection.');
    }
  };

  // ── Delete Collection ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this collection from the store & database?')) {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Collection removed from store and database.');
      verifyDatabase();
    }
  };

  const handleCopySql = () => {
    const sql = `-- =============================================================
--  ZAYMERA BOUTIQUE — Categories Table & Storage Schema
--  Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  count       TEXT        NOT NULL DEFAULT '0 Styles',
  image       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  featured    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DISABLE RLS FOR PUBLIC STOREFRONT ACCESS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;

-- 3. STORAGE BUCKET FOR CATEGORY IMAGES
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('category-images', 'category-images', TRUE, 15728640, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
  ON CONFLICT (id) DO UPDATE SET public = TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Bucket notice: %', SQLERRM;
END $$;

-- 4. STORAGE POLICIES
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public select category-images" ON storage.objects;
  CREATE POLICY "Public select category-images" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Select policy notice: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public insert category-images" ON storage.objects;
  CREATE POLICY "Public insert category-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Insert policy notice: %', SQLERRM;
END $$;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
`;
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      showToast('SQL Schema copied to clipboard!');
      setTimeout(() => setCopiedSql(false), 4000);
    });
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
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
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
            Organize atelier collections with direct photo upload, showcase lookbook banners on the home page, and persist to the Supabase database.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleSyncToDb}
            disabled={isSyncingDb}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] hover:bg-[#F3ECE1] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Sync all collections into the Supabase database table"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#936718] ${isSyncingDb ? 'animate-spin' : ''}`} />
            <span>{isSyncingDb ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] hover:bg-[#F3ECE1] transition-all cursor-pointer shadow-xs"
            title="Inspect Database Schema"
          >
            <Database className="w-3.5 h-3.5 text-[#936718]" />
            <span>DB Schema</span>
          </button>

          <button
            onClick={() => {
              clearAddPhoto();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Collection</span>
          </button>
        </div>
      </div>

      {/* Live Database & Storage Status Banner */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        dbStatus.tableExists
          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            dbStatus.tableExists ? 'bg-[#22C55E] animate-pulse' : 'bg-[#F59E0B]'
          }`} />
          <div>
            <span className="font-bold">
              {dbStatus.tableExists ? 'Supabase Live Database & Storage Connected:' : 'Supabase Setup Alert:'}
            </span>{' '}
            <span className="opacity-90">
              {dbStatus.tableExists
                ? `Table 'categories' active (${dbStatus.count} records in cloud table) • Storage bucket 'category-images' ready for photos.`
                : `Categories are active via automatic cloud sync. Run the 1-click SQL schema if you want custom PostgreSQL table indexing.`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => verifyDatabase(true)}
            className="px-2.5 py-1 rounded-lg bg-white/80 border border-current hover:bg-white text-[11px] font-semibold cursor-pointer transition-colors"
          >
            {dbStatus.checking ? 'Checking...' : 'Verify DB'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search collections by title, slug, or aesthetic..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] shadow-xs"
        />
      </div>

      {/* Categories Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#6B5E52] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#936718]" />
          <span>Loading luxury atelier collections...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#6B5E52] bg-white rounded-3xl border border-[#EAE2D5] p-8 space-y-3">
          <ImageIcon className="w-10 h-10 text-[#C5A059] mx-auto opacity-70" />
          <h3 className="font-display text-base text-[#1C1613]">No collections found</h3>
          <p className="max-w-md mx-auto text-[#8A7B6E]">
            {searchTerm ? 'No collections match your search filter.' : 'You have not added any collections yet. Click "Add Collection" to upload your first lookbook category.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                clearAddPhoto();
                setIsAddModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 bg-[#936718] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#785312] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="group rounded-3xl bg-white border border-[#EAE2D5] overflow-hidden shadow-xs hover:border-[#C5A059]/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Banner Image Display */}
                <div className="relative h-44 sm:h-52 overflow-hidden bg-[#FAF7F2]">
                  <img
                    src={cat.image || '/images/royal_blue_anarkali_1788292199640.jpg'}
                    alt={cat.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/royal_blue_anarkali_1788292199640.jpg';
                    }}
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
                      Featured on Home
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-2 text-xs">
                  <div className="text-[11px] font-mono text-[#6B5E52] flex items-center justify-between">
                    <span>Slug: <span className="text-[#1C1613] font-semibold">{cat.slug}</span></span>
                    {cat.image.startsWith('http') && (
                      <span className="text-[10px] bg-[#ECFDF5] text-[#15803D] px-2 py-0.5 rounded-md font-semibold">
                        Cloud Photo
                      </span>
                    )}
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
                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] text-[#936718] font-semibold hover:underline"
                >
                  <span>View on Store</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] hover:bg-[#F3ECE1] transition-colors cursor-pointer"
                    title="Edit Collection"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* ADD COLLECTION MODAL (with Photo Upload Section)                          */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-5 h-5 text-[#936718]" />
              <h2 className="font-display text-lg sm:text-xl text-[#1C1613] tracking-wide font-normal">
                Add New Collection
              </h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 sm:space-y-5">
              {/* Collection Title */}
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="e.g. Royal Organza Dupattas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              {/* Slug & Item Count */}
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

              {/* ── PHOTO UPLOAD SECTION (Replaces URL Text Input) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider">
                    Collection Photo *
                  </label>
                  <span className="text-[10.5px] text-[#8A7B6E]">
                    JPG, PNG, WEBP, GIF (up to 15MB)
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAddPhotoSelect(file);
                  }}
                />

                {/* Dropzone / Upload Area */}
                {addPhotoPreview ? (
                  <div className="relative rounded-2xl border-2 border-[#C5A059]/40 bg-[#FAF7F2] p-3 sm:p-4 space-y-3">
                    {/* Preview Banner */}
                    <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-black/5 shadow-inner">
                      <img
                        src={addPhotoPreview}
                        alt="Collection Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                        <span className="text-[11px] font-medium truncate">
                          {addPhotoFile?.name || 'Uploaded photo'}
                        </span>
                        {addPhotoFile && (
                          <span className="text-[10px] text-white/70">
                            {(addPhotoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>

                      {/* Upload Status Overlay */}
                      {isAddPhotoUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs font-bold">
                          <Loader2 className="w-6 h-6 animate-spin text-[#E2B755]" />
                          <span>Uploading photo to Supabase storage...</span>
                        </div>
                      )}
                    </div>

                    {/* Controls below preview */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        {isAddPhotoUploading ? (
                          <span className="text-[#936718] font-semibold flex items-center gap-1.5 text-[11px]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Syncing to cloud storage...
                          </span>
                        ) : addPhotoUploadError ? (
                          <span className="text-red-600 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {addPhotoUploadError}
                          </span>
                        ) : (
                          <span className="text-[#15803D] font-semibold flex items-center gap-1.5 text-[11px] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#86EFAC]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Photo Ready & Saved in Cloud
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE2D5] text-[#936718] hover:bg-[#F3ECE1] text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={clearAddPhoto}
                          className="px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => addFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleAddPhotoSelect(file);
                    }}
                    className="border-2 border-dashed border-[#D6C7B2] hover:border-[#936718] rounded-2xl p-6 sm:p-8 bg-[#FAF8F5] hover:bg-[#F5EFE6] transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F3ECE1] group-hover:bg-[#EAE0D0] flex items-center justify-center mx-auto transition-colors">
                      <UploadCloud className="w-6 h-6 text-[#936718]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1C1613]">
                        Click to upload photo or drag & drop here
                      </p>
                      <p className="text-[11px] text-[#8A7B6E] mt-0.5">
                        High resolution portrait or landscape image for lookbook & storefront cards
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-white border border-[#EAE2D5] text-[10.5px] font-semibold text-[#936718] shadow-xs">
                        Browse Files on Device
                      </span>
                    </div>
                  </div>
                )}

                {addPhotoUploadError && !addPhotoPreview && (
                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {addPhotoUploadError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Collection aesthetic summary and fabric details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE2D5]">
                <input
                  type="checkbox"
                  id="feat"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[#936718] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="feat" className="text-xs font-semibold text-[#1C1613] cursor-pointer">
                  Feature on Mega Menu & Home Catalog Showcases
                </label>
              </div>

              {/* Modal Actions */}
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
                  disabled={isAddPhotoUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddPhotoUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Collection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* EDIT COLLECTION MODAL (with Photo Upload Section)                         */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-5 h-5 text-[#936718]" />
              <h2 className="font-display text-lg sm:text-xl text-[#1C1613] tracking-wide font-normal">
                Edit Collection
              </h2>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 sm:space-y-5">
              {/* Collection Title */}
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

              {/* Slug & Item Count */}
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

              {/* ── PHOTO UPLOAD SECTION (Replaces URL Text Input) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider">
                    Collection Photo *
                  </label>
                  <span className="text-[10.5px] text-[#8A7B6E]">
                    JPG, PNG, WEBP, GIF (up to 15MB)
                  </span>
                </div>

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEditPhotoSelect(file);
                  }}
                />

                {editPhotoPreview ? (
                  <div className="relative rounded-2xl border-2 border-[#C5A059]/40 bg-[#FAF7F2] p-3 sm:p-4 space-y-3">
                    <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-black/5 shadow-inner">
                      <img
                        src={editPhotoPreview}
                        alt={editingCategory.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                        <span className="text-[11px] font-medium truncate">
                          {editPhotoFile?.name || editingCategory.title}
                        </span>
                        {editPhotoFile && (
                          <span className="text-[10px] text-white/70">
                            {(editPhotoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>

                      {isEditPhotoUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs font-bold">
                          <Loader2 className="w-6 h-6 animate-spin text-[#E2B755]" />
                          <span>Uploading new photo to Supabase storage...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        {isEditPhotoUploading ? (
                          <span className="text-[#936718] font-semibold flex items-center gap-1.5 text-[11px]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Syncing to cloud storage...
                          </span>
                        ) : editPhotoUploadError ? (
                          <span className="text-red-600 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {editPhotoUploadError}
                          </span>
                        ) : (
                          <span className="text-[#15803D] font-semibold flex items-center gap-1.5 text-[11px] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#86EFAC]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Photo Ready & Saved in Cloud
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE2D5] text-[#936718] hover:bg-[#F3ECE1] text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          Replace Photo
                        </button>
                        <button
                          type="button"
                          onClick={clearEditPhoto}
                          className="px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleEditPhotoSelect(file);
                    }}
                    className="border-2 border-dashed border-[#D6C7B2] hover:border-[#936718] rounded-2xl p-6 sm:p-8 bg-[#FAF8F5] hover:bg-[#F5EFE6] transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F3ECE1] group-hover:bg-[#EAE0D0] flex items-center justify-center mx-auto transition-colors">
                      <UploadCloud className="w-6 h-6 text-[#936718]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1C1613]">
                        Click to upload new photo or drag & drop here
                      </p>
                      <p className="text-[11px] text-[#8A7B6E] mt-0.5">
                        High resolution portrait or landscape image
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-white border border-[#EAE2D5] text-[10.5px] font-semibold text-[#936718] shadow-xs">
                        Browse Files on Device
                      </span>
                    </div>
                  </div>
                )}

                {editPhotoUploadError && !editPhotoPreview && (
                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editPhotoUploadError}
                  </p>
                )}
              </div>

              {/* Description */}
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

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE2D5]">
                <input
                  type="checkbox"
                  id="editFeat"
                  checked={editingCategory.featured ?? false}
                  onChange={(e) => setEditingCategory({ ...editingCategory, featured: e.target.checked })}
                  className="rounded text-[#936718] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editFeat" className="text-xs font-semibold text-[#1C1613] cursor-pointer">
                  Feature on Mega Menu & Home Catalog Showcases
                </label>
              </div>

              {/* Modal Actions */}
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
                  disabled={isEditPhotoUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isEditPhotoUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* SQL SCHEMA MODAL (For automatic / manual Supabase Database verification)  */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setShowSqlModal(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-[#936718]" />
              <h2 className="font-display text-lg sm:text-xl text-[#1C1613] tracking-wide font-normal">
                Supabase Categories & Storage Schema
              </h2>
            </div>
            <p className="text-xs text-[#6B5E52] mb-4">
              Our application automatically keeps your categories in sync via PostgreSQL and Supabase Storage. If you are configuring a fresh Supabase database instance, copy and run this script in the Supabase SQL Editor:
            </p>

            <pre className="p-4 bg-[#1C1613] text-[#F3E2C4] font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-[#3A2F28]">
{`-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  count       TEXT        NOT NULL DEFAULT '0 Styles',
  image       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  featured    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DISABLE RLS FOR PUBLIC READ/WRITE ACCESS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;

-- 3. STORAGE BUCKET FOR CATEGORY IMAGES
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('category-images', 'category-images', TRUE, 15728640, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
  ON CONFLICT (id) DO UPDATE SET public = TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Bucket notice: %', SQLERRM;
END $$;`}
            </pre>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-[#8A7B6E]">
                Status: {dbStatus.tableExists ? '✅ Table Active in Supabase' : '⚠️ Ready for execution'}
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
