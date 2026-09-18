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
  X,
  Trash2,
  Printer,
  AlertCircle,
  FileText,
  Check
} from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus, deleteOrder } from '@/lib/supabase/services';

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

  // Delete State
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Print State
  const [orderToPrint, setOrderToPrint] = useState<any | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
    setOrders(prev =>
      prev.map(o => (o.id === orderId || o.order_number === orderId ? { ...o, order_status: newStatus } : o))
    );
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

  // Delete Order Handler
  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    const targetId = deletingOrder.id || deletingOrder.order_number;
    setIsDeleting(true);

    try {
      // Optimistic removal from state
      setOrders(prev => prev.filter(o => o.id !== targetId && o.order_number !== targetId));

      if (selectedOrder && (selectedOrder.id === targetId || selectedOrder.order_number === targetId)) {
        setSelectedOrder(null);
      }

      await deleteOrder(targetId);
      showToast(`Order ${deletingOrder.order_number || ''} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete order:', err);
      showToast('Error deleting order. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeletingOrder(null);
    }
  };

  // Open Print Preview Modal
  const handlePrintPreview = (order: any) => {
    setOrderToPrint(order);
    setShowPrintPreview(true);
  };

  // Trigger Immediate Browser Print
  const handleTriggerPrint = (order: any) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 150);
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

  // Address Helper
  const formatAddress = (addr: any) => {
    if (!addr) return { street: 'Not Specified', cityStatePin: '', country: 'India' };
    if (typeof addr === 'string') return { street: addr, cityStatePin: '', country: 'India' };
    const street = addr.street || addr.address || 'Not Specified';
    const cityStatePin = [
      addr.city,
      addr.state,
      addr.postalCode || addr.pincode ? `PIN: ${addr.postalCode || addr.pincode}` : ''
    ].filter(Boolean).join(', ');
    const country = addr.country || 'India';
    return { street, cityStatePin, country };
  };

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
            Track customer orders, review shipping addresses, print customer dispatch slips, and manage order lifecycles.
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
              key={ord.id || ord.order_number}
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

              <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE2] text-[11px] text-[#7A6959]">
                <span>{formattedDate} • {ord.payment_method || 'COD'}</span>
                
                {/* Actions row: Print, Delete, View */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handlePrintPreview(ord)}
                    className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#8A7B6E] hover:text-[#1C1613] border border-[#EAE2D5] transition-colors cursor-pointer"
                    title="Print Customer Details & Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingOrder(ord)}
                    className="p-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] transition-colors cursor-pointer"
                    title="Delete Order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF5EC] text-xs text-[#936718] font-bold hover:bg-[#F3E7D3] border border-[#EBDCC5] transition-colors cursor-pointer active:scale-95"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop & Tablet Orders Table (>= sm screens) */}
      <div className="hidden sm:block rounded-3xl bg-white border border-[#EAE2D5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto admin-responsive-table">
          <table className="w-full min-w-[820px] text-left text-xs text-[#1C1613]">
            <thead className="bg-[#FAF6EE] text-[#7A6959] uppercase tracking-wider text-[10px] font-bold border-b border-[#EAE2D5]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Order ID &amp; Date</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
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
                  <tr key={ord.id || ord.order_number} className="hover:bg-[#FAF7F2] transition-colors">
                    
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

                    {/* Actions: View Details, Print Customer Details, Delete Order */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#936718] border border-[#EAE2D5] transition-colors cursor-pointer"
                          title="View Full Order Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintPreview(ord)}
                          className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#6B5E52] hover:text-[#1C1613] border border-[#EAE2D5] transition-colors cursor-pointer"
                          title="Print Customer Details & Dispatch Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingOrder(ord)}
                          className="p-2 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1.5">
              <button
                onClick={() => handlePrintPreview(selectedOrder)}
                className="p-2 rounded-full bg-[#FAF5EC] hover:bg-[#F3E7D3] text-[#936718] border border-[#EBDCC5] cursor-pointer transition-colors"
                title="Print Customer Details Slip"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full bg-[#FAF7F2] text-[#7A6959] hover:text-[#1C1613] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5] mb-4 sm:mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#936718]">Order Invoice Details</span>
                <h2 className="font-mono text-base sm:text-xl font-bold text-[#1C1613] mt-0.5">
                  {selectedOrder.order_number}
                </h2>
              </div>
              <div className="mr-16">
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
                <div className="text-[11px] text-[#7A6959] mt-0.5">{selectedOrder.customer_email || 'No email provided'}</div>
                <div className="text-[11px] text-[#7A6959] mt-0.5 font-medium">{selectedOrder.customer_phone || 'No phone provided'}</div>
              </div>

              <div>
                <div className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[#8A7B6E] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#936718]" />
                  <span>Delivery Destination</span>
                </div>
                <div className="text-xs text-[#1C1613] leading-relaxed">
                  {typeof selectedOrder.shipping_address === 'string' ? (
                    selectedOrder.shipping_address
                  ) : (
                    <>
                      {selectedOrder.shipping_address?.street || selectedOrder.shipping_address?.address || 'Not specified'}<br />
                      {selectedOrder.shipping_address?.city || ''}{selectedOrder.shipping_address?.state ? `, ${selectedOrder.shipping_address?.state}` : ''}{selectedOrder.shipping_address?.postalCode || selectedOrder.shipping_address?.pincode ? ` - ${selectedOrder.shipping_address?.postalCode || selectedOrder.shipping_address?.pincode}` : ''}<br />
                      {selectedOrder.shipping_address?.country || 'India'}
                    </>
                  )}
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

            {/* Actions in Modal: Status Update, Print Customer Slip, Delete Order, Close */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-[#EAE2D5]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A6959]">Status:</span>
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePrintPreview(selectedOrder)}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF5EC] hover:bg-[#F3E7D3] text-xs font-bold text-[#936718] border border-[#EBDCC5] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  title="Print Customer Details & Dispatch Slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={() => setDeletingOrder(selectedOrder)}
                  className="px-3.5 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-xs font-bold text-[#DC2626] border border-[#FECACA] flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Delete Order Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE2] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] border border-[#DDD4C5] cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#EAE2D5] rounded-3xl p-6 shadow-2xl text-[#1C1613] space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="p-2.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA]">
                <AlertCircle className="w-6 h-6 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="font-display text-lg text-[#1C1613] font-bold">Delete Order</h3>
                <span className="font-mono text-xs text-[#936718] font-bold">
                  {deletingOrder.order_number}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B5E52] leading-relaxed">
              Are you sure you want to permanently delete order <strong className="text-[#1C1613]">{deletingOrder.order_number}</strong> for <strong className="text-[#1C1613]">{deletingOrder.customer_name}</strong>?
            </p>

            <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[11px] text-[#DC2626] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>Irreversible Action</span>
              </div>
              <p className="text-[10.5px] leading-normal opacity-90">
                This will delete the customer order records, item manifests, and delivery status permanently from both the store dashboard and database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F2ECE2]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingOrder(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#6B5E52] hover:bg-[#F2ECE2] border border-[#DDD4C5] cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Order...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details & Dispatch Manifest Print Preview Modal */}
      {showPrintPreview && orderToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[95vh] overflow-y-auto bg-white border border-[#EAE2D5] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#1C1613]">
            
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EAE2D5]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#936718]" />
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#1C1613]">
                    Customer Details &amp; Dispatch Slip
                  </h3>
                  <p className="text-[11px] text-[#7A6959]">
                    Review invoice &amp; customer delivery details before printing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#936718] hover:bg-[#7D5714] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Now</span>
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 rounded-full bg-[#FAF7F2] text-[#7A6959] hover:text-[#1C1613] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visual Invoice Paper Container */}
            <div className="p-6 sm:p-8 border border-[#EAE2D5] rounded-2xl bg-white shadow-xs space-y-6 text-[#1C1613]">
              
              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#EAE2D5]">
                <div>
                  <div className="text-2xl font-serif tracking-wider font-bold text-[#1C1613]">
                    ZAYMERA
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-[#936718] font-bold mt-0.5">
                    Haute Couture &amp; Luxury Fashion Atelier
                  </div>
                  <div className="text-[11px] text-[#7A6959] mt-1">
                    support@zaymera.com • www.zaymera.com
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded bg-[#FAF5EC] border border-[#EBDCC5] text-[10px] uppercase font-bold tracking-wider text-[#936718]">
                    Customer Dispatch Manifest
                  </span>
                  <div className="font-mono text-sm font-bold text-[#1C1613]">
                    Order #{orderToPrint.order_number}
                  </div>
                  <div className="text-[11px] text-[#7A6959]">
                    Date: {orderToPrint.created_at ? new Date(orderToPrint.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                  </div>
                </div>
              </div>

              {/* Customer & Shipping 2-Column Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Customer Details */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#936718] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Information</span>
                  </div>
                  <div className="text-xs font-bold text-[#1C1613]">
                    {orderToPrint.customer_name}
                  </div>
                  <div className="text-xs text-[#4A3E34] flex items-center gap-1.5 pt-0.5">
                    <Phone className="w-3 h-3 text-[#936718]" />
                    <span className="font-semibold">{orderToPrint.customer_phone || 'N/A'}</span>
                  </div>
                  <div className="text-xs text-[#7A6959] flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-[#936718]" />
                    <span>{orderToPrint.customer_email || 'N/A'}</span>
                  </div>
                </div>

                {/* Shipping Destination */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#936718] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Address</span>
                  </div>
                  <div className="text-xs font-bold text-[#1C1613]">
                    {orderToPrint.customer_name}
                  </div>
                  <div className="text-xs text-[#4A3E34] leading-relaxed">
                    {(() => {
                      const addr = formatAddress(orderToPrint.shipping_address);
                      return (
                        <>
                          {addr.street}<br />
                          {addr.cityStatePin && <>{addr.cityStatePin}<br /></>}
                          {addr.country}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Ordered Items Table */}
              <div className="border border-[#EAE2D5] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6EE] text-[#7A6959] text-[10px] uppercase font-bold border-b border-[#EAE2D5]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE2]">
                    {(orderToPrint.order_items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="text-xs">
                        <td className="py-2.5 px-3 text-[#7A6959]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#1C1613]">
                          {item.product_name}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#936718]">{item.size || 'Standard'}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-[#7A6959]">₹{item.price?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#1C1613]">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financials & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-[#8A7B6E]">Payment Information</div>
                  <div className="font-semibold text-[#1C1613] flex items-center justify-between">
                    <span>Payment Mode:</span>
                    <span className="font-bold text-[#936718]">{orderToPrint.payment_method || 'COD'}</span>
                  </div>
                  <div className="text-[#7A6959] flex items-center justify-between">
                    <span>Payment Status:</span>
                    <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-white border border-[#DDD4C5]">
                      {orderToPrint.payment_status || (orderToPrint.payment_method === 'COD' ? 'Pending (Collect on Delivery)' : 'Paid')}
                    </span>
                  </div>
                  <div className="text-[#7A6959] flex items-center justify-between">
                    <span>Order Lifecycle:</span>
                    <span className="uppercase font-bold text-[10px] text-[#15803D]">
                      {orderToPrint.order_status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D5] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#6B5E52]">
                    <span>Subtotal:</span>
                    <span>₹{orderToPrint.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B5E52]">
                    <span>Complimentary Shipping:</span>
                    <span className="text-[#16A34A] font-semibold">₹0 (Free)</span>
                  </div>
                  <div className="pt-2 border-t border-[#EAE2D5] flex items-center justify-between font-bold text-sm text-[#1C1613]">
                    <span>Grand Total:</span>
                    <span className="text-[#936718]">₹{orderToPrint.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Warehouse Dispatch Verification Box */}
              <div className="p-4 rounded-xl border border-dashed border-[#D5C9B7] bg-[#FAF9F6] text-xs space-y-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A7B6E]">
                  Warehouse &amp; Courier Packaging Verification
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#4A3E34]">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded text-[#936718]" readOnly />
                    <span>Fabric Inspected</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded text-[#936718]" readOnly />
                    <span>Luxury Box Packed</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded text-[#936718]" readOnly />
                    <span>Tamper-Proof Tag</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded text-[#936718]" readOnly />
                    <span>Invoice Enclosed</span>
                  </label>
                </div>
                <div className="pt-2 border-t border-[#EAE2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#7A6959]">
                  <div>Dispatcher Signature: ______________________</div>
                  <div>AWB / Courier Tracking: ______________________</div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-[#8A7B6E] pt-2">
                Thank you for ordering with Zaymera Couture. For concierge or alterations, contact support@zaymera.com.
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#EAE2D5]">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE2] text-xs font-semibold text-[#6B5E52] hover:text-[#1C1613] border border-[#DDD4C5] cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#936718] hover:bg-[#7D5714] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DEDICATED PRINT DOM CONTAINER (Visible only in @media print) */}
      {orderToPrint && (
        <div id="printable-customer-slip" className="hidden print:block font-sans text-black">
          
          {/* Atelier Brand Header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-black mb-4">
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-wider text-black m-0">
                ZAYMERA
              </h1>
              <p className="text-xs uppercase font-bold text-gray-700 tracking-wider m-0 mt-0.5">
                Luxury Ethnic Wear &amp; Haute Couture
              </p>
              <p className="text-[10px] text-gray-600 m-0 mt-1">
                Concierge: support@zaymera.com • Store: www.zaymera.com
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-black border border-black px-2 py-0.5 inline-block">
                Customer Dispatch Slip &amp; Invoice
              </div>
              <div className="text-sm font-mono font-bold text-black mt-1">
                Order #{orderToPrint.order_number}
              </div>
              <div className="text-[11px] text-gray-700 mt-0.5">
                Date: {orderToPrint.created_at ? new Date(orderToPrint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
              </div>
            </div>
          </div>

          {/* Customer and Delivery Details */}
          <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-300 text-xs">
            {/* Customer Details */}
            <div className="p-3 border border-gray-300 rounded">
              <div className="text-[10px] font-bold uppercase text-gray-700 mb-1">
                Customer Information
              </div>
              <div className="font-bold text-sm text-black">
                {orderToPrint.customer_name}
              </div>
              <div className="text-xs text-black mt-1">
                <strong>Phone:</strong> {orderToPrint.customer_phone || 'N/A'}
              </div>
              <div className="text-xs text-gray-800 mt-0.5">
                <strong>Email:</strong> {orderToPrint.customer_email || 'N/A'}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-3 border border-gray-300 rounded">
              <div className="text-[10px] font-bold uppercase text-gray-700 mb-1">
                Shipping &amp; Delivery Destination
              </div>
              <div className="font-bold text-xs text-black">
                {orderToPrint.customer_name}
              </div>
              <div className="text-xs text-black leading-relaxed mt-1">
                {(() => {
                  const addr = formatAddress(orderToPrint.shipping_address);
                  return (
                    <>
                      {addr.street}<br />
                      {addr.cityStatePin && <>{addr.cityStatePin}<br /></>}
                      {addr.country}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full text-left text-xs border border-gray-300">
              <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-2 px-2.5 border-r border-gray-300 w-8">#</th>
                  <th className="py-2 px-2.5 border-r border-gray-300">Garment / Ensemble</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 w-16">Size</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 text-center w-12">Qty</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 text-right w-24">Price</th>
                  <th className="py-2 px-2.5 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {(orderToPrint.order_items || []).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-gray-600">{idx + 1}</td>
                    <td className="py-2 px-2.5 border-r border-gray-300 font-semibold text-black">
                      {item.product_name}
                    </td>
                    <td className="py-2 px-2.5 border-r border-gray-300 font-bold">{item.size || 'Standard'}</td>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-right">₹{item.price?.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-right font-bold">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials and Payment Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div className="p-3 border border-gray-300 rounded space-y-1">
              <div className="font-bold text-[10px] uppercase text-gray-700">Payment Summary</div>
              <div><strong>Method:</strong> {orderToPrint.payment_method || 'Cash on Delivery (COD)'}</div>
              <div><strong>Status:</strong> {orderToPrint.payment_status || (orderToPrint.payment_method === 'COD' ? 'Pending (Collect on Delivery)' : 'Paid')}</div>
              <div><strong>Order Status:</strong> {orderToPrint.order_status?.toUpperCase()}</div>
            </div>

            <div className="p-3 border border-gray-300 rounded space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{orderToPrint.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>Free Complimentary</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-300 font-bold text-sm text-black">
                <span>Total Amount:</span>
                <span>₹{orderToPrint.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Warehouse Checklist & Dispatch Verification */}
          <div className="p-3 border border-dashed border-gray-400 rounded text-xs space-y-2 mb-4">
            <div className="text-[10px] font-bold uppercase text-gray-700">
              Warehouse Packaging &amp; Dispatch Checklist
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div>[ ✓ ] Quality Inspected</div>
              <div>[ ✓ ] Hand-Packed in Gift Box</div>
              <div>[ ✓ ] Security Tag Attached</div>
              <div>[ ✓ ] Invoice Enclosed</div>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300 text-[10px] text-gray-700">
              <div>Dispatcher Signature: _______________________</div>
              <div>Courier AWB / Tracking #: _______________________</div>
            </div>
          </div>

          {/* Slip Footer */}
          <div className="text-center text-[10px] text-gray-600 border-t border-gray-300 pt-2">
            Thank you for shopping with Zaymera Couture. For queries or returns, email support@zaymera.com.
          </div>

        </div>
      )}

    </div>
  );
}
