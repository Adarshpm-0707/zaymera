import { supabase, isSupabaseConfigured, supabaseAdmin } from './client';
import { ProductItem, CartItem } from '@/types';
import { PRODUCTS_CATALOG } from '@/constants/catalog';

// ─────────────────────────────────────────────────────────────────────────────
// Types / Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderInput {
  userId?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  cartItems: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod?: string;
}

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  message: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  slug: string;
  count: string;
  image: string;
  description?: string;
  featured?: boolean;
}

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpent: number;
  ordersCount: number;
  tier: 'VIP' | 'Regular' | 'New';
  joinedDate: string;
  isRegistered?: boolean;
  authId?: string;
  lastLogin?: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  active: boolean;
}

export interface StoreSettingsItem {
  announcementText: string;
  conciergePhone: string;
  supportEmail: string;
  freeShippingThreshold: number;
  storeTimings: string;
  currencySymbol: string;
  whatsappMessage: string;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  sortOrder: number;
  active: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local Storage Keys (used as offline cache only)
// ─────────────────────────────────────────────────────────────────────────────

const LS = {
  PRODUCTS:          'zaymera_admin_custom_products',
  ORDERS:            'zaymera_admin_orders',
  INQUIRIES:         'zaymera_admin_inquiries',
  CATEGORIES:        'zaymera_admin_categories',
  CUSTOMERS:         'zaymera_admin_customers',
  DELETED_CUSTOMERS: 'zaymera_admin_deleted_customers',
  COUPONS:           'zaymera_admin_coupons',
  STORE_SETTINGS:    'zaymera_admin_store_settings',
  BANNERS:           'zaymera_admin_banners',
  PURGE_KEY:         'zaymera_products_purged_v2',
};

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Caches
// ─────────────────────────────────────────────────────────────────────────────

let cachedProducts:   ProductItem[]    | null = null;
let cachedOrders:     any[]            | null = null;
let cachedInquiries:  any[]            | null = null;
let cachedCategories: CategoryItem[]   | null = null;
let cachedCustomers:  CustomerItem[]   | null = null;
let cachedCoupons:    CouponItem[]     | null = null;
let cachedSettings:   StoreSettingsItem | null = null;
let cachedBanners:    BannerItem[]     | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

// Track tables that are unavailable or missing from Supabase schema cache (e.g. PGRST205 404).
// Prevents spamming remote queries, eliminates 404 errors, and keeps admin navigation instant.
const missingTables = new Set<string>();

export function isTableAvailable(table: string): boolean {
  if (!isSupabaseConfigured) return false;
  if (missingTables.has(table)) return false;
  return true;
}

export function markTableUnavailable(table: string) {
  missingTables.add(table);
}

export function resetSupabaseTableStatus(table?: string) {
  if (table) {
    missingTables.delete(table);
  } else {
    missingTables.clear();
  }
}

export function getUnavailableTables(): string[] {
  return Array.from(missingTables);
}

export function isMissingTableError(err: any): boolean {
  if (!err) return false;
  return (
    err?.code === 'PGRST205' ||
    err?.status === 404 ||
    (typeof err?.message === 'string' && err.message.includes('schema cache'))
  );
}

export async function withTimeout<T>(promise: Promise<T>, ms = 8000, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer!));
}

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[ls] Failed to save ${key}:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Upload Helpers (client-side Supabase storage with data URL fallback)
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadImageFile(
  file: File,
  bucket: string = 'product-images',
  folder: string = 'uploads'
): Promise<{ publicUrl: string; path: string; error: string | null }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}/${Date.now()}-${cleanFileName}`;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { publicUrl: urlData.publicUrl, path: filePath, error: null };
      }
    }

    // Fallback: convert to base64 Data URL for instant client-side preview and storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ publicUrl: reader.result as string, path: filePath, error: null });
      reader.onerror = () => resolve({ publicUrl: '', path: '', error: 'Failed to read file' });
      reader.readAsDataURL(file);
    });
  } catch (err: any) {
    return { publicUrl: '', path: '', error: err?.message || 'Upload failed' };
  }
}

export async function deleteImageFile(bucket: string, path: string): Promise<void> {
  try {
    if (isSupabaseConfigured && path) {
      await supabase.storage.from(bucket).remove([path]);
    }
  } catch {
    // non-critical
  }
}

/**
 * Extract storage path from a Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/product-images/folder/file.jpg"
 *   → "folder/file.jpg"
 */
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.substring(idx + marker.length);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Products — old purge helper (keep for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

function checkAndPurgeOldMockProducts() {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem(LS.PURGE_KEY)) {
      localStorage.setItem(LS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(LS.PURGE_KEY, 'true');
      cachedProducts = [];
    }
  } catch { /* ignore */ }
}

export function getLocalProducts(): ProductItem[] {
  if (typeof window === 'undefined') return [];
  checkAndPurgeOldMockProducts();
  return lsGet<ProductItem[]>(LS.PRODUCTS, []);
}

export function saveLocalProducts(products: ProductItem[]) {
  cachedProducts = products;
  lsSet(LS.PRODUCTS, products);
}

// ─────────────────────────────────────────────────────────────────────────────
// Synchronous Initial Getters (SSR Safe — identical between Server & Client)
// ─────────────────────────────────────────────────────────────────────────────

export function getInitialProducts(): ProductItem[] {
  return PRODUCTS_CATALOG;
}

export function getInitialCategories(): CategoryItem[] {
  return [];
}

export function getInitialOrders(): any[] {
  return [];
}

export function getInitialInquiries(): any[] {
  return [];
}

export function getInitialCustomers(): CustomerItem[] {
  return [];
}

export function getInitialCoupons(): CouponItem[] {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUCTS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

function formatProductFromDb(item: any): ProductItem {
  return {
    id:             item.id,
    name:           item.name || '',
    category:       item.category || '',
    price:          Number(item.price) || 0,
    originalPrice:  item.original_price ? Number(item.original_price) : (Number(item.price) || 0),
    purchasedPrice: item.purchased_price ? Number(item.purchased_price) : undefined,
    image:          item.image || (Array.isArray(item.images) && item.images[0]) || '',
    images:         Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
    tag:            item.tag || '',
    description:    item.description || '',
    fabric:         item.fabric || '',
    work:           item.work || '',
    inStock:        item.in_stock !== false,
    sizes:          Array.isArray(item.sizes) ? item.sizes : [
      { size: 'S',   inStock: true },
      { size: 'M',   inStock: true },
      { size: 'L',   inStock: true },
      { size: 'XL',  inStock: true },
      { size: 'XXL', inStock: true },
    ]
  };
}

export async function fetchProducts(): Promise<{ data: ProductItem[]; error: any }> {
  checkAndPurgeOldMockProducts();

  // Serve from cache instantly if available
  if (cachedProducts && cachedProducts.length > 0) {
    // Refresh in background
    _refreshProductsFromDb().catch(() => {});
    return { data: cachedProducts, error: null };
  }

  return _refreshProductsFromDb();
}

async function _refreshProductsFromDb(): Promise<{ data: ProductItem[]; error: any }> {
  const localProducts = getLocalProducts();

  if (!isTableAvailable('products')) {
    const fallback = localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG;
    cachedProducts = fallback;
    return { data: fallback, error: null };
  }

  try {
    const result = await withTimeout(
      supabase.from('products').select('*').order('created_at', { ascending: false }) as any,
      8000,
      { data: null, error: 'timeout' }
    );

    if (result.error || result.data === null) {
      if (isMissingTableError(result.error)) {
        markTableUnavailable('products');
      }
      const fallback = localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG;
      cachedProducts = fallback;
      return { data: fallback, error: null };
    }

    if (result.data.length === 0) {
      const fallback = localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG;
      cachedProducts = fallback;
      return { data: fallback, error: null };
    }

    const formatted = result.data.map(formatProductFromDb);
    // Merge DB products with local-only products (those not yet synced)
    const merged = [
      ...formatted,
      ...localProducts.filter(lp => !formatted.some(f => f.id === lp.id))
    ];
    cachedProducts = merged;
    saveLocalProducts(merged); // keep local cache in sync
    return { data: merged, error: null };
  } catch (err) {
    const fallback = localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG;
    cachedProducts = fallback;
    return { data: fallback, error: null };
  }
}

export async function fetchAllProductsAdmin(): Promise<{ data: ProductItem[]; error: any }> {
  return fetchProducts();
}

export async function fetchProductById(id: string): Promise<{ data: ProductItem | null; error: any }> {
  const currentLocal = getLocalProducts();
  const localMatch = currentLocal.find(p => p.id === id);
  if (localMatch) {
    return { data: localMatch, error: null };
  }

  if (cachedProducts && cachedProducts.length > 0) {
    const memoryMatch = cachedProducts.find(p => p.id === id);
    if (memoryMatch) return { data: memoryMatch, error: null };
  }

  if (isTableAvailable('products')) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        return { data: formatProductFromDb(data), error: null };
      }
      if (isMissingTableError(error)) {
        markTableUnavailable('products');
      }
    } catch {
      // silent fallback
    }
  }

  const catalogMatch = PRODUCTS_CATALOG.find(p => p.id === id);
  return { data: catalogMatch || null, error: null };
}

/**
 * Create a product.
 * imageFiles: optional File[] for slots that have local files (not URLs).
 * imageUrls: string[] with already-resolved URLs (from file upload or pasted URL).
 */
export async function createProduct(
  product: Omit<ProductItem, 'id'> & { id?: string; imageFiles?: (File | null)[] }
): Promise<{ success: boolean; data: ProductItem | null; error: any; savedLocallyOnly?: boolean }> {
  const newId = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // ── Upload any File objects to Supabase Storage ───────────────────────────
  let imageUrls: string[] = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : product.image ? [product.image] : [];

  if (product.imageFiles && product.imageFiles.length > 0) {
    const uploadPromises = product.imageFiles.map(async (file, idx) => {
      if (!file) return imageUrls[idx] || '';
      const result = await uploadImageFile(file, 'product-images', newId);
      if (result.error || !result.publicUrl) {
        console.warn(`[upload] Image ${idx} upload notice:`, result.error);
        return imageUrls[idx] && !imageUrls[idx].startsWith('blob:') ? imageUrls[idx] : '';
      }
      return result.publicUrl;
    });
    imageUrls = (await Promise.all(uploadPromises)).filter(Boolean);
  }

  // Filter out any temporary browser blob: URLs so they never poison the database
  imageUrls = imageUrls.filter(url => url && !url.startsWith('blob:'));
  const primaryImage = imageUrls[0] || (product.image && !product.image.startsWith('blob:') ? product.image : '') || '/images/royal_blue_anarkali_1788292199640.jpg';

  const fullProduct: ProductItem = {
    id:             newId,
    name:           product.name,
    category:       product.category,
    price:          Number(product.price),
    originalPrice:  Number(product.originalPrice || product.price),
    purchasedPrice: product.purchasedPrice ? Number(product.purchasedPrice) : undefined,
    image:          primaryImage,
    images:         imageUrls,
    tag:            product.tag || 'New Arrival',
    description:    product.description || '',
    fabric:         product.fabric || 'Haute Couture Handloom',
    work:           product.work || 'Artisan Handcrafted',
    inStock:        product.inStock !== false,
    sizes:          product.sizes || [
      { size: 'S',   inStock: true },
      { size: 'M',   inStock: true },
      { size: 'L',   inStock: true },
      { size: 'XL',  inStock: true },
      { size: 'XXL', inStock: true },
    ]
  };

  // Save to local cache immediately (optimistic)
  const currentLocal = getLocalProducts();
  saveLocalProducts([fullProduct, ...currentLocal.filter(p => p.id !== newId)]);

  // ── Persist to Supabase ───────────────────────────────────────────────────
  let dbError: any = null;
  let savedLocallyOnly = false;

  if (isTableAvailable('products')) {
    try {
      const dbPayload = {
        id:              fullProduct.id,
        name:            fullProduct.name,
        category:        fullProduct.category,
        price:           fullProduct.price,
        original_price:  fullProduct.originalPrice,
        purchased_price: fullProduct.purchasedPrice ?? null,
        image:           fullProduct.image,
        images:          fullProduct.images,
        tag:             fullProduct.tag,
        description:     fullProduct.description,
        fabric:          fullProduct.fabric,
        work:            fullProduct.work,
        in_stock:        fullProduct.inStock,
        sizes:           fullProduct.sizes,
        created_at:      new Date().toISOString(),
      };
      const { error: dbErr } = await supabase.from('products').upsert(dbPayload);
      if (dbErr) {
        dbError = dbErr;
        savedLocallyOnly = true;
        if (isMissingTableError(dbErr)) markTableUnavailable('products');
        console.warn('[createProduct] Supabase notice:', dbErr.message);
      }
    } catch (err: any) {
      dbError = err;
      savedLocallyOnly = true;
      console.warn('[createProduct] Supabase notice:', err?.message);
    }
  } else {
    savedLocallyOnly = true;
    dbError = { message: "The 'products' table does not exist in Supabase yet." };
  }

  // Invalidate cache so storefront shows fresh data
  cachedProducts = null;
  return { success: !savedLocallyOnly, data: fullProduct, error: dbError, savedLocallyOnly };
}

export async function updateProduct(
  id: string,
  updates: Partial<ProductItem> & { imageFiles?: (File | null)[]; removedImageUrls?: string[] }
): Promise<{ success: boolean; data: ProductItem | null; error: any; savedLocallyOnly?: boolean }> {
  // ── Remove deleted images from storage ───────────────────────────────────
  if (updates.removedImageUrls && updates.removedImageUrls.length > 0) {
    for (const url of updates.removedImageUrls) {
      const path = extractStoragePath(url, 'product-images');
      if (path) await deleteImageFile('product-images', path);
    }
  }

  // ── Upload new files ──────────────────────────────────────────────────────
  if (updates.imageFiles && updates.imageFiles.some(Boolean)) {
    const existingUrls: string[] = Array.isArray(updates.images) ? updates.images : [];
    const uploadPromises = updates.imageFiles.map(async (file, idx) => {
      if (!file) return existingUrls[idx] || '';
      const result = await uploadImageFile(file, 'product-images', id);
      return result.error ? (existingUrls[idx] || '') : result.publicUrl;
    });
    const resolved = (await Promise.all(uploadPromises)).filter(Boolean);
    updates.images = resolved.filter(url => url && !url.startsWith('blob:'));
    updates.image = updates.images[0] || (updates.image && !updates.image.startsWith('blob:') ? updates.image : '');
  } else if (updates.images) {
    updates.images = updates.images.filter(url => url && !url.startsWith('blob:'));
    if (updates.image && updates.image.startsWith('blob:')) {
      updates.image = updates.images[0] || '';
    }
  }

  // ── Update local cache ────────────────────────────────────────────────────
  const currentLocal = getLocalProducts();
  const idx = currentLocal.findIndex(p => p.id === id);
  let updatedProduct: ProductItem;

  if (idx >= 0) {
    updatedProduct = { ...currentLocal[idx], ...updates };
    currentLocal[idx] = updatedProduct;
  } else {
    const base = PRODUCTS_CATALOG.find(p => p.id === id);
    updatedProduct = base ? { ...base, ...updates } as ProductItem : updates as ProductItem;
    currentLocal.unshift(updatedProduct);
  }
  saveLocalProducts(currentLocal);

  // ── Update in Supabase ────────────────────────────────────────────────────
  let dbError: any = null;
  let savedLocallyOnly = false;

  if (isTableAvailable('products')) {
    try {
      const dbPayload: Record<string, any> = {};
      if (updates.name          !== undefined) dbPayload.name            = updates.name;
      if (updates.category      !== undefined) dbPayload.category        = updates.category;
      if (updates.price         !== undefined) dbPayload.price           = updates.price;
      if (updates.originalPrice !== undefined) dbPayload.original_price  = updates.originalPrice;
      if (updates.purchasedPrice!== undefined) dbPayload.purchased_price = updates.purchasedPrice;
      if (updates.image         !== undefined) dbPayload.image           = updates.image;
      if (updates.images        !== undefined) dbPayload.images          = updates.images;
      if (updates.tag           !== undefined) dbPayload.tag             = updates.tag;
      if (updates.description   !== undefined) dbPayload.description     = updates.description;
      if (updates.fabric        !== undefined) dbPayload.fabric          = updates.fabric;
      if (updates.work          !== undefined) dbPayload.work            = updates.work;
      if (updates.inStock       !== undefined) dbPayload.in_stock        = updates.inStock;
      if (updates.sizes         !== undefined) dbPayload.sizes           = updates.sizes;

      const { error: dbErr } = await supabase.from('products').update(dbPayload).eq('id', id);
      if (dbErr) {
        dbError = dbErr;
        savedLocallyOnly = true;
        if (isMissingTableError(dbErr)) {
          markTableUnavailable('products');
        }
        console.warn('[updateProduct] Supabase notice:', dbErr.message);
      }
    } catch (err: any) {
      dbError = err;
      savedLocallyOnly = true;
      console.warn('[updateProduct] Supabase notice:', err?.message);
    }
  } else {
    savedLocallyOnly = true;
    dbError = { message: "The 'products' table does not exist in Supabase yet." };
  }

  // Invalidate cache so storefront shows fresh data
  cachedProducts = null;
  return { success: !savedLocallyOnly, data: updatedProduct, error: dbError, savedLocallyOnly };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error: any }> {
  // Remove from local cache
  const currentLocal = getLocalProducts();
  const product = currentLocal.find(p => p.id === id);
  saveLocalProducts(currentLocal.filter(p => p.id !== id));
  if (cachedProducts) cachedProducts = cachedProducts.filter(p => p.id !== id);

  // Delete associated images from storage
  if (product?.images && product.images.length > 0) {
    for (const url of product.images) {
      const path = extractStoragePath(url, 'product-images');
      if (path) await deleteImageFile('product-images', path);
    }
  }

  // Delete from Supabase
  if (isTableAvailable('products')) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('products');
      }
    } catch {
      // silent fallback
    }
  }

  // Invalidate cache
  cachedProducts = null;
  return { success: true, error: null };
}

export async function deleteAllProducts(): Promise<{ success: boolean; error: any }> {
  // Clear all image files from storage (best-effort)
  const current = getLocalProducts();
  for (const p of current) {
    if (p.images && p.images.length > 0) {
      for (const url of p.images) {
        const path = extractStoragePath(url, 'product-images');
        if (path) deleteImageFile('product-images', path).catch(() => {});
      }
    }
  }

  cachedProducts = [];
  saveLocalProducts([]);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(LS.PURGE_KEY, 'true');
    } catch { /* ignore */ }
  }

  if (isTableAvailable('products')) {
    try {
      const { error } = await supabase.from('products').delete().neq('id', '___none___');
      if (isMissingTableError(error)) {
        markTableUnavailable('products');
      }
    } catch {
      // silent fallback
    }
  }

  return { success: true, error: null };
}

export async function seedInitialCatalogToSupabase(): Promise<{ count: number; error: any }> {
  saveLocalProducts([...PRODUCTS_CATALOG]);
  cachedProducts = [...PRODUCTS_CATALOG];

  if (!isSupabaseConfigured) {
    return { count: PRODUCTS_CATALOG.length, error: null };
  }
  try {
    const formatted = PRODUCTS_CATALOG.map(p => ({
      id:             p.id,
      name:           p.name,
      category:       p.category,
      price:          p.price,
      original_price: p.originalPrice,
      image:          p.image,
      images:         p.images || [p.image],
      tag:            p.tag,
      description:    p.description,
      fabric:         p.fabric,
      work:           p.work,
      in_stock:       p.inStock,
      sizes:          p.sizes,
      created_at:     new Date().toISOString(),
    }));
    const { error: upsertErr } = await supabase.from('products').upsert(formatted, { onConflict: 'id' });
    if (upsertErr) {
      if (isMissingTableError(upsertErr)) {
        markTableUnavailable('products');
      }
    } else {
      resetSupabaseTableStatus('products');
    }
    return { count: formatted.length, error: null };
  } catch {
    return { count: PRODUCTS_CATALOG.length, error: null };
  }
}

export async function checkDatabaseConnection(): Promise<{
  isConfigured: boolean;
  tableExists: boolean;
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      tableExists: false,
      error: 'Supabase credentials are not configured in your .env file.',
    };
  }
  try {
    resetSupabaseTableStatus('products');
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      if (isMissingTableError(error)) {
        markTableUnavailable('products');
        return {
          isConfigured: true,
          tableExists: false,
          error: "Table 'public.products' does not exist in Supabase. Please run supabase/schema.sql in the Supabase SQL Editor.",
        };
      }
      return { isConfigured: true, tableExists: false, error: error.message };
    }
    resetSupabaseTableStatus('products');
    return { isConfigured: true, tableExists: true, error: null };
  } catch (err: any) {
    return {
      isConfigured: true,
      tableExists: false,
      error: err?.message || 'Failed to connect to Supabase database',
    };
  }
}

export async function syncLocalProductsToSupabase(): Promise<{
  success: boolean;
  syncedCount: number;
  error: string | null;
}> {
  const localProducts = getLocalProducts();
  if (!localProducts || localProducts.length === 0) {
    return { success: true, syncedCount: 0, error: 'No local products found to sync.' };
  }

  const check = await checkDatabaseConnection();
  if (!check.tableExists) {
    return {
      success: false,
      syncedCount: 0,
      error: check.error || "The 'products' table does not exist in Supabase yet.",
    };
  }

  try {
    const payloads = localProducts.map((p) => ({
      id:              p.id,
      name:            p.name,
      category:        p.category,
      price:           p.price,
      original_price:  p.originalPrice,
      purchased_price: p.purchasedPrice ?? null,
      image:           p.image,
      images:          p.images || [p.image],
      tag:             p.tag || 'New Arrival',
      description:     p.description || '',
      fabric:          p.fabric || '',
      work:            p.work || '',
      in_stock:        p.inStock !== false,
      sizes:           p.sizes || [],
      created_at:      new Date().toISOString(),
    }));

    const { error } = await supabase.from('products').upsert(payloads, { onConflict: 'id' });
    if (error) {
      return { success: false, syncedCount: 0, error: error.message };
    }

    cachedProducts = null;
    await _refreshProductsFromDb();

    return { success: true, syncedCount: payloads.length, error: null };
  } catch (err: any) {
    return { success: false, syncedCount: 0, error: err?.message || 'Sync failed.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ORDERS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_ORDERS = [
  {
    id: 'ord-101',
    order_number: 'ZY-884129',
    customer_name: 'Ananya Sharma',
    customer_email: 'ananya.sharma@example.com',
    customer_phone: '+91 98765 43210',
    shipping_address: { street: '42 Heritage Boulevard, Koregaon Park', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
    subtotal: 3999, shipping_fee: 0, total: 3999,
    payment_method: 'Prepaid (UPI / Card)', payment_status: 'paid', order_status: 'confirmed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    order_items: [{ product_name: 'ZAYMERA ROYAL SAPPHIRE TREE-MOTIF ANARKALI SUIT', size: 'XL', price: 3999, quantity: 1, product_image: '/images/royal_blue_anarkali_1788292199640.jpg' }]
  },
  {
    id: 'ord-102',
    order_number: 'ZY-992314',
    customer_name: 'Priyanka Kapoor',
    customer_email: 'priyanka.k@example.com',
    customer_phone: '+91 98112 34567',
    shipping_address: { street: '18 Gulmohar Avenue, Juhu', city: 'Mumbai', state: 'Maharashtra', postalCode: '400049', country: 'India' },
    subtotal: 1960, shipping_fee: 0, total: 1960,
    payment_method: 'COD', payment_status: 'pending', order_status: 'processing',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    order_items: [{ product_name: 'CASUAL WEAR IMPORTED FABRIC POLKA DOTS CO-ORD SET', size: 'XL', price: 980, quantity: 2, product_image: '/images/pink_polka_coord_1788314855326.jpg' }]
  }
];

export function getLocalOrders(): any[] {
  return lsGet<any[]>(LS.ORDERS, DEMO_ORDERS);
}

export function saveLocalOrders(orders: any[]) {
  cachedOrders = orders;
  lsSet(LS.ORDERS, orders);
}

export async function createOrder(order: OrderInput) {
  const newOrder = {
    id: 'ord-' + Date.now(),
    user_id: order.userId || null,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    shipping_address: order.shippingAddress,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total: order.total,
    payment_method: order.paymentMethod || 'COD',
    payment_status: 'pending',
    order_status: 'processing',
    created_at: new Date().toISOString(),
    order_items: order.cartItems.map(item => ({
      product_id:    item.product.id,
      product_name:  item.product.name,
      product_image: item.product.image,
      size:          item.size,
      price:         item.product.price,
      quantity:      item.quantity
    }))
  };

  const currentLocal = getLocalOrders();
  saveLocalOrders([newOrder, ...currentLocal]);

  if (!isSupabaseConfigured) {
    return { success: true, orderData: newOrder, isDemo: true };
  }

  try {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id:          order.userId || null,
        order_number:     order.orderNumber,
        customer_name:    order.customerName,
        customer_email:   order.customerEmail,
        customer_phone:   order.customerPhone,
        shipping_address: order.shippingAddress,
        subtotal:         order.subtotal,
        shipping_fee:     order.shippingFee,
        total:            order.total,
        payment_method:   order.paymentMethod || 'COD',
        payment_status:   'pending',
        order_status:     'processing'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const itemsToInsert = order.cartItems.map(item => ({
      order_id:      orderData.id,
      product_id:    item.product.id,
      product_name:  item.product.name,
      product_image: item.product.image,
      size:          item.size,
      price:         item.product.price,
      quantity:      item.quantity
    }));

    await supabase.from('order_items').insert(itemsToInsert);
    return { success: true, orderData, error: null };
  } catch (err: any) {
    return { success: true, orderData: newOrder, error: null };
  }
}

export async function fetchAdminOrders(): Promise<{ data: any[]; error: any }> {
  const localOrders = getLocalOrders();
  if (!cachedOrders || cachedOrders.length === 0) cachedOrders = localOrders;

  if (!isTableAvailable('orders')) return { data: cachedOrders, error: null };

  try {
    const result = await withTimeout(
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }) as any,
      1500,
      { data: null, error: 'timeout' }
    );

    if (result.error || result.data === null || result.data.length === 0) {
      if (isMissingTableError(result.error)) {
        markTableUnavailable('orders');
      }
      return { data: cachedOrders || localOrders, error: null };
    }

    const combined = [
      ...result.data,
      ...localOrders.filter(lo => !result.data.some((d: any) => d.order_number === lo.order_number))
    ];
    cachedOrders = combined;
    return { data: combined, error: null };
  } catch {
    return { data: cachedOrders || localOrders, error: null };
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error: any }> {
  const currentLocal = getLocalOrders();
  const updated = currentLocal.map(o =>
    o.id === orderId || o.order_number === orderId ? { ...o, order_status: status } : o
  );
  cachedOrders = updated;
  saveLocalOrders(updated);

  if (isTableAvailable('orders')) {
    try {
      const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
      if (isMissingTableError(error)) {
        markTableUnavailable('orders');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true, error: null };
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; error: any }> {
  // Update in-memory cache and localStorage
  const currentLocal = getLocalOrders();
  const updated = currentLocal.filter(o => o.id !== orderId && o.order_number !== orderId);
  cachedOrders = updated;
  saveLocalOrders(updated);

  // Remove from Supabase if table is available
  if (isTableAvailable('orders')) {
    try {
      // Find matching order id in case orderId was order_number
      const { data: matched } = await supabase
        .from('orders')
        .select('id')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);

      const targetIds = (matched && matched.length > 0) ? matched.map((m: any) => m.id) : [orderId];

      // Delete child items first to satisfy foreign key constraints
      await supabase.from('order_items').delete().in('order_id', targetIds);
      // Delete parent order
      const { error } = await supabase.from('orders').delete().in('id', targetIds);

      if (error && isMissingTableError(error)) {
        markTableUnavailable('orders');
      }
    } catch (err) {
      console.error('Failed to delete order from Supabase:', err);
    }
  }
  return { success: true, error: null };
}


export async function getOrderByNumber(orderNumber: string) {
  const localOrders = getLocalOrders();
  const found = localOrders.find(o => o.order_number.toLowerCase() === orderNumber.trim().toLowerCase());
  if (found) return found;
  if (!isTableAvailable('orders')) return null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber.trim())
      .single();
    if (error) {
      if (isMissingTableError(error)) {
        markTableUnavailable('orders');
      }
      return null;
    }
    return data;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INQUIRIES
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_INQUIRIES = [
  { id: 'inq-1', name: 'Ritu Varma', email: 'ritu.varma@gmail.com', phone: '+91 97654 32190', service_type: 'Bespoke Bridal Anarkali Sizing', message: 'I would like custom sleeve embroidery on the Royal Sapphire Anarkali for my sister\'s engagement reception in November.', status: 'new', created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 'inq-2', name: 'Meera Singhania', email: 'meera.s@outlook.com', phone: '+91 98200 11223', service_type: 'Custom Unstitched Handloom Dupatta', message: 'Can I order matching extra fabric for the Chanderi Silk Set with gold zari borders?', status: 'contacted', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
];

export function getLocalInquiries(): any[] {
  return lsGet<any[]>(LS.INQUIRIES, DEMO_INQUIRIES);
}

export function saveLocalInquiries(inquiries: any[]) {
  cachedInquiries = inquiries;
  lsSet(LS.INQUIRIES, inquiries);
}

export async function submitInquiry(inquiry: InquiryInput) {
  const newInquiry = {
    id: 'inq-' + Date.now(),
    name: inquiry.name, email: inquiry.email,
    phone: inquiry.phone || '',
    service_type: inquiry.serviceType || 'General Inquiry',
    message: inquiry.message,
    status: 'new',
    created_at: new Date().toISOString()
  };

  const currentLocal = getLocalInquiries();
  saveLocalInquiries([newInquiry, ...currentLocal]);

  if (!isTableAvailable('inquiries')) return { success: true, data: newInquiry, isDemo: true };

  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert({ name: inquiry.name, email: inquiry.email, phone: inquiry.phone || '', service_type: inquiry.serviceType || 'General Inquiry', message: inquiry.message })
      .select().single();
    if (error) {
      if (isMissingTableError(error)) {
        markTableUnavailable('inquiries');
      }
      return { success: true, data: newInquiry, error: null };
    }
    return { success: true, data };
  } catch {
    return { success: true, data: newInquiry, error: null };
  }
}

export async function fetchAdminInquiries(): Promise<{ data: any[]; error: any }> {
  const localInquiries = getLocalInquiries();
  if (!cachedInquiries || cachedInquiries.length === 0) cachedInquiries = localInquiries;
  if (!isTableAvailable('inquiries')) return { data: cachedInquiries, error: null };

  try {
    const result = await withTimeout(
      supabase.from('inquiries').select('*').order('created_at', { ascending: false }) as any,
      1500,
      { data: null, error: 'timeout' }
    );
    if (result.error || result.data === null || result.data.length === 0) {
      if (isMissingTableError(result.error)) {
        markTableUnavailable('inquiries');
      }
      return { data: cachedInquiries || localInquiries, error: null };
    }
    const combined = [
      ...result.data,
      ...localInquiries.filter(li => !result.data.some((d: any) => d.id === li.id))
    ];
    cachedInquiries = combined;
    return { data: combined, error: null };
  } catch {
    return { data: cachedInquiries || localInquiries, error: null };
  }
}

export async function updateInquiryStatus(inquiryId: string, status: string): Promise<{ success: boolean; error: any }> {
  const currentLocal = getLocalInquiries();
  const updated = currentLocal.map(i => i.id === inquiryId ? { ...i, status } : i);
  saveLocalInquiries(updated);

  if (isTableAvailable('inquiries')) {
    try {
      const { error } = await supabase.from('inquiries').update({ status }).eq('id', inquiryId);
      if (isMissingTableError(error)) {
        markTableUnavailable('inquiries');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: CategoryItem[] = [];

const MOCK_CATEGORY_IDS = new Set(['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6']);

function checkAndPurgeOldMockCategories() {
  if (typeof window === 'undefined') return;
  try {
    const purgeKey = 'zaymera_categories_purged_v2';
    if (!localStorage.getItem(purgeKey)) {
      const existing = lsGet<CategoryItem[]>(LS.CATEGORIES, []);
      const clean = existing.filter(c => !MOCK_CATEGORY_IDS.has(c.id));
      localStorage.setItem(LS.CATEGORIES, JSON.stringify(clean));
      localStorage.setItem(purgeKey, 'true');
      cachedCategories = clean;
    }
  } catch { /* ignore */ }
}

export function getLocalCategories(): CategoryItem[] {
  if (typeof window === 'undefined') return [];
  checkAndPurgeOldMockCategories();
  const cats = lsGet<CategoryItem[]>(LS.CATEGORIES, DEFAULT_CATEGORIES);
  return cats.filter(c => !MOCK_CATEGORY_IDS.has(c.id));
}

export function saveLocalCategories(cats: CategoryItem[]) {
  const clean = cats.filter(c => !MOCK_CATEGORY_IDS.has(c.id));
  cachedCategories = clean;
  lsSet(LS.CATEGORIES, clean);
}

export async function fetchCategories(): Promise<{ data: CategoryItem[]; error: any }> {
  checkAndPurgeOldMockCategories();
  if (cachedCategories !== null) {
    _refreshCategoriesFromDb().catch(() => {});
    return { data: cachedCategories, error: null };
  }
  return _refreshCategoriesFromDb();
}

async function _refreshCategoriesFromDb(): Promise<{ data: CategoryItem[]; error: any }> {
  const local = getLocalCategories();
  if (!isTableAvailable('categories')) {
    cachedCategories = local;
    return { data: local, error: null };
  }

  try {
    const result = await withTimeout(
      supabase.from('categories').select('*').order('sort_order', { ascending: true }) as any,
      4000,
      { data: null, error: 'timeout' }
    );
    if (result.error || result.data === null) {
      if (isMissingTableError(result.error)) {
        markTableUnavailable('categories');
      }
      cachedCategories = local;
      return { data: local, error: null };
    }

    const formatted: CategoryItem[] = result.data.map((c: any) => ({
      id: c.id, title: c.title, slug: c.slug, count: c.count,
      image: c.image, description: c.description, featured: c.featured
    }));

    // Single source of truth: DB-sourced + any local-only categories not yet in DB (excluding mocks)
    const merged = [
      ...formatted,
      ...local.filter(lc => !formatted.some(fc => fc.id === lc.id || fc.slug === lc.slug))
    ].filter(c => !MOCK_CATEGORY_IDS.has(c.id));

    cachedCategories = merged;
    saveLocalCategories(merged);
    return { data: merged, error: null };
  } catch {
    cachedCategories = local;
    return { data: local, error: null };
  }
}

export async function createCategory(
  cat: Omit<CategoryItem, 'id'> & { imageFile?: File | null }
): Promise<{ success: boolean; data: CategoryItem }> {
  let imageUrl = cat.image || '';

  // Upload image file if provided
  if (cat.imageFile) {
    const result = await uploadImageFile(cat.imageFile, 'category-images', 'categories');
    if (!result.error) imageUrl = result.publicUrl;
  }

  const newCat: CategoryItem = {
    id:          'cat-' + Date.now(),
    title:       cat.title,
    slug:        cat.slug || cat.title.toLowerCase().replace(/\s+/g, '-'),
    count:       cat.count || '0 Styles',
    image:       imageUrl,
    description: cat.description || '',
    featured:    cat.featured ?? false
  };

  const list = getLocalCategories();
  saveLocalCategories([...list, newCat]);

  if (isTableAvailable('categories')) {
    try {
      const { error } = await supabase.from('categories').upsert({
        id: newCat.id, title: newCat.title, slug: newCat.slug,
        count: newCat.count, image: newCat.image,
        description: newCat.description, featured: newCat.featured
      });
      if (isMissingTableError(error)) {
        markTableUnavailable('categories');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true, data: newCat };
}

export async function updateCategory(id: string, updates: Partial<CategoryItem> & { imageFile?: File | null }): Promise<{ success: boolean }> {
  // Upload image if a new file was provided
  if (updates.imageFile) {
    const result = await uploadImageFile(updates.imageFile, 'category-images', 'categories');
    if (!result.error) updates.image = result.publicUrl;
  }

  const list = getLocalCategories();
  const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
  saveLocalCategories(updated);

  if (isTableAvailable('categories')) {
    try {
      const dbPayload: Record<string, any> = {};
      if (updates.title       !== undefined) dbPayload.title       = updates.title;
      if (updates.slug        !== undefined) dbPayload.slug        = updates.slug;
      if (updates.count       !== undefined) dbPayload.count       = updates.count;
      if (updates.image       !== undefined) dbPayload.image       = updates.image;
      if (updates.description !== undefined) dbPayload.description = updates.description;
      if (updates.featured    !== undefined) dbPayload.featured    = updates.featured;
      const { error } = await supabase.from('categories').update(dbPayload).eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('categories');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  const list = getLocalCategories();
  saveLocalCategories(list.filter(c => c.id !== id));

  if (isTableAvailable('categories')) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('categories');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CUSTOMERS (read-only directory derived from orders)
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_CUSTOMERS: CustomerItem[] = [
  { id: 'cust-1', name: 'Ananya Sharma',  email: 'ananya.sharma@example.com', phone: '+91 98765 43210', city: 'Pune, Maharashtra',   totalSpent: 12499, ordersCount: 3, tier: 'VIP',     joinedDate: '2026-01-15' },
  { id: 'cust-2', name: 'Priyanka Kapoor', email: 'priyanka.k@example.com',   phone: '+91 98112 34567', city: 'Mumbai, Maharashtra',  totalSpent: 4940,  ordersCount: 2, tier: 'Regular', joinedDate: '2026-02-02' },
  { id: 'cust-3', name: 'Sunita Reddy',    email: 'sunita.reddy@gmail.com',   phone: '+91 94401 22334', city: 'Hyderabad, Telangana', totalSpent: 8999,  ordersCount: 2, tier: 'VIP',     joinedDate: '2026-02-18' },
  { id: 'cust-4', name: 'Kavita Chawla',   email: 'kavita.c@yahoo.com',       phone: '+91 98990 55667', city: 'New Delhi, Delhi',     totalSpent: 980,   ordersCount: 1, tier: 'New',     joinedDate: '2026-03-01' },
];

export function getLocalCustomers(): CustomerItem[] {
  return lsGet<CustomerItem[]>(LS.CUSTOMERS, DEMO_CUSTOMERS);
}

export function saveLocalCustomers(custs: CustomerItem[]) {
  cachedCustomers = custs;
  lsSet(LS.CUSTOMERS, custs);
}

export async function fetchCustomers(): Promise<{ data: CustomerItem[]; error: any }> {
  if (cachedCustomers && cachedCustomers.length > 0) return { data: cachedCustomers, error: null };
  const custs = getLocalCustomers();
  cachedCustomers = custs;
  return { data: custs, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. COUPONS
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_COUPONS: CouponItem[] = [
  { id: 'coup-1', code: 'ZAYMERA10',    discountType: 'percentage', value: 10,  minSpend: 1500, expiryDate: '2026-12-31', usageLimit: 500,  timesUsed: 142, active: true },
  { id: 'coup-2', code: 'ROYALFESTIVE', discountType: 'fixed',      value: 500, minSpend: 3500, expiryDate: '2026-11-30', usageLimit: 200,  timesUsed: 68,  active: true },
  { id: 'coup-3', code: 'FIRSTCOUTURE', discountType: 'percentage', value: 15,  minSpend: 980,  expiryDate: '2026-10-15', usageLimit: 1000, timesUsed: 310, active: true },
];

export function getLocalCoupons(): CouponItem[] {
  return lsGet<CouponItem[]>(LS.COUPONS, DEMO_COUPONS);
}

export function saveLocalCoupons(coupons: CouponItem[]) {
  cachedCoupons = coupons;
  lsSet(LS.COUPONS, coupons);
}

export async function fetchCoupons(): Promise<{ data: CouponItem[]; error: any }> {
  if (cachedCoupons && cachedCoupons.length > 0) {
    _refreshCouponsFromDb().catch(() => {});
    return { data: cachedCoupons, error: null };
  }
  return _refreshCouponsFromDb();
}

async function _refreshCouponsFromDb(): Promise<{ data: CouponItem[]; error: any }> {
  const local = getLocalCoupons();
  if (!isTableAvailable('coupons')) {
    cachedCoupons = local;
    return { data: local, error: null };
  }

  try {
    const result = await withTimeout(
      supabase.from('coupons').select('*').order('created_at', { ascending: false }) as any,
      1500,
      { data: null, error: 'timeout' }
    );

    if (result.error || result.data === null || result.data.length === 0) {
      if (isMissingTableError(result.error)) {
        markTableUnavailable('coupons');
      }
      cachedCoupons = local;
      return { data: local, error: null };
    }

    const formatted: CouponItem[] = result.data.map((c: any) => ({
      id:           c.id,
      code:         c.code,
      discountType: c.discount_type,
      value:        Number(c.value),
      minSpend:     Number(c.min_spend),
      expiryDate:   c.expiry_date,
      usageLimit:   c.usage_limit,
      timesUsed:    c.times_used,
      active:       c.active
    }));

    cachedCoupons = formatted;
    saveLocalCoupons(formatted);
    return { data: formatted, error: null };
  } catch {
    cachedCoupons = local;
    return { data: local, error: null };
  }
}

export async function createCoupon(coupon: Omit<CouponItem, 'id' | 'timesUsed'>): Promise<{ success: boolean; data: CouponItem }> {
  const newCoupon: CouponItem = {
    id:           'coup-' + Date.now(),
    code:         coupon.code.toUpperCase().trim(),
    discountType: coupon.discountType,
    value:        Number(coupon.value),
    minSpend:     Number(coupon.minSpend || 0),
    expiryDate:   coupon.expiryDate || '2026-12-31',
    usageLimit:   Number(coupon.usageLimit || 100),
    timesUsed:    0,
    active:       coupon.active ?? true
  };

  const list = getLocalCoupons();
  saveLocalCoupons([newCoupon, ...list]);

  if (isTableAvailable('coupons')) {
    try {
      const { error } = await supabase.from('coupons').upsert({
        id:            newCoupon.id,
        code:          newCoupon.code,
        discount_type: newCoupon.discountType,
        value:         newCoupon.value,
        min_spend:     newCoupon.minSpend,
        expiry_date:   newCoupon.expiryDate,
        usage_limit:   newCoupon.usageLimit,
        times_used:    0,
        active:        newCoupon.active
      });
      if (isMissingTableError(error)) {
        markTableUnavailable('coupons');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true, data: newCoupon };
}

export async function toggleCouponStatus(id: string): Promise<{ success: boolean }> {
  const list = getLocalCoupons();
  const updated = list.map(c => c.id === id ? { ...c, active: !c.active } : c);
  saveLocalCoupons(updated);
  const found = updated.find(c => c.id === id);

  if (isTableAvailable('coupons') && found) {
    try {
      const { error } = await supabase.from('coupons').update({ active: found.active }).eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('coupons');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}

export async function deleteCoupon(id: string): Promise<{ success: boolean }> {
  const list = getLocalCoupons();
  saveLocalCoupons(list.filter(c => c.id !== id));

  if (isTableAvailable('coupons')) {
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('coupons');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. STORE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: StoreSettingsItem = {
  announcementText:      'Complimentary Express Worldwide Delivery & Handloom Guarantee',
  conciergePhone:        '+91 73061 15950',
  supportEmail:          'atelier@zaymera.com',
  freeShippingThreshold: 0,
  storeTimings:          '10:00 AM – 9:00 PM IST',
  currencySymbol:        '₹',
  whatsappMessage:       'Hello Zaymera Boutique Team, I would like to inquire about couture items.'
};

export function getLocalStoreSettings(): StoreSettingsItem {
  return lsGet<StoreSettingsItem>(LS.STORE_SETTINGS, DEFAULT_SETTINGS);
}

export function saveLocalStoreSettings(settings: StoreSettingsItem) {
  cachedSettings = settings;
  lsSet(LS.STORE_SETTINGS, settings);
}

export async function fetchStoreSettings(): Promise<{ data: StoreSettingsItem; error: any }> {
  if (cachedSettings) return { data: cachedSettings, error: null };
  const local = getLocalStoreSettings();

  if (!isTableAvailable('store_settings')) {
    cachedSettings = local;
    return { data: local, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error || !data) {
      if (isMissingTableError(error)) {
        markTableUnavailable('store_settings');
      }
      cachedSettings = local;
      return { data: local, error: null };
    }

    const settings: StoreSettingsItem = {
      announcementText:      data.announcement_text,
      conciergePhone:        data.concierge_phone,
      supportEmail:          data.support_email,
      freeShippingThreshold: Number(data.free_shipping_threshold),
      storeTimings:          data.store_timings,
      currencySymbol:        data.currency_symbol,
      whatsappMessage:       data.whatsapp_message
    };
    cachedSettings = settings;
    saveLocalStoreSettings(settings);
    return { data: settings, error: null };
  } catch {
    cachedSettings = local;
    return { data: local, error: null };
  }
}

export async function updateStoreSettings(settings: StoreSettingsItem): Promise<{ success: boolean; error: any }> {
  saveLocalStoreSettings(settings);

  if (isTableAvailable('store_settings')) {
    try {
      const { error } = await supabase.from('store_settings').upsert({
        id:                      'global',
        announcement_text:       settings.announcementText,
        concierge_phone:         settings.conciergePhone,
        support_email:           settings.supportEmail,
        free_shipping_threshold: settings.freeShippingThreshold,
        store_timings:           settings.storeTimings,
        currency_symbol:         settings.currencySymbol,
        whatsapp_message:        settings.whatsappMessage,
        updated_at:              new Date().toISOString()
      });
      if (isMissingTableError(error)) {
        markTableUnavailable('store_settings');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. BANNERS
// ─────────────────────────────────────────────────────────────────────────────

export function getLocalBanners(): BannerItem[] {
  return lsGet<BannerItem[]>(LS.BANNERS, []);
}

export function saveLocalBanners(banners: BannerItem[]) {
  cachedBanners = banners;
  lsSet(LS.BANNERS, banners);
}

export async function fetchBanners(): Promise<{ data: BannerItem[]; error: any }> {
  if (cachedBanners && cachedBanners.length > 0) return { data: cachedBanners, error: null };
  const local = getLocalBanners();
  if (!isTableAvailable('banners')) {
    cachedBanners = local;
    return { data: local, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (isMissingTableError(error)) {
        markTableUnavailable('banners');
      }
      cachedBanners = local;
      return { data: local, error: null };
    }

    const formatted: BannerItem[] = data.map((b: any) => ({
      id: b.id, title: b.title, subtitle: b.subtitle,
      image: b.image, link: b.link, sortOrder: b.sort_order, active: b.active
    }));
    cachedBanners = formatted;
    saveLocalBanners(formatted);
    return { data: formatted, error: null };
  } catch {
    return { data: local, error: null };
  }
}

export async function createBanner(
  banner: Omit<BannerItem, 'id'> & { imageFile?: File | null }
): Promise<{ success: boolean; data: BannerItem }> {
  let imageUrl = banner.image || '';

  if (banner.imageFile) {
    const result = await uploadImageFile(banner.imageFile, 'banner-images', 'banners');
    if (!result.error) imageUrl = result.publicUrl;
  }

  const newBanner: BannerItem = {
    id:        'ban-' + Date.now(),
    title:     banner.title,
    subtitle:  banner.subtitle || '',
    image:     imageUrl,
    link:      banner.link || '',
    sortOrder: banner.sortOrder || 0,
    active:    banner.active ?? true
  };

  const list = getLocalBanners();
  saveLocalBanners([...list, newBanner]);

  if (isTableAvailable('banners')) {
    try {
      const { error } = await supabase.from('banners').upsert({
        id: newBanner.id, title: newBanner.title, subtitle: newBanner.subtitle,
        image: newBanner.image, link: newBanner.link,
        sort_order: newBanner.sortOrder, active: newBanner.active
      });
      if (isMissingTableError(error)) {
        markTableUnavailable('banners');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true, data: newBanner };
}

export async function updateBanner(id: string, updates: Partial<BannerItem> & { imageFile?: File | null }): Promise<{ success: boolean }> {
  if (updates.imageFile) {
    const result = await uploadImageFile(updates.imageFile, 'banner-images', 'banners');
    if (!result.error) updates.image = result.publicUrl;
  }

  const list = getLocalBanners();
  saveLocalBanners(list.map(b => b.id === id ? { ...b, ...updates } : b));

  if (isTableAvailable('banners')) {
    try {
      const dbPayload: Record<string, any> = {};
      if (updates.title     !== undefined) dbPayload.title      = updates.title;
      if (updates.subtitle  !== undefined) dbPayload.subtitle   = updates.subtitle;
      if (updates.image     !== undefined) dbPayload.image      = updates.image;
      if (updates.link      !== undefined) dbPayload.link       = updates.link;
      if (updates.sortOrder !== undefined) dbPayload.sort_order = updates.sortOrder;
      if (updates.active    !== undefined) dbPayload.active     = updates.active;
      const { error } = await supabase.from('banners').update(dbPayload).eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('banners');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}

export async function deleteBanner(id: string): Promise<{ success: boolean }> {
  const list = getLocalBanners();
  const found = list.find(b => b.id === id);
  saveLocalBanners(list.filter(b => b.id !== id));

  // Delete image from storage
  if (found?.image) {
    const path = extractStoragePath(found.image, 'banner-images');
    if (path) deleteImageFile('banner-images', path).catch(() => {});
  }

  if (isTableAvailable('banners')) {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('banners');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}
