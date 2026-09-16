'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Server,
  Trash2,
  HardDrive
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  seedInitialCatalogToSupabase, 
  getLocalProducts, 
  saveLocalProducts,
  deleteAllProducts 
} from '@/lib/supabase/services';
import { PRODUCTS_CATALOG } from '@/constants/catalog';

export default function AdminSettingsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [localCount, setLocalCount] = useState<number>(0);

  useEffect(() => {
    setLocalCount(getLocalProducts().length);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialCatalogToSupabase();
      setLocalCount(getLocalProducts().length);
      showToast(`Catalog sync complete! ${res.count} products verified in database.`);
    } catch (err) {
      console.error('Seed error:', err);
      showToast('Error syncing catalog to database.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearAllProducts = async () => {
    if (confirm('Delete ALL products from the store and cache completely?')) {
      await deleteAllProducts();
      setLocalCount(0);
      showToast('All products deleted from catalog and cache.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-16">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#EAE2D5]">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#1C1613] tracking-wide">
            Database & System Settings
          </h1>
        </div>
        <p className="text-[11px] sm:text-xs text-[#6B5E52] mt-1 font-normal">
          Manage your Supabase cloud connectivity, seed initial catalog data, and inspect schema structures.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h2 className="font-display text-base text-[#1C1613] tracking-wide flex items-center gap-2">
            <Database className="w-4 h-4 text-[#936718]" />
            <span>Supabase Cloud Database Status</span>
          </h2>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] text-xs self-start sm:self-auto">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-[#16A34A] animate-pulse' : 'bg-[#EAB308]'}`} />
            <span className="font-bold text-[#1C1613]">
              {isSupabaseConfigured ? 'Cloud Connected' : 'Local Fallback Mode'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1">
            <div className="text-[10.5px] uppercase font-bold text-[#6B5E52]">Database Endpoint</div>
            <div className="font-mono text-[#1C1613] truncate font-semibold">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Configured via .env'}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1">
            <div className="text-[10.5px] uppercase font-bold text-[#6B5E52]">Key Type</div>
            <div className="font-mono text-[#936718] truncate font-semibold">
              Supabase Publishable / Anon Key (Active)
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Seeding & Maintenance Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Seed Card */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base text-[#1C1613] tracking-wide font-normal">
              Sync Default Atelier Catalog
            </h3>
            <p className="text-xs text-[#6B5E52] mt-1.5 leading-relaxed">
              Pushes all 8 core boutique catalog ensembles (Polka Co-Ords, Royal Sapphire Anarkali, Pearl Ivory Anarkali, Crimson Bridal Kurta, Chanderi Silks) into your Supabase database.
            </p>
          </div>

          <button
            onClick={handleSeedCatalog}
            disabled={isSeeding}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 hover:opacity-95 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Syncing to Database...' : 'Sync 8 Default Products to DB'}</span>
          </button>
        </div>

        {/* Local Storage & Cache */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-3">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base text-[#1C1613] tracking-wide font-normal">
              Local Product Store Cache
            </h3>
            <p className="text-xs text-[#6B5E52] mt-1.5 leading-relaxed">
              Zaymera uses high-speed persistent caching so all admin edits and new pieces immediately render across the storefront in sub-millisecond response times.
            </p>
            <div className="mt-2 text-xs font-semibold text-[#0284C7]">
              Current cached count: {localCount} pieces
            </div>
          </div>

          <button
            onClick={handleClearAllProducts}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold tracking-wide transition-all cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-4 h-4 text-[#DC2626]" />
            <span>Delete All Products from Store</span>
          </button>
        </div>

      </div>

      {/* Database Schema Summary Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs space-y-4">
        <h2 className="font-display text-base text-[#1C1613] tracking-wide flex items-center gap-2">
          <Server className="w-4 h-4 text-[#936718]" />
          <span>Supabase Schema Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]">
            <span className="font-mono font-bold text-[#936718]">public.products</span>
            <p className="text-[11px] text-[#6B5E52] mt-1">
              id, name, category, price, original_price, image, tag, description, fabric, work, in_stock, sizes
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]">
            <span className="font-mono font-bold text-[#936718]">public.orders</span>
            <p className="text-[11px] text-[#6B5E52] mt-1">
              id, order_number, customer_name, customer_email, customer_phone, shipping_address, subtotal, total, order_status
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]">
            <span className="font-mono font-bold text-[#936718]">public.inquiries</span>
            <p className="text-[11px] text-[#6B5E52] mt-1">
              id, name, email, phone, service_type, message, status, created_at
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
