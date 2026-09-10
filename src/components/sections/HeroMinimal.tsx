'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SlideData } from '@/types';

interface HeroMinimalProps {
  slides: SlideData[];
  onShopNow: (slide: SlideData) => void;
  onSelectHotspot?: (hotspotId: string, slide: SlideData) => void;
  onExploreCategory: (category: string) => void;
}

export const HeroMinimal: React.FC<HeroMinimalProps> = ({
  slides,
  onShopNow,
  onExploreCategory
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextSlide]);

  const activeSlide = slides[currentIndex];

  return (
    <section 
      className="relative w-full min-h-[640px] sm:min-h-[720px] lg:min-h-[820px] bg-[#FAF8F5] overflow-hidden flex items-center"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={activeSlide.image}
            alt={activeSlide.productName}
            className="w-full h-full object-cover object-center"
          />
          
          {/* Gradients tailored for editorial luxury aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent sm:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="max-w-2xl text-white space-y-4 sm:space-y-6">
          
          {/* Subtle Tag Badge */}
          <motion.div
            key={`tag-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#E8D4BE]"
          >
            <span>{activeSlide.tag}</span>
          </motion.div>

          {/* Headline with Luxury Serif Accent */}
          <motion.div
            key={`headline-${currentIndex}`}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-1 sm:space-y-2"
          >
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-tight">
              {activeSlide.headlineStart} <br />
              <span className="font-serif italic font-light text-[#F4E3C8]">
                {activeSlide.headlineItalic}
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-sm sm:text-base text-[#D4CBC0] font-light max-w-lg leading-relaxed"
          >
            {activeSlide.description}
          </motion.p>

          {/* Price & Action Buttons */}
          <motion.div
            key={`actions-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => onShopNow(activeSlide)}
              className="px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs sm:text-sm font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2 group"
            >
              <span>{activeSlide.primaryCta}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              href="/products?category=festive-wear"
              prefetch={true}
              className="px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-medium tracking-wider uppercase transition-all active:scale-95 cursor-pointer inline-flex items-center"
            >
              Explore Collection
            </Link>
          </motion.div>

          {/* Product Pill Info */}
          <motion.div
            key={`pill-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-4 flex items-center gap-4 text-xs text-[#E1D7CC]"
          >
            <span className="font-semibold text-white">{activeSlide.productName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E6C280]" />
            <span className="text-[#E6C280] font-bold text-sm">{activeSlide.productPrice}</span>
          </motion.div>

        </div>
      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-6 sm:bottom-10 right-4 sm:right-10 z-20 flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all active:scale-90 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-[#E6C280]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all active:scale-90 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </section>
  );
};
