"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  ShoppingBag, Filter, ChevronDown, Search, MoreVertical,
  Truck, Package, CheckCircle2, XCircle, Clock, AlertCircle,
  CreditCard, MapPin, Phone, User, Calendar, ExternalLink, Download
} from 'lucide-react';

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    order_type: '',
    payment_method: '',
    payment_status: ''
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await api.get(`/orders/?${query}`);
      setOrders(res.data?.results ?? res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const updateOrderStatus = async (orderId: number, status: string, paymentStatus?: string) => {
    try {
      await api.patch(`/orders/${orderId}/update-status/`, { status, payment_status: paymentStatus });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status, payment_status: paymentStatus ?? prev.payment_status }));
      }
    } catch (err) {
      console.error('Failed to update status', err);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'packed': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'returned': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders Management</h1>
          <p className="text-gray-500 text-sm">Manage incoming orders and delivery status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl flex items-center px-4 py-2.5 shadow-sm group focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <Search className="text-gray-400 mr-3" size={18} />
            <input placeholder="Search orders..." className="outline-none text-sm w-48" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400 mr-2">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
        </div>
        
        <select 
          className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none"
          value={filters.status}
          onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </select>

        <select 
          className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none"
          value={filters.order_type}
          onChange={e => setFilters(prev => ({ ...prev, order_type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Self-Pickup</option>
        </select>

        <select 
          className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none"
          value={filters.payment_method}
          onChange={e => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
        >
          <option value="">Payment Method</option>
          <option value="cod">Cash on Delivery</option>
          <option value="online">Online Payment</option>
        </select>

        <select 
          className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none"
          value={filters.payment_status}
          onChange={e => setFilters(prev => ({ ...prev, payment_status: e.target.value }))}
        >
          <option value="">Payment Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>

        <button 
          onClick={() => setFilters({ status: '', order_type: '', payment_method: '', payment_status: '' })}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Orders Table */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Order ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Total</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Type</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 text-gray-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-gray-400">No orders found.</td></tr>
              ) : orders.map((order: any) => (
                <tr 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`cursor-pointer hover:bg-indigo-50/30 transition-colors ${selectedOrder?.id === order.id ? 'bg-indigo-50/50' : ''}`}
                >
                  <td className="px-6 py-5">
                    <span className="font-mono font-bold text-gray-900">#{order.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                        {order.full_name?.charAt(0) || order.customer?.username?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{order.full_name}</span>
                        <span className="text-[10px] text-gray-400">{order.phone_number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-extrabold text-gray-900">NPR {order.total}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {order.order_type === 'delivery' ? <Truck size={14} className="text-gray-400" /> : <Package size={14} className="text-gray-400" />}
                      <span className="text-xs font-medium text-gray-600 capitalize">{order.order_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 transition">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {selectedOrder ? (
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden sticky top-6 animate-in slide-in-from-right-8 duration-300">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <h3 className="font-black text-gray-900 tracking-tight">Order Details</h3>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">#{selectedOrder.id}</span>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Items */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <ShoppingBag size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ordered Items</span>
                  </div>
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                          <img src={item.product?.images?.[0]?.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{item.product?.name}</span>
                          <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-900">NPR {item.price}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Grand Total</span>
                    <span className="text-xl font-black text-indigo-600">NPR {selectedOrder.total}</span>
                  </div>
                </div>

                {/* Shipping & Payment */}
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <User size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Customer Info</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 space-y-2">
                      <div className="flex items-center gap-2"><User size={14} className="text-gray-300" /> {selectedOrder.full_name}</div>
                      <div className="flex items-center gap-2"><Phone size={14} className="text-gray-300" /> {selectedOrder.phone_number}</div>
                      {selectedOrder.order_type === 'delivery' && (
                        <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-300 mt-1" /> {selectedOrder.shipping_address}, {selectedOrder.city}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CreditCard size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Payment Info</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-gray-400">{selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block w-fit ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedOrder.payment_status}
                        </span>
                      </div>
                      {selectedOrder.payment_status === 'unpaid' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, selectedOrder.status, 'paid')}
                          className="bg-white border border-gray-200 text-[10px] font-black uppercase px-3 py-2 rounded-xl hover:bg-gray-50 transition"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-8 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Document</span>
                    <button 
                      onClick={() => handleDownloadInvoice(selectedOrder.id)}
                      className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                    >
                      <Download size={14} /> Invoice PDF
                    </button>
                  </div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Update Order Status</div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOrder.status === 'pending' && (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                        className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-xs hover:bg-blue-100 transition col-span-2"
                      >
                        <CheckCircle2 size={14} /> Confirm Order
                      </button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'packed')}
                        className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 py-3 rounded-2xl font-bold text-xs hover:bg-purple-100 transition col-span-2"
                      >
                        <Package size={14} /> Mark as Packed
                      </button>
                    )}
                    {selectedOrder.status === 'packed' && (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                        className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-3 rounded-2xl font-bold text-xs hover:bg-indigo-100 transition col-span-2"
                      >
                        <Truck size={14} /> Ship Order
                      </button>
                    )}
                    {selectedOrder.status === 'shipped' && (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                        className="flex items-center justify-center gap-2 bg-teal-50 text-teal-600 py-3 rounded-2xl font-bold text-xs hover:bg-teal-100 transition col-span-2"
                      >
                        <CheckCircle2 size={14} /> Mark Delivered
                      </button>
                    )}
                    {selectedOrder.status === 'delivered' && (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                        className="flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-2xl font-bold text-xs hover:bg-green-100 transition col-span-2"
                      >
                        <CheckCircle2 size={14} /> Complete Order
                      </button>
                    )}
                    
                    {['pending', 'confirmed', 'packed'].includes(selectedOrder.status) && (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                        className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition col-span-2"
                      >
                        <XCircle size={14} /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-12 text-center flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                <Clock size={40} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Select an order</p>
                <p className="text-xs text-gray-400">Click on an order to view full details and manage its status.</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-xl">
            <div className="absolute -right-8 -bottom-8 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition duration-1000" />
            <h4 className="font-bold text-lg mb-4 relative z-10">Order Insights</h4>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-indigo-100 text-xs">
                <span>Pending Orders</span>
                <span className="font-bold text-white">{orders.filter(o => o.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between items-center text-indigo-100 text-xs">
                <span>Self-Pickup</span>
                <span className="font-bold text-white">{orders.filter(o => o.order_type === 'pickup').length}</span>
              </div>
              <div className="flex justify-between items-center text-indigo-100 text-xs">
                <span>Today's Total</span>
                <span className="font-bold text-white">NPR {orders.reduce((acc, o) => acc + parseFloat(o.total), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
