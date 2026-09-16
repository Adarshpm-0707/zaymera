'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Mail,
  Phone,
  MessageCircle,
  Crown,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Calendar,
  PlusCircle,
  X,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import {
  fetchCustomers,
  saveLocalCustomers,
  getLocalCustomers,
  CustomerItem
} from '@/lib/supabase/services';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState('');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [tier, setTier] = useState<'VIP' | 'Regular' | 'New'>('New');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await fetchCustomers();
      if (data) setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newCustomer: CustomerItem = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98000 00000',
      city: city.trim() || 'Mumbai, Maharashtra',
      totalSpent: 0,
      ordersCount: 0,
      tier,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    saveLocalCustomers(updated);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setCity('');
    showToast(`Client "${newCustomer.name}" added to directory.`);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = selectedTier === 'all' || c.tier.toLowerCase() === selectedTier.toLowerCase();

    return matchesSearch && matchesTier;
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const vipCount = customers.filter(c => c.tier === 'VIP').length;
  const avgOrderValue = customers.length > 0 ? Math.round(totalSpentAll / Math.max(1, customers.reduce((sum, c) => sum + c.ordersCount, 0))) : 0;

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-16">
      
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
              Client & VIP Directory
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#FAF7F2] border border-[#EAE2D5] text-[#936718] px-2.5 py-0.5 rounded-full font-bold">
              {customers.length} Clients
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#6B5E52] mt-1 font-normal">
            Manage haute couture patrons, track lifetime purchases, and initiate direct concierge outreach.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#C5A059] to-[#9B2242] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Patron</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B5E52] text-[11px] font-semibold uppercase tracking-wider">
            <span>Total Patrons</span>
            <Users className="w-3.5 h-3.5 text-[#936718]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#1C1613]">
            {customers.length}
          </div>
          <p className="text-[10px] text-[#8A7B6E]">Verified atelier accounts</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B5E52] text-[11px] font-semibold uppercase tracking-wider">
            <span>VIP Royalty Tier</span>
            <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#936718]">
            {vipCount}
          </div>
          <p className="text-[10px] text-[#8A7B6E]">High-frequency couture clients</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B5E52] text-[11px] font-semibold uppercase tracking-wider">
            <span>Total Spend</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#1C1613]">
            ₹{totalSpentAll.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#8A7B6E]">Lifetime order value</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B5E52] text-[11px] font-semibold uppercase tracking-wider">
            <span>Average Order</span>
            <ShoppingBag className="w-3.5 h-3.5 text-[#9B2242]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#1C1613]">
            ₹{avgOrderValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#8A7B6E]">Per completed transaction</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#EAE2D5] shadow-xs rounded-xl overflow-x-auto text-xs font-semibold">
          {[
            { id: 'all', label: 'All Clients' },
            { id: 'vip', label: 'VIP' },
            { id: 'regular', label: 'Regular' },
            { id: 'new', label: 'New' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs ${
                selectedTier === tab.id
                  ? 'bg-[#1C1613] text-white font-semibold shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#1C1613]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, city..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718] shadow-xs"
          />
        </div>
      </div>

      {/* Mobile Card List (< sm screens) */}
      <div className="sm:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B5E52] bg-white border border-[#EAE2D5] rounded-2xl shadow-xs">
            No patrons found matching your criteria.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${cust.name}, greetings from Zaymera Haute Couture Atelier!`)}`;
            
            return (
              <div
                key={cust.id}
                className="p-4 rounded-2xl bg-white border border-[#EAE2D5] space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] flex items-center justify-center text-sm font-bold text-[#936718]">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1C1613] flex items-center gap-1.5">
                        <span>{cust.name}</span>
                        {cust.tier === 'VIP' && (
                          <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#6B5E52] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#8A7B6E]" />
                        <span>{cust.city}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      cust.tier === 'VIP'
                        ? 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]'
                        : cust.tier === 'Regular'
                        ? 'bg-[#ECFDF5] text-[#15803D] border border-[#86EFAC]'
                        : 'bg-[#FAF7F2] text-[#6B5E52] border border-[#EAE2D5]'
                    }`}
                  >
                    {cust.tier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-[11px]">
                  <div>
                    <span className="text-[#8A7B6E] block text-[9.5px]">Orders</span>
                    <span className="font-bold text-[#1C1613]">{cust.ordersCount} Placed</span>
                  </div>
                  <div>
                    <span className="text-[#8A7B6E] block text-[9.5px]">Total Spent</span>
                    <span className="font-bold text-[#936718]">₹{cust.totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#15803D] border border-[#A7F3D0] text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`mailto:${cust.email}?subject=Exclusive Atelier Update from Zaymera`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#936718] border border-[#EAE2D5] text-xs font-semibold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table (≥ sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-white border border-[#EAE2D5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto admin-responsive-table">
          <table className="w-full min-w-[780px] text-left text-xs text-[#1C1613]">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE2D5] text-[10.5px] uppercase tracking-wider text-[#6B5E52] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Tier Status</th>
                <th className="py-3.5 px-4 text-right">Concierge Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE2D5]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#6B5E52]">
                    No patrons match your search filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${cust.name}, greetings from Zaymera Haute Couture Atelier!`)}`;

                  return (
                    <tr key={cust.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] flex items-center justify-center font-bold text-[#936718] text-xs shrink-0">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#1C1613] flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              {cust.tier === 'VIP' && <Crown className="w-3.5 h-3.5 text-[#C5A059]" />}
                            </div>
                            <div className="text-[10px] text-[#8A7B6E]">
                              Joined {cust.joinedDate}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] space-y-0.5">
                        <div className="text-[#1C1613]">{cust.email}</div>
                        <div className="text-[#8A7B6E]">{cust.phone}</div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-[#6B5E52]">
                        {cust.city}
                      </td>

                      <td className="py-3.5 px-4 text-[11.5px] font-semibold text-[#1C1613]">
                        {cust.ordersCount}
                      </td>

                      <td className="py-3.5 px-4 text-[11.5px] font-bold text-[#936718]">
                        ₹{cust.totalSpent.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block ${
                            cust.tier === 'VIP'
                              ? 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]'
                              : cust.tier === 'Regular'
                              ? 'bg-[#ECFDF5] text-[#15803D] border border-[#86EFAC]'
                              : 'bg-[#FAF7F2] text-[#6B5E52] border border-[#EAE2D5]'
                          }`}
                        >
                          {cust.tier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#15803D] hover:bg-[#D1FAE5] border border-[#A7F3D0] transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          <a
                            href={`mailto:${cust.email}?subject=Zaymera Atelier Exclusive VIP Offer`}
                            className="p-1.5 rounded-xl bg-[#FAF7F2] text-[#936718] hover:bg-[#F3ECE1] border border-[#EAE2D5] transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patron Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-4 h-4 text-[#936718]" />
              <h2 className="font-display text-lg sm:text-xl text-[#1C1613] tracking-wide font-normal">
                Register New Atelier Client
              </h2>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maharani Gayatri Devi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. client@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#936718]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E36] uppercase tracking-wider mb-1.5">
                    Tier Membership
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs text-[#1C1613] focus:outline-none focus:border-[#936718]"
                  >
                    <option value="New">New Client</option>
                    <option value="Regular">Regular Patron</option>
                    <option value="VIP">VIP Haute Royalty</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9B2242] text-white text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
                >
                  Register Patron
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
