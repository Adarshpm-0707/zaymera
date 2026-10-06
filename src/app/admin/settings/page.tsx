'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Server,
  Trash2,
  HardDrive,
  Mail,
  Send,
  Check,
  AlertCircle,
  Clock,
  FileText,
  X
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  seedInitialCatalogToSupabase, 
  getLocalProducts, 
  saveLocalProducts,
  deleteAllProducts 
} from '@/lib/supabase/services';
import { PRODUCTS_CATALOG } from '@/constants/catalog';
import {
  STORE_ADMIN_EMAIL,
  getEmailConfig,
  saveEmailConfig,
  getEmailLogs,
  sendEmailNotification,
  formatOrderDateTime,
  checkFormSubmitStatus,
  triggerFormSubmitActivation,
  isFormSubmitActivated,
  EmailLogEntry,
  EmailServiceConfig
} from '@/lib/email/orderEmailService';
import { Copy, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [localCount, setLocalCount] = useState<number>(0);

  // Email Config State
  const [emailConfig, setEmailConfig] = useState<EmailServiceConfig>({
    web3FormsKey: '',
    brevoApiKey: '',
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: '',
    customWebhookUrl: '',
    activeProvider: 'auto',
  });
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [previewLog, setPreviewLog] = useState<EmailLogEntry | null>(null);

  // FormSubmit & Delivery Diagnostics State
  const [formSubmitActive, setFormSubmitActive] = useState<boolean | null>(null);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [isResendingActivation, setIsResendingActivation] = useState(false);
  const [activationMessage, setActivationMessage] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeEmailTab, setActiveEmailTab] = useState<'formsubmit' | 'google-script' | 'brevo' | 'web3forms'>('formsubmit');

  useEffect(() => {
    setLocalCount(getLocalProducts().length);
    setEmailConfig(getEmailConfig());
    setEmailLogs(getEmailLogs());
    setFormSubmitActive(isFormSubmitActivated());

    const handleEmailDispatched = () => {
      setEmailLogs(getEmailLogs());
    };
    window.addEventListener('zaymera-email-dispatched', handleEmailDispatched);
    return () => window.removeEventListener('zaymera-email-dispatched', handleEmailDispatched);
  }, []);

  const handleSaveEmailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailConfig(emailConfig);
    showToast('Email dispatch settings saved successfully!');
  };

  const handleCheckFormSubmit = async () => {
    setIsCheckingActivation(true);
    setActivationMessage('Pinging formsubmit.co to test activation status...');
    try {
      const res = await checkFormSubmitStatus(STORE_ADMIN_EMAIL);
      setFormSubmitActive(res.activated);
      setActivationMessage(res.message);
      if (res.activated) {
        showToast('FormSubmit is ACTIVATED & ACTIVE!');
      } else {
        showToast('FormSubmit needs 1-time activation in zaymerawardrobe@gmail.com');
      }
    } catch {
      setActivationMessage('Could not verify status. Please check your network connection.');
    } finally {
      setIsCheckingActivation(false);
    }
  };

  const handleResendActivation = async () => {
    setIsResendingActivation(true);
    try {
      const res = await triggerFormSubmitActivation(STORE_ADMIN_EMAIL);
      setActivationMessage(res.message);
      showToast(res.message);
    } catch (err: any) {
      showToast('Error triggering activation: ' + (err?.message || 'failed'));
    } finally {
      setIsResendingActivation(false);
    }
  };

  const handleCopyScript = () => {
    const scriptCode = `/**
 * ZAYMERA HAUTE COUTURE — GOOGLE APPS SCRIPT ORDER EMAIL RELAY
 * Deploy at https://script.google.com logged in as zaymerawardrobe@gmail.com
 * Deploy as Web app with "Execute as: Me" and "Who has access: Anyone"
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = (data.to || data.customerEmail || '').trim();
    var storeEmail = (data.storeEmail || 'zaymerawardrobe@gmail.com').trim();
    var subject = data.subject || 'Zaymera Order Notification';
    var html = data.html || data.htmlContent || '';
    var text = data.text || data.textContent || 'New order placed at Zaymera.';

    // Send to Store Admin
    GmailApp.sendEmail(storeEmail, subject, text, {
      name: 'ZAYMERA Haute Couture',
      htmlBody: html
    });

    // Send to Customer if valid email provided
    if (to && to.indexOf('@') !== -1 && to.toLowerCase() !== storeEmail.toLowerCase()) {
      GmailApp.sendEmail(to, subject, text, {
        name: 'ZAYMERA Haute Couture',
        htmlBody: html,
        replyTo: storeEmail
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Delivered via native Gmail' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    showToast('Google Apps Script copied to clipboard!');
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSendTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const nowFormatted = formatOrderDateTime(new Date());
      const testHtml = `
        <div style="font-family: Georgia, serif; max-width: 550px; margin: 0 auto; padding: 24px; background-color: #FAF7F2; border: 1px solid #EAE2D5; border-radius: 16px;">
          <h2 style="color: #9B2242; margin-top: 0;">ZAYMERA - Test Notification</h2>
          <p style="font-size: 13px; color: #4A3E34;">
            This is a test notification confirming that the automated order email service is successfully configured and active.
          </p>
          <div style="background: white; border: 1px solid #DDD0C0; padding: 12px; border-radius: 8px; font-size: 12px; margin: 16px 0;">
            <div><strong>Store Recipient:</strong> ${STORE_ADMIN_EMAIL}</div>
            <div><strong>Timestamp:</strong> ${nowFormatted}</div>
            <div><strong>Status:</strong> Active &amp; Ready for Order Placement / Cancellation</div>
          </div>
          <div style="font-size: 11px; color: #8C7A68;">
            Zaymera Haute Couture Atelier • Clothing That Speak Elegance
          </div>
        </div>
      `;

      const result = await sendEmailNotification({
        toEmail: STORE_ADMIN_EMAIL,
        recipientRole: 'store_admin',
        emailType: 'test',
        subject: `🔔 Test Notification from Zaymera Atelier System`,
        htmlContent: testHtml,
        textContent: `ZAYMERA TEST NOTIFICATION\nSent to: ${STORE_ADMIN_EMAIL}\nTimestamp: ${nowFormatted}\nStatus: Active`,
        orderNumber: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      });

      setEmailLogs(getEmailLogs());
      if (result.success) {
        showToast(`Test email delivered to ${STORE_ADMIN_EMAIL} (${result.transport})`);
      } else if (result.needsActivation || result.transport === 'formsubmit-needs-activation') {
        setFormSubmitActive(false);
        setActivationMessage(result.message);
        showToast(`Action Required: Please click "Activate Form" in your email at ${STORE_ADMIN_EMAIL}`);
      } else {
        showToast(`Email test notice: ${result.message}`);
      }
    } catch (err: any) {
      showToast(`Email test error: ${err?.message || 'Failed'}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialCatalogToSupabase();
      setLocalCount(getLocalProducts().length);
      showToast(`Catalog sync complete! ${res.count} products verified in database.`);
    } catch (err) {
      console.error('Seed error:', err);
      showToast('Error syncing catalog to database.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearAllProducts = async () => {
    if (confirm('Delete ALL products from the store and cache completely?')) {
      await deleteAllProducts();
      setLocalCount(0);
      showToast('All products deleted from catalog and cache.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-16">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#EAE2D5]">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#1C1613] tracking-wide">
            Database & System Settings
          </h1>
        </div>
        <p className="text-[11px] sm:text-xs text-[#6B5E52] mt-1 font-normal">
          Manage your Supabase cloud connectivity, seed initial catalog data, and inspect schema structures.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h2 className="font-display text-base text-[#1C1613] tracking-wide flex items-center gap-2">
            <Database className="w-4 h-4 text-[#936718]" />
            <span>Supabase Cloud Database Status</span>
          </h2>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] text-xs self-start sm:self-auto">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-[#16A34A] animate-pulse' : 'bg-[#EAB308]'}`} />
            <span className="font-bold text-[#1C1613]">
              {isSupabaseConfigured ? 'Cloud Connected' : 'Local Fallback Mode'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1">
            <div className="text-[10.5px] uppercase font-bold text-[#6B5E52]">Database Endpoint</div>
            <div className="font-mono text-[#1C1613] truncate font-semibold">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Configured via .env'}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1">
            <div className="text-[10.5px] uppercase font-bold text-[#6B5E52]">Key Type</div>
            <div className="font-mono text-[#936718] truncate font-semibold">
              Supabase Publishable / Anon Key (Active)
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Seeding & Maintenance Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Seed Card */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base text-[#1C1613] tracking-wide font-normal">
              Sync Default Atelier Catalog
            </h3>
            <p className="text-xs text-[#6B5E52] mt-1.5 leading-relaxed">
              Pushes all 8 core boutique catalog ensembles (Polka Co-Ords, Royal Sapphire Anarkali, Pearl Ivory Anarkali, Crimson Bridal Kurta, Chanderi Silks) into your Supabase database.
            </p>
          </div>

          <button
            onClick={handleSeedCatalog}
            disabled={isSeeding}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 hover:opacity-95 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Syncing to Database...' : 'Sync 8 Default Products to DB'}</span>
          </button>
        </div>

        {/* Local Storage & Cache */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-3">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base text-[#1C1613] tracking-wide font-normal">
              Local Product Store Cache
            </h3>
            <p className="text-xs text-[#6B5E52] mt-1.5 leading-relaxed">
              Zaymera uses high-speed persistent caching so all admin edits and new pieces immediately render across the storefront in sub-millisecond response times.
            </p>
            <div className="mt-2 text-xs font-semibold text-[#0284C7]">
              Current cached count: {localCount} pieces
            </div>
          </div>

          <button
            onClick={handleClearAllProducts}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold tracking-wide transition-all cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-4 h-4 text-[#DC2626]" />
            <span>Delete All Products from Store</span>
          </button>
        </div>

      </div>

      {/* ── AUTOMATED ORDER EMAILS & STORE NOTIFICATIONS ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-[#EAE2D5]">
          <div>
            <h2 className="font-display text-base text-[#1C1613] tracking-wide flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#9B2242]" />
              <span>Automated Order Communication &amp; Store Notifications</span>
            </h2>
            <p className="text-xs text-[#6B5E52] mt-1">
              Dispatches comprehensive order invoices &amp; cancellation notices to customer email and store desk <strong className="text-[#9B2242]">{STORE_ADMIN_EMAIL}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleSendTestEmail}
              disabled={isTestingEmail}
              className="px-4 py-2 rounded-xl bg-[#FAF5EE] hover:bg-[#F4ECE0] border border-[#E8DFC9] text-xs font-bold text-[#9B2242] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-spin' : ''}`} />
              <span>{isTestingEmail ? 'Sending Test...' : 'Send Test Email to Store'}</span>
            </button>
          </div>
        </div>

        {/* ── LIVE DELIVERABILITY & ACTIVATION DIAGNOSTIC CARD ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF6F0] to-[#FFFDF9] border border-[#EADBCC] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${formSubmitActive ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${formSubmitActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <div>
                <div className="text-xs font-bold text-[#1C1613] flex items-center gap-2">
                  <span>Primary Transport Status (FormSubmit):</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider ${
                    formSubmitActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {formSubmitActive ? '✓ Activated & Active' : '⚠️ Activation Required'}
                  </span>
                </div>
                <div className="text-[11px] text-[#7A6959] mt-0.5">
                  Target Store Mailbox: <strong>{STORE_ADMIN_EMAIL}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCheckFormSubmit}
                disabled={isCheckingActivation}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5EFE6] border border-[#DCD0BE] text-xs font-semibold text-[#1C1613] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#936718] ${isCheckingActivation ? 'animate-spin' : ''}`} />
                <span>{isCheckingActivation ? 'Checking...' : 'Check Status'}</span>
              </button>

              <button
                onClick={handleResendActivation}
                disabled={isResendingActivation}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5EFE6] border border-[#DCD0BE] text-xs font-semibold text-[#9B2242] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className={`w-3 h-3 ${isResendingActivation ? 'animate-spin' : ''}`} />
                <span>{isResendingActivation ? 'Sending...' : 'Resend Activation Link'}</span>
              </button>

              <a
                href="https://mail.google.com/mail/u/0/#search/formsubmit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Gmail Inbox</span>
              </a>
            </div>
          </div>

          {activationMessage && (
            <div className="p-3 rounded-xl bg-white border border-[#E5D8C5] text-xs text-[#5C4D3E]">
              {activationMessage}
            </div>
          )}

          {/* Step by Step Activation Guide */}
          {!formSubmitActive && (
            <div className="p-3.5 rounded-xl bg-[#FFFBF0] border border-[#FDE68A] text-xs space-y-2 text-[#92400E]">
              <div className="font-bold flex items-center gap-1.5 text-[#78350F]">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span>Why are emails not received in your inbox yet? (1-Time Action Required)</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#92400E]">
                FormSubmit has already sent an activation confirmation email to <strong>{STORE_ADMIN_EMAIL}</strong> to verify ownership. <strong>No order emails will be delivered until you complete this 1-time step:</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/80 border border-[#FCD34D] space-y-1">
                  <div className="font-bold text-[#78350F]">Step 1: Open Gmail</div>
                  <div>Open your Gmail logged into <strong>{STORE_ADMIN_EMAIL}</strong> (click the red button above).</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 border border-[#FCD34D] space-y-1">
                  <div className="font-bold text-[#78350F]">Step 2: Find Email</div>
                  <div>Look for an email from <strong>FormSubmit</strong> titled <em>"Please activate your form"</em>. (Check <strong>Spam / Junk</strong> folder if not in Inbox).</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 border border-[#FCD34D] space-y-1">
                  <div className="font-bold text-[#78350F]">Step 3: Click Activate</div>
                  <div>Click the blue <strong>"Activate Form"</strong> button in that email. Then return here and click <strong>"Check Status"</strong>!</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Triggers Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#166534]">
              <Check className="w-4 h-4 text-[#16A34A]" />
              <span>1. Order Placement Trigger (Active)</span>
            </div>
            <p className="text-[11px] text-[#15803D] leading-relaxed">
              When a customer places an order (both <strong>Cash on Delivery</strong> and <strong>Online Payment</strong>):
            </p>
            <ul className="text-[11px] text-[#166534] list-disc list-inside space-y-0.5">
              <li>Full purchasing date &amp; exact time displayed (e.g. 25 September 2026, 03:45 PM IST)</li>
              <li>Delivered to customer email provided at checkout</li>
              <li>Delivered to store desk <strong>{STORE_ADMIN_EMAIL}</strong></li>
              <li>Itemized garments, sizes, quantities, and price totals</li>
              <li>Complete delivery address &amp; customer contact phone</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#9F1239]">
              <AlertCircle className="w-4 h-4 text-[#E11D48]" />
              <span>2. Order Cancellation Trigger (Active)</span>
            </div>
            <p className="text-[11px] text-[#BE123C] leading-relaxed">
              When an order is cancelled (by customer within 15 mins or by store admin):
            </p>
            <ul className="text-[11px] text-[#9F1239] list-disc list-inside space-y-0.5">
              <li>Exact cancellation timestamp &amp; specific reason included</li>
              <li>Delivered to BOTH customer email and <strong>{STORE_ADMIN_EMAIL}</strong></li>
              <li>Full details of cancelled pieces and total amount</li>
              <li>Inventory stock auto-restored confirmation</li>
            </ul>
          </div>
        </div>

        {/* ── DELIVERY METHODS TABS & CONFIGURATION ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6B5E52]">
              Select Preferred Email Delivery Transport
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveEmailTab('formsubmit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeEmailTab === 'formsubmit'
                  ? 'bg-[#1C1613] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#EAE2D5]'
              }`}
            >
              1. FormSubmit (Zero Config)
            </button>

            <button
              type="button"
              onClick={() => setActiveEmailTab('google-script')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeEmailTab === 'google-script'
                  ? 'bg-[#1C1613] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#EAE2D5]'
              }`}
            >
              2. Google Apps Script (Direct Gmail - Recommended)
            </button>

            <button
              type="button"
              onClick={() => setActiveEmailTab('brevo')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeEmailTab === 'brevo'
                  ? 'bg-[#1C1613] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#EAE2D5]'
              }`}
            >
              3. Brevo REST API (300/Day Free)
            </button>

            <button
              type="button"
              onClick={() => setActiveEmailTab('web3forms')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeEmailTab === 'web3forms'
                  ? 'bg-[#1C1613] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#EAE2D5]'
              }`}
            >
              4. Web3Forms Key
            </button>
          </div>

          {/* Tab 1: FormSubmit Details */}
          {activeEmailTab === 'formsubmit' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-3 text-xs">
              <div className="font-bold text-[#1C1613] flex items-center justify-between">
                <span>FormSubmit.co (Zero API Key Setup)</span>
                <span className="text-[11px] font-mono text-[#9B2242]">https://formsubmit.co/ajax/{STORE_ADMIN_EMAIL}</span>
              </div>
              <p className="text-[#6B5E52] leading-relaxed">
                FormSubmit automatically forwards orders placed on your website directly into <strong>{STORE_ADMIN_EMAIL}</strong> and sends a copy to the customer's email.
                It requires no accounts, no credit cards, and no API keys. The only requirement is clicking the 1-time activation link sent to your inbox.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={isResendingActivation}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF4EA] border border-[#DDD0C0] text-xs font-bold text-[#9B2242] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Resend Activation Email</span>
                </button>
                <a
                  href="https://mail.google.com/mail/u/0/#search/formsubmit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#FAF5EC] hover:bg-[#F3E7D3] border border-[#EBDCC5] text-xs font-bold text-[#936718] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Search "FormSubmit" in Gmail</span>
                </a>
              </div>
            </div>
          )}

          {/* Tab 2: Google Apps Script (Recommended Native Option) */}
          {activeEmailTab === 'google-script' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-[#1C1613]">Google Apps Script (Native Gmail Mailer — 0% Spam Rate)</h4>
                  <p className="text-[11px] text-[#6B5E52] mt-0.5">
                    Sends emails directly from your Gmail account (<strong>{STORE_ADMIN_EMAIL}</strong>) using Google's own servers. Completely free for 100 emails/day forever.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4EA] border border-[#DDD0C0] text-xs font-bold text-[#1C1613] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#9B2242]" />
                    <span>{copiedScript ? 'Copied!' : 'Copy Script Code'}</span>
                  </button>
                  <a
                    href="https://script.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open script.google.com</span>
                  </a>
                </div>
              </div>

              {/* Instructions summary */}
              <div className="p-3 rounded-xl bg-white border border-[#EAE2D5] space-y-1.5 text-[11px] text-[#5C4D3E]">
                <div className="font-bold text-[#1C1613]">Quick 60-Second Setup:</div>
                <ol className="list-decimal list-inside space-y-1 text-[#6B5E52]">
                  <li>Click <strong>"Copy Script Code"</strong> above, then click <strong>"Open script.google.com"</strong>.</li>
                  <li>Click <strong>"+ New project"</strong>, paste the script into <code>Code.gs</code>.</li>
                  <li>Click <strong>"Deploy"</strong> → <strong>"New deployment"</strong> → Select type <strong>"Web app"</strong>.</li>
                  <li>Set: <em>Execute as: "Me"</em> and <em>Who has access: "Anyone"</em>. Click <strong>Deploy</strong>.</li>
                  <li>Copy the resulting Web App URL and paste it into the field below!</li>
                </ol>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4D4034] uppercase tracking-wider mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="text"
                  value={emailConfig.customWebhookUrl || ''}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, customWebhookUrl: e.target.value }))}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD0C0] bg-white text-xs text-[#1C1613] font-mono focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Brevo REST API */}
          {activeEmailTab === 'brevo' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-3 text-xs">
              <div className="font-bold text-[#1C1613]">Brevo REST API (300 Free Emails / Day)</div>
              <p className="text-[#6B5E52] leading-relaxed">
                Brevo provides an instant transactional email REST API. Sign up at <a href="https://brevo.com" target="_blank" rel="noopener noreferrer" className="underline text-[#9B2242] font-semibold">brevo.com</a>, generate an API key under SMTP &amp; API, and paste it below.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-[#4D4034] uppercase tracking-wider mb-1">
                  Brevo API Key (xkeysib-...)
                </label>
                <input
                  type="password"
                  value={emailConfig.brevoApiKey || ''}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, brevoApiKey: e.target.value }))}
                  placeholder="xkeysib-..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD0C0] bg-white text-xs text-[#1C1613] font-mono focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Web3Forms */}
          {activeEmailTab === 'web3forms' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-3 text-xs">
              <div className="font-bold text-[#1C1613]">Web3Forms Access Key</div>
              <p className="text-[#6B5E52] leading-relaxed">
                Get an access key in 10 seconds at <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer" className="underline text-[#9B2242] font-semibold">web3forms.com</a> using {STORE_ADMIN_EMAIL}.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-[#4D4034] uppercase tracking-wider mb-1">
                  Web3Forms Access Key
                </label>
                <input
                  type="text"
                  value={emailConfig.web3FormsKey || ''}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, web3FormsKey: e.target.value }))}
                  placeholder="e.g. 7cf23078-4390-410a-bfe7-c8c7c9c0fb93"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD0C0] bg-white text-xs text-[#1C1613] font-mono focus:outline-none focus:ring-2 focus:ring-[#9B2242]/20"
                />
              </div>
            </div>
          )}

          {/* Save Settings Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveEmailSettings}
              className="px-5 py-2.5 rounded-xl bg-[#221C18] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Save Email Configuration
            </button>
          </div>
        </div>

        {/* Recent Communication Logs */}
        <div className="pt-2 border-t border-[#EAE2D5] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6B5E52] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#936718]" />
              <span>Recent Transactional Email Logs ({emailLogs.length})</span>
            </div>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] text-center text-xs text-[#8C7A68]">
              No emails sent yet. Place an order or click "Send Test Email to Store" to see logs here.
            </div>
          ) : (
            <div className="divide-y divide-[#F2ECE2] border border-[#EAE2D5] rounded-2xl overflow-hidden bg-[#FAF8F5] max-h-56 overflow-y-auto text-xs">
              {emailLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF5EE] transition-colors">
                  <div>
                    <div className="font-semibold text-[#1C1613] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.status === 'sent' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="font-mono text-[11px] text-[#9B2242]">{log.orderNumber}</span>
                      <span>{log.subject}</span>
                    </div>
                    <div className="text-[10px] text-[#7A6959] mt-0.5">
                      To: <strong>{log.recipient}</strong> • Time: {formatOrderDateTime(log.createdAt)} • Via: {log.transportUsed || 'in-app'}
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewLog(log)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD0C0] text-[10px] font-bold text-[#6B5E52] hover:bg-[#FAF4EA] cursor-pointer shrink-0"
                  >
                    View HTML
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── EMAIL PREVIEW MODAL IN SETTINGS ── */}
      {previewLog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white border border-[#EAE2D5] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-[#EAE2D5] flex items-center justify-between bg-[#FAF8F5] shrink-0">
              <div>
                <h3 className="font-semibold text-xs text-[#1F1916]">{previewLog.subject}</h3>
                <p className="text-[10px] text-[#7A6959]">To: {previewLog.recipient} • Ref: {previewLog.orderNumber}</p>
              </div>
              <button
                onClick={() => setPreviewLog(null)}
                className="p-1 rounded-full text-[#7A6959] hover:text-[#1C1613] hover:bg-[#FAF4EA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-[#FAF7F2]">
              <div
                className="max-w-2xl mx-auto shadow-sm"
                dangerouslySetInnerHTML={{ __html: previewLog.htmlPreview }}
              />
            </div>
            <div className="p-3 border-t border-[#EAE2D5] bg-white flex justify-end shrink-0">
              <button
                onClick={() => setPreviewLog(null)}
                className="px-4 py-2 rounded-xl bg-[#221C18] text-white text-xs font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Schema Summary Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs space-y-4">
        <h2 className="font-display text-base text-[#1C1613] tracking-wide flex items-center gap-2">
          <Server className="w-4 h-4 text-[#936718]" />
          <span>Supabase Schema Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]">
            <span className="font-mono font-bold text-[#936718]">public.products</span>
            <p className="text-[11px] text-[#6B5E52] mt-1">
              id, name, category, price, original_price, image, tag, description, fabric, work, in_stock, sizes
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]">
            <span className="font-mono font-bold text-[#936718]">public.orders</span>
            <p className="text-[11px] text-[#6B5E52] mt-1">
              id, order_number, customer_name, customer_email, customer_phone, shipping_address, subtotal, total, order_status
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]">
            <span className="font-mono font-bold text-[#936718]">public.inquiries</span>
            <p className="text-[11px] text-[#6B5E52] mt-1">
              id, name, email, phone, service_type, message, status, created_at
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
