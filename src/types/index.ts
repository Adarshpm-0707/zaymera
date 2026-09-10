export interface SlideHotspot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  title: string;
  subtitle: string;
  price?: string;
  tag?: string;
}

export interface SlideData {
  id: number;
  tag: string;
  headlineStart: string;
  headlineItalic: string;
  brandTitle?: string;
  brandSubtitle?: string;
  description: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  image: string;
  theme: 'dark-gold' | 'light-editorial' | 'warm-amber' | 'night-architectural';
  productName: string;
  productPrice: string;
  productSlug: string;
  badge: string;
  accent: string;
  hotspots?: SlideHotspot[];
  location?: string;
}

export interface ProductSizeOption {
  size: string;
  inStock: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;           // offer / selling price (what customer pays)
  originalPrice: number;   // MRP / strikethrough price
  purchasedPrice?: number; // cost price (admin-only, internal)
  image: string;           // primary image (images[0] alias)
  images?: string[];       // up to 4 image URLs; images[0] = primary
  tag: string;
  description: string;
  fabric: string;
  work: string;
  inStock: boolean;
  sizes?: ProductSizeOption[];
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  size: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'vip' | 'admin';
}

export interface NavCategory {
  name: string;
  slug: string;
  hasDropdown?: boolean;
}

export interface CategoryTile {
  title: string;
  count: string;
  image: string;
  slug: string;
}
