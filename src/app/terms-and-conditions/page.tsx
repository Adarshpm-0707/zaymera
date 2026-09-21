'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function TermsAndConditionsAliasPage() {
  useEffect(() => {
    redirect('/terms');
  }, []);

  return null;
}
