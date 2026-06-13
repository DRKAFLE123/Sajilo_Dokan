"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  ShoppingBag, Package, Truck, CheckCircle2, Clock, 
  ChevronRight, ArrowRight, MapPin, Phone, CreditCard,
  AlertCircle, Search, Filter, Download
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/');
      setOrders(res.data?.results ?? res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePayNow = async (orderId: number) => {
    try {
      const res = await api.post(`/orders/${orderId}/initiate-khalti/`, {
        return_url: `${window.location.origin}/orders/payment-callback`,
        website_url: window.location.origin
      });
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        alert('Could not initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('Khalti initiate error', err);
      alert('Failed to connect to Khalti payment gateway.');
    }
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Invoice download error', err);
      alert('Failed to download invoice.');
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrder || !disputeReason) return;
    setSubmittingDispute(true);
    try {
      await api.post('/disputes/', {
        order: disputeOrder.id,
        reason: disputeReason
      });
      alert('Your dispute has been submitted successfully. Admin and Shop Owner have been notified.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeOrder(null);
      fetchOrders();
    } catch (err: any) {
      console.error('Raise dispute error', err);
      alert('Failed to raise dispute. ' + (err.response?.data?.detail || ''));
    } finally {
      setSubmittingDispute(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'processing': return <Package size={16} className="text-blue-500" />;
      case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'processing': return 'Processing';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const filteredOrders = filter 
    ? orders.filter(o => o.status === filter)
    : orders;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">My Orders</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Order History</h1>
          <p className="text-gray-500 mt-1">Track and manage your recent orders.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm appearance-none"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto mb-6 shadow-sm">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">You haven't placed any orders matching this criteria yet.</p>
          <Link href="/" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
              <div className="p-8 md:p-10">
                <div className="flex flex-wrap justify-between items-start gap-6 mb-8 pb-8 border-b border-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</span>
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">#{order.id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {order.payment_status}
                      </div>
                      {order.dispute_status && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.dispute_status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          Dispute: {order.dispute_status}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Total Amount</span>
                    <span className="text-2xl font-black text-gray-900">NPR {order.total}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Order Items */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                      <ShoppingBag size={12} /> Items Ordered
                    </h5>
                    <div className="space-y-3">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl group-hover:bg-gray-50 transition">
                          <div className="w-14 h-14 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src={item.product?.images?.[0]?.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{item.product?.name}</p>
                            <p className="text-[10px] text-gray-500">Quantity: {item.quantity} × NPR {item.price}</p>
                          </div>
                          <span className="font-black text-gray-900 text-xs">NPR {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                        <Truck size={12} /> Delivery Info
                      </h5>
                      <div className="text-[11px] font-medium text-gray-600 space-y-1.5">
                        <p className="flex items-center gap-2 font-bold text-gray-900"><Phone size={12} className="text-gray-300" /> {order.phone_number}</p>
                        <p className="flex items-start gap-2"><MapPin size={12} className="text-gray-300 mt-0.5" /> {order.shipping_address}, {order.city}</p>
                        <p className="flex items-center gap-2 capitalize"><Truck size={12} className="text-gray-300" /> {order.order_type}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                        <CreditCard size={12} /> Payment
                      </h5>
                      <div className="text-[11px] font-medium text-gray-600 space-y-1.5">
                        <p className="font-bold text-gray-900 uppercase">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">Shop ID: {order.shop}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-between items-center pt-8 border-t border-gray-50">
                  <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5">
                    <Clock size={12} /> Ordered on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-4">
                    {order.payment_method === 'online' && order.payment_status === 'unpaid' && (
                      <button 
                        onClick={() => handlePayNow(order.id)}
                        className="bg-[#5C2D91] hover:bg-[#4a2475] text-white px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2"
                      >
                        <CreditCard size={14} /> Pay with Khalti
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition"
                      title="Download Invoice"
                    >
                      <Download size={14} /> Invoice
                    </button>
                    {!order.dispute_status && order.status !== 'cancelled' && order.status !== 'returned' && (
                      <button 
                        onClick={() => { setDisputeOrder(order); setShowDisputeModal(true); }}
                        className="text-xs font-bold text-red-500 hover:text-red-650 transition"
                      >
                        Raise Dispute
                      </button>
                    )}
                    <Link href={`/chat?shop_id=${order.shop}`} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
                      Contact Shop <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDisputeModal && disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-xl space-y-6 mx-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 text-red-600">
                <AlertCircle size={20} /> Raise a Dispute
              </h3>
              <p className="text-gray-500 text-xs mt-2">
                Order <span className="font-mono font-bold text-gray-800">#{disputeOrder.id}</span>
              </p>
              <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                Submitting a dispute will notify the shop owner and platform mediators. Provide details of the problem (e.g., damaged items, incorrect quantity).
              </p>
            </div>
            
            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Mediation Request / Reason</label>
                <textarea 
                  rows={4}
                  required
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="Detail the issue with your order..." 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => { setShowDisputeModal(false); setDisputeReason(''); setDisputeOrder(null); }}
                  className="flex-1 px-5 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingDispute}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  {submittingDispute ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
