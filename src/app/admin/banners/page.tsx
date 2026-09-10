'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Save,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  Truck,
  Clock,
  MessageCircle,
  Eye,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  getLocalStoreSettings,
  saveLocalStoreSettings,
  StoreSettingsItem
} from '@/lib/supabase/services';

export default function AdminBannersPage() {
  const [settings, setSettings] = useState<StoreSettingsItem>({
    announcementText: 'Complimentary Express Worldwide Delivery & Handloom Guarantee',
    conciergePhone: '+91 98765 43210',
    supportEmail: 'atelier@zaymera.com',
    freeShippingThreshold: 0,
    storeTimings: '10:00 AM – 9:00 PM IST',
    currencySymbol: '₹',
    whatsappMessage: 'Hello Zaymera Boutique Team, I would like to inquire about couture items.'
  });

  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loaded = getLocalStoreSettings();
    setSettings(loaded);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      saveLocalStoreSettings(settings);
      showToast('Storefront announcements and concierge settings saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults: StoreSettingsItem = {
      announcementText: 'Complimentary Express Worldwide Delivery & Handloom Guarantee',
      conciergePhone: '+91 98765 43210',
      supportEmail: 'atelier@zaymera.com',
      freeShippingThreshold: 0,
      storeTimings: '10:00 AM – 9:00 PM IST',
      currencySymbol: '₹',
      whatsappMessage: 'Hello Zaymera Boutique Team, I would like to inquire about couture items.'
    };
    setSettings(defaults);
    saveLocalStoreSettings(defaults);
    showToast('Reset to default Atelier configuration.');
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-16">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#162E19] border border-[#22C55E] text-[#4ADE80] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#26201B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#FAF8F5] tracking-wide">
              Store Banners & Concierge Settings
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#291F18] border border-[#3E3025] text-[#E2B755] px-2.5 py-0.5 rounded-full font-bold">
              Live Broadcast
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-1 font-normal">
            Control the marquee announcement ticker, customer helpline touchpoints, and luxury shipping assurances.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#201814] hover:bg-[#2C211B] text-xs text-[#A89887] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#201814] text-xs text-[#C5A059] hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Store</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Live Storefront Preview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#14100E] border border-[#2D221A] space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E2B755]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Storefront TopBar Ticker Preview</span>
          </div>
          <span className="text-[10px] text-[#8C7B6C]">Preview Mode</span>
        </div>

        {/* Mock TopBar */}
        <div className="overflow-hidden rounded-xl bg-[#110D0B] border border-[#3E3026] text-[11px] text-[#FAF8F5] py-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shrink-0" />
            <span className="font-medium text-[#FAF8F5] tracking-wider text-xs">
              {settings.announcementText || 'Your announcement will appear here...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[10.5px] text-[#C5A059]">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#C5A059]" />
              {settings.conciergePhone}
            </span>
            <span className="flex items-center gap-1 text-[#A89887]">
              <Clock className="w-3 h-3" />
              {settings.storeTimings}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Marquee Announcement */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#14100E] border border-[#26201B] space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#241C16]">
            <Megaphone className="w-4 h-4 text-[#C5A059]" />
            <h2 className="font-display text-base sm:text-lg font-bold text-[#FAF8F5]">
              Announcement Marquee Ticker
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
              Top Announcement Text *
            </label>
            <input
              type="text"
              required
              value={settings.announcementText}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              placeholder="e.g. Complimentary Express Worldwide Delivery & Handloom Guarantee"
              className="w-full px-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
            />
            <p className="text-[10.5px] text-[#736353] mt-1">
              Displayed prominently at the very top of all public pages on desktop & mobile devices.
            </p>
          </div>
        </div>

        {/* Section 2: Concierge & Customer Care */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#14100E] border border-[#26201B] space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#241C16]">
            <Phone className="w-4 h-4 text-[#E2B755]" />
            <h2 className="font-display text-base sm:text-lg font-bold text-[#FAF8F5]">
              Concierge Touchpoints & Direct Helplines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                Boutique Helpline Phone *
              </label>
              <input
                type="text"
                required
                value={settings.conciergePhone}
                onChange={(e) => setSettings({ ...settings, conciergePhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                Support Email *
              </label>
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="concierge@zaymera.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                Atelier Service Hours
              </label>
              <input
                type="text"
                value={settings.storeTimings}
                onChange={(e) => setSettings({ ...settings, storeTimings: e.target.value })}
                placeholder="10:00 AM – 9:00 PM IST"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
                Complimentary Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                placeholder="0 = All Orders Free"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A89887] uppercase tracking-wider mb-1.5">
              WhatsApp Concierge Floating Button Greeting
            </label>
            <textarea
              rows={2}
              value={settings.whatsappMessage}
              onChange={(e) => setSettings({ ...settings, whatsappMessage: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1C1613] border border-[#30251E] text-xs text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Broadcast Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
