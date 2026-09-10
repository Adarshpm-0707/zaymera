'use client';

import React, { useState } from 'react';
import { X, Send, PhoneCall, Clock, CheckCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { SITE_CONFIG } from '@/constants/siteConfig';

export const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const predefinedInquiries = [
    "✨ Inquiring about Bridal & Wedding Troussau Collection",
    "👗 Looking for Custom Stitching & Sizing assistance",
    "📍 Need store location & VIP appointment booking",
    "🛍️ Help with Churidar sets & Unstitched Chanderi silk"
  ];

  const handleSendWhatsApp = (text: string) => {
    const rawPhone = SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || "919876543210";
    const encodedText = encodeURIComponent(text || "Hello Zaymera Boutique Team, I'd like to ask a question.");
    const url = `https://wa.me/${rawPhone}?text=${encodedText}`;
    window.open(url, '_blank');
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setIsOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      {/* Popover Chat Interface */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-white border border-[#EADBCC] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg backdrop-blur-xs">
                    <WhatsAppIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight">Zaymera Atelier WhatsApp</h4>
                  <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    Online &bull; Instant Stylist Assistance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                aria-label="Close WhatsApp chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#FAF7F2] space-y-3 max-h-80 overflow-y-auto">
            {/* Bot message bubble */}
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-xs border border-[#EFE8DC] text-xs text-[#2B231D] space-y-1.5 max-w-[88%]">
              <p className="font-medium text-[#1A1412]">
                Namaste! Welcome to Zaymera Haute Couture. 🌸
              </p>
              <p className="text-[#665749] text-[11px] leading-relaxed">
                Connect directly with our master stylists on WhatsApp for custom measurements, bridal inquiries, or order updates.
              </p>
            </div>

            {/* Quick Direct WhatsApp Button */}
            <button
              onClick={() => handleSendWhatsApp("Hello Zaymera Boutique Team, I'd like to chat with a stylist.")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#20BE5C] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>Direct WhatsApp Chat</span>
            </button>

            {/* Predefined Quick Questions */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A68]">
                Or select an inquiry:
              </p>
              {predefinedInquiries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendWhatsApp(q)}
                  className="w-full text-left text-xs bg-white hover:bg-[#FAF0E6] hover:text-[#9B2242] border border-[#E0D5C3] p-2.5 rounded-xl transition-all shadow-2xs font-medium text-[#4D4034] active:scale-[0.98] cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-[#EAE2D5] flex items-center gap-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customMsg.trim() && handleSendWhatsApp(customMsg)}
              placeholder="Type your message to WhatsApp..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#25D366] bg-[#FAF8F5]"
            />
            <button
              onClick={() => customMsg.trim() && handleSendWhatsApp(customMsg)}
              disabled={!customMsg.trim()}
              className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BE5C] text-white disabled:opacity-40 transition-all shadow-md active:scale-95 cursor-pointer"
              aria-label="Send WhatsApp message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Floating Action Button with Original WhatsApp Brand Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BE5C] text-white p-3 sm:px-4.5 sm:py-3.5 rounded-full shadow-[0_8px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_30px_rgba(37,211,102,0.55)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer z-40 border-2 border-white/40"
        aria-label="Chat on WhatsApp with Zaymera Concierge"
      >
        <WhatsAppIcon className="w-6 h-6 sm:w-6 sm:h-6 text-white shrink-0 drop-shadow-xs" />
        <span className="hidden sm:inline font-bold text-xs tracking-wider uppercase drop-shadow-xs">
          {isOpen ? 'Close Concierge' : 'WhatsApp'}
        </span>
        
        {/* Pulse Beacon Indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border-2 border-white"></span>
        </span>
      </button>

    </div>
  );
};

