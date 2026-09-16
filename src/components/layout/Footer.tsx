'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { circleLogoImg } from '@/constants/catalog';
import { SITE_CONFIG } from '@/constants/siteConfig';

export const Footer: React.FC = () => {
  const cleanPhone = SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || '917306115950';
  const telPhone = SITE_CONFIG.conciergePhone.replace(/[^0-9+]/g, '') || '+917306115950';

  return (
    <motion.footer 
      className="border-t border-[#E8DFCE] bg-[#FAF8F5] text-[#554D46] pt-12 pb-10 sm:pt-14 sm:pb-12 text-xs font-jakarta"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-6">
        
        {/* 1. Brand Emblem & Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 shadow-sm overflow-hidden" style={{ width: '32px', height: '32px' }}>
              <img
                src={circleLogoImg}
                alt="Zaymera"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span className="font-tenor text-lg sm:text-xl tracking-[0.25em] text-[#1C1613] font-medium">
              ZAYMERA
            </span>
          </div>
          <span className="hidden sm:inline text-[#C5A059] text-xs">✦</span>
          <span className="text-[10px] sm:text-[11px] text-[#7A6C5F] tracking-[0.22em] uppercase font-medium">
            Clothing That Speak Elegance
          </span>
        </div>

        {/* 2. Contact Section & WhatsApp Concierge */}
        <div className="w-full max-w-2xl bg-white border border-[#E7DECD] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#9B2242] mb-3">
            Atelier Client Concierge & Bespoke Tailoring
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs">
            {/* WhatsApp Link */}
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello Zaymera Stylist, I would like to inquire about couture designs and custom sizing.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-semibold transition-all duration-200 active:scale-98"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp: <strong className="font-bold text-[#0F6848]">{SITE_CONFIG.conciergePhone}</strong></span>
            </a>

            {/* Direct Call Link */}
            <a
              href={`tel:${telPhone}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2D8C7] text-[#4A3F35] font-medium transition-all duration-200 active:scale-98"
            >
              <Phone className="w-3.5 h-3.5 text-[#9B2242]" />
              <span>Call Us: <strong className="font-semibold text-[#221C18]">{SITE_CONFIG.conciergePhone}</strong></span>
            </a>

            {/* Timings */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A68]">
              <Clock className="w-3.5 h-3.5 text-[#9B2242]" />
              <span>10:00 AM – 9:00 PM IST</span>
            </div>
          </div>
        </div>

        {/* 3. Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5 text-[11px] sm:text-xs text-[#6B5E52] font-medium tracking-wide">
          <Link href="/products" className="hover:text-[#9B2242] transition-colors">
            All Products
          </Link>
          <span className="text-[#D6CBB8] text-[9px]">•</span>
          <Link href="/products?filter=new-arrivals" className="hover:text-[#9B2242] transition-colors">
            New Arrivals
          </Link>
          <span className="text-[#D6CBB8] text-[9px]">•</span>
          <span className="hover:text-[#9B2242] transition-colors cursor-pointer">Terms & Conditions</span>
          <span className="text-[#D6CBB8] text-[9px]">•</span>
          <span className="hover:text-[#9B2242] transition-colors cursor-pointer">Shipping & Customs</span>
          <span className="text-[#D6CBB8] text-[9px]">•</span>
          <span className="hover:text-[#9B2242] transition-colors cursor-pointer">Artisan Handloom Certificate</span>
          <span className="text-[#D6CBB8] text-[9px]">•</span>
          <span className="hover:text-[#9B2242] transition-colors cursor-pointer">Atelier Care Guide</span>
        </nav>

        {/* 4. Copyright & Disclaimer */}
        <div className="w-full max-w-md pt-3 border-t border-[#EFE8DC] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-[10px] sm:text-[10.5px] text-[#9E8E7D] tracking-wider">
          <span>© {new Date().getFullYear()} ZAYMERA Haute Couture.</span>
          <span className="hidden sm:inline text-[#D6CBB8]">|</span>
          <span>All rights reserved.</span>
        </div>
      </div>
    </motion.footer>
  );
};
