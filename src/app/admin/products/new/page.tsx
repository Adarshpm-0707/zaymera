'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  Sparkles,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Layers,
  Heart,
  ShoppingCart,
  FileEdit,
  Upload,
  X,
  Tag,
  DollarSign,
  Plus,
  IndianRupee,
  Edit3,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Database,
  CloudUpload
} from 'lucide-react';
import {
  createProduct,
  updateProduct,
  fetchProductById,
  fetchCategories,
  CategoryItem,
  uploadImageFile
} from '@/lib/supabase/services';
import { ProductItem } from '@/types';

const DEFAULT_SIZES = [
  { size: 'XS', inStock: true, enabled: false },
  { size: 'S',  inStock: true, enabled: true  },
  { size: 'M',  inStock: true, enabled: true  },
  { size: 'L',  inStock: true, enabled: true  },
  { size: 'XL', inStock: true, enabled: true  },
  { size: 'XXL',inStock: true, enabled: false },
  { size: '3XL',inStock: true, enabled: false },
  { size: 'Free Size', inStock: true, enabled: false },
];

const HARDCODED_CATEGORIES = [
  { id: 'casual-wear',         title: 'Casual Co-Ord Sets',   slug: 'casual-wear'         },
  { id: 'festive-wear',        title: 'Festive Anarkalis',     slug: 'festive-wear'        },
  { id: 'wedding-collection',  title: 'Wedding & Ceremonial',  slug: 'wedding-collection'  },
  { id: 'unstitched-material', title: 'Unstitched Silks',      slug: 'unstitched-material' },
  { id: 'tops',                title: 'Tops & Tunics',         slug: 'tops'                },
  { id: 'top-dupatta',         title: 'Top and Dupatta',       slug: 'top-dupatta'         },
  { id: 'customized',          title: 'Customized Atelier',    slug: 'customized'          },
];

interface ImageSlot {
  url: string;
  file: File | null;
  isUploading?: boolean;
  uploadError?: string | null;
  source?: 'supabase' | 'local' | 'external';
}

const emptySlot = (): ImageSlot => ({ url: '', file: null, isUploading: false, uploadError: null });

function ProductEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [successMessage, setSuccessMessage]     = useState('');
  const [mobileTab, setMobileTab]               = useState<'form' | 'preview'>('form');

  // Dynamic categories
  const [categories, setCategories] = useState<CategoryItem[]>(HARDCODED_CATEGORIES as any);

  useEffect(() => {
    fetchCategories().then(({ data }) => {
      if (data && data.length > 0) {
        // Merge: custom cats first, then hardcoded fallbacks that don't already exist
        const merged = [
          ...data,
          ...HARDCODED_CATEGORIES.filter(h => !data.some(d => d.slug === h.slug)) as any
        ];
        setCategories(merged);
      }
    }).catch(() => {/* silent fallback to hardcoded */});
  }, []);

  // ---------- Form State ----------
  const [name,           setName]           = useState('');
  const [category,       setCategory]       = useState('festive-wear');
  const [offerPrice,     setOfferPrice]     = useState<number | ''>('');      // selling price
  const [originalPrice,  setOriginalPrice]  = useState<number | ''>('');      // MRP / strikethrough
  const [purchasedPrice, setPurchasedPrice] = useState<number | ''>('');      // cost price (admin only)
  const [tag,            setTag]            = useState('New Arrival');
  const [fabric,         setFabric]         = useState('');
  const [work,           setWork]           = useState('');
  const [description,    setDescription]    = useState('');
  const [inStock,        setInStock]        = useState(true);

  // ---------- Storage Bucket Status ----------
  const [bucketStatus, setBucketStatus] = useState<{
    checked: boolean;
    exists: boolean;
    bucket: string;
    hasServiceRole: boolean;
    checking: boolean;
  }>({
    checked: false,
    exists: false,
    bucket: 'product-images',
    hasServiceRole: false,
    checking: false
  });
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const checkBucketStatus = async () => {
    setBucketStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await fetch('/api/upload?bucket=product-images');
      const data = await res.json();
      if (data && data.success) {
        setBucketStatus({
          checked: true,
          exists: Boolean(data.exists),
          bucket: data.bucket || 'product-images',
          hasServiceRole: Boolean(data.hasServiceRole),
          checking: false
        });
      } else {
        setBucketStatus(prev => ({ ...prev, checked: true, exists: false, checking: false }));
      }
    } catch {
      setBucketStatus(prev => ({ ...prev, checked: true, exists: false, checking: false }));
    }
  };

  useEffect(() => {
    checkBucketStatus();
  }, []);

  // ---------- 4 Image Slots ----------
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    emptySlot(), emptySlot(), emptySlot(), emptySlot()
  ]);
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleImageUrlChange = (idx: number, val: string) => {
    setImageSlots(prev => prev.map((s, i) => i === idx ? {
      ...s,
      url: val,
      file: null,
      isUploading: false,
      uploadError: null,
      source: val.includes('supabase.co') ? 'supabase' : (val.startsWith('/uploads/') ? 'local' : 'external')
    } : s));
  };

  const handleFileChange = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast local preview immediately for smooth UI
    const tempBlobUrl = URL.createObjectURL(file);
    setImageSlots(prev => prev.map((s, i) => i === idx ? {
      url: tempBlobUrl,
      file,
      isUploading: true,
      uploadError: null,
      source: undefined
    } : s));

    try {
      // Immediate upload to the storage bucket
      const result = await uploadImageFile(file, 'product-images', editId || 'products');
      if (result.publicUrl) {
        setImageSlots(prev => prev.map((s, i) => i === idx ? {
          url: result.publicUrl,
          file: null,
          isUploading: false,
          uploadError: null,
          source: result.publicUrl.includes('supabase.co') ? 'supabase' : 'local'
        } : s));
      } else {
        setImageSlots(prev => prev.map((s, i) => i === idx ? {
          ...s,
          isUploading: false,
          uploadError: result.error || 'Upload to storage bucket failed'
        } : s));
      }
    } catch (err: any) {
      setImageSlots(prev => prev.map((s, i) => i === idx ? {
        ...s,
        isUploading: false,
        uploadError: err?.message || 'Upload error'
      } : s));
    }
  };

  const clearSlot = (idx: number) => {
    setImageSlots(prev => prev.map((s, i) => i === idx ? emptySlot() : s));
    if (fileInputRefs[idx].current) fileInputRefs[idx].current!.value = '';
  };

  // ---------- Sizes State ----------
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const [customSize, setCustomSize] = useState('');

  const handleToggleSizeEnabled = (sizeName: string) =>
    setSizes(prev => prev.map(s => s.size === sizeName ? { ...s, enabled: !s.enabled } : s));

  const handleToggleSizeStock = (sizeName: string) =>
    setSizes(prev => prev.map(s => s.size === sizeName ? { ...s, inStock: !s.inStock } : s));

  const handleAddCustomSize = () => {
    const trimmed = customSize.trim().toUpperCase();
    if (!trimmed || sizes.some(s => s.size === trimmed)) return;
    setSizes(prev => [...prev, { size: trimmed, inStock: true, enabled: true }]);
    setCustomSize('');
  };

  // ---------- Load existing product in edit mode ----------
  useEffect(() => {
    if (!editId) return;
    setIsLoadingProduct(true);
    fetchProductById(editId).then(({ data }) => {
      if (!data) {
        setIsLoadingProduct(false);
        return;
      }
      setName(data.name || '');
      setCategory(data.category || 'festive-wear');
      setOfferPrice(data.price ?? '');
      setOriginalPrice(data.originalPrice ?? data.price ?? '');
      setPurchasedPrice(data.purchasedPrice ?? '');
      setTag(data.tag || 'New Arrival');
      setFabric(data.fabric || '');
      setWork(data.work || '');
      setDescription(data.description || '');
      setInStock(data.inStock !== false);

      // Populate image slots
      const rawImages = Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : (data.image ? [data.image] : []);
      const newSlots: ImageSlot[] = [emptySlot(), emptySlot(), emptySlot(), emptySlot()];
      rawImages.forEach((url, i) => {
        if (i < 4) newSlots[i] = { url, file: null };
      });
      setImageSlots(newSlots);

      // Populate sizes
      if (data.sizes && Array.isArray(data.sizes) && data.sizes.length > 0) {
        const updatedDefaults = DEFAULT_SIZES.map(def => {
          const match = data.sizes?.find((s: any) => s.size === def.size);
          if (match) {
            return { ...def, enabled: true, inStock: match.inStock !== false };
          }
          return { ...def, enabled: false };
        });
        const customSizes = data.sizes
          .filter((s: any) => !DEFAULT_SIZES.some(d => d.size === s.size))
          .map((s: any) => ({ size: s.size, inStock: s.inStock !== false, enabled: true }));
        setSizes([...updatedDefaults, ...customSizes]);
      }
      setIsLoadingProduct(false);
    }).catch(err => {
      console.error('Failed to load product for editing:', err);
      setIsLoadingProduct(false);
    });
  }, [editId]);

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageSlots.some(s => s.isUploading)) {
      alert('Please wait for images to finish saving to the storage bucket before submitting.');
      return;
    }

    const validSlots = imageSlots.filter(s => s.url.trim() && !s.url.startsWith('blob:'));
    const primaryImageUrl = validSlots[0]?.url.trim() || imageSlots[0].url.trim();

    if (!name.trim() || !offerPrice || !primaryImageUrl) {
      alert('Please fill required fields: Product Title, Selling Price, and at least Image 1');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const activeSizes = sizes
        .filter(s => s.enabled)
        .map(s => ({ size: s.size, inStock: s.inStock }));

      const allImages = imageSlots
        .map(s => s.url.trim())
        .filter(url => url && !url.startsWith('blob:'));

      const cleanPrimary = allImages[0] || (primaryImageUrl.startsWith('blob:') ? '' : primaryImageUrl);

      if (isEditMode && editId) {
        await updateProduct(editId, {
          name:           name.trim().toUpperCase(),
          category,
          price:          Number(offerPrice),
          originalPrice:  originalPrice ? Number(originalPrice) : Number(offerPrice),
          purchasedPrice: purchasedPrice ? Number(purchasedPrice) : undefined,
          image:          cleanPrimary,
          images:         allImages,
          tag:            tag.trim() || 'New Arrival',
          description:    description.trim(),
          fabric:         fabric.trim() || 'Haute Couture Handloom',
          work:           work.trim()   || 'Artisan Handcrafted',
          inStock,
          sizes:          activeSizes.length > 0 ? activeSizes : [{ size: 'Free Size', inStock: true }]
        });

        setSuccessMessage(`"${name}" updated successfully! Changes are live across the storefront.`);
        setTimeout(() => router.push('/admin/products'), 1400);
      } else {
        await createProduct({
          name:           name.trim().toUpperCase(),
          category,
          price:          Number(offerPrice),
          originalPrice:  originalPrice ? Number(originalPrice) : Number(offerPrice),
          purchasedPrice: purchasedPrice ? Number(purchasedPrice) : undefined,
          image:          cleanPrimary,
          images:         allImages,
          tag:            tag.trim() || 'New Arrival',
          description:    description.trim(),
          fabric:         fabric.trim() || 'Haute Couture Handloom',
          work:           work.trim()   || 'Artisan Handcrafted',
          inStock,
          sizes:          activeSizes.length > 0 ? activeSizes : [{ size: 'Free Size', inStock: true }]
        });

        setSuccessMessage(`"${name}" saved to database and is now live on the storefront!`);
        setTimeout(() => router.push('/admin/products'), 1800);
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('An error occurred while saving the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryPreviewImage = imageSlots[0].url || imageSlots.find(s => s.url)?.url || '';

  if (isLoadingProduct) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="font-display text-lg text-[#FAF8F5]">Loading Couture Piece for Editing...</h2>
        <p className="text-xs text-[#8C7B6C]">Retrieving product specifications and lookbook images.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#26201B]">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs text-[#A89887] hover:text-white transition-colors mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#FAF8F5] tracking-wide">
              {isEditMode ? 'Edit Couture Piece' : 'Add New Couture Piece'}
            </h1>
            <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isEditMode ? 'bg-[#C5A059] text-black font-extrabold' : 'bg-[#9B2242] text-white'
            }`}>
              {isEditMode ? 'Editing Mode' : 'Live DB'}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-1 font-normal">
            {isEditMode
              ? `Editing full specifications for "${name || 'Product'}". All changes will sync to live catalog.`
              : 'Products saved here are instantly live on the Home & Products pages.'}
          </p>
        </div>

        {/* Mobile Form / Preview Tabs */}
        <div className="flex lg:hidden items-center p-1 rounded-xl bg-[#1C1613] border border-[#2B221B] self-start">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'form' ? 'bg-[#C5A059] text-black shadow-md' : 'text-[#A89887]'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'preview' ? 'bg-[#C5A059] text-black shadow-md' : 'text-[#A89887]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#142918] border border-[#22C55E] text-[#4ADE80] text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form + Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

        {/* ==================== LEFT FORM ==================== */}
        <form
          onSubmit={handleSubmit}
          className={`lg:col-span-7 space-y-5 sm:space-y-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}
        >

          {/* ── CARD 1: Product Info ── */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#14100E] border border-[#26201B] shadow-xl space-y-4">
            <h3 className="font-display text-sm sm:text-base text-[#FAF8F5] tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Product Information</span>
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. ZAYMERA ROYAL VELVET EMBROIDERED ANARKALI SUIT"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Category & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Collection / Category *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug} className="bg-[#1C1613] text-[#FAF8F5]">
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Badge / Tag
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  placeholder="e.g. Bestseller, Trending Now, Pure Silk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                Product Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the silhouette, drape, neckline, occasion, styling tips..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059] resize-none"
              />
            </div>

          </div>

          {/* ── CARD 2: Pricing ── */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#14100E] border border-[#26201B] shadow-xl space-y-4">
            <h3 className="font-display text-sm sm:text-base text-[#FAF8F5] tracking-wide flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#C5A059]" />
              <span>Pricing Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

              {/* Offer / Selling Price */}
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Selling / Offer Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6959] text-xs font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 2499"
                    className="w-full pl-6 pr-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <p className="text-[10px] text-[#7A6959] mt-1">Price shown to customers</p>
              </div>

              {/* Original / MRP */}
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Original MRP (₹) — Strikethrough
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6959] text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 3999"
                    className="w-full pl-6 pr-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <p className="text-[10px] text-[#7A6959] mt-1">Shown with line-through</p>
              </div>

              {/* Purchased / Cost Price */}
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Purchased / Cost Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6959] text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={purchasedPrice}
                    onChange={e => setPurchasedPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 1200"
                    className="w-full pl-6 pr-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <p className="text-[10px] text-[#E2B755] mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755] inline-block" />
                  Admin only — not shown to customers
                </p>
              </div>
            </div>

            {/* Margin indicator */}
            {offerPrice && purchasedPrice && Number(purchasedPrice) > 0 && (
              <div className="p-3 rounded-xl bg-[#1A2A1A] border border-[#22C55E]/30 text-xs flex items-center gap-3">
                <span className="text-[#8C7B6C]">Margin:</span>
                <span className="text-[#4ADE80] font-bold">
                  ₹{(Number(offerPrice) - Number(purchasedPrice)).toLocaleString()}
                </span>
                <span className="text-[#4ADE80]">
                  ({Math.round(((Number(offerPrice) - Number(purchasedPrice)) / Number(offerPrice)) * 100)}% profit)
                </span>
              </div>
            )}
          </div>

          {/* ── CARD 3: 4 Image Slots ── */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#14100E] border border-[#26201B] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#26201B]">
              <div>
                <h3 className="font-display text-sm sm:text-base text-[#FAF8F5] tracking-wide flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                  <span>Product Photography &amp; Storage Bucket</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#8C7B6C] mt-0.5">
                  Images uploaded from your device are saved directly into your storage bucket.
                </p>
              </div>

              {/* Bucket Status Indicator */}
              <div className="flex items-center gap-2">
                {bucketStatus.checked ? (
                  bucketStatus.exists ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D2818] border border-[#22C55E]/40 text-[#4ADE80] text-[10.5px] font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      <span>Bucket: {bucketStatus.bucket} (Active)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBucketModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C5A059]/20 to-[#9B2242]/20 hover:from-[#C5A059]/30 hover:to-[#9B2242]/30 border border-[#C5A059]/50 text-[#E2B755] text-[11px] font-semibold transition-all shadow cursor-pointer active:scale-95"
                    >
                      <Database className="w-3.5 h-3.5 text-[#E2B755]" />
                      <span>Setup Storage Bucket</span>
                    </button>
                  )
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-[10.5px] text-[#8C7B6C]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Checking bucket...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {imageSlots.map((slot, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#A89887] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {idx === 0 ? (
                        <span className="bg-[#9B2242] text-white px-1.5 py-0.5 rounded text-[9px] font-bold">Primary</span>
                      ) : (
                        <span className="bg-[#291F18] text-[#C5A059] px-1.5 py-0.5 rounded text-[9px] font-bold">Image {idx + 1}</span>
                      )}
                      {idx === 0 && <span className="text-[#EF4444]">*</span>}
                    </div>
                    {slot.url && (
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded font-semibold tracking-wide bg-[#211A15] text-[#C5A059] border border-[#3A2D23]">
                        {slot.source === 'supabase' || slot.url.includes('supabase.co')
                          ? 'Cloud Bucket'
                          : slot.url.startsWith('/uploads/')
                          ? 'Server Storage'
                          : 'Linked URL'}
                      </span>
                    )}
                  </div>

                  {/* Preview Box */}
                  <div
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${
                      slot.url
                        ? 'border-[#C5A059]/60 bg-[#241B16]'
                        : 'border-dashed border-[#30251E] bg-[#1C1613] cursor-pointer hover:border-[#C5A059]/40'
                    }`}
                    onClick={() => !slot.url && !slot.isUploading && fileInputRefs[idx].current?.click()}
                  >
                    {slot.isUploading && (
                      <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <div className="w-7 h-7 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10.5px] font-bold text-[#FAF8F5]">Uploading to Bucket...</span>
                        <span className="text-[9px] text-[#A89887]">Saving high-resolution image</span>
                      </div>
                    )}

                    {slot.uploadError && !slot.isUploading && (
                      <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                        <span className="text-[10px] text-[#EF4444] font-medium leading-tight line-clamp-3">
                          {slot.uploadError}
                        </span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); fileInputRefs[idx].current?.click(); }}
                          className="px-2.5 py-1 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-[10px] font-bold cursor-pointer"
                        >
                          Retry Upload
                        </button>
                      </div>
                    )}

                    {slot.url ? (
                      <>
                        <img src={slot.url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); clearSlot(idx); }}
                          className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 p-3 text-center">
                        <Upload className="w-5 h-5 text-[#6E5F52]" />
                        <span className="text-[10px] text-[#A89887] font-medium">Click to upload image</span>
                        <span className="text-[8.5px] text-[#6E5F52]">JPG, PNG, WebP up to 15MB</span>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRefs[idx]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileChange(idx, e)}
                  />

                  {/* URL Input */}
                  <input
                    type="text"
                    value={slot.file && slot.isUploading ? 'Uploading...' : slot.url}
                    onChange={e => handleImageUrlChange(idx, e.target.value)}
                    placeholder={idx === 0 ? 'https://... or click upload above' : 'Optional image URL or click upload'}
                    className={`w-full px-3 py-2 rounded-xl bg-[#1C1613] border text-[10.5px] text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059] ${
                      slot.url ? 'border-[#C5A059]/40' : 'border-[#30251E]'
                    }`}
                  />

                  <button
                    type="button"
                    disabled={slot.isUploading}
                    onClick={() => fileInputRefs[idx].current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#201915] hover:bg-[#2C221C] border border-[#30251E] hover:border-[#C5A059] text-[10.5px] text-[#A89887] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{slot.url ? 'Replace Image' : 'Upload from device'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── CARD 4: Fabric, Work & Sizes ── */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#14100E] border border-[#26201B] shadow-xl space-y-4">
            <h3 className="font-display text-sm sm:text-base text-[#FAF8F5] tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A059]" />
              <span>Craftsmanship &amp; Sizing</span>
            </h3>

            {/* Fabric & Work */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Fabric / Material
                </label>
                <input
                  type="text"
                  value={fabric}
                  onChange={e => setFabric(e.target.value)}
                  placeholder="e.g. 100% Pure Handloom Cotton Silk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                  Embroidery / Handwork
                </label>
                <input
                  type="text"
                  value={work}
                  onChange={e => setWork(e.target.value)}
                  placeholder="e.g. Resham Zari & Scalloped Cutwork"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Size Grid */}
            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-2">
                Size Options &amp; Availability
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sizes.map(s => (
                  <div
                    key={s.size}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                      s.enabled
                        ? 'bg-[#1C1613] border-[#3E3025]'
                        : 'bg-[#14100E] border-[#221A15] opacity-50'
                    }`}
                  >
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={() => handleToggleSizeEnabled(s.size)}
                        className="rounded text-[#C5A059]"
                      />
                      <span>{s.size}</span>
                    </label>

                    {s.enabled && (
                      <button
                        type="button"
                        onClick={() => handleToggleSizeStock(s.size)}
                        className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase tracking-wider cursor-pointer ${
                          s.inStock
                            ? 'bg-[#15341C] text-[#4ADE80]'
                            : 'bg-[#3A1414] text-[#F87171] line-through'
                        }`}
                      >
                        {s.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add custom size */}
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={customSize}
                  onChange={e => setCustomSize(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSize())}
                  placeholder="Add custom size (e.g. 36, 38...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] placeholder-[#6E5F52] focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-3 py-2 rounded-xl bg-[#291F18] border border-[#3E3025] text-[#C5A059] hover:bg-[#3E2E1E] transition-colors cursor-pointer text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stock Master Toggle */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#221A15]">
              <input
                type="checkbox"
                id="masterInStock"
                checked={inStock}
                onChange={e => setInStock(e.target.checked)}
                className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
              />
              <label htmlFor="masterInStock" className="text-xs font-semibold text-[#FAF8F5] cursor-pointer">
                Publish as Available in Stock
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 sm:pt-4">
            <Link
              href="/admin/products"
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#201915] text-xs font-semibold text-[#A89887] hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? (isEditMode ? 'Saving Updates...' : 'Saving to Database...')
                : (isEditMode ? 'Save Changes' : 'Save & Publish Product')}
            </button>
          </div>

        </form>

        {/* ==================== RIGHT PREVIEW ==================== */}
        <div
          className={`lg:col-span-5 sticky top-20 sm:top-24 space-y-4 ${
            mobileTab === 'form' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Live Storefront Preview</span>
            </div>
            <span className="text-[10px] text-[#8C7B6C]">As seen on /products</span>
          </div>

          {/* Product Card Preview */}
          <div className="rounded-2xl bg-white text-[#221C18] border border-[#E8DFCE] overflow-hidden shadow-2xl max-w-sm mx-auto">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-[#ECE4D8]">
              {primaryPreviewImage ? (
                <img
                  src={primaryPreviewImage}
                  alt={name || 'Product preview'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#B8A898] gap-2">
                  <ImageIcon className="w-10 h-10 opacity-40" />
                  <span className="text-[11px] font-medium">Add Image 1 to preview</span>
                </div>
              )}

              {tag && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="bg-white/95 backdrop-blur-sm text-[#9B2242] text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    {tag}
                  </span>
                </div>
              )}
              <div className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-[#5C4E43] flex items-center justify-center shadow-md">
                <Heart className="w-4 h-4" />
              </div>
            </div>

            {/* Thumbnail Strip (images 2-4) */}
            {imageSlots.slice(1).some(s => s.url) && (
              <div className="flex gap-1.5 px-3 pt-2.5">
                {imageSlots.slice(1).map((slot, i) =>
                  slot.url ? (
                    <div key={i} className="w-12 h-14 rounded-lg overflow-hidden border border-[#E8DFCE] bg-[#F5F0E8]">
                      <img src={slot.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : null
                )}
              </div>
            )}

            {/* Details */}
            <div className="p-4 pb-2 flex flex-col items-center text-center">
              {/* Sizes */}
              <div className="flex items-center justify-center gap-1.5 mb-2.5 flex-wrap">
                {sizes.filter(s => s.enabled).map(s => (
                  <span
                    key={s.size}
                    className={`min-w-[32px] h-6 px-1 text-[10px] font-semibold rounded border flex items-center justify-center ${
                      s.inStock
                        ? 'bg-white text-[#4A3F35] border-[#D6CBB8]'
                        : 'bg-gray-50 text-gray-400 border-gray-300 line-through'
                    }`}
                  >
                    {s.size}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="font-sans text-xs font-semibold uppercase text-[#2B231D] line-clamp-2 min-h-[2rem]">
                {name || 'ENTER PRODUCT TITLE ABOVE'}
              </h3>

              {/* Prices */}
              <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#1F1916]">
                  ₹{Number(offerPrice || 0).toLocaleString()}
                </span>
                {originalPrice && Number(originalPrice) > Number(offerPrice) && (
                  <span className="text-[11px] text-[#9E8E7D] line-through">
                    ₹{Number(originalPrice).toLocaleString()}
                  </span>
                )}
                {originalPrice && offerPrice && Number(originalPrice) > Number(offerPrice) && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {Math.round(((Number(originalPrice) - Number(offerPrice)) / Number(originalPrice)) * 100)}% OFF
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[#7A6C5F] line-clamp-2 mt-1">
                {fabric && work ? `${fabric} • ${work}` : fabric || work || 'Fabric & handwork details'}
              </p>
            </div>

            {/* Bottom Buttons */}
            <div className="p-3 pt-1.5 grid grid-cols-2 gap-2 border-t border-[#F2ECE1] mt-1 bg-[#FAF8F5]/60">
              <div className="w-full py-2 px-2 rounded-lg bg-[#D81B60] text-white text-[10px] font-bold flex items-center justify-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </div>
              <div className="w-full py-2 px-2 rounded-lg bg-[#16A34A] text-white text-[10px] font-bold flex items-center justify-center">
                Buy Now
              </div>
            </div>
          </div>

          {/* Admin price breakdown box */}
          {(offerPrice || originalPrice || purchasedPrice) && (
            <div className="p-4 rounded-2xl bg-[#14100E] border border-[#26201B] space-y-2 text-xs">
              <div className="text-[10.5px] font-bold text-[#A89887] uppercase tracking-wider mb-2">Price Summary</div>
              {originalPrice && <div className="flex justify-between text-[#8C7B6C]"><span>MRP</span><span className="line-through">₹{Number(originalPrice).toLocaleString()}</span></div>}
              {offerPrice && <div className="flex justify-between text-[#FAF8F5] font-semibold"><span>Selling Price</span><span>₹{Number(offerPrice).toLocaleString()}</span></div>}
              {purchasedPrice && <div className="flex justify-between text-[#E2B755]"><span>Your Cost</span><span>₹{Number(purchasedPrice).toLocaleString()}</span></div>}
              {offerPrice && purchasedPrice && (
                <div className="flex justify-between text-[#4ADE80] font-bold border-t border-[#26201B] pt-2">
                  <span>Net Margin</span>
                  <span>₹{(Number(offerPrice) - Number(purchasedPrice)).toLocaleString()} ({Math.round(((Number(offerPrice) - Number(purchasedPrice)) / Number(offerPrice)) * 100)}%)</span>
                </div>
              )}
            </div>
          )}
        </div>

      {/* ── SUPABASE STORAGE BUCKET SETUP MODAL ── */}
      {showBucketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#17120F] border border-[#3D3025] shadow-2xl p-6 space-y-5 text-[#FAF8F5]">
            <button
              type="button"
              onClick={() => setShowBucketModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#251E18] text-[#A89887] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2A1D13] border border-[#C5A059]/40 flex items-center justify-center text-[#E2B755]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-normal text-white">
                  Supabase Storage Bucket Setup
                </h3>
                <p className="text-xs text-[#A89887]">
                  Enable cloud storage for lookbook photography
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#C4B5A5]">
              <div className="p-3.5 rounded-2xl bg-[#201814] border border-[#33261C] space-y-2">
                <span className="font-bold text-[#E2B755] uppercase tracking-wider text-[10px]">
                  Option 1: Supabase Dashboard (30 Seconds)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#D8C9B8]">
                  <li>
                    Open{' '}
                    <a
                      href="https://supabase.com/dashboard/project/hvhxdjkhodjdqysqziew/storage/buckets"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E2B755] underline hover:text-white inline-flex items-center gap-1 font-semibold"
                    >
                      Supabase Storage Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click <strong className="text-white">"New bucket"</strong></li>
                  <li>Set Bucket name: <code className="px-1.5 py-0.5 rounded bg-[#2D2119] text-[#E2B755] font-mono text-[10.5px]">product-images</code></li>
                  <li>Toggle <strong className="text-[#22C55E]">"Public bucket"</strong> to ON</li>
                  <li>Click <strong className="text-white">"Save bucket"</strong></li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#201814] border border-[#33261C] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E2B755] uppercase tracking-wider text-[10px]">
                    Option 2: 1-Click SQL Query
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', TRUE) ON CONFLICT (id) DO UPDATE SET public = TRUE;\nCREATE POLICY "Public insert product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');\nCREATE POLICY "Public select product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E2B755] hover:text-white cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <p className="text-[10.5px] text-[#A89887]">
                  Paste in the{' '}
                  <a
                    href="https://supabase.com/dashboard/project/hvhxdjkhodjdqysqziew/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E2B755] underline hover:text-white"
                  >
                    Supabase SQL Editor
                  </a>{' '}
                  and click Run.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#142617] border border-[#22C55E]/30 text-[#4ADE80] text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
                <span>
                  Automatic server fallback is active: images uploaded right now are safely saved to the server and shown in the add section.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBucketModal(false)}
                className="px-4 py-2 rounded-xl bg-[#241C16] hover:bg-[#32261F] text-xs font-semibold text-[#A89887] hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={bucketStatus.checking}
                onClick={async () => {
                  await checkBucketStatus();
                  if (bucketStatus.exists) {
                    setShowBucketModal(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${bucketStatus.checking ? 'animate-spin' : ''}`} />
                <span>{bucketStatus.checking ? 'Checking...' : 'Re-check Connection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default function AddNewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-display text-lg text-[#FAF8F5]">Loading Atelier Designer...</h2>
          <p className="text-xs text-[#8C7B6C]">Preparing couture configuration studio.</p>
        </div>
      }
    >
      <ProductEditorContent />
    </Suspense>
  );
}
