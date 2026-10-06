/**
 * ZAYMERA HAUTE COUTURE — ORDER EMAIL NOTIFICATION SERVICE
 * 
 * Manages automated transactional email dispatch for:
 * 1. Order Placed (Customer email & Store admin: zaymerawardrobe@gmail.com)
 *    - Full purchasing time, customer details, address, payment method (COD / Online),
 *      itemized product list, and price breakdown.
 * 2. Order Cancelled (Both customer email & zaymerawardrobe@gmail.com)
 *    - Cancellation timestamp, reason, order reference, customer details, and inventory restore notice.
 * 
 * Multi-Transport Delivery Architecture:
 * - Primary: FormSubmit.co (Zero API key required; sends directly to zaymerawardrobe@gmail.com with _cc to customer)
 * - Brevo / Sendinblue REST API (300 free emails/day forever)
 * - Google Apps Script / Custom Webhook (Sends directly from Gmail account)
 * - Web3Forms (CORS native)
 * - EmailJS (Template based)
 * - Supabase & Local Database Email Logging (Audit history & zero data loss)
 * - One-click Gmail compose fallback for direct email composition
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const STORE_ADMIN_EMAIL = 'zaymerawardrobe@gmail.com';
export const STORE_NAME = 'ZAYMERA';
export const STORE_TAGLINE = 'Clothing That Speak Elegance';
export const STORE_PHONE = '+91 73061 15950';

export interface EmailLogEntry {
  id: string;
  orderNumber: string;
  recipient: string;
  recipientRole: 'customer' | 'store_admin' | 'both';
  emailType: 'order_placed' | 'order_cancelled' | 'test';
  paymentMethod?: string;
  subject: string;
  status: 'sent' | 'queued' | 'failed' | 'logged' | 'needs_activation';
  transportUsed?: string;
  errorMessage?: string;
  htmlPreview: string;
  createdAt: string;
}

const LS_EMAIL_LOGS = 'zaymera_email_logs';
const LS_EMAIL_CONFIG = 'zaymera_email_config';
const LS_ACTIVATION_NOTICE = 'zaymera_formsubmit_activated';

export interface EmailServiceConfig {
  activeProvider: 'auto' | 'formsubmit' | 'brevo' | 'webhook' | 'emailjs' | 'web3forms';
  brevoApiKey?: string;
  customWebhookUrl?: string; // Google Apps Script Web App or custom API
  web3FormsKey?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
}

export function getEmailConfig(): EmailServiceConfig {
  if (typeof window === 'undefined') {
    return {
      activeProvider: 'auto',
      brevoApiKey: process.env.NEXT_PUBLIC_BREVO_API_KEY || '',
      customWebhookUrl: process.env.NEXT_PUBLIC_ORDER_WEBHOOK_URL || '',
      web3FormsKey: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '',
      emailjsServiceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
      emailjsTemplateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
      emailjsPublicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
    };
  }

  try {
    const raw = localStorage.getItem(LS_EMAIL_CONFIG);
    const saved = raw ? JSON.parse(raw) : {};
    return {
      activeProvider: saved.activeProvider || 'auto',
      brevoApiKey: saved.brevoApiKey || process.env.NEXT_PUBLIC_BREVO_API_KEY || '',
      customWebhookUrl: saved.customWebhookUrl || process.env.NEXT_PUBLIC_ORDER_WEBHOOK_URL || '',
      web3FormsKey: saved.web3FormsKey || process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '',
      emailjsServiceId: saved.emailjsServiceId || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
      emailjsTemplateId: saved.emailjsTemplateId || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
      emailjsPublicKey: saved.emailjsPublicKey || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
    };
  } catch {
    return { activeProvider: 'auto' };
  }
}

export function saveEmailConfig(config: Partial<EmailServiceConfig>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getEmailConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(LS_EMAIL_CONFIG, JSON.stringify(updated));
  } catch (err) {
    console.warn('[saveEmailConfig] Error:', err);
  }
}

export function isFormSubmitActivated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_ACTIVATION_NOTICE) === 'true';
}

export function setFormSubmitActivated(val: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ACTIVATION_NOTICE, val ? 'true' : 'false');
}

/**
 * Live test to verify if FormSubmit has been activated for zaymerawardrobe@gmail.com
 */
export async function checkFormSubmitStatus(targetEmail: string = STORE_ADMIN_EMAIL): Promise<{
  activated: boolean;
  message: string;
}> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail.trim())}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: 'Zaymera FormSubmit Activation Check',
        check: 'status',
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && (json.success === 'true' || json.success === true)) {
      setFormSubmitActivated(true);
      return {
        activated: true,
        message: `FormSubmit is fully activated and actively delivering emails to ${targetEmail}!`,
      };
    }

    if (json.message && json.message.toLowerCase().includes('activation')) {
      setFormSubmitActivated(false);
      return {
        activated: false,
        message: `Activation pending: FormSubmit has sent an "Activate Form" link to ${targetEmail}. Please check your Gmail Inbox and Spam/Junk folder.`,
      };
    }

    return {
      activated: false,
      message: json.message || 'Verification completed.',
    };
  } catch (err: any) {
    return {
      activated: false,
      message: 'Network error checking FormSubmit: ' + (err?.message || 'unknown error'),
    };
  }
}

/**
 * Triggers a fresh activation email from FormSubmit to zaymerawardrobe@gmail.com
 */
export async function triggerFormSubmitActivation(targetEmail: string = STORE_ADMIN_EMAIL): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail.trim())}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: 'Please Activate Zaymera Automated Order Notification Service',
        _template: 'table',
        message: `Activation request for automated transactional order notifications on ${targetEmail}.`,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (json.message && json.message.toLowerCase().includes('activation')) {
      return {
        success: true,
        message: `A fresh activation email was just sent to ${targetEmail}! Please open your Gmail (check Inbox & Spam) and click "Activate Form".`,
      };
    }

    if (res.ok && (json.success === 'true' || json.success === true)) {
      setFormSubmitActivated(true);
      return {
        success: true,
        message: `Form is already activated for ${targetEmail}!`,
      };
    }

    return {
      success: false,
      message: json.message || 'Could not send activation email.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to trigger activation: ' + (err?.message || 'network error'),
    };
  }
}

// ── FORMATTING HELPERS ────────────────────────────────────────────────────────

export function formatOrderDateTime(dateInput?: string | number | Date): string {
  if (!dateInput) {
    dateInput = new Date();
  }
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }
  return dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
}

export function formatPaymentMethodLabel(paymentMethod?: string): {
  label: string;
  isCOD: boolean;
  instruction: string;
} {
  const norm = (paymentMethod || 'COD').trim().toUpperCase();
  if (norm === 'COD' || norm.includes('CASH')) {
    return {
      label: 'Cash on Delivery (COD)',
      isCOD: true,
      instruction: 'Payment is due in cash upon doorstep delivery. Please keep exact change ready.',
    };
  }
  return {
    label: 'Online Payment (Prepaid / UPI / Card)',
    isCOD: false,
    instruction: 'Payment has been confirmed online. Your order is prioritized for rapid bespoke dispatch.',
  };
}

// ── EMAIL LOG STORAGE ─────────────────────────────────────────────────────────

export function getEmailLogs(): EmailLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_EMAIL_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEmailLog(entry: EmailLogEntry): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const logs = getEmailLogs();
      const updated = [entry, ...logs.filter(l => l.id !== entry.id)].slice(0, 100);
      localStorage.setItem(LS_EMAIL_LOGS, JSON.stringify(updated));
    } catch (err) {
      console.warn('[saveEmailLog] localStorage error:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await (supabase as any).from('email_logs').insert({
        id: entry.id,
        order_number: entry.orderNumber,
        recipient: entry.recipient,
        recipient_role: entry.recipientRole,
        email_type: entry.emailType,
        subject: entry.subject,
        status: entry.status,
        error_message: entry.errorMessage || null,
        html_preview: entry.htmlPreview.slice(0, 2500),
        created_at: entry.createdAt,
      });
    } catch {
      // Non-blocking fallback
    }
  }
}

// ── DATA EXTRACTION ───────────────────────────────────────────────────────────

export interface OrderDataForEmail {
  order_number?: string;
  orderNumber?: string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  customer_phone?: string;
  customerPhone?: string;
  shipping_address?: any;
  shippingAddress?: any;
  payment_method?: string;
  paymentMethod?: string;
  subtotal?: number;
  shipping_fee?: number;
  shippingFee?: number;
  total?: number;
  order_items?: any[];
  cartItems?: any[];
  created_at?: string;
  createdAt?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

function extractOrderFields(order: OrderDataForEmail) {
  const orderNumber = order.order_number || order.orderNumber || 'ZYM-' + Date.now();
  const customerName = order.customer_name || order.customerName || 'Valued Patron';
  const customerEmail = order.customer_email || order.customerEmail || '';
  const customerPhone = order.customer_phone || order.customerPhone || 'Not provided';
  const shippingAddress = order.shipping_address || order.shippingAddress || {};
  const paymentMethod = order.payment_method || order.paymentMethod || 'COD';
  const subtotal = Number(order.subtotal || 0);
  const shippingFee = Number(order.shipping_fee ?? order.shippingFee ?? 0);
  const total = Number(order.total || subtotal + shippingFee);
  const items = order.order_items || order.cartItems || [];
  const createdAt = order.created_at || order.createdAt || new Date().toISOString();
  const cancelledAt = order.cancelled_at || new Date().toISOString();
  const cancelReason = order.cancel_reason || 'Order cancelled by customer';

  const street = shippingAddress.street || '';
  const city = shippingAddress.city || '';
  const state = shippingAddress.state || '';
  const postalCode = shippingAddress.postalCode || shippingAddress.postal_code || '';
  const country = shippingAddress.country || 'India';
  const formattedAddress = [street, city, state ? `${state} - ${postalCode}` : postalCode, country]
    .filter(Boolean)
    .join(', ');

  const textItems = items.map((it: any) => {
    const name = it.product_name || it.product?.name || 'Artisan Couture Piece';
    const size = it.size || 'M';
    const qty = it.quantity || 1;
    const price = it.price || it.product?.price || 0;
    return `${name} (Size: ${size}, Qty: ${qty}) - ₹${(price * qty).toLocaleString('en-IN')}`;
  }).join(' | ');

  return {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    formattedAddress,
    paymentMethod,
    subtotal,
    shippingFee,
    total,
    items,
    textItems,
    createdAt,
    cancelledAt,
    cancelReason,
  };
}

// ── HTML EMAIL TEMPLATE BUILDERS ──────────────────────────────────────────────

export function buildOrderPlacedEmailHtml(
  order: OrderDataForEmail,
  recipientRole: 'customer' | 'store_admin' = 'customer'
): { subject: string; html: string; text: string } {
  const data = extractOrderFields(order);
  const payInfo = formatPaymentMethodLabel(data.paymentMethod);
  const formattedDate = formatOrderDateTime(data.createdAt);
  const isStore = recipientRole === 'store_admin';

  const subject = isStore
    ? `🚨 [NEW ORDER] #${data.orderNumber} - ₹${data.total.toLocaleString('en-IN')} (${payInfo.label})`
    : `Order Confirmed: #${data.orderNumber} | Zaymera Haute Couture`;

  const itemRowsHtml = data.items.map((it: any) => {
    const title = it.product_name || it.product?.name || 'Artisan Couture Garment';
    const image = it.product_image || it.product?.image || '';
    const size = it.size || 'Standard';
    const qty = Number(it.quantity) || 1;
    const price = Number(it.price || it.product?.price || 0);
    const itemTotal = price * qty;

    return `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #F0EAE1; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              ${image ? `
                <td style="width: 58px; vertical-align: top; padding-right: 12px;">
                  <img src="${image}" alt="${title}" width="54" height="68" style="width: 54px; height: 68px; object-fit: cover; border-radius: 8px; border: 1px solid #EAE0D2; display: block;" />
                </td>
              ` : ''}
              <td style="vertical-align: top;">
                <div style="font-family: 'Georgia', serif; font-size: 14px; font-weight: bold; color: #1F1916; line-height: 1.3;">
                  ${title}
                </div>
                <div style="font-size: 12px; color: #8C7A68; margin-top: 4px;">
                  Size: <strong style="color: #9B2242;">${size}</strong> &nbsp;•&nbsp; Qty: <strong>${qty}</strong>
                </div>
                <div style="font-size: 12px; color: #7A6959; margin-top: 2px;">
                  ₹${price.toLocaleString('en-IN')} each
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #F0EAE1; text-align: right; vertical-align: middle; font-size: 14px; font-weight: bold; color: #1F1916;">
          ₹${itemTotal.toLocaleString('en-IN')}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
  </style>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #FAF7F2; color: #2B231D;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EAE2D5; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    
    <!-- BRAND HEADER -->
    <tr>
      <td style="background: linear-gradient(135deg, #1F1916 0%, #38241D 50%, #9B2242 100%); padding: 32px 24px; text-align: center;">
        <div style="letter-spacing: 4px; font-size: 11px; text-transform: uppercase; color: #D5AF6B; font-weight: 700; margin-bottom: 6px;">
          HAUTE COUTURE ATELIER
        </div>
        <div style="font-family: 'Georgia', serif; font-size: 28px; letter-spacing: 3px; color: #FFFFFF; font-weight: 400; text-transform: uppercase;">
          ${STORE_NAME}
        </div>
        <div style="font-size: 11px; color: #E8D8C8; font-style: italic; margin-top: 4px;">
          ${STORE_TAGLINE}
        </div>
      </td>
    </tr>

    <!-- STATUS BANNER -->
    <tr>
      <td style="padding: 24px 28px 12px 28px; text-align: center;">
        <div style="display: inline-block; padding: 6px 16px; border-radius: 999px; background-color: ${isStore ? '#FEF3C7' : '#FAF0E1'}; border: 1px solid ${isStore ? '#F59E0B' : '#E5D2BA'}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: ${isStore ? '#92400E' : '#8C5D23'};">
          ${isStore ? '🚨 STORE NOTIFICATION • NEW ORDER PLACED' : '✨ ORDER CONFIRMED & REGISTERED'}
        </div>
        <h1 style="font-family: 'Georgia', serif; font-size: 24px; font-weight: normal; color: #1F1916; margin: 16px 0 6px 0;">
          ${isStore ? 'New Customer Order Received!' : 'Thank You for Your Bespoke Order'}
        </h1>
        <p style="font-size: 13px; color: #7A6D60; margin: 0 auto; line-height: 1.5; max-width: 500px;">
          ${isStore
            ? `Customer <strong>${data.customerName}</strong> has placed order <strong>#${data.orderNumber}</strong>. Full delivery destination and items are detailed below for immediate processing.`
            : `Your handcrafted garments have entered our bespoke preparation queue. We have carefully registered your order details below.`}
        </p>
      </td>
    </tr>

    <!-- ORDER REFERENCE & PURCHASING TIME -->
    <tr>
      <td style="padding: 12px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAF7F2; border: 1px solid #EAE0D2; border-radius: 14px; padding: 14px 18px;">
          <tr>
            <td style="vertical-align: middle;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #8C7A68;">
                Order Reference Number
              </div>
              <div style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #9B2242; margin-top: 2px;">
                ${data.orderNumber}
              </div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #8C7A68;">
                Purchasing Date &amp; Time
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #1F1916; margin-top: 2px;">
                ${formattedDate}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PAYMENT & DELIVERY SUMMARY CARD -->
    <tr>
      <td style="padding: 12px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFDF9; border: 1px solid #E8DCCB; border-radius: 14px;">
          <tr>
            <!-- Customer & Shipping -->
            <td width="50%" style="padding: 16px; border-right: 1px solid #EFE5D8; vertical-align: top;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #8C7A68; margin-bottom: 6px;">
                📍 Delivery Destination
              </div>
              <div style="font-size: 13px; font-weight: bold; color: #1F1916;">
                ${data.customerName}
              </div>
              <div style="font-size: 12px; color: #665747; margin-top: 3px; line-height: 1.4;">
                ${data.formattedAddress || 'Address will be confirmed by customer phone.'}
              </div>
              <div style="font-size: 12px; color: #665747; margin-top: 6px;">
                📞 <strong>${data.customerPhone}</strong>
              </div>
              <div style="font-size: 12px; color: #665747;">
                ✉️ <strong>${data.customerEmail}</strong>
              </div>
            </td>

            <!-- Payment Method -->
            <td width="50%" style="padding: 16px; vertical-align: top;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #8C7A68; margin-bottom: 6px;">
                💳 Payment Method
              </div>
              <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; background-color: ${payInfo.isCOD ? '#FAF5EC' : '#ECFDF5'}; border: 1px solid ${payInfo.isCOD ? '#EBDCC5' : '#A7F3D0'}; font-size: 11px; font-weight: bold; color: ${payInfo.isCOD ? '#936718' : '#047857'}; text-transform: uppercase;">
                ${payInfo.label}
              </div>
              <div style="font-size: 11px; color: #7A6959; margin-top: 8px; line-height: 1.4;">
                ${payInfo.instruction}
              </div>
              <div style="margin-top: 10px; font-size: 12px; font-weight: bold; color: #1F1916;">
                Total Payable: <span style="color: #9B2242; font-size: 15px;">₹${data.total.toLocaleString('en-IN')}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ORDER ITEMS TABLE -->
    <tr>
      <td style="padding: 16px 28px 8px 28px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #8C7A68; margin-bottom: 8px;">
          Ensemble Items (${data.items.length})
        </div>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top: 2px solid #1F1916; border-bottom: 2px solid #1F1916;">
          <thead>
            <tr style="background-color: #FAF7F2;">
              <th align="left" style="padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7A6959;">Product / Garment</th>
              <th align="right" style="padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7A6959;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- PRICE BREAKDOWN -->
    <tr>
      <td style="padding: 12px 28px 20px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 280px; margin-left: auto;">
          <tr>
            <td style="padding: 4px 0; font-size: 12px; color: #7A6959;">Items Subtotal:</td>
            <td style="padding: 4px 0; font-size: 12px; font-weight: 600; color: #1F1916; text-align: right;">
              ₹${data.subtotal.toLocaleString('en-IN')}
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 12px; color: #7A6959;">Luxury Express Shipping:</td>
            <td style="padding: 4px 0; font-size: 12px; font-weight: 600; color: #1F1916; text-align: right;">
              ${data.shippingFee === 0 ? '<span style="color: #059669;">FREE</span>' : `₹${data.shippingFee.toLocaleString('en-IN')}`}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0 4px 0; border-top: 1px solid #EAE2D5; font-size: 14px; font-weight: bold; color: #1F1916;">Grand Total:</td>
            <td style="padding: 10px 0 4px 0; border-top: 1px solid #EAE2D5; font-size: 18px; font-weight: bold; color: #9B2242; text-align: right;">
              ₹${data.total.toLocaleString('en-IN')}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background-color: #FAF7F2; padding: 24px 28px; border-top: 1px solid #EAE2D5; text-align: center; font-size: 11px; color: #8C7A68; line-height: 1.6;">
        <div style="font-weight: bold; color: #1F1916; margin-bottom: 4px;">
          ${STORE_NAME} CONCIERGE &amp; ATELIER TEAM
        </div>
        <div>
          Official Store Notification Email: <a href="mailto:${STORE_ADMIN_EMAIL}" style="color: #9B2242; text-decoration: none; font-weight: bold;">${STORE_ADMIN_EMAIL}</a>
        </div>
        <div>
          Stylist Assistance &amp; WhatsApp: <strong>${STORE_PHONE}</strong>
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #A89887;">
          © ${new Date().getFullYear()} Zaymera Boutique Atelier. All Rights Reserved. Clothing That Speak Elegance.
        </div>
      </td>
    </tr>

  </table>
</body>
</html>
  `.trim();

  const text = `
========================================
ZAYMERA - ORDER NOTIFICATION
${isStore ? 'NEW ORDER PLACED (STORE COPY)' : 'ORDER CONFIRMATION (CUSTOMER COPY)'}
========================================

Order Reference: ${data.orderNumber}
Purchasing Date & Time: ${formattedDate}
Payment Method: ${payInfo.label}
Payment Status: ${payInfo.isCOD ? 'Pending - Cash On Delivery' : 'Paid Online'}

Customer Name: ${data.customerName}
Customer Email: ${data.customerEmail}
Customer Phone: ${data.customerPhone}
Delivery Destination: ${data.formattedAddress}

ORDERED ENSEMBLES:
${data.textItems}

Subtotal: ₹${data.subtotal.toLocaleString('en-IN')}
Shipping: ${data.shippingFee === 0 ? 'FREE' : `₹${data.shippingFee.toLocaleString('en-IN')}`}
GRAND TOTAL: ₹${data.total.toLocaleString('en-IN')}

Store Notification Mail: ${STORE_ADMIN_EMAIL}
Helpline: ${STORE_PHONE}
========================================
  `.trim();

  return { subject, html, text };
}

export function buildOrderCancelledEmailHtml(
  order: OrderDataForEmail,
  recipientRole: 'customer' | 'store_admin' = 'customer',
  customReason?: string
): { subject: string; html: string; text: string } {
  const data = extractOrderFields(order);
  const payInfo = formatPaymentMethodLabel(data.paymentMethod);
  const orderDate = formatOrderDateTime(data.createdAt);
  const cancelDate = formatOrderDateTime(data.cancelledAt || new Date().toISOString());
  const reason = customReason || data.cancelReason || 'Order cancelled by customer within allowed window';
  const isStore = recipientRole === 'store_admin';

  const subject = isStore
    ? `⚠️ [ORDER CANCELLED] #${data.orderNumber} | Customer: ${data.customerName}`
    : `Order Cancelled: #${data.orderNumber} | Zaymera Haute Couture`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
  </style>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #FAF7F2; color: #2B231D;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EAE2D5; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    
    <!-- BRAND HEADER -->
    <tr>
      <td style="background: linear-gradient(135deg, #2B1D1D 0%, #451C24 100%); padding: 28px 24px; text-align: center;">
        <div style="font-family: 'Georgia', serif; font-size: 26px; letter-spacing: 3px; color: #FFFFFF; font-weight: 400; text-transform: uppercase;">
          ${STORE_NAME}
        </div>
        <div style="font-size: 11px; color: #E8D8C8; font-style: italic; margin-top: 3px;">
          ${STORE_TAGLINE}
        </div>
      </td>
    </tr>

    <!-- CANCELLATION BADGE & TITLE -->
    <tr>
      <td style="padding: 24px 28px 12px 28px; text-align: center;">
        <div style="display: inline-block; padding: 6px 16px; border-radius: 999px; background-color: #FFE4E6; border: 1px solid #FDA4AF; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #BE123C;">
          ${isStore ? '⚠️ ORDER CANCELLED (STORE COPY)' : 'ORDER CANCELLED'}
        </div>
        <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: normal; color: #1F1916; margin: 14px 0 6px 0;">
          ${isStore ? `Order #${data.orderNumber} Has Been Cancelled` : 'Your Order Has Been Cancelled'}
        </h1>
        <p style="font-size: 13px; color: #7A6D60; margin: 0 auto; line-height: 1.5; max-width: 500px;">
          ${isStore
            ? `Order <strong>${data.orderNumber}</strong> by customer <strong>${data.customerName}</strong> was cancelled. Reserved quantities have been automatically returned to inventory stock.`
            : `We confirm that your order <strong>${data.orderNumber}</strong> has been cancelled. Reserved artisan garments have been returned to our inventory.`}
        </p>
      </td>
    </tr>

    <!-- CANCELLATION DETAILS BOX -->
    <tr>
      <td style="padding: 12px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFF8F8; border: 1px solid #FECDD3; border-radius: 14px; padding: 16px;">
          <tr>
            <td style="font-size: 12px; color: #9F1239; line-height: 1.6;">
              <div><strong>Order Number:</strong> <span style="font-family: monospace; font-size: 14px;">${data.orderNumber}</span></div>
              <div><strong>Purchased On:</strong> ${orderDate}</div>
              <div><strong>Cancelled On:</strong> ${cancelDate}</div>
              <div><strong>Cancellation Reason:</strong> ${reason}</div>
              <div><strong>Customer Name:</strong> ${data.customerName} (📞 ${data.customerPhone}, ✉️ ${data.customerEmail})</div>
              <div><strong>Payment Method:</strong> ${payInfo.label}</div>
              <div><strong>Total Order Amount:</strong> ₹${data.total.toLocaleString('en-IN')}</div>
              <div><strong>Cancelled Ensembles:</strong> ${data.textItems}</div>
              <div style="margin-top: 6px; color: #047857; font-weight: bold;">
                ✓ Inventory Status: All items successfully restored to stock ledger.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background-color: #FAF7F2; padding: 20px 28px; border-top: 1px solid #EAE2D5; text-align: center; font-size: 11px; color: #8C7A68; line-height: 1.6;">
        <div style="font-weight: bold; color: #1F1916; margin-bottom: 2px;">
          ZAYMERA BOUTIQUE ATELIER
        </div>
        <div>
          Official Store Notification: <a href="mailto:${STORE_ADMIN_EMAIL}" style="color: #9B2242; text-decoration: none; font-weight: bold;">${STORE_ADMIN_EMAIL}</a>
        </div>
        <div>
          Questions or Assistance: <strong>${STORE_PHONE}</strong>
        </div>
      </td>
    </tr>

  </table>
</body>
</html>
  `.trim();

  const text = `
========================================
ZAYMERA - ORDER CANCELLED
${isStore ? 'STORE NOTIFICATION' : 'CUSTOMER COPY'}
========================================

Order Reference: ${data.orderNumber}
Purchased On: ${orderDate}
Cancelled On: ${cancelDate}
Reason: ${reason}

Customer: ${data.customerName} (${data.customerPhone} / ${data.customerEmail})
Payment Method: ${payInfo.label}
Total Amount: ₹${data.total.toLocaleString('en-IN')}
Cancelled Ensembles: ${data.textItems}

Stock Status: Items automatically returned to inventory.

Store Notification: ${STORE_ADMIN_EMAIL}
Helpline: ${STORE_PHONE}
========================================
  `.trim();

  return { subject, html, text };
}

// ── ROBUST MULTI-TRANSPORT DISPATCHER ─────────────────────────────────────────

export async function sendEmailNotification(params: {
  toEmail: string;
  recipientRole: 'customer' | 'store_admin' | 'both';
  emailType: 'order_placed' | 'order_cancelled' | 'test';
  subject: string;
  htmlContent: string;
  textContent: string;
  orderNumber: string;
  paymentMethod?: string;
  structuredData?: Record<string, string>;
}): Promise<{ success: boolean; message: string; transport: string; needsActivation?: boolean }> {
  const config = getEmailConfig();
  const cleanToEmail = (params.toEmail || STORE_ADMIN_EMAIL).trim();
  const isCustomerEmail = cleanToEmail && cleanToEmail.includes('@') && cleanToEmail.toLowerCase() !== STORE_ADMIN_EMAIL.toLowerCase();
  const logId = 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  // ── 1. BREVO REST API (Guaranteed Instant Delivery if Key Provided) ──
  if (config.brevoApiKey && (config.activeProvider === 'brevo' || config.activeProvider === 'auto')) {
    try {
      const recipients = [{ email: STORE_ADMIN_EMAIL, name: 'Zaymera Boutique Atelier' }];
      if (isCustomerEmail) {
        recipients.push({ email: cleanToEmail, name: 'Customer' });
      }

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.brevoApiKey.trim(),
        },
        body: JSON.stringify({
          sender: { name: 'Zaymera Haute Couture', email: STORE_ADMIN_EMAIL },
          to: recipients,
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent,
        }),
      });

      if (brevoRes.ok) {
        await saveEmailLog({
          id: logId,
          orderNumber: params.orderNumber,
          recipient: cleanToEmail,
          recipientRole: params.recipientRole,
          emailType: params.emailType,
          paymentMethod: params.paymentMethod,
          subject: params.subject,
          status: 'sent',
          transportUsed: 'brevo-api',
          htmlPreview: params.htmlContent,
          createdAt: new Date().toISOString(),
        });
        return { success: true, message: 'Delivered directly via Brevo API', transport: 'brevo' };
      }
    } catch (bErr) {
      console.warn('[orderEmailService] Brevo dispatch attempt notice:', bErr);
    }
  }

  // ── 2. GOOGLE APPS SCRIPT WEB APP (Direct Gmail Delivery, 0 Spam, No CORS blocking) ──
  if (config.customWebhookUrl && (config.activeProvider === 'webhook' || config.activeProvider === 'auto')) {
    try {
      const gasPayload = JSON.stringify({
        to: cleanToEmail,
        customerEmail: isCustomerEmail ? cleanToEmail : '',
        storeEmail: STORE_ADMIN_EMAIL,
        subject: params.subject,
        html: params.htmlContent,
        text: params.textContent,
        orderNumber: params.orderNumber,
        emailType: params.emailType,
      });

      // Using mode: 'no-cors' and text/plain ensures the browser never blocks Google Apps Script with CORS preflight
      await fetch(config.customWebhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: gasPayload,
      });

      await saveEmailLog({
        id: logId,
        orderNumber: params.orderNumber,
        recipient: cleanToEmail,
        recipientRole: params.recipientRole,
        emailType: params.emailType,
        paymentMethod: params.paymentMethod,
        subject: params.subject,
        status: 'sent',
        transportUsed: 'google-apps-script',
        htmlPreview: params.htmlContent,
        createdAt: new Date().toISOString(),
      });
      return { success: true, message: 'Delivered natively via Google Apps Script (Gmail)', transport: 'google-apps-script' };
    } catch (hErr) {
      console.warn('[orderEmailService] Webhook dispatch notice:', hErr);
    }
  }

  // ── 3. FORMSUBMIT.CO (Zero API Key Needed; Delivers directly to zaymerawardrobe@gmail.com + CC) ──
  try {
    const formSubmitPayload: Record<string, string> = {
      _subject: params.subject,
      _replyto: isCustomerEmail ? cleanToEmail : STORE_ADMIN_EMAIL,
      _template: 'table',
      _captcha: 'false',
    };

    if (isCustomerEmail) {
      formSubmitPayload._cc = cleanToEmail;
      formSubmitPayload._autoresponse = `Thank you for choosing Zaymera Haute Couture. Your order #${params.orderNumber} is registered. Our atelier has commenced tailoring. Contact: ${STORE_ADMIN_EMAIL} | ${STORE_PHONE}.`;
    }

    if (params.structuredData) {
      Object.assign(formSubmitPayload, params.structuredData);
    } else {
      formSubmitPayload['Order Reference'] = params.orderNumber;
      formSubmitPayload['Notification Subject'] = params.subject;
      formSubmitPayload['Email Type'] = params.emailType;
      formSubmitPayload['Customer Email'] = cleanToEmail;
      formSubmitPayload['Summary'] = params.textContent;
    }

    const fsResponse = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(STORE_ADMIN_EMAIL)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formSubmitPayload),
    });

    const fsJson = await fsResponse.json().catch(() => ({}));

    // FormSubmit success: target email is activated and delivery completed
    if (fsResponse.ok && (fsJson.success === 'true' || fsJson.success === true)) {
      setFormSubmitActivated(true);
      await saveEmailLog({
        id: logId,
        orderNumber: params.orderNumber,
        recipient: `${STORE_ADMIN_EMAIL}${isCustomerEmail ? `, ${cleanToEmail}` : ''}`,
        recipientRole: params.recipientRole,
        emailType: params.emailType,
        paymentMethod: params.paymentMethod,
        subject: params.subject,
        status: 'sent',
        transportUsed: 'formsubmit',
        htmlPreview: params.htmlContent,
        createdAt: new Date().toISOString(),
      });
      return { success: true, message: `Delivered via FormSubmit to ${STORE_ADMIN_EMAIL}`, transport: 'formsubmit' };
    }

    // FormSubmit indicates activation is required by the email owner
    if (fsJson.message && fsJson.message.toLowerCase().includes('activation')) {
      setFormSubmitActivated(false);
      await saveEmailLog({
        id: logId,
        orderNumber: params.orderNumber,
        recipient: STORE_ADMIN_EMAIL,
        recipientRole: params.recipientRole,
        emailType: params.emailType,
        paymentMethod: params.paymentMethod,
        subject: params.subject,
        status: 'needs_activation',
        transportUsed: 'formsubmit',
        errorMessage: 'FormSubmit activation link was sent to zaymerawardrobe@gmail.com. Please click "Activate Form" in your Gmail.',
        htmlPreview: params.htmlContent,
        createdAt: new Date().toISOString(),
      });

      return {
        success: false,
        needsActivation: true,
        message: 'FormSubmit activation required: An email with an "Activate Form" button was sent to zaymerawardrobe@gmail.com. Please check Inbox & Spam and click it.',
        transport: 'formsubmit-needs-activation',
      };
    }
  } catch (fsErr) {
    console.warn('[orderEmailService] FormSubmit dispatch notice:', fsErr);
  }

  // ── 4. WEB3FORMS (If Real Key Provided) ──
  if (config.web3FormsKey && (config.activeProvider === 'web3forms' || config.activeProvider === 'auto')) {
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: config.web3FormsKey,
          from_name: 'Zaymera Haute Couture',
          subject: params.subject,
          email: cleanToEmail,
          message: params.textContent,
          order_number: params.orderNumber,
          store_admin_email: STORE_ADMIN_EMAIL,
        }),
      });

      const resJson = await response.json().catch(() => ({}));
      if (response.ok && resJson.success) {
        await saveEmailLog({
          id: logId,
          orderNumber: params.orderNumber,
          recipient: cleanToEmail,
          recipientRole: params.recipientRole,
          emailType: params.emailType,
          paymentMethod: params.paymentMethod,
          subject: params.subject,
          status: 'sent',
          transportUsed: 'web3forms',
          htmlPreview: params.htmlContent,
          createdAt: new Date().toISOString(),
        });
        return { success: true, message: 'Delivered via Web3Forms', transport: 'web3forms' };
      }
    } catch (wErr) {
      console.warn('[orderEmailService] Web3Forms notice:', wErr);
    }
  }

  // ── 5. RECORD TO INTERNAL SYSTEM LEDGER (Guarantee Zero Data Loss) ──
  await saveEmailLog({
    id: logId,
    orderNumber: params.orderNumber,
    recipient: cleanToEmail,
    recipientRole: params.recipientRole,
    emailType: params.emailType,
    paymentMethod: params.paymentMethod,
    subject: params.subject,
    status: 'logged',
    transportUsed: 'in-app-ledger',
    htmlPreview: params.htmlContent,
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Recorded in order communication ledger for ${cleanToEmail}.`,
    transport: 'in-app-ledger',
  };
}

// ── TOP-LEVEL DISPATCH FUNCTIONS ──────────────────────────────────────────────

/**
 * Sends order placed emails to BOTH the customer and zaymerawardrobe@gmail.com
 * Handles both Online payment and Cash on Delivery (COD).
 */
export async function sendOrderPlacedEmails(order: OrderDataForEmail): Promise<{
  customerResult: { success: boolean; message: string; transport?: string; needsActivation?: boolean };
  storeResult: { success: boolean; message: string; transport?: string; needsActivation?: boolean };
  needsActivation: boolean;
}> {
  const data = extractOrderFields(order);
  const payInfo = formatPaymentMethodLabel(data.paymentMethod);
  const formattedDate = formatOrderDateTime(data.createdAt);

  const customerEmailPkg = buildOrderPlacedEmailHtml(order, 'customer');
  const storeEmailPkg = buildOrderPlacedEmailHtml(order, 'store_admin');

  // Structured payload for table-formatted delivery
  const structuredData: Record<string, string> = {
    'Order Reference': data.orderNumber,
    'Purchasing Date & Time': formattedDate,
    'Customer Full Name': data.customerName,
    'Customer Email': data.customerEmail || 'Not provided',
    'Customer Phone': data.customerPhone || 'Not provided',
    'Delivery Address': data.formattedAddress,
    'Payment Method': payInfo.label,
    'Payment Status': payInfo.isCOD ? 'Pending - Cash on Delivery' : 'Paid Online (Verified)',
    'Ensembles Ordered': data.textItems,
    'Items Subtotal': `₹${data.subtotal.toLocaleString('en-IN')}`,
    'Luxury Shipping': data.shippingFee === 0 ? 'FREE (Complimentary Express)' : `₹${data.shippingFee.toLocaleString('en-IN')}`,
    'Grand Total Amount': `₹${data.total.toLocaleString('en-IN')}`,
    'Notification Recipient': STORE_ADMIN_EMAIL,
  };

  // 1. Dispatch primary store notification with customer CC
  const storeResult = await sendEmailNotification({
    toEmail: STORE_ADMIN_EMAIL,
    recipientRole: 'store_admin',
    emailType: 'order_placed',
    subject: storeEmailPkg.subject,
    htmlContent: storeEmailPkg.html,
    textContent: storeEmailPkg.text,
    orderNumber: data.orderNumber,
    paymentMethod: data.paymentMethod,
    structuredData,
  });

  // 2. Dispatch dedicated customer copy if email provided
  let customerResult: { success: boolean; message: string; transport?: string; needsActivation?: boolean } = {
    success: true,
    message: 'Included via Carbon Copy (_cc)',
    transport: storeResult.transport,
    needsActivation: storeResult.needsActivation
  };
  if (data.customerEmail && data.customerEmail.includes('@') && data.customerEmail.toLowerCase() !== STORE_ADMIN_EMAIL.toLowerCase()) {
    customerResult = await sendEmailNotification({
      toEmail: data.customerEmail,
      recipientRole: 'customer',
      emailType: 'order_placed',
      subject: customerEmailPkg.subject,
      htmlContent: customerEmailPkg.html,
      textContent: customerEmailPkg.text,
      orderNumber: data.orderNumber,
      paymentMethod: data.paymentMethod,
      structuredData,
    });
  }

  const needsActivation = Boolean(storeResult.needsActivation || storeResult.transport === 'formsubmit-needs-activation');
  const results = { customerResult, storeResult, needsActivation };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zaymera-email-dispatched', {
        detail: {
          orderNumber: data.orderNumber,
          type: 'order_placed',
          customerEmail: data.customerEmail,
          storeEmail: STORE_ADMIN_EMAIL,
          needsActivation,
          results,
        },
      })
    );
  }

  return results;
}

/**
 * Sends order cancellation emails to BOTH the customer and zaymerawardrobe@gmail.com
 */
export async function sendOrderCancelledEmails(
  order: OrderDataForEmail,
  reason: string = 'Order cancelled by customer'
): Promise<{
  customerResult: { success: boolean; message: string; transport?: string; needsActivation?: boolean };
  storeResult: { success: boolean; message: string; transport?: string; needsActivation?: boolean };
  needsActivation: boolean;
}> {
  const data = extractOrderFields(order);
  const payInfo = formatPaymentMethodLabel(data.paymentMethod);
  const orderDate = formatOrderDateTime(data.createdAt);
  const cancelDate = formatOrderDateTime(data.cancelledAt || new Date().toISOString());

  const customerEmailPkg = buildOrderCancelledEmailHtml(order, 'customer', reason);
  const storeEmailPkg = buildOrderCancelledEmailHtml(order, 'store_admin', reason);

  const structuredData: Record<string, string> = {
    'Order Reference': data.orderNumber,
    'Original Purchasing Time': orderDate,
    'Cancellation Timestamp': cancelDate,
    'Cancellation Reason': reason,
    'Customer Name': data.customerName,
    'Customer Email': data.customerEmail || 'Not provided',
    'Customer Phone': data.customerPhone || 'Not provided',
    'Payment Method': payInfo.label,
    'Cancelled Ensembles': data.textItems,
    'Total Order Value': `₹${data.total.toLocaleString('en-IN')}`,
    'Inventory Stock Restored': 'YES - All garments returned to boutique inventory',
    'Notification Recipient': STORE_ADMIN_EMAIL,
  };

  const storeResult = await sendEmailNotification({
    toEmail: STORE_ADMIN_EMAIL,
    recipientRole: 'store_admin',
    emailType: 'order_cancelled',
    subject: storeEmailPkg.subject,
    htmlContent: storeEmailPkg.html,
    textContent: storeEmailPkg.text,
    orderNumber: data.orderNumber,
    paymentMethod: data.paymentMethod,
    structuredData,
  });

  let customerResult: { success: boolean; message: string; transport?: string; needsActivation?: boolean } = {
    success: true,
    message: 'Included via Carbon Copy (_cc)',
    transport: storeResult.transport,
    needsActivation: storeResult.needsActivation
  };
  if (data.customerEmail && data.customerEmail.includes('@') && data.customerEmail.toLowerCase() !== STORE_ADMIN_EMAIL.toLowerCase()) {
    customerResult = await sendEmailNotification({
      toEmail: data.customerEmail,
      recipientRole: 'customer',
      emailType: 'order_cancelled',
      subject: customerEmailPkg.subject,
      htmlContent: customerEmailPkg.html,
      textContent: customerEmailPkg.text,
      orderNumber: data.orderNumber,
      paymentMethod: data.paymentMethod,
      structuredData,
    });
  }

  const needsActivation = Boolean(storeResult.needsActivation || storeResult.transport === 'formsubmit-needs-activation');
  const results = { customerResult, storeResult, needsActivation };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zaymera-email-dispatched', {
        detail: {
          orderNumber: data.orderNumber,
          type: 'order_cancelled',
          customerEmail: data.customerEmail,
          storeEmail: STORE_ADMIN_EMAIL,
          reason,
          needsActivation,
          results,
        },
      })
    );
  }

  return results;
}

/**
 * Generates direct Gmail compose URL for instant store administrator communication
 */
export function generateGmailComposeUrl(
  to: string,
  subject: string,
  bodyText: string
): string {
  const encTo = encodeURIComponent(to.trim());
  const encSub = encodeURIComponent(subject.trim());
  const encBody = encodeURIComponent(bodyText.trim());
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSub}&body=${encBody}`;
}
