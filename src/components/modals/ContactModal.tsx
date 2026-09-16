'use client';

import React, { useState } from 'react';
import { X, MapPin, Phone, Mail, Clock, Send, Check } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { circleLogoImg } from '@/constants/catalog';
import { submitInquiry } from '@/lib/supabase/services';
import { SITE_CONFIG } from '@/constants/siteConfig';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('Bespoke Bridal Fitting');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await submitInquiry({
      name,
      email,
      phone,
      serviceType,
      message,
    });
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E5DCCE] shadow-2xl p-6 sm:p-8 text-[#2B231D] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8C7A68] hover:text-[#221C18] hover:bg-[#FAF4EA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] to-[#9B2242] shrink-0 shadow-md overflow-hidden" style={{ width: '48px', height: '48px' }}>
            <img
              src={circleLogoImg}
              alt="Zaymera"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full bg-[#FAF7F2]"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <h3 className="font-display text-2xl font-normal text-[#221C18] tracking-wide">
              Boutique Atelier Concierge
            </h3>
            <p className="text-xs text-[#7A6D60] font-light">
              Personalized bridal previews & custom fitting appointments
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-display text-lg font-medium">Inquiry Received</h4>
            <p className="text-xs text-emerald-700">
              Our lead couture stylist will contact you via WhatsApp/Email within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priyadarshini Roy"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                  WhatsApp / Mobile
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                Service Required
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242] bg-white"
              >
                <option>Bespoke Bridal Fitting</option>
                <option>Custom Handloom Sizing</option>
                <option>Co-Ord Set Bulk/Reseller Inquiry</option>
                <option>VIP Store Appointment</option>
                <option>General Customer Support</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4D4034] mb-1">
                Message / Measurements Note
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your design preference, sizing requests, or wedding date..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCD1BF] focus:outline-none focus:border-[#9B2242] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending Request...' : 'Send Atelier Inquiry'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#EADBCC]"></div>
              <span className="flex-shrink mx-3 text-[10px] text-[#8C7A68] uppercase font-bold tracking-wider">or instant response</span>
              <div className="flex-grow border-t border-[#EADBCC]"></div>
            </div>

            <a
              href={`https://wa.me/${SITE_CONFIG.conciergePhone.replace(/[^0-9]/g, '') || '917306115950'}?text=${encodeURIComponent('Hello Zaymera Atelier Stylist, I would like to inquire about couture designs.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20BE5C] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>Chat on WhatsApp ({SITE_CONFIG.conciergePhone})</span>
            </a>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#F0EAE1] grid grid-cols-2 gap-3 text-[11px] text-[#7A6C5F]">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#9B2242]" />
            <a
              href={`tel:${SITE_CONFIG.conciergePhone.replace(/[^0-9+]/g, '')}`}
              className="font-medium hover:text-[#9B2242] transition-colors"
            >
              {SITE_CONFIG.conciergePhone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#9B2242]" />
            <span>10:00 AM - 9:00 PM IST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
