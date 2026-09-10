import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Tenor_Sans, Italiana } from 'next/font/google';
import { AppProviders } from '@/providers';
import { SITE_CONFIG } from '@/constants/siteConfig';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const tenorSans = Tenor_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const italiana = Italiana({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-italiana',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  openGraph: {
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${tenorSans.variable} ${italiana.variable}`}>
      <body suppressHydrationWarning className="bg-[#FAF8F5] text-[#221C18] antialiased selection:bg-[#9B2242] selection:text-white font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
