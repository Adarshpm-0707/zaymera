'use client';

import React, { useState } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { PRODUCTS_CATALOG } from '@/constants/catalog';
import { ProductItem } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductItem) => void;
  products?: ProductItem[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  products
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const sourceCatalog = products ?? PRODUCTS_CATALOG;

  const results = searchTerm.trim()
    ? sourceCatalog.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.fabric ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-[#E5DCCE] shadow-2xl p-6 text-[#2B231D]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-[#EAE2D5]">
          <Search className="w-5 h-5 text-[#9B2242]" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search co-ord sets, anarkalis, bridal troussau, Chanderi silks..."
            className="w-full text-sm sm:text-base focus:outline-none text-[#221C18] placeholder-[#9E9081]"
          />
        </div>

        {searchTerm.trim() ? (
          <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3">
            <div className="text-xs text-[#8C7A68] font-medium uppercase tracking-wider">
              {results.length} Pieces Found
            </div>

            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF5ED] border border-transparent hover:border-[#E8DEC8] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-14 object-cover rounded-lg bg-[#ECE4D8]"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-[#221C18] group-hover:text-[#9B2242] transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="text-[11px] text-[#7A6C5F] mt-0.5 flex items-center gap-2">
                          <span className="font-bold text-[#9B2242]">₹{product.price}</span>
                          <span>•</span>
                          <span>{product.fabric}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#A89887] group-hover:text-[#9B2242] transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#8C7A68]">
                No matching handcrafted garments found. Try searching for "anarkali", "co-ord", or "silk".
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 pt-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#9B2242] flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Popular Boutique Searches
            </span>
            <div className="flex flex-wrap gap-2">
              {['Co-Ord Sets', 'Sapphire Anarkali', 'Pearl Ivory Bridal', 'Chanderi Silk', 'Festive Churidars'].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchTerm(term)}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-[#FAF5ED] hover:bg-[#F3E9DA] text-[#55473B] transition-colors border border-[#EADBCC] cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
