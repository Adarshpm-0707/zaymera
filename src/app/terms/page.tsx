'use client';

import React from 'react';
import { LegalPageShell, PolicySection } from '@/components/legal/LegalPageShell';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { Sparkles } from 'lucide-react';

export default function TermsPage() {
  const sections: PolicySection[] = [
    {
      id: 'acceptance-of-terms',
      number: '01',
      title: 'Acceptance of Atelier Terms',
      content: (
        <>
          <p>
            Welcome to <strong>{SITE_CONFIG.name} Haute Couture</strong> (&ldquo;Zaymera&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By accessing our boutique website, commissioning made-to-measure ensembles, purchasing ready-to-wear garments, or consulting with our personal styling concierge, you agree to be bound by these Terms and Conditions.
          </p>
          <p>
            Please read these terms carefully prior to completing any transaction. If you do not agree with any provision contained herein, we advise discontinuing use of our digital salon.
          </p>
        </>
      ),
    },
    {
      id: 'handcrafted-nuances',
      number: '02',
      title: 'Handcrafted Nuances & Fabric Color Variance',
      content: (
        <>
          <p>
            At ZAYMERA, our garments are artisanal creations handcrafted with natural silks, organzas, tissue blends, hand-embroidered zardozi, and resham threads.
          </p>
          <div className="legal-callout-gold space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9B2242]">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              Artisan Weave Characteristic:
            </div>
            <p className="text-xs text-[#6B5E52] leading-relaxed">
              Minor irregularities in yarn thickness, weave texture, dye saturation, or hand-embroidery alignment are intrinsic hallmarks of genuine handloom craftsmanship and should not be construed as defects.
            </p>
          </div>
          <p>
            <strong>Display Color Variation:</strong> While our studio photography is calibrated to represent colors with utmost fidelity, variations in personal display screens, ambient lighting, and device color gamuts may yield subtle variances between digital imagery and the physical garment.
          </p>
        </>
      ),
    },
    {
      id: 'pricing-and-taxes',
      number: '03',
      title: 'Pricing, Currency & Statutory Taxes',
      content: (
        <>
          <p>
            All prices displayed on our website are denominated in <strong>Indian National Rupees (INR ₹)</strong> and are inclusive of applicable Goods and Services Tax (GST) unless explicitly noted otherwise.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-[#9B2242]">
            <li>
              <strong>Complimentary Shipping:</strong> Orders qualifying under our current atelier promotional threshold ({SITE_CONFIG.shippingAnnouncement}) receive complimentary standard insured courier delivery across India.
            </li>
            <li>
              <strong>Price Adjustments:</strong> We reserve the right to revise catalog prices for raw fabric and embroidery cost fluctuations without prior notice. However, confirmed orders will strictly be honored at the price recorded upon checkout.
            </li>
            <li>
              <strong>International Orders & Customs:</strong> Any cross-border customs tariffs, value-added taxes, or import levies assessed by destination customs authorities remain the sole responsibility of the client.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'order-processing-sizing',
      number: '04',
      title: 'Bespoke Orders, Sizing & Cancellations',
      content: (
        <>
          <p>
            <strong>Order Acceptance:</strong> Receipt of an electronic order confirmation constitutes acknowledgment of your request. Contractual acceptance is confirmed once fabric inspection and tailoring scheduling commence.
          </p>
          <p>
            <strong>Bespoke Sizing Verification:</strong> For customized ensembles, our concierge stylist may reach out via WhatsApp or telephone to re-verify your measurements prior to cutting pattern blocks. Timely responses ensure we meet the projected delivery date.
          </p>
          <div className="legal-callout-white">
            <p className="text-xs text-[#5C5045]">
              <strong>Cancellation Window:</strong> Orders for standard ready-to-wear pieces may be canceled within <strong>24 hours</strong> of placement for a 100% full refund. For custom-tailored or bespoke bridal ensembles, cancellations cannot be accepted once fabric cutting and hand-embroidery work have commenced.
            </p>
          </div>
        </>
      ),
    },
    {
      id: 'shipping-and-dispatch',
      number: '05',
      title: 'Dispatch Timelines & Insured Delivery',
      content: (
        <>
          <p>
            We take extreme care in packaging your couture pieces in signature archival dust covers and tamper-evident packaging:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-[#C5A059]">
            <li>
              <strong>Ready-to-Wear Pieces:</strong> Typically dispatched from our atelier within 2 to 4 business days.
            </li>
            <li>
              <strong>Bespoke & Made-to-Order Pieces:</strong> Crafted individually by our master artisans with a production window of 10 to 21 business days, depending on embroidery intricacy.
            </li>
            <li>
              <strong>Transit Insurance:</strong> All domestic shipments are fully insured until handover. We strongly recommend inspecting the outer seal upon receipt and requesting OTP validation with courier personnel.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'returns-and-alterations',
      number: '06',
      title: 'Returns, Alterations & Exchange Covenant',
      content: (
        <>
          <p>
            We strive for perfection in every silhouette. In the event an item requires adjustment:
          </p>
          <div className="legal-grid-boxes">
            <div className="legal-grid-box-item">
              <div className="legal-grid-box-title">1. Ready-to-Wear Ensembles</div>
              <p className="legal-grid-box-desc">
                Standard catalog pieces may be returned or exchanged within <strong>7 calendar days</strong> of delivery, provided the garment is unworn, unwashed, unaltered, and retained with all original atelier security tags intact.
              </p>
            </div>
            <div className="legal-grid-box-item">
              <div className="legal-grid-box-title">2. Custom-Tailored & Bespoke Pieces</div>
              <p className="legal-grid-box-desc">
                Because made-to-measure pieces are drafted uniquely to individual anatomical measurements, they are <em>non-refundable</em>. However, we offer <strong>one complimentary fitting alteration</strong> within 14 days of delivery.
              </p>
            </div>
          </div>
          <p>
            To initiate an alteration or return, simply notify our concierge team on WhatsApp ({SITE_CONFIG.conciergePhone}) with your order number and fitting notes.
          </p>
        </>
      ),
    },
    {
      id: 'intellectual-property',
      number: '07',
      title: 'Haute Couture Intellectual Property & Copyrights',
      content: (
        <>
          <p>
            All visual content, garment designs, embroidery patterns, silhouette cuts, catalog photography, brand trademarks, emblems, and editorial copy featured on this platform are the exclusive intellectual property of <strong>ZAYMERA Haute Couture</strong>.
          </p>
          <p>
            Any unauthorized duplication, commercial replication of designs, scraping of imagery, or counterfeit production constitutes an infringement of applicable trademark and copyright statutes and will be subject to civil and criminal legal recourse.
          </p>
        </>
      ),
    },
    {
      id: 'limitation-of-liability',
      number: '08',
      title: 'Limitation of Liability & Force Majeure',
      content: (
        <>
          <p>
            While we exercise rigorous quality controls, ZAYMERA shall not be held liable for indirect, incidental, or consequential damages resulting from website unavailability, courier transit delays attributable to customs or climate emergencies (force majeure), or client dry-cleaning and fabric mishandling contradictory to our care guidelines.
          </p>
          <p>
            Our aggregate liability for any verifiable claim under an order shall never exceed the actual purchase price paid by the customer for the specific item in question.
          </p>
        </>
      ),
    },
    {
      id: 'governing-law',
      number: '09',
      title: 'Governing Law & Legal Jurisdiction',
      content: (
        <>
          <p>
            These Terms and Conditions shall be interpreted, construed, and enforced in accordance with the substantive laws of <strong>India</strong>.
          </p>
          <p>
            Any dispute, controversy, or claim arising out of or relating to this agreement shall be submitted to the exclusive jurisdiction of the competent courts having territorial jurisdiction over our registered atelier headquarters.
          </p>
        </>
      ),
    },
    {
      id: 'concierge-assistance',
      number: '10',
      title: 'Client Concierge & Formal Notices',
      content: (
        <>
          <p>
            If you require bespoke clarification regarding sizing, alterations, fabric selection, or these Terms and Conditions, our dedicated concierge team is at your disposal:
          </p>
          <div className="legal-callout-white space-y-2 text-xs">
            <p><strong>Atelier:</strong> {SITE_CONFIG.name} Haute Couture</p>
            <p><strong>Direct Concierge:</strong> {SITE_CONFIG.conciergePhone}</p>
            <p><strong>Legal & Client Inquiries:</strong> <a href={`mailto:${SITE_CONFIG.conciergeEmail}`} className="text-[#9B2242] underline">{SITE_CONFIG.conciergeEmail}</a></p>
            <p><strong>Operating Hours:</strong> Monday – Saturday, 10:00 AM – 9:00 PM IST</p>
          </div>
        </>
      ),
    },
  ];

  return (
    <LegalPageShell
      title="Terms & Conditions"
      subtitle="The principles governing your acquisition of handcrafted couture, custom tailoring covenants, shipping, and atelier client care."
      lastUpdated="Effective: September 2026 (v2.4)"
      activeTab="terms"
      sections={sections}
    />
  );
}
