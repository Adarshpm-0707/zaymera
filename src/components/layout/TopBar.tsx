'use client';

import React from 'react';
import Link from 'next/link';
import { User, Search, ShoppingBag, Sparkles, Phone, Heart, UserCheck, Shield } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { useAuth } from '@/hooks/useAuth';
import { SITE_CONFIG } from '@/constants/siteConfig';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenContact: () => void;
  cartCount: number;
  wishlistCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenContact,
  cartCount,
  wishlistCount
}) => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0];
  const rawPhone = SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || "919876543210";

  return (
    <div className="w-full bg-[#FAF8F5] border-b border-[#EAE3D5] text-[#554D46] text-[11px] font-sans-clean">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
        
        {/* Left Utility / Announcement */}
        <div className="flex items-center space-x-6 tracking-wider">
          <span className="sm:hidden inline-flex items-center gap-1.5 text-[10.5px] text-[#7A6C5F] font-medium truncate max-w-[210px]">
            <Sparkles className="w-3 h-3 text-[#9B2242] shrink-0" />
            <span>Complimentary Express Delivery</span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-[#7A6C5F]">
            <Sparkles className="w-3 h-3 text-[#9B2242]" />
            <span>{SITE_CONFIG.shippingAnnouncement}</span>
          </span>
          <button 
            onClick={onOpenContact}
            className="hidden md:inline-flex items-center gap-1 hover:text-[#9B2242] transition-colors cursor-pointer"
          >
            <Phone className="w-3 h-3 text-[#9B2242]" />
            <span>Atelier Concierge</span>
          </button>
          <a
            href={`https://wa.me/${rawPhone}?text=${encodeURIComponent('Hello Zaymera Boutique Team, I would like to inquire about couture items.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 text-[#128C7E] hover:text-[#25D366] transition-colors font-medium"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
            <span>WhatsApp Support</span>
          </a>

          {/* Admin Atelier Direct Portal Button */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-[#9B2242] hover:text-[#781830] transition-colors font-bold px-2 py-0.5 rounded-full bg-[#FAF0E6] border border-[#E8D4C0]"
            title="Open Admin Control Center"
          >
            <Shield className="w-3 h-3 text-[#9B2242]" />
            <span>Admin Atelier</span>
          </Link>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center space-x-4 sm:space-x-6 tracking-wider">
          <button 
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 hover:text-[#9B2242] transition-colors cursor-pointer py-1"
          >
            {user ? (
              <UserCheck className="w-3.5 h-3.5 text-[#9B2242]" />
            ) : (
              <User className="w-3.5 h-3.5 text-[#7A6C5F]" />
            )}
            <span className="hidden sm:inline">
              {user ? `Hi, ${displayName}` : 'My Account'}
            </span>
            <span className="sm:hidden">
              {user ? displayName : 'Account'}
            </span>
          </button>

          <button 
            onClick={onOpenSearch}
            className="inline-flex items-center gap-1.5 hover:text-[#9B2242] transition-colors cursor-pointer py-1"
          >
            <Search className="w-3.5 h-3.5 text-[#7A6C5F]" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button 
            onClick={onOpenWishlist}
            className="inline-flex items-center gap-1.5 hover:text-[#9B2242] transition-colors cursor-pointer group py-1"
            title="View Wishlist"
          >
            <Heart className="w-3.5 h-3.5 text-[#7A6C5F] group-hover:text-[#9B2242]" />
            <span className="hidden sm:inline">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="bg-[#9B2242] text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button 
            onClick={onOpenCart}
            className="inline-flex items-center gap-1.5 hover:text-[#9B2242] transition-colors cursor-pointer group py-1"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#7A6C5F] group-hover:text-[#9B2242]" />
            <span>Bag</span>
            {cartCount > 0 && (
              <span className="bg-[#9B2242] text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
