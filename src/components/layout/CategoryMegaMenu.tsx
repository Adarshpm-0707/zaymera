'use client';

import React from 'react';
import Link from 'next/link';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { CATEGORY_TILES } from '@/constants/catalog';

interface CategoryMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (slug: string) => void;
}

export const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({
  isOpen,
  onClose,
  onSelectCategory
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-md border-b border-[#E8DFC8] shadow-2xl z-30 transition-all animate-in slide-in-from-top-2 duration-200"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header inside Mega Menu */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#F0EAE1]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9B2242] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Zaymera Haute Couture Directory
            </span>
            <h3 className="font-display text-2xl font-normal text-[#1F1916] mt-1">
              Explore Our Signature Ensembles
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF4EA] text-[#8C7A68] hover:text-[#221C18] transition-colors cursor-pointer"
            aria-label="Close Mega Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Prominent Visual Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.slug}
              href={`/products?category=${tile.slug}`}
              prefetch={true}
              onClick={() => {
                onSelectCategory(tile.slug);
                onClose();
              }}
              className="group relative h-72 sm:h-80 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
            >
              <img
                src={tile.image}
                alt={tile.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E6C280] mb-1">
                  {tile.count}
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-normal leading-snug group-hover:text-[#F3E2C4] transition-colors">
                  {tile.title}
                </h4>
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/90 group-hover:text-white transition-colors">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 pt-6 border-t border-[#F0EAE1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6C5F]">
          <span>✨ Looking for bespoke bridal fitting or custom sizing? Speak directly with our master couturiers.</span>
          <Link
            href="/products"
            prefetch={true}
            onClick={() => {
              onSelectCategory('all');
              onClose();
            }}
            className="text-[#9B2242] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            View Complete Boutique Archive <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
