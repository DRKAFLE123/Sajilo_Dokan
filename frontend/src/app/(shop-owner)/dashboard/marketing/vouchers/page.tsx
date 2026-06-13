"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { Ticket, Plus, Save, X, Trash2, Calendar, Users, AlertCircle, Percent, Banknote } from 'lucide-react';
import Link from 'next/link';

interface Voucher {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  minimum_order_amount: string;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export default function ShopVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order_amount: '0',
    max_uses: '100',
    valid_from: '',
    valid_until: '',
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
    
    // Set default dates (Today to Next Month)
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    
    // Format to YYYY-MM-DDThh:mm for datetime-local input
    const formatDateForInput = (d: Date) => {
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    setFormData(prev => ({
      ...prev,
      valid_from: formatDateForInput(now),
      valid_until: formatDateForInput(nextMonth)
    }));
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vouchers/');
      setVouchers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch vouchers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    
    try {
      await api.post('/vouchers/', formData);
      await fetchVouchers();
      setIsModalOpen(false);
      // Reset main fields
      setFormData(prev => ({...prev, code: '', discount_value: ''}));
    } catch (err: any) {
      setFormError(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to create voucher.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await api.patch(`/vouchers/${id}/`, { is_active: !currentStatus });
      setVouchers(prev => prev.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
    } catch (err) {
      console.error('Failed to toggle status');
    }
  };

  const deleteVoucher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;
    try {
      await api.delete(`/vouchers/${id}/`);
      setVouchers(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-sm text-gray-500 flex gap-2">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link> &gt; 
        <span>Marketing</span> &gt; 
        <span className="font-bold text-gray-800">Shop Vouchers</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Voucher Management</h1>
          <p className="text-gray-500">Create discount codes to attract more customers to your shop.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Plus size={20} /> Create Voucher
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400 animate-pulse">Loading Vouchers...</div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <Ticket size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No active vouchers yet!</h2>
          <p className="text-gray-500 max-w-sm mb-6">Create your first discount code and share it with your customers to boost sales.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 font-bold border-2 border-indigo-100 px-6 py-2 rounded-xl hover:bg-indigo-50 transition"
          >
            Create Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map(v => (
            <div key={v.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className={`p-6 border-b border-gray-100 relative overflow-hidden ${v.is_active ? 'bg-gradient-to-br from-indigo-50 to-white' : 'bg-gray-50'}`}>
                {/* Decoration */}
                <div className="absolute -right-6 -top-6 text-indigo-100/50 transform rotate-12">
                  <Ticket size={120} />
                </div>
                
                <div className="relative z-10">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md mb-3 ${
                    v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-gray-900 font-mono tracking-widest">{v.code}</h3>
                  </div>
                  <p className="text-indigo-600 font-bold text-lg mt-1 flex items-center gap-1">
                    {v.discount_type === 'percentage' ? <Percent size={18}/> : <Banknote size={18}/>}
                    {v.discount_type === 'percentage' ? `${v.discount_value}% OFF` : `NPR ${parseFloat(v.discount_value)} OFF`}
                  </p>
                </div>
              </div>
              
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-gray-50 rounded-lg"><Users size={16} className="text-gray-400" /></div>
                  <div>
                    <p className="font-medium">Usage Limit</p>
                    <p className="font-bold text-gray-900">{v.used_count} / {v.max_uses} used</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-gray-50 rounded-lg"><Calendar size={16} className="text-gray-400" /></div>
                  <div>
                    <p className="font-medium">Valid Until</p>
                    <p className="font-bold text-gray-900">{new Date(v.valid_until).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button 
                  onClick={() => toggleStatus(v.id, v.is_active)}
                  className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
                    v.is_active ? 'text-gray-500 hover:bg-gray-200' : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {v.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={() => deleteVoucher(v.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="text-indigo-600" /> New Voucher
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateVoucher} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Voucher Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. SUMMER20"
                  maxLength={20}
                  className="w-full uppercase font-mono tracking-widest px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
                <p className="text-xs text-gray-500 mt-1">Must be unique for your shop. Customers will type this at checkout.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type</label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition"
                    value={formData.discount_type}
                    onChange={e => setFormData({...formData, discount_type: e.target.value as any})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Value</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder={formData.discount_type === 'percentage' ? "e.g. 15" : "e.g. 500"}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition"
                    value={formData.discount_value}
                    onChange={e => setFormData({...formData, discount_value: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Min. Order (NPR)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition"
                    value={formData.minimum_order_amount}
                    onChange={e => setFormData({...formData, minimum_order_amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Uses Total</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition"
                    value={formData.max_uses}
                    onChange={e => setFormData({...formData, max_uses: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valid From</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition text-sm"
                    value={formData.valid_from}
                    onChange={e => setFormData({...formData, valid_from: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valid Until</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition text-sm"
                    value={formData.valid_until}
                    onChange={e => setFormData({...formData, valid_until: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : <><Save size={18} /> Save Voucher</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
