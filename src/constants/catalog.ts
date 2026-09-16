import { ProductItem, NavCategory, CategoryTile } from '@/types';

export const circleLogoImg = '/images/zaymera_circle_logo_1788315549876.jpg';
export const pinkPolkaImg = '/images/pink_polka_coord_1788314855326.jpg';
export const tealPolkaImg = '/images/teal_polka_coord_1788314878566.jpg';
export const sagePolkaImg = '/images/sage_polka_coord_1788314896370.jpg';
export const beigePolkaImg = '/images/beige_polka_coord_1788314916274.jpg';
export const royalBlueProductImg = '/images/royal_blue_anarkali_1788292199640.jpg';
export const ivoryProductImg = '/images/ivory_anarkali_1788292215541.jpg';

export const PRODUCTS_CATALOG: ProductItem[] = [];

export const NAV_CATEGORIES: NavCategory[] = [
  { name: "SHOP BY CATEGORY", slug: "all", hasDropdown: true },
  { name: "ALL PRODUCTS", slug: "products-page" },
  { name: "NEW ARRIVALS", slug: "new-arrivals" },
  { name: "MOST SELLING", slug: "most-selling" },
  { name: "TRACK ORDER", slug: "track-order" }
];

export const CATEGORY_TILES: CategoryTile[] = [
  {
    title: "Casual Co-Ord Sets",
    count: "60+ Styles",
    image: pinkPolkaImg,
    slug: "casual-wear"
  },
  {
    title: "Festive Anarkalis & Churidars",
    count: "140+ Designs",
    image: royalBlueProductImg,
    slug: "festive-wear"
  },
  {
    title: "Wedding & Ceremony Troussau",
    count: "95+ Ensembles",
    image: ivoryProductImg,
    slug: "wedding-collection"
  }
];
