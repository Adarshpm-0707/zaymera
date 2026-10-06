import { supabase, isSupabaseConfigured, supabaseAdmin } from './client';
import { ProductItem, CartItem } from '@/types';
import { PRODUCTS_CATALOG } from '@/constants/catalog';
import { sendOrderPlacedEmails, sendOrderCancelledEmails, STORE_ADMIN_EMAIL } from '@/lib/email/orderEmailService';

export { sendOrderPlacedEmails, sendOrderCancelledEmails, STORE_ADMIN_EMAIL };

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
  paymentStatus?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
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

export const dbClient = () => supabaseAdmin || supabase;
export const CLOUD_SYNC_BUCKET = 'category-images';

/**
 * Persists any JSON data structure to Supabase Cloud Storage.
 * Acts as an infallible cross-origin, cross-device sync layer
 * (accessible identically from localhost and zaymera.in).
 */
export async function syncEntityToCloud(filename: string, data: any): Promise<boolean> {
  const client = dbClient();
  if (!client) return false;
  try {
    const payload = JSON.stringify(data, null, 2);
    const body = typeof Buffer !== 'undefined'
      ? Buffer.from(payload)
      : new Blob([payload], { type: 'application/json' });
    const { error } = await client.storage
      .from(CLOUD_SYNC_BUCKET)
      .upload(`cloud_data/${filename}`, body, {
        contentType: 'application/json',
        upsert: true
      });
    if (error) {
      console.warn(`[cloud-sync] Upload warning for ${filename}:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`[cloud-sync] Failed to sync ${filename}:`, err?.message);
    return false;
  }
}

/**
 * Downloads JSON data from Supabase Cloud Storage.
 * Ensures consistent shared data across localhost and production.
 */
export async function fetchEntityFromCloud<T>(filename: string): Promise<T | null> {
  const client = dbClient();
  if (!client) return null;
  try {
    const { data, error } = await client.storage
      .from(CLOUD_SYNC_BUCKET)
      .download(`cloud_data/${filename}`);
    if (!error && data) {
      const text = await data.text();
      return JSON.parse(text) as T;
    }
  } catch {
    // non-blocking fallback
  }
  return null;
}

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
    const client = dbClient();

    if (isSupabaseConfigured && client) {
      const { data, error } = await client.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
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
    const client = dbClient();
    if (isSupabaseConfigured && path && client) {
      await client.storage.from(bucket).remove([path]);
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
  return DEFAULT_CATEGORIES;
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

function formatProductFromDb(item: any, existingLocalList?: ProductItem[]): ProductItem {
  let stockVal: number | undefined = undefined;

  // 1. Direct column 'stock' if it exists in Supabase
  if (item.stock !== undefined && item.stock !== null && !isNaN(Number(item.stock))) {
    stockVal = Number(item.stock);
  } else if (Array.isArray(item.sizes)) {
    // 2. Check if embedded in sizes JSON array in Supabase
    const sizeWithStock = item.sizes.find((s: any) => s && s.stock !== undefined && s.stock !== null && !isNaN(Number(s.stock)));
    if (sizeWithStock) {
      stockVal = Number(sizeWithStock.stock);
    }
  }

  // 3. Fallback to existing local products cache so user-edited stock is never lost
  if (stockVal === undefined) {
    const list = existingLocalList || getLocalProducts();
    const localMatch = list.find((p: any) => p && p.id === item.id);
    if (localMatch && localMatch.stock !== undefined && localMatch.stock !== null && !isNaN(Number(localMatch.stock))) {
      stockVal = Number(localMatch.stock);
    }
  }

  // 4. Default fallback based on in_stock
  if (stockVal === undefined) {
    stockVal = item.in_stock === false ? 0 : 10;
  }

  const isAvailable = item.in_stock !== false && stockVal > 0;

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
    inStock:        isAvailable,
    stock:          stockVal,
    sizes:          Array.isArray(item.sizes) ? item.sizes.map((s: any) => ({ ...s, stock: stockVal, inStock: isAvailable })) : [
      { size: 'S',   inStock: isAvailable, stock: stockVal },
      { size: 'M',   inStock: isAvailable, stock: stockVal },
      { size: 'L',   inStock: isAvailable, stock: stockVal },
      { size: 'XL',  inStock: isAvailable, stock: stockVal },
      { size: 'XXL', inStock: isAvailable, stock: stockVal },
    ]
  };
}

export async function fetchProducts(forceRefresh: boolean = false): Promise<{ data: ProductItem[]; error: any }> {
  checkAndPurgeOldMockProducts();

  // If forceRefresh is false and cache is populated, return immediately and revalidate in background
  if (!forceRefresh && cachedProducts && cachedProducts.length > 0) {
    _refreshProductsFromDb().then(fresh => {
      if (fresh.data && fresh.data.length > 0) {
        cachedProducts = fresh.data;
      }
    }).catch(() => {});
    return { data: cachedProducts, error: null };
  }

  return _refreshProductsFromDb();
}

async function _refreshProductsFromDb(): Promise<{ data: ProductItem[]; error: any }> {
  const localProducts = getLocalProducts();
  const client = dbClient();

  if (!isTableAvailable('products')) {
    // Attempt to read from cloud storage backup so localhost and production remain in sync
    const cloudBackup = await fetchEntityFromCloud<ProductItem[]>('products_backup.json');
    const fallback = (cloudBackup && cloudBackup.length > 0)
      ? cloudBackup
      : (localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG);
    cachedProducts = fallback;
    return { data: fallback, error: null };
  }

  try {
    const result = await withTimeout(
      client.from('products').select('*').order('created_at', { ascending: false }) as any,
      8000,
      { data: null, error: 'timeout' }
    );

    if (result.error || result.data === null) {
      if (isMissingTableError(result.error)) {
        markTableUnavailable('products');
      }
      const cloudBackup = await fetchEntityFromCloud<ProductItem[]>('products_backup.json');
      const fallback = (cloudBackup && cloudBackup.length > 0)
        ? cloudBackup
        : (localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG);
      cachedProducts = fallback;
      return { data: fallback, error: null };
    }

    if (result.data.length === 0) {
      const fallback = localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG;
      cachedProducts = fallback;
      return { data: fallback, error: null };
    }

    const formatted = result.data.map((item: any) => formatProductFromDb(item, localProducts));
    // Remote database is the primary source of truth across all devices.
    // Preserve local drafts that start with 'draft-' and have not yet been synced
    const localDrafts = localProducts.filter(lp => lp.id.startsWith('draft-') && !formatted.some(f => f.id === lp.id));
    const merged = [...formatted, ...localDrafts];
    cachedProducts = merged;
    saveLocalProducts(merged); // keep local cache in sync with remote
    syncEntityToCloud('products_backup.json', merged).catch(() => {});
    return { data: merged, error: null };
  } catch (err) {
    const fallback = localProducts.length > 0 ? localProducts : PRODUCTS_CATALOG;
    cachedProducts = fallback;
    return { data: fallback, error: null };
  }
}

export async function fetchAllProductsAdmin(forceRefresh: boolean = false): Promise<{ data: ProductItem[]; error: any }> {
  return fetchProducts(forceRefresh);
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

  const client = dbClient();
  if (isTableAvailable('products') && client) {
    try {
      const { data, error } = await client.from('products').select('*').eq('id', id).single();
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

  const stockVal = product.stock !== undefined ? Number(product.stock) : 10;
  const isAvailable = (stockVal > 0) && (product.inStock !== false);

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
    inStock:        isAvailable,
    stock:          stockVal,
    sizes:          product.sizes || [
      { size: 'S',   inStock: isAvailable },
      { size: 'M',   inStock: isAvailable },
      { size: 'L',   inStock: isAvailable },
      { size: 'XL',  inStock: isAvailable },
      { size: 'XXL', inStock: isAvailable },
    ]
  };

  // Save to local cache immediately (optimistic)
  const currentLocal = getLocalProducts();
  const updatedProducts = [fullProduct, ...currentLocal.filter(p => p.id !== newId)];
  saveLocalProducts(updatedProducts);
  cachedProducts = null;

  // ── Persist to Supabase ───────────────────────────────────────────────────
  let dbError: any = null;
  let savedLocallyOnly = false;
  const client = dbClient();

  if (isTableAvailable('products') && client) {
    try {
      const dbPayload: any = {
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
        stock:           fullProduct.stock,
        sizes:           fullProduct.sizes,
        created_at:      new Date().toISOString(),
      };
      let { error: dbErr } = await client.from('products').upsert(dbPayload, { onConflict: 'id' });
      if (dbErr && dbErr.message && dbErr.message.includes('stock')) {
        delete dbPayload.stock;
        const retry = await client.from('products').upsert(dbPayload, { onConflict: 'id' });
        dbErr = retry.error;
      }
      if (dbErr) {
        dbError = dbErr;
        savedLocallyOnly = true;
        if (isMissingTableError(dbErr)) markTableUnavailable('products');
        console.warn('[createProduct] Supabase notice:', dbErr.message);
      } else {
        resetSupabaseTableStatus('products');
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

  // Multi-tier backup to cloud storage so all origins stay in sync
  syncEntityToCloud('products_backup.json', updatedProducts).catch(() => {});

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

  // Auto-sync inStock with stock if stock is provided
  if (updates.stock !== undefined) {
    const clampedStock = Math.max(0, Math.floor(Number(updates.stock) || 0));
    updates.stock = clampedStock;
    if (updates.inStock === undefined) {
      updates.inStock = clampedStock > 0;
    }
    // Also sync into sizes array so it is preserved in Supabase JSONB column even if stock column doesn't exist yet
    const currentSizes = updates.sizes || (idx >= 0 ? currentLocal[idx].sizes : undefined) || [
      { size: 'S', inStock: updates.inStock },
      { size: 'M', inStock: updates.inStock },
      { size: 'L', inStock: updates.inStock },
      { size: 'XL', inStock: updates.inStock },
      { size: 'XXL', inStock: updates.inStock },
    ];
    updates.sizes = currentSizes.map((s: any) => ({
      ...s,
      stock: clampedStock,
      inStock: updates.inStock
    }));
  }

  if (idx >= 0) {
    updatedProduct = { ...currentLocal[idx], ...updates };
    currentLocal[idx] = updatedProduct;
  } else {
    const base = PRODUCTS_CATALOG.find(p => p.id === id);
    updatedProduct = base ? { ...base, ...updates } as ProductItem : updates as ProductItem;
    currentLocal.unshift(updatedProduct);
  }
  saveLocalProducts(currentLocal);
  cachedProducts = currentLocal;

  // ── Update in Supabase ────────────────────────────────────────────────────
  let dbError: any = null;
  let savedLocallyOnly = false;
  const client = dbClient();

  if (isTableAvailable('products') && client) {
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
      if (updates.stock         !== undefined) dbPayload.stock           = updates.stock;
      if (updates.sizes         !== undefined) dbPayload.sizes           = updates.sizes;

      let { error: dbErr } = await client.from('products').update(dbPayload).eq('id', id);
      if (dbErr && dbErr.message && dbErr.message.includes('stock')) {
        delete dbPayload.stock;
        const retry = await client.from('products').update(dbPayload).eq('id', id);
        dbErr = retry.error;
      }
      if (dbErr) {
        dbError = dbErr;
        savedLocallyOnly = true;
        if (isMissingTableError(dbErr)) {
          markTableUnavailable('products');
        }
        console.warn('[updateProduct] Supabase notice:', dbErr.message);
      } else {
        resetSupabaseTableStatus('products');
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

  syncEntityToCloud('products_backup.json', currentLocal).catch(() => {});
  cachedProducts = currentLocal;
  return { success: !savedLocallyOnly, data: updatedProduct, error: dbError, savedLocallyOnly };
}

export async function updateProductStock(
  id: string,
  newStock: number
): Promise<{ success: boolean; data: ProductItem | null; error: any }> {
  const clamped = Math.max(0, Math.floor(Number(newStock) || 0));
  return updateProduct(id, {
    stock: clamped,
    inStock: clamped > 0
  });
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error: any }> {
  // Remove from local cache
  const currentLocal = getLocalProducts();
  const product = currentLocal.find(p => p.id === id);
  const remaining = currentLocal.filter(p => p.id !== id);
  saveLocalProducts(remaining);
  cachedProducts = null;

  // Delete associated images from storage
  if (product?.images && product.images.length > 0) {
    for (const url of product.images) {
      const path = extractStoragePath(url, 'product-images');
      if (path) await deleteImageFile('product-images', path);
    }
  }

  // Delete from Supabase
  const client = dbClient();
  if (isTableAvailable('products') && client) {
    try {
      const { error } = await client.from('products').delete().eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('products');
      }
    } catch {
      // silent fallback
    }
  }

  syncEntityToCloud('products_backup.json', remaining).catch(() => {});
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

  const client = dbClient();
  if (isTableAvailable('products') && client) {
    try {
      const { error } = await client.from('products').delete().neq('id', '___none___');
      if (isMissingTableError(error)) {
        markTableUnavailable('products');
      }
    } catch {
      // silent fallback
    }
  }

  syncEntityToCloud('products_backup.json', []).catch(() => {});
  return { success: true, error: null };
}

export async function seedInitialCatalogToSupabase(): Promise<{ count: number; error: any }> {
  saveLocalProducts([...PRODUCTS_CATALOG]);
  cachedProducts = [...PRODUCTS_CATALOG];

  if (!isSupabaseConfigured) {
    return { count: PRODUCTS_CATALOG.length, error: null };
  }
  const client = dbClient();
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
    const { error: upsertErr } = await client.from('products').upsert(formatted, { onConflict: 'id' });
    if (upsertErr) {
      if (isMissingTableError(upsertErr)) {
        markTableUnavailable('products');
      }
    } else {
      resetSupabaseTableStatus('products');
    }
    syncEntityToCloud('products_backup.json', PRODUCTS_CATALOG).catch(() => {});
    return { count: formatted.length, error: null };
  } catch {
    return { count: PRODUCTS_CATALOG.length, error: null };
  }
}

export async function checkDatabaseConnection(): Promise<{
  isConfigured: boolean;
  tableExists: boolean;
  ordersTableExists: boolean;
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      tableExists: false,
      ordersTableExists: false,
      error: 'Supabase credentials are not configured in your .env file.',
    };
  }
  const client = dbClient();
  let productsOk = false;
  let ordersOk = false;
  let errMsg: string | null = null;

  try {
    resetSupabaseTableStatus('products');
    const { error: pErr } = await client.from('products').select('id').limit(1);
    if (!pErr) {
      productsOk = true;
    } else {
      errMsg = pErr.message;
      if (isMissingTableError(pErr)) markTableUnavailable('products');
    }

    resetSupabaseTableStatus('orders');
    const { error: oErr } = await client.from('orders').select('id').limit(1);
    if (!oErr) {
      ordersOk = true;
    } else {
      if (isMissingTableError(oErr)) markTableUnavailable('orders');
    }

    return {
      isConfigured: true,
      tableExists: productsOk,
      ordersTableExists: ordersOk,
      error: (!productsOk || !ordersOk)
        ? (!ordersOk && productsOk)
          ? "The 'products' table is active, but 'orders' table is not yet created in Supabase SQL editor. Orders are currently synchronizing live via Cloud Storage fallback!"
          : errMsg
        : null
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      tableExists: productsOk,
      ordersTableExists: ordersOk,
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

  const client = dbClient();
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

    const { error } = await client.from('products').upsert(payloads, { onConflict: 'id' });
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

export const ORDER_CANCELLATION_WINDOW_MINUTES = 15;

const LS_CUSTOMER_ORDERS = 'zaymera_customer_recent_orders';

export function saveCustomerRecentOrder(orderNumber: string) {
  if (typeof window === 'undefined' || !orderNumber) return;
  try {
    const existing = getCustomerRecentOrders();
    const clean = orderNumber.trim();
    const updated = [clean, ...existing.filter(o => o.toLowerCase() !== clean.toLowerCase())].slice(0, 30);
    localStorage.setItem(LS_CUSTOMER_ORDERS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[saveCustomerRecentOrder] error:', err);
  }
}

export function getCustomerRecentOrders(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_CUSTOMER_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
    payment_status: order.paymentStatus || 'pending',
    order_status: order.paymentStatus === 'paid' ? 'confirmed' : 'processing',
    razorpay_payment_id: order.razorpayPaymentId || null,
    razorpay_order_id: order.razorpayOrderId || null,
    stock_restored: false,
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

  // 1. Update local cache immediately
  const currentLocal = getLocalOrders().filter(o => o.id !== 'ord-101' && o.id !== 'ord-102');
  const updatedOrders = [newOrder, ...currentLocal.filter(o => o.id !== newOrder.id && o.order_number !== newOrder.order_number)];
  saveLocalOrders(updatedOrders);
  cachedOrders = updatedOrders;

  // 2. Persist to customer's browser recent orders
  saveCustomerRecentOrder(order.orderNumber);

  // 3. Persist to Cloud Storage so localhost and live (zaymera.in) share this order immediately
  syncEntityToCloud('orders.json', updatedOrders).catch(() => {});

  // 4. ── AUTOMATICALLY DECREMENT STOCK IN INVENTORY ──
  try {
    const qtyByProduct = new Map<string, number>();
    for (const item of order.cartItems) {
      const pid = item.product?.id;
      if (pid) {
        qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + (item.quantity || 1));
      }
    }

    for (const [productId, qtyToDeduct] of qtyByProduct.entries()) {
      const { data: prod } = await fetchProductById(productId);
      if (prod) {
        const curStock = prod.stock !== undefined ? prod.stock : (prod.inStock ? 10 : 0);
        const nextStock = Math.max(0, curStock - qtyToDeduct);
        await updateProductStock(productId, nextStock);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zaymera-stock-updated', {
        detail: { orderNumber: order.orderNumber, action: 'order_created' }
      }));
    }
  } catch (stockErr) {
    console.warn('[createOrder] Auto-decrement stock notice:', stockErr);
  }

  if (!isSupabaseConfigured) {
    return { success: true, orderData: newOrder, isDemo: true };
  }

  // 5. Attempt insertion into PostgreSQL tables if available
  const client = dbClient();
  if (isTableAvailable('orders') && client) {
    try {
      const { data: orderData, error: orderError } = await client
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
          payment_status:   order.paymentStatus || 'pending',
          order_status:     order.paymentStatus === 'paid' ? 'confirmed' : 'processing'
        })
        .select()
        .single();

      if (!orderError && orderData) {
        const itemsToInsert = order.cartItems.map(item => ({
          order_id:      orderData.id,
          product_id:    item.product.id,
          product_name:  item.product.name,
          product_image: item.product.image,
          size:          item.size,
          price:         item.product.price,
          quantity:      item.quantity
        }));
        // ── AUTOMATED TRANSACTIONAL EMAIL NOTIFICATION ──
        sendOrderPlacedEmails(orderData).catch(mailErr => {
          console.warn('[createOrder] Automated email notification notice:', mailErr);
        });
        return { success: true, orderData, error: null };
      }

      if (orderError && isMissingTableError(orderError)) {
        markTableUnavailable('orders');
      }
    } catch (err: any) {
      if (isMissingTableError(err)) {
        markTableUnavailable('orders');
      }
    }
  }

  // ── AUTOMATED TRANSACTIONAL EMAIL NOTIFICATION (Fallback/Local/Demo) ──
  sendOrderPlacedEmails(newOrder).catch(mailErr => {
    console.warn('[createOrder] Automated email notification notice:', mailErr);
  });

  return { success: true, orderData: newOrder, error: null };
}

/**
 * Cancels a customer order if within the allowable cancellation window (e.g. 15 minutes)
 * and automatically restores inventory quantities back to the stock ledger.
 */
export async function cancelCustomerOrder(
  orderNumberOrId: string,
  reason: string = 'Order cancelled by customer'
): Promise<{ success: boolean; message: string; order?: any; error?: any }> {
  const cleanId = (orderNumberOrId || '').trim();
  if (!cleanId) {
    return { success: false, message: 'Invalid order reference.' };
  }

  // 1. Locate order
  const order = await getOrderByNumber(cleanId);
  if (!order) {
    return { success: false, message: `Order "${cleanId}" was not found.` };
  }

  // 2. Validate current status
  if (order.order_status === 'cancelled') {
    return { success: false, message: 'This order has already been cancelled.' };
  }

  if (order.order_status === 'shipped' || order.order_status === 'delivered') {
    return {
      success: false,
      message: 'This order has already been dispatched with luxury courier and can no longer be cancelled.'
    };
  }

  // 3. Validate cancellation window (15 minutes from creation)
  const createdAtMs = new Date(order.created_at || order.createdAt || Date.now()).getTime();
  const elapsedMinutes = (Date.now() - createdAtMs) / (1000 * 60);

  if (elapsedMinutes > ORDER_CANCELLATION_WINDOW_MINUTES) {
    return {
      success: false,
      message: `The ${ORDER_CANCELLATION_WINDOW_MINUTES}-minute cancellation window has elapsed. Artisan crafting and dispatch preparation are underway.`
    };
  }

  // 4. AUTOMATICALLY RESTORE INVENTORY STOCK
  if (!order.stock_restored) {
    try {
      const items = order.order_items || order.cartItems || [];
      const qtyByProduct = new Map<string, number>();

      for (const it of items) {
        const pid = it.product_id || it.product?.id || it.id;
        const q = Number(it.quantity) || 1;
        if (pid) {
          qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + q);
        }
      }

      for (const [productId, qtyToAdd] of qtyByProduct.entries()) {
        const { data: prod } = await fetchProductById(productId);
        if (prod) {
          const curStock = prod.stock !== undefined ? prod.stock : (prod.inStock ? 10 : 0);
          const restoredStock = curStock + qtyToAdd;
          await updateProductStock(productId, restoredStock);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zaymera-stock-updated', {
          detail: { orderNumber: order.order_number, action: 'order_cancelled', restored: true }
        }));
      }
    } catch (stockErr) {
      console.warn('[cancelCustomerOrder] Inventory restoration notice:', stockErr);
    }
  }

  // 5. Update order state in cache, cloud sync, and Supabase
  const nowIso = new Date().toISOString();
  const updatedFields = {
    order_status: 'cancelled',
    stock_restored: true,
    cancelled_at: nowIso,
    cancel_reason: reason
  };

  const currentLocal = getLocalOrders();
  const updatedList = currentLocal.map(o =>
    (o.id === order.id || o.order_number === order.order_number || o.order_number === cleanId)
      ? { ...o, ...updatedFields }
      : o
  );
  cachedOrders = updatedList;
  saveLocalOrders(updatedList);
  syncEntityToCloud('orders.json', updatedList).catch(() => {});

  const client = dbClient();
  if (isTableAvailable('orders') && client) {
    try {
      await client
        .from('orders')
        .update({
          order_status: 'cancelled',
          updated_at: nowIso
        })
        .or(`id.eq.${order.id},order_number.eq.${order.order_number}`);
    } catch (dbErr) {
      console.warn('[cancelCustomerOrder] Supabase update notice:', dbErr);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaymera-orders-updated', {
      detail: { orderNumber: order.order_number, status: 'cancelled' }
    }));
  }

  const finalOrder = { ...order, ...updatedFields };

  // ── AUTOMATED CANCELLATION EMAIL DISPATCH ──
  // Dispatches cancellation details to both customer email and zaymerawardrobe@gmail.com
  sendOrderCancelledEmails(finalOrder, reason).catch(cancelMailErr => {
    console.warn('[cancelCustomerOrder] Email cancellation notice:', cancelMailErr);
  });

  return {
    success: true,
    message: `Order ${order.order_number} has been cancelled successfully. Ordered items have been returned to stock.`,
    order: finalOrder
  };
}

export async function fetchAdminOrders(): Promise<{ data: any[]; error: any }> {
  const client = dbClient();

  // 1. Try SQL database first
  if (isTableAvailable('orders') && client) {
    try {
      const result = await withTimeout(
        client.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }) as any,
        6000,
        { data: null, error: 'timeout' }
      );

      if (!result.error && Array.isArray(result.data) && result.data.length > 0) {
        cachedOrders = result.data;
        saveLocalOrders(result.data);
        syncEntityToCloud('orders.json', result.data).catch(() => {});
        return { data: result.data, error: null };
      }

      if (isMissingTableError(result.error)) {
        markTableUnavailable('orders');
      }
    } catch {
      // non-blocking fallback
    }
  }

  // 2. Fetch from Cloud Storage (infallible cross-device sync)
  try {
    const cloudOrders = await fetchEntityFromCloud<any[]>('orders.json');
    if (cloudOrders && Array.isArray(cloudOrders) && cloudOrders.length > 0) {
      cachedOrders = cloudOrders;
      saveLocalOrders(cloudOrders);
      return { data: cloudOrders, error: null };
    }
  } catch {}

  // 3. Fallback to local cache
  const localOrders = getLocalOrders();
  cachedOrders = localOrders;
  return { data: localOrders, error: null };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error: any }> {
  const currentLocal = getLocalOrders();
  const targetOrder = currentLocal.find(o => o.id === orderId || o.order_number === orderId);

  // If status changed to cancelled and stock has not been restored, restore it
  if (status === 'cancelled' && targetOrder && !targetOrder.stock_restored) {
    try {
      const items = targetOrder.order_items || targetOrder.cartItems || [];
      for (const it of items) {
        const pid = it.product_id || it.product?.id || it.id;
        const q = Number(it.quantity) || 1;
        if (pid) {
          const { data: prod } = await fetchProductById(pid);
          if (prod) {
            const cur = prod.stock !== undefined ? prod.stock : (prod.inStock ? 10 : 0);
            await updateProductStock(pid, cur + q);
          }
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zaymera-stock-updated', {
          detail: { orderId, action: 'order_cancelled', restored: true }
        }));
      }
    } catch (e) {
      console.warn('[updateOrderStatus] Stock restoration notice:', e);
    }
  }

  const updated = currentLocal.map(o =>
    o.id === orderId || o.order_number === orderId
      ? {
          ...o,
          order_status: status,
          ...(status === 'cancelled' ? { stock_restored: true, cancelled_at: new Date().toISOString() } : {})
        }
      : o
  );
  cachedOrders = updated;
  saveLocalOrders(updated);
  syncEntityToCloud('orders.json', updated).catch(() => {});

  const client = dbClient();
  if (isTableAvailable('orders') && client) {
    try {
      const { error } = await client.from('orders').update({ order_status: status }).or(`id.eq.${orderId},order_number.eq.${orderId}`);
      if (isMissingTableError(error)) {
        markTableUnavailable('orders');
      }
    } catch {
      // silent fallback
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaymera-orders-updated', { detail: { orderId, status } }));
  }

  // ── AUTOMATED CANCELLATION EMAIL IF STATUS CHANGED TO CANCELLED ──
  if (status === 'cancelled' && targetOrder) {
    const cancelledCopy = { ...targetOrder, order_status: 'cancelled', cancelled_at: new Date().toISOString() };
    sendOrderCancelledEmails(cancelledCopy, 'Order marked as cancelled by atelier administration').catch(err => {
      console.warn('[updateOrderStatus] Cancel email notice:', err);
    });
  }

  return { success: true, error: null };
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; error: any }> {
  // Update in-memory cache and localStorage
  const currentLocal = getLocalOrders();
  const updated = currentLocal.filter(o => o.id !== orderId && o.order_number !== orderId);
  cachedOrders = updated;
  saveLocalOrders(updated);
  syncEntityToCloud('orders.json', updated).catch(() => {});

  // Remove from Supabase if table is available
  const client = dbClient();
  if (isTableAvailable('orders') && client) {
    try {
      const { data: matched } = await client
        .from('orders')
        .select('id')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);

      const targetIds = (matched && matched.length > 0) ? matched.map((m: any) => m.id) : [orderId];

      await client.from('order_items').delete().in('order_id', targetIds);
      const { error } = await client.from('orders').delete().in('id', targetIds);

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
  const cleanNumber = orderNumber.trim().toLowerCase();

  // 1. Check local cache
  const localOrders = getLocalOrders();
  const foundLocal = localOrders.find(o => o.order_number?.toLowerCase() === cleanNumber);
  if (foundLocal) return foundLocal;

  // 2. Check SQL table
  const client = dbClient();
  if (isTableAvailable('orders') && client) {
    try {
      const { data, error } = await client
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber.trim())
        .single();
      if (!error && data) return data;
      if (isMissingTableError(error)) {
        markTableUnavailable('orders');
      }
    } catch { /* continue */ }
  }

  // 3. Check Cloud Storage
  try {
    const cloudOrders = await fetchEntityFromCloud<any[]>('orders.json');
    if (cloudOrders && Array.isArray(cloudOrders)) {
      const foundCloud = cloudOrders.find(o => o.order_number?.toLowerCase() === cleanNumber);
      if (foundCloud) return foundCloud;
    }
  } catch {}

  return null;
}

export async function syncLocalOrdersToSupabase(): Promise<{ success: boolean; syncedCount: number; error: string | null }> {
  const client = dbClient();
  if (!client) return { success: false, syncedCount: 0, error: 'Database client unavailable' };

  // Fetch orders from cloud storage or local cache
  let orders = await fetchEntityFromCloud<any[]>('orders.json');
  if (!orders || orders.length === 0) {
    orders = getLocalOrders().filter(o => o.id !== 'ord-101' && o.id !== 'ord-102');
  }

  if (!orders || orders.length === 0) {
    return { success: true, syncedCount: 0, error: 'No orders found to sync.' };
  }

  let synced = 0;
  for (const ord of orders) {
    try {
      const { data: orderData, error: oErr } = await client.from('orders').upsert({
        id: ord.id || undefined,
        user_id: ord.user_id || null,
        order_number: ord.order_number,
        customer_name: ord.customer_name,
        customer_email: ord.customer_email,
        customer_phone: ord.customer_phone || '',
        shipping_address: ord.shipping_address || {},
        subtotal: ord.subtotal || 0,
        shipping_fee: ord.shipping_fee || 0,
        total: ord.total || 0,
        payment_method: ord.payment_method || 'COD',
        payment_status: ord.payment_status || 'pending',
        order_status: ord.order_status || 'processing',
        created_at: ord.created_at || new Date().toISOString()
      }, { onConflict: 'order_number' }).select().single();

      if (!oErr && orderData && Array.isArray(ord.order_items)) {
        for (const itm of ord.order_items) {
          await client.from('order_items').insert({
            order_id: orderData.id,
            product_id: itm.product_id || null,
            product_name: itm.product_name,
            product_image: itm.product_image || '',
            size: itm.size || '',
            price: itm.price || 0,
            quantity: itm.quantity || 1
          });
        }
        synced++;
      }
    } catch { /* ignore individual sync failure */ }
  }

  return { success: true, syncedCount: synced, error: null };
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
  // Filter out demo inquiries when saving real inquiries
  const filtered = currentLocal.filter(i => i.id !== 'inq-1' && i.id !== 'inq-2');
  const updated = [newInquiry, ...filtered];
  saveLocalInquiries(updated);
  syncEntityToCloud('inquiries.json', updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('inquiries')) {
    try {
      const { data, error } = await client
        .from('inquiries')
        .insert({
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone || '',
          service_type: inquiry.serviceType || 'General Inquiry',
          message: inquiry.message
        })
        .select().single();
      if (error) {
        if (isMissingTableError(error)) {
          markTableUnavailable('inquiries');
        }
      } else if (data) {
        return { success: true, data };
      }
    } catch {
      // fallback
    }
  }

  return { success: true, data: newInquiry };
}

export async function fetchAdminInquiries(): Promise<{ data: any[]; error: any }> {
  // 1. Try cloud storage
  try {
    const cloud = await fetchEntityFromCloud<any[]>('inquiries.json');
    if (cloud && cloud.length > 0) {
      cachedInquiries = cloud;
      saveLocalInquiries(cloud);
      return { data: cloud, error: null };
    }
  } catch {}

  // 2. Try DB if table available
  const client = dbClient();
  if (client && isTableAvailable('inquiries')) {
    try {
      const result = await withTimeout(
        client.from('inquiries').select('*').order('created_at', { ascending: false }) as any,
        2500,
        { data: null, error: 'timeout' }
      );
      if (result.data && result.data.length > 0) {
        cachedInquiries = result.data;
        saveLocalInquiries(result.data);
        syncEntityToCloud('inquiries.json', result.data).catch(() => {});
        return { data: result.data, error: null };
      } else if (isMissingTableError(result.error)) {
        markTableUnavailable('inquiries');
      }
    } catch {}
  }

  const local = getLocalInquiries();
  return { data: cachedInquiries || local, error: null };
}

export async function updateInquiryStatus(inquiryId: string, status: string): Promise<{ success: boolean; error: any }> {
  const currentLocal = getLocalInquiries();
  const updated = currentLocal.map(i => i.id === inquiryId ? { ...i, status } : i);
  saveLocalInquiries(updated);
  syncEntityToCloud('inquiries.json', updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('inquiries')) {
    try {
      const { error } = await client.from('inquiries').update({ status }).eq('id', inquiryId);
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

export const DEFAULT_CATEGORIES: CategoryItem[] = [];

export function getLocalCategories(): CategoryItem[] {
  if (typeof window === 'undefined') return [];
  const cats = lsGet<CategoryItem[]>(LS.CATEGORIES, []);
  return cats || [];
}

export function saveLocalCategories(cats: CategoryItem[]) {
  cachedCategories = cats;
  lsSet(LS.CATEGORIES, cats);
}

async function syncCategoriesToCloud(cats: CategoryItem[]): Promise<void> {
  await syncEntityToCloud('categories.json', cats);
}

async function fetchCategoriesFromCloud(): Promise<CategoryItem[] | null> {
  return fetchEntityFromCloud<CategoryItem[]>('categories.json');
}

export async function fetchCategories(): Promise<{ data: CategoryItem[]; error: any }> {
  if (cachedCategories !== null && cachedCategories.length > 0) {
    _refreshCategoriesFromDb().catch(() => {});
    return { data: cachedCategories, error: null };
  }
  return _refreshCategoriesFromDb();
}

async function _refreshCategoriesFromDb(): Promise<{ data: CategoryItem[]; error: any }> {
  // 1. Fetch from Supabase Cloud Storage (authoritative across all devices for admin-added categories)
  try {
    const cloudCategories = await fetchCategoriesFromCloud();
    if (cloudCategories !== null && cloudCategories.length > 0) {
      cachedCategories = cloudCategories;
      saveLocalCategories(cloudCategories);
      return { data: cloudCategories, error: null };
    }
  } catch {}

  // 2. Also try SQL table if available
  const client = dbClient();
  if (client && isTableAvailable('categories')) {
    try {
      const result = await withTimeout(
        client.from('categories').select('*').order('sort_order', { ascending: true }) as any,
        3000,
        { data: null, error: 'timeout' }
      );
      if (result.data && result.data.length > 0) {
        const formatted: CategoryItem[] = result.data.map((c: any) => ({
          id: c.id, title: c.title, slug: c.slug, count: c.count,
          image: c.image, description: c.description, featured: c.featured
        }));
        cachedCategories = formatted;
        saveLocalCategories(formatted);
        syncCategoriesToCloud(formatted).catch(() => {});
        return { data: formatted, error: null };
      } else if (isMissingTableError(result.error)) {
        markTableUnavailable('categories');
      }
    } catch {
      // non-blocking
    }
  }

  // 3. Fallback to local storage (only admin-added categories)
  const local = getLocalCategories();
  cachedCategories = local;
  return { data: local, error: null };
}

export async function createCategory(
  cat: Omit<CategoryItem, 'id'> & { imageFile?: File | null }
): Promise<{ success: boolean; data: CategoryItem }> {
  let imageUrl = cat.image || '/images/royal_blue_anarkali_1788292199640.jpg';

  // Upload image file if provided
  if (cat.imageFile) {
    const result = await uploadImageFile(cat.imageFile, 'category-images', 'categories');
    if (!result.error) imageUrl = result.publicUrl;
  }

  const newCat: CategoryItem = {
    id:          'cat-' + Date.now(),
    title:       cat.title,
    slug:        cat.slug || cat.title.toLowerCase().replace(/\s+/g, '-'),
    count:       cat.count || '40+ Styles',
    image:       imageUrl,
    description: cat.description || '',
    featured:    cat.featured ?? false
  };

  const list = getLocalCategories();
  const updated = [...list, newCat];
  saveLocalCategories(updated);
  syncCategoriesToCloud(updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('categories')) {
    try {
      const { error } = await client.from('categories').upsert({
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
  syncCategoriesToCloud(updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('categories')) {
    try {
      const dbPayload: Record<string, any> = {};
      if (updates.title       !== undefined) dbPayload.title       = updates.title;
      if (updates.slug        !== undefined) dbPayload.slug        = updates.slug;
      if (updates.count       !== undefined) dbPayload.count       = updates.count;
      if (updates.image       !== undefined) dbPayload.image       = updates.image;
      if (updates.description !== undefined) dbPayload.description = updates.description;
      if (updates.featured    !== undefined) dbPayload.featured    = updates.featured;
      const { error } = await client.from('categories').update(dbPayload).eq('id', id);
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
  const updated = list.filter(c => c.id !== id);
  saveLocalCategories(updated);
  syncCategoriesToCloud(updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('categories')) {
    try {
      const { error } = await client.from('categories').delete().eq('id', id);
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
  let custs = [...getLocalCustomers()];

  // If supabaseAdmin is configured, augment with registered patrons from Cloud Auth
  if (supabaseAdmin) {
    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (userList?.users) {
        for (const u of userList.users) {
          const role = u.user_metadata?.role;
          if (role === 'Administrator') continue;
          const email = u.email || '';
          if (!email) continue;
          const exists = custs.some(c => c.email.toLowerCase() === email.toLowerCase());
          if (!exists) {
            const joined = u.created_at ? u.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            const name = (u.user_metadata?.full_name as string) || (u.user_metadata?.username as string) || email.split('@')[0];
            const phone = (u.user_metadata?.phone as string) || '+91 98000 00000';
            custs.push({
              id: u.id,
              name,
              email,
              phone,
              city: 'Online Atelier Client',
              totalSpent: 0,
              ordersCount: 0,
              tier: (u.user_metadata?.tier as any) || 'New',
              joinedDate: joined,
              isRegistered: true
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch cloud auth customers:', err);
    }
  }

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
  // 1. Try cloud storage sync
  try {
    const cloudCoupons = await fetchEntityFromCloud<CouponItem[]>('coupons.json');
    if (cloudCoupons && cloudCoupons.length > 0) {
      cachedCoupons = cloudCoupons;
      saveLocalCoupons(cloudCoupons);
      return { data: cloudCoupons, error: null };
    }
  } catch {}

  // 2. Try DB if table available
  const client = dbClient();
  if (client && isTableAvailable('coupons')) {
    try {
      const result = await withTimeout(
        client.from('coupons').select('*').order('created_at', { ascending: false }) as any,
        2500,
        { data: null, error: 'timeout' }
      );

      if (result.data && result.data.length > 0) {
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
        syncEntityToCloud('coupons.json', formatted).catch(() => {});
        return { data: formatted, error: null };
      } else if (isMissingTableError(result.error)) {
        markTableUnavailable('coupons');
      }
    } catch {}
  }

  const local = getLocalCoupons();
  cachedCoupons = local;
  return { data: local, error: null };
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
  const updated = [newCoupon, ...list];
  saveLocalCoupons(updated);
  syncEntityToCloud('coupons.json', updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('coupons')) {
    try {
      const { error } = await client.from('coupons').upsert({
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
  syncEntityToCloud('coupons.json', updated).catch(() => {});
  const found = updated.find(c => c.id === id);

  const client = dbClient();
  if (client && isTableAvailable('coupons') && found) {
    try {
      const { error } = await client.from('coupons').update({ active: found.active }).eq('id', id);
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
  const updated = list.filter(c => c.id !== id);
  saveLocalCoupons(updated);
  syncEntityToCloud('coupons.json', updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('coupons')) {
    try {
      const { error } = await client.from('coupons').delete().eq('id', id);
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
  supportEmail:          'zaymerawardrobe@gmail.com',
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

  // 1. Try cloud storage sync
  try {
    const cloud = await fetchEntityFromCloud<StoreSettingsItem>('store_settings.json');
    if (cloud) {
      cachedSettings = cloud;
      saveLocalStoreSettings(cloud);
      return { data: cloud, error: null };
    }
  } catch {}

  // 2. Try DB if table available
  const client = dbClient();
  if (client && isTableAvailable('store_settings')) {
    try {
      const { data, error } = await client
        .from('store_settings')
        .select('*')
        .eq('id', 'global')
        .single();

      if (!error && data) {
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
        syncEntityToCloud('store_settings.json', settings).catch(() => {});
        return { data: settings, error: null };
      } else if (isMissingTableError(error)) {
        markTableUnavailable('store_settings');
      }
    } catch {}
  }

  const local = getLocalStoreSettings();
  cachedSettings = local;
  return { data: local, error: null };
}

export async function updateStoreSettings(settings: StoreSettingsItem): Promise<{ success: boolean; error: any }> {
  saveLocalStoreSettings(settings);
  syncEntityToCloud('store_settings.json', settings).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('store_settings')) {
    try {
      const { error } = await client.from('store_settings').upsert({
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

  // 1. Try cloud storage sync
  try {
    const cloud = await fetchEntityFromCloud<BannerItem[]>('banners.json');
    if (cloud && cloud.length > 0) {
      cachedBanners = cloud;
      saveLocalBanners(cloud);
      return { data: cloud, error: null };
    }
  } catch {}

  // 2. Try DB if table available
  const client = dbClient();
  if (client && isTableAvailable('banners')) {
    try {
      const { data, error } = await client
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        const formatted: BannerItem[] = data.map((b: any) => ({
          id: b.id, title: b.title, subtitle: b.subtitle,
          image: b.image, link: b.link, sortOrder: b.sort_order, active: b.active
        }));
        cachedBanners = formatted;
        saveLocalBanners(formatted);
        syncEntityToCloud('banners.json', formatted).catch(() => {});
        return { data: formatted, error: null };
      } else if (isMissingTableError(error)) {
        markTableUnavailable('banners');
      }
    } catch {}
  }

  const local = getLocalBanners();
  cachedBanners = local;
  return { data: local, error: null };
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
  const updated = [...list, newBanner];
  saveLocalBanners(updated);
  syncEntityToCloud('banners.json', updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('banners')) {
    try {
      const { error } = await client.from('banners').upsert({
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
  const updated = list.map(b => b.id === id ? { ...b, ...updates } : b);
  saveLocalBanners(updated);
  syncEntityToCloud('banners.json', updated).catch(() => {});

  const client = dbClient();
  if (client && isTableAvailable('banners')) {
    try {
      const dbPayload: Record<string, any> = {};
      if (updates.title     !== undefined) dbPayload.title      = updates.title;
      if (updates.subtitle  !== undefined) dbPayload.subtitle   = updates.subtitle;
      if (updates.image     !== undefined) dbPayload.image      = updates.image;
      if (updates.link      !== undefined) dbPayload.link       = updates.link;
      if (updates.sortOrder !== undefined) dbPayload.sort_order = updates.sortOrder;
      if (updates.active    !== undefined) dbPayload.active     = updates.active;
      const { error } = await client.from('banners').update(dbPayload).eq('id', id);
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
  const updated = list.filter(b => b.id !== id);
  saveLocalBanners(updated);
  syncEntityToCloud('banners.json', updated).catch(() => {});

  // Delete image from storage
  if (found?.image) {
    const path = extractStoragePath(found.image, 'banner-images');
    if (path) deleteImageFile('banner-images', path).catch(() => {});
  }

  const client = dbClient();
  if (client && isTableAvailable('banners')) {
    try {
      const { error } = await client.from('banners').delete().eq('id', id);
      if (isMissingTableError(error)) {
        markTableUnavailable('banners');
      }
    } catch {
      // silent fallback
    }
  }
  return { success: true };
}
