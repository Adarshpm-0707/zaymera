'use client';

import React from 'react';

interface TopBarProps {
  onOpenSearch?: () => void;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenAuth?: () => void;
  onOpenContact?: () => void;
  cartCount?: number;
  wishlistCount?: number;
}

export const TopBar: React.FC<TopBarProps> = () => {
  return null;
};
