'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  PackageCheck,
  ChevronRight,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  X
} from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus, getInitialOrders } from '@/lib/supabase/services';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  processing: { bg: 'bg-[#2E2413]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  confirmed: { bg: 'bg-[#152B3C]', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30' },
  shipped: { bg: 'bg-[#251A3C]', text: 'text-[#C084FC]', border: 'border-[#C084FC]/30' },
  delivered: { bg: 'bg-[#132E1B]', text: 'text-[#4ADE80]', border: 'border-[#4ADE80]/30' },
  cancelled: { bg: 'bg-[#3A1414]', text: 'text-[#F87171]', border: 'border-[#F87171]/30' }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadOrders = async () => {
    try {
      const { data } = await fetchAdminOrders();
      if (data && data.length > 0) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId || o.order_number === orderId ? { ...o, order_status: newStatus } : o));
    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_number === orderId)) {
      setSelectedOrder((prev: any) => ({ ...prev, order_status: newStatus }));
    }

    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order status changed to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || o.order_status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#162E19] border border-[#22C55E] text-[#4ADE80] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#26201B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-[#FAF8F5] tracking-wide">
              Orders Control Center
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#291F18] border border-[#3E3025] text-[#E2B755] px-2.5 py-0.5 rounded-full font-bold">
              {orders.length} Orders
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8C7B6C] mt-1 font-normal">
            Track customer orders, review shipping addresses, and manage dispatch lifecycles.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="p-2 sm:p-2.5 rounded-xl bg-[#201915] hover:bg-[#2C221D] border border-[#362A21] text-[#A89887] hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#14100E] border border-[#26201B]">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8C7B6C]">Total Revenue</div>
          <div className="text-base sm:text-lg font-bold text-[#E2B755] mt-1">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#14100E] border border-[#26201B]">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8C7B6C]">Processing</div>
          <div className="text-base sm:text-lg font-bold text-[#F59E0B] mt-1">
            {orders.filter(o => o.order_status === 'processing').length}
          </div>
        </div>
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#14100E] border border-[#26201B]">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8C7B6C]">Active Transit</div>
          <div className="text-base sm:text-lg font-bold text-[#38BDF8] mt-1">
            {orders.filter(o => o.order_status === 'confirmed' || o.order_status === 'shipped').length}
          </div>
        </div>
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#14100E] border border-[#26201B]">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8C7B6C]">Delivered</div>
          <div className="text-base sm:text-lg font-bold text-[#4ADE80] mt-1">
            {orders.filter(o => o.order_status === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6959]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer, phone, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171210] border border-[#2D231C] text-xs text-[#FAF8F5] placeholder-[#7A6959] focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['all', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#C5A059] text-black shadow-md'
                  : 'bg-[#1C1613] text-[#A89887] hover:text-white border border-[#2B221B]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Mobile Orders Cards List (< sm screens) */}
      <div className="block sm:hidden space-y-3">
        {filteredOrders.map((ord) => {
          const statusStyle = STATUS_COLORS[ord.order_status] || STATUS_COLORS.processing;
          const items = ord.order_items || [];
          const formattedDate = ord.created_at
            ? new Date(ord.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : 'Recent';

          return (
            <div
              key={ord.id}
              className="p-4 rounded-2xl bg-[#14100E] border border-[#26201B] shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-bold text-[#E2B755]">
                  {ord.order_number}
                </div>
                <select
                  value={ord.order_status}
                  onChange={(e) => handleStatusChange(ord.id || ord.order_number, e.target.value)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  <option value="processing" className="bg-[#1C1613] text-[#F59E0B]">Processing</option>
                  <option value="confirmed" className="bg-[#1C1613] text-[#38BDF8]">Confirmed</option>
                  <option value="shipped" className="bg-[#1C1613] text-[#C084FC]">Shipped</option>
                  <option value="delivered" className="bg-[#1C1613] text-[#4ADE80]">Delivered</option>
                  <option value="cancelled" className="bg-[#1C1613] text-[#F87171]">Cancelled</option>
                </select>
              </div>

              <div className="text-xs text-[#FAF8F5] font-semibold">
                {ord.customer_name}
                <div className="text-[11px] text-[#8C7B6C] font-normal">{ord.customer_phone || ord.customer_email}</div>
              </div>

              {/* Items preview */}
              <div className="p-2.5 rounded-xl bg-[#1A1411] border border-[#26201A] flex items-center justify-between text-xs">
                <div className="truncate max-w-[190px] text-[#A89887]">
                  {items[0]?.product_name || 'Ensemble Item'}
                  {items.length > 1 && ` (+${items.length - 1} more)`}
                </div>
                <div className="font-bold text-[#FAF8F5]">
                  ₹{ord.total?.toLocaleString() || ord.subtotal?.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#7A6959]">
                <span>{formattedDate} • {ord.payment_method || 'COD'}</span>
                <button
                  onClick={() => setSelectedOrder(ord)}
                  className="text-xs text-[#C5A059] font-semibold hover:underline cursor-pointer"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Orders Table (>= sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-[#14100E] border border-[#26201B] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAF8F5]">
            <thead className="bg-[#1C1613] text-[#A89887] uppercase tracking-wider text-[10px] font-bold border-b border-[#2B221B]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status & Action</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221A16]">
              {filteredOrders.map((ord) => {
                const statusStyle = STATUS_COLORS[ord.order_status] || STATUS_COLORS.processing;
                const items = ord.order_items || [];
                const formattedDate = ord.created_at
                  ? new Date(ord.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Recent';

                return (
                  <tr key={ord.id} className="hover:bg-[#1A1411] transition-colors">
                    
                    {/* Order Number & Date */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-mono text-xs font-bold text-[#E2B755]">
                        {ord.order_number}
                      </div>
                      <div className="text-[10px] text-[#7A6959] mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#FAF8F5]">{ord.customer_name}</div>
                      <div className="text-[10.5px] text-[#8C7B6C]">{ord.customer_phone || ord.customer_email}</div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 text-[#A89887]">
                      <div className="max-w-[170px] truncate font-medium">
                        {items[0]?.product_name || 'Ensemble Piece'}
                      </div>
                      {items.length > 1 && (
                        <span className="text-[9.5px] text-[#C5A059] font-semibold">
                          +{items.length - 1} more item(s)
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#FAF8F5] text-sm">
                        ₹{ord.total?.toLocaleString() || ord.subtotal?.toLocaleString()}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#201915] text-[#C5A059] border border-[#3A2D23]">
                        {ord.payment_method || 'COD'}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={ord.order_status}
                        onChange={(e) => handleStatusChange(ord.id || ord.order_number, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        <option value="processing" className="bg-[#1C1613] text-[#F59E0B]">Processing</option>
                        <option value="confirmed" className="bg-[#1C1613] text-[#38BDF8]">Confirmed</option>
                        <option value="shipped" className="bg-[#1C1613] text-[#C084FC]">Shipped</option>
                        <option value="delivered" className="bg-[#1C1613] text-[#4ADE80]">Delivered</option>
                        <option value="cancelled" className="bg-[#1C1613] text-[#F87171]">Cancelled</option>
                      </select>
                    </td>

                    {/* View Details */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="p-2 rounded-lg bg-[#201814] hover:bg-[#2C211A] text-[#C5A059] hover:text-white transition-colors cursor-pointer"
                        title="View Full Order Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="py-12 text-center text-[#8C7B6C] bg-[#14100E] rounded-3xl border border-[#26201B]">
          <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-[#4A3C32]" />
          <p className="text-sm font-medium">No orders found.</p>
        </div>
      )}

      {/* Order Detail Modal (Responsive Dialog) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto bg-[#15110F] border border-[#3A2E25] rounded-3xl p-4 sm:p-8 shadow-2xl text-[#FAF8F5]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#201915] text-[#8C7B6C] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-[#29201A] mb-4 sm:mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">Order Invoice Details</span>
                <h2 className="font-mono text-base sm:text-xl font-bold text-[#FAF8F5] mt-0.5">
                  {selectedOrder.order_number}
                </h2>
              </div>
              <div className="mr-8">
                <span className={`text-[10px] font-bold uppercase px-2.5 sm:px-3 py-1 rounded-full border ${
                  STATUS_COLORS[selectedOrder.order_status]?.bg || ''
                } ${STATUS_COLORS[selectedOrder.order_status]?.text || ''} ${
                  STATUS_COLORS[selectedOrder.order_status]?.border || ''
                }`}>
                  {selectedOrder.order_status}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#1C1613] border border-[#2D231C] mb-4 sm:mb-6">
              <div>
                <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8C7B6C] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Customer Information</span>
                </div>
                <div className="text-xs font-bold text-white">{selectedOrder.customer_name}</div>
                <div className="text-[11px] text-[#A89887] mt-0.5">{selectedOrder.customer_email}</div>
                <div className="text-[11px] text-[#A89887] mt-0.5">{selectedOrder.customer_phone}</div>
              </div>

              <div>
                <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8C7B6C] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Delivery Destination</span>
                </div>
                <div className="text-xs text-[#FAF8F5] leading-relaxed">
                  {selectedOrder.shipping_address?.street || 'N/A'}<br />
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postalCode}<br />
                  {selectedOrder.shipping_address?.country || 'India'}
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#A89887]">
                Ordered Ensembles ({(selectedOrder.order_items || []).length})
              </div>

              <div className="divide-y divide-[#241B16] border border-[#26201B] rounded-2xl overflow-hidden bg-[#181210]">
                {(selectedOrder.order_items || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-10 h-12 object-cover rounded-md bg-[#221A15]"
                        />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-[#FAF8F5] uppercase tracking-wide line-clamp-1">
                          {item.product_name}
                        </div>
                        <div className="text-[10px] sm:text-[10.5px] text-[#8C7B6C] mt-0.5">
                          Size: <span className="text-white font-bold">{item.size}</span> • Qty: <span className="text-white font-bold">{item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-[#E2B755] shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Financials */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C1613] border border-[#2D231C] space-y-1.5 sm:space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#A89887]">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[#A89887]">
                <span>Express Courier Shipping</span>
                <span className="text-[#22C55E]">Free (Complimentary)</span>
              </div>
              <div className="flex items-center justify-between text-[#A89887]">
                <span>Payment Mode</span>
                <span className="text-white font-medium">{selectedOrder.payment_method || 'COD'}</span>
              </div>
              <div className="pt-2 border-t border-[#2C221B] flex items-center justify-between font-bold text-sm text-white">
                <span>Grand Total</span>
                <span className="text-[#E2B755]">₹{selectedOrder.total?.toLocaleString()}</span>
              </div>
            </div>

            {/* Status Change CTA in Modal */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-[#29201A]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8C7B6C]">Update Status:</span>
                <select
                  value={selectedOrder.order_status}
                  onChange={(e) => handleStatusChange(selectedOrder.id || selectedOrder.order_number, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#221A15] border border-[#3A2D23] text-xs font-bold text-[#E2B755] cursor-pointer focus:outline-none"
                >
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#221B17] text-xs font-semibold text-[#A89887] hover:text-white cursor-pointer"
              >
                Close Modal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
