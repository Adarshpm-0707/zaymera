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
  processing: { bg: 'bg-[#FEF9EE]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
  confirmed: { bg: 'bg-[#EFF6FF]', text: 'text-[#0284C7]', border: 'border-[#BAE6FD]' },
  shipped: { bg: 'bg-[#FAF5FF]', text: 'text-[#9333EA]', border: 'border-[#E9D5FF]' },
  delivered: { bg: 'bg-[#ECFDF5]', text: 'text-[#15803D]', border: 'border-[#86EFAC]' },
  cancelled: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FECACA]' }
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
              Orders Control Center
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#FEF9EE] border border-[#F3E0B5] text-[#936718] px-2.5 py-0.5 rounded-full font-bold">
              {orders.length} Orders
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#7A6959] mt-1 font-normal">
            Track customer orders, review shipping addresses, and manage dispatch lifecycles.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-[#F6F1E8] border border-[#EAE2D5] text-[#7A6959] hover:text-[#1C1613] transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E]">Total Revenue</div>
          <div className="text-base sm:text-lg font-bold text-[#936718] mt-1">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E]">Processing</div>
          <div className="text-base sm:text-lg font-bold text-[#D97706] mt-1">
            {orders.filter(o => o.order_status === 'processing').length}
          </div>
        </div>
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E]">Active Transit</div>
          <div className="text-base sm:text-lg font-bold text-[#0284C7] mt-1">
            {orders.filter(o => o.order_status === 'confirmed' || o.order_status === 'shipped').length}
          </div>
        </div>
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs">
          <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E]">Delivered</div>
          <div className="text-base sm:text-lg font-bold text-[#16A34A] mt-1">
            {orders.filter(o => o.order_status === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7B6E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer, phone, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#1C1613] placeholder-[#8A7B6E] focus:outline-none focus:border-[#C5A059] shadow-xs"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['all', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize tracking-wide transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                selectedStatus === st
                  ? 'bg-[#C5A059] text-white'
                  : 'bg-white text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5]'
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
              className="p-4 rounded-2xl bg-white border border-[#EAE2D5] shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-bold text-[#936718]">
                  {ord.order_number}
                </div>
                <select
                  value={ord.order_status}
                  onChange={(e) => handleStatusChange(ord.id || ord.order_number, e.target.value)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="text-xs text-[#1C1613] font-semibold">
                {ord.customer_name}
                <div className="text-[11px] text-[#7A6959] font-normal">{ord.customer_phone || ord.customer_email}</div>
              </div>

              {/* Items preview */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] flex items-center justify-between text-xs">
                <div className="truncate max-w-[190px] text-[#6B5E52]">
                  {items[0]?.product_name || 'Ensemble Item'}
                  {items.length > 1 && ` (+${items.length - 1} more)`}
                </div>
                <div className="font-bold text-[#1C1613]">
                  ₹{ord.total?.toLocaleString() || ord.subtotal?.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#7A6959]">
                <span>{formattedDate} • {ord.payment_method || 'COD'}</span>
                <button
                  onClick={() => setSelectedOrder(ord)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF5EC] text-xs text-[#936718] font-bold hover:bg-[#F3E7D3] border border-[#EBDCC5] transition-colors cursor-pointer active:scale-95 shrink-0"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop & Tablet Orders Table (>= sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-white border border-[#EAE2D5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto admin-responsive-table">
          <table className="w-full min-w-[780px] text-left text-xs text-[#1C1613]">
            <thead className="bg-[#FAF6EE] text-[#7A6959] uppercase tracking-wider text-[10px] font-bold border-b border-[#EAE2D5]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Order ID &amp; Date</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status &amp; Action</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE2]">
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
                  <tr key={ord.id} className="hover:bg-[#FAF7F2] transition-colors">
                    
                    {/* Order Number & Date */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-mono text-xs font-bold text-[#936718]">
                        {ord.order_number}
                      </div>
                      <div className="text-[10px] text-[#7A6959] mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1C1613]">{ord.customer_name}</div>
                      <div className="text-[10.5px] text-[#7A6959]">{ord.customer_phone || ord.customer_email}</div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 text-[#6B5E52]">
                      <div className="max-w-[170px] truncate font-medium text-[#1C1613]">
                        {items[0]?.product_name || 'Ensemble Piece'}
                      </div>
                      {items.length > 1 && (
                        <span className="text-[9.5px] text-[#936718] font-semibold">
                          +{items.length - 1} more item(s)
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1C1613] text-sm">
                        ₹{ord.total?.toLocaleString() || ord.subtotal?.toLocaleString()}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FAF5EC] text-[#936718] border border-[#EBDCC5]">
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
                        <option value="processing">Processing</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* View Details */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#936718] border border-[#EAE2D5] transition-colors cursor-pointer"
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
        <div className="py-12 text-center text-[#7A6959] bg-white rounded-3xl border border-[#EAE2D5]">
          <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-[#BAAC9C]" />
          <p className="text-sm font-medium text-[#1C1613]">No orders found.</p>
        </div>
      )}

      {/* Order Detail Modal (Responsive Dialog) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-4 sm:p-8 shadow-2xl text-[#1C1613]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-[#FAF7F2] text-[#7A6959] hover:text-[#1C1613] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5] mb-4 sm:mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#936718]">Order Invoice Details</span>
                <h2 className="font-mono text-base sm:text-xl font-bold text-[#1C1613] mt-0.5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] mb-4 sm:mb-6">
              <div>
                <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#936718]" />
                  <span>Customer Information</span>
                </div>
                <div className="text-xs font-bold text-[#1C1613]">{selectedOrder.customer_name}</div>
                <div className="text-[11px] text-[#7A6959] mt-0.5">{selectedOrder.customer_email}</div>
                <div className="text-[11px] text-[#7A6959] mt-0.5">{selectedOrder.customer_phone}</div>
              </div>

              <div>
                <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#936718]" />
                  <span>Delivery Destination</span>
                </div>
                <div className="text-xs text-[#1C1613] leading-relaxed">
                  {selectedOrder.shipping_address?.street || 'N/A'}<br />
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postalCode}<br />
                  {selectedOrder.shipping_address?.country || 'India'}
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6B5E52]">
                Ordered Ensembles ({(selectedOrder.order_items || []).length})
              </div>

              <div className="divide-y divide-[#F2ECE2] border border-[#EAE2D5] rounded-2xl overflow-hidden bg-[#FAF8F5]">
                {(selectedOrder.order_items || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-10 h-12 object-cover rounded-md bg-white border border-[#EAE2D5]"
                        />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-[#1C1613] uppercase tracking-wide line-clamp-1">
                          {item.product_name}
                        </div>
                        <div className="text-[10px] sm:text-[10.5px] text-[#7A6959] mt-0.5">
                          Size: <span className="text-[#1C1613] font-bold">{item.size}</span> • Qty: <span className="text-[#1C1613] font-bold">{item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-[#936718] shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Financials */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1.5 sm:space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#6B5E52]">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[#6B5E52]">
                <span>Express Courier Shipping</span>
                <span className="text-[#16A34A] font-semibold">Free (Complimentary)</span>
              </div>
              <div className="flex items-center justify-between text-[#6B5E52]">
                <span>Payment Mode</span>
                <span className="text-[#1C1613] font-medium">{selectedOrder.payment_method || 'COD'}</span>
              </div>
              <div className="pt-2 border-t border-[#EAE2D5] flex items-center justify-between font-bold text-sm text-[#1C1613]">
                <span>Grand Total</span>
                <span className="text-[#936718]">₹{selectedOrder.total?.toLocaleString()}</span>
              </div>
            </div>

            {/* Status Change CTA in Modal */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-[#EAE2D5]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A6959]">Update Status:</span>
                <select
                  value={selectedOrder.order_status}
                  onChange={(e) => handleStatusChange(selectedOrder.id || selectedOrder.order_number, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#DDD4C5] text-xs font-bold text-[#936718] cursor-pointer focus:outline-none shadow-xs"
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
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE2] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] border border-[#DDD4C5] cursor-pointer transition-colors"
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
