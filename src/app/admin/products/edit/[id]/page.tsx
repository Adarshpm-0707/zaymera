'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProductByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (resolvedParams?.id) {
      router.replace(`/admin/products/new?edit=${encodeURIComponent(resolvedParams.id)}`);
    }
  }, [resolvedParams, router]);

  return (
    <div className="py-24 text-center space-y-4">
      <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
      <h2 className="font-display text-lg text-[#FAF8F5]">Opening Product Editor...</h2>
    </div>
  );
}
