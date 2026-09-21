'use client';

import React from 'react';
import { LegalPageShell, PolicySection } from '@/components/legal/LegalPageShell';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const sections: PolicySection[] = [
    {
      id: 'atelier-commitment',
      number: '01',
      title: 'Atelier Philosophy & Privacy Commitment',
      content: (
        <>
          <p>
            Welcome to <strong>{SITE_CONFIG.name} Haute Couture</strong> (&ldquo;Zaymera&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Atelier&rdquo;). We believe that true luxury is inextricably bound to discretion, trust, and uncompromising privacy.
          </p>
          <p>
            This Privacy Policy describes how we collect, safeguard, process, and respect your personal information when you explore our digital salon, place orders for ready-to-wear or bespoke garments, engage with our concierge stylists, or visit <strong>zaymeracouture.com</strong>.
          </p>
          <div className="legal-callout-gold">
            <p className="text-xs text-[#7A6038] font-medium leading-relaxed">
              ✦ <strong>Our Golden Rule:</strong> We never sell, rent, monetize, or barter your personal records, contact details, or styling portfolios with third-party advertising brokers. Your relationship is with Zaymera alone.
            </p>
          </div>
        </>
      ),
    },
    {
      id: 'information-collected',
      number: '02',
      title: 'Information We Collect',
      content: (
        <>
          <p>
            In order to curate our collections and tailor garments to your exacting standards, we collect only necessary and proportionate information:
          </p>
          <ul className="list-disc pl-5 space-y-2 marker:text-[#9B2242]">
            <li>
              <strong>Identity & Contact Credentials:</strong> Full name, telephone/WhatsApp contact number, email address, and shipping/billing destinations.
            </li>
            <li>
              <strong>Bespoke Tailoring & Measurement Profiles:</strong> Bust, waist, hips, shoulder span, desired ensemble length, sleeve specifications, and fitting notes provided for made-to-order couture.
            </li>
            <li>
              <strong>Order & Acquisition History:</strong> Garments ordered, fabric preferences, transaction histories, custom alteration requests, and invoice archives.
            </li>
            <li>
              <strong>Digital Browsing & Device Telemetry:</strong> Anonymized IP addresses, browser specifications, page view interactions, and bag cache sessions to ensure smooth browsing across desktop and mobile devices.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'bespoke-confidentiality',
      number: '03',
      title: 'Bespoke Measurements & Fitting Discretion',
      content: (
        <>
          <p>
            We recognize that custom sizing and personal body measurements are deeply intimate data points.
          </p>
          <p>
            Any measurement cards, size notes, or styling photographs shared via our digital atelier or WhatsApp concierge are stored securely in our encrypted customer profiles. These files are strictly accessed by authorized master cutters and senior patternmakers solely to execute your tailoring with millimeter precision.
          </p>
          <p>
            You may request the permanent deletion or modification of your bespoke size record at any time by contacting our atelier concierge.
          </p>
        </>
      ),
    },
    {
      id: 'purpose-of-processing',
      number: '04',
      title: 'How We Utilize Your Information',
      content: (
        <>
          <p>Your information is processed for specific, legitimate, and transparent atelier operations:</p>
          <div className="legal-grid-boxes">
            <div className="legal-grid-box-item">
              <div className="legal-grid-box-title">1. Atelier Crafting & Dispatch</div>
              <p className="legal-grid-box-desc">
                Executing embroidery, cutting fabrics, quality inspection, packaging, and coordinated doorstep courier delivery.
              </p>
            </div>
            <div className="legal-grid-box-item">
              <div className="legal-grid-box-title">2. White-Glove Concierge</div>
              <p className="legal-grid-box-desc">
                Answering sizing inquiries via WhatsApp or phone, delivering order status updates, and assisting with alteration bookings.
              </p>
            </div>
            <div className="legal-grid-box-item">
              <div className="legal-grid-box-title">3. Payment Confirmation</div>
              <p className="legal-grid-box-desc">
                Validating legitimate transactions, preventing fraudulent identity theft, and issuing GST-compliant tax invoices.
              </p>
            </div>
            <div className="legal-grid-box-item">
              <div className="legal-grid-box-title">4. Boutique Experience Refinement</div>
              <p className="legal-grid-box-desc">
                Optimizing our visual catalog, enhancing loading performance, and saving your wishlist and shopping bag across visits.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'payment-security',
      number: '05',
      title: 'Payment Protection & Financial Security',
      content: (
        <>
          <p>
            Client financial security is foundational to our enterprise. All digital transactions executed on Zaymera are processed through RBI-authorized, <strong>PCI-DSS Level 1 Compliant</strong> payment gateways (such as Razorpay, Cashfree, or Stripe) with 256-bit TLS bank-grade encryption.
          </p>
          <div className="legal-callout-white flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#9B2242] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5C5045]">
              <strong>No Card Data Stored:</strong> ZAYMERA does not capture, store, or hold your Credit/Debit Card numbers, CVV codes, or net banking PINs on our servers. All transaction tokens are held exclusively by the certified payment gateway.
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'information-sharing',
      number: '06',
      title: 'Information Sharing & Vetted Third Parties',
      content: (
        <>
          <p>
            We only disclose customer data to reputable, vetted third parties who are strictly required to fulfill your orders:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-[#C5A059]">
            <li>
              <strong>Premium Logistics Partners:</strong> Tier-one express couriers (e.g., Blue Dart, Delhivery, DHL Express) receive solely your name, delivery address, and contact number to execute insured transit.
            </li>
            <li>
              <strong>Cloud Infrastructure & Authentication:</strong> Secure database and authentication services (Supabase & Google Cloud) that safeguard your login credentials and purchase records.
            </li>
            <li>
              <strong>Statutory & Regulatory Authorities:</strong> Where mandated by applicable law, tax regulation, or valid court order under the laws of India.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'cookies-policy',
      number: '07',
      title: 'Cookies & Session Memory',
      content: (
        <>
          <p>
            Our website uses lightweight first-party cookies and browser local storage mechanisms to:
          </p>
          <ul className="list-disc pl-5 space-y-1 marker:text-[#9B2242]">
            <li>Keep your shopping bag active while browsing different garments.</li>
            <li>Maintain your wishlist and recently viewed ensemble items.</li>
            <li>Remember your login session securely without requiring repetitive authentication.</li>
          </ul>
          <p className="mt-2">
            You can configure your browser to decline cookies, although doing so may impair the ability to add items to the cart or complete checkout.
          </p>
        </>
      ),
    },
    {
      id: 'data-retention-rights',
      number: '08',
      title: 'Your Privacy Rights & Account Controls',
      content: (
        <>
          <p>
            Under the Digital Personal Data Protection Act (DPDPA) and international consumer privacy frameworks, you maintain complete sovereignty over your information:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-[#9B2242]">
            <li>
              <strong>Right to Access & Review:</strong> You may request a comprehensive copy of all personal records and measurement profiles associated with your account.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You may request instant correction of inaccurate addresses, contact numbers, or tailoring notes.
            </li>
            <li>
              <strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You can request complete deletion of your customer account and personal data, subject only to statutory tax retention obligations.
            </li>
            <li>
              <strong>Marketing Communication Opt-Out:</strong> We will never spam your inbox or phone. You can unsubscribe from seasonal lookbooks or preview notifications at any time.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'contact-officer',
      number: '09',
      title: 'Privacy Concierge & Grievance Redressal',
      content: (
        <>
          <p>
            For any queries, privacy concerns, or requests regarding the processing of your personal data, please contact our designated Atelier Data Protection Liaison:
          </p>
          <div className="legal-callout-white space-y-2 text-xs">
            <p><strong>Entity:</strong> ZAYMERA Haute Couture Atelier</p>
            <p><strong>Concierge Telephone:</strong> {SITE_CONFIG.conciergePhone} (Mon–Sat, 10:00 AM – 9:00 PM IST)</p>
            <p><strong>Direct Privacy Email:</strong> <a href={`mailto:${SITE_CONFIG.conciergeEmail}`} className="text-[#9B2242] underline">{SITE_CONFIG.conciergeEmail}</a></p>
            <p><strong>Physical Address:</strong> {SITE_CONFIG.address}</p>
          </div>
        </>
      ),
    },
  ];

  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="Our commitment to safeguarding your identity, bespoke tailoring measurements, and personal data with discretion and integrity."
      lastUpdated="Effective: September 2026 (v2.4)"
      activeTab="privacy"
      sections={sections}
    />
  );
}
