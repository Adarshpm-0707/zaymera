'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Sparkles,
  Clock,
  User
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { fetchAdminInquiries, updateInquiryStatus } from '@/lib/supabase/services';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAdminInquiries();
      if (data) {
        setInquiries(data);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status: newStatus } : i));
    try {
      await updateInquiryStatus(inquiryId, newStatus);
      showToast(`Inquiry status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch =
      i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#ECFDF5] border border-[#86EFAC] text-[#15803D] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#EAE2D5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#1C1613] tracking-wide">
              Bespoke Concierge & Inquiries
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] px-2.5 py-0.5 rounded-full font-bold">
              {inquiries.length} Inquiries
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#6B5E52] mt-1 font-normal">
            Manage custom fitting inquiries, bridal customization requests, and customer messages.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          disabled={loading}
          className="p-2 sm:p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EAE2D5] text-[#6B5E52] hover:text-[#1C1613] transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh Inquiries"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, email, phone, custom request details..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['all', 'new', 'contacted', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1C1613] text-white shadow-xs'
                  : 'bg-white text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {filteredInquiries.map((inq) => {
          const rawPhone = (inq.phone || '').replace(/[^0-9]/g, '');
          const waUrl = rawPhone
            ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(`Hello ${inq.name}, Greetings from ZAYMERA Haute Couture Atelier regarding your inquiry about "${inq.service_type || 'Bespoke Customization'}". How may we assist you today?`)}`
            : null;

          const formattedDate = inq.created_at
            ? new Date(inq.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : 'Recent';

          return (
            <div
              key={inq.id}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE2D5] shadow-xs hover:border-[#C5A059]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 sm:space-y-4"
            >
              <div className="space-y-2.5 sm:space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-xs sm:text-sm text-[#1C1613]">
                        {inq.name}
                      </h3>
                      <span className={`text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inq.status === 'new'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                          : inq.status === 'contacted'
                          ? 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]'
                          : 'bg-[#ECFDF5] text-[#15803D] border border-[#86EFAC]'
                      }`}>
                        {inq.status}
                      </span>
                    </div>

                    <div className="text-[10.5px] sm:text-[11px] text-[#936718] font-medium mt-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>{inq.service_type || 'General Couture Inquiry'}</span>
                    </div>
                  </div>

                  <div className="text-[9.5px] sm:text-[10px] text-[#8A7B6E] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Client Contact Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B5E52]">
                  {inq.email && (
                    <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-[#1C1613] transition-colors">
                      <Mail className="w-3 h-3 text-[#8A7B6E]" />
                      <span className="truncate max-w-[160px] sm:max-w-none">{inq.email}</span>
                    </a>
                  )}
                  {inq.phone && (
                    <a href={`tel:${inq.phone}`} className="flex items-center gap-1 hover:text-[#1C1613] transition-colors">
                      <Phone className="w-3 h-3 text-[#8A7B6E]" />
                      <span>{inq.phone}</span>
                    </a>
                  )}
                </div>

                {/* Message Body */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] leading-relaxed">
                  {inq.message}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2.5 border-t border-[#EAE2D5] flex items-center justify-between gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6B5E52] uppercase font-bold">Status:</span>
                  <select
                    value={inq.status}
                    onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] text-[10.5px] font-bold uppercase text-[#1C1613] cursor-pointer focus:outline-none min-h-[36px]"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20BE5C] text-white text-xs font-bold transition-all shadow-sm active:scale-95 ml-auto sm:ml-0 min-h-[36px]"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

            </div>
          );
        })}

        {filteredInquiries.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-[#6B5E52] bg-white rounded-3xl border border-[#EAE2D5] shadow-xs">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-[#C5A059]" />
            <p className="text-sm font-medium">No inquiries found matching your filters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
