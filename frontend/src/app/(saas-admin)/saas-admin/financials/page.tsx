"use client";

import React, { useEffect, useState } from 'react';
import { Percent, Wallet, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus, Edit } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface Category {
  id: number;
  name: string;
}

interface CommissionRate {
  id?: number;
  category: number;
  category_name?: string;
  rate_percent: string;
}

interface PayoutRequest {
  id: number;
  shop: number;
  shop_name: string;
  amount: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  admin_notes: string;
}

export default function SaaSAdminFinancialsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Rate Editing state
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [newRatePercent, setNewRatePercent] = useState('');
  const [editingRateId, setEditingRateId] = useState<number | null>(null);

  // Admin notes / action state
  const [notes, setNotes] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [payoutAction, setPayoutAction] = useState<'approve' | 'reject' | 'mark_paid' | null>(null);

  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    try {
      const catRes = await api.get('/product-categories/');
      setCategories(catRes.data?.results ?? catRes.data);

      const rateRes = await api.get('/commission-rates/');
      setRates(rateRes.data?.results ?? rateRes.data);

      const payoutRes = await api.get('/payout-requests/');
      setPayouts(payoutRes.data?.results ?? payoutRes.data);

      const settingsRes = await api.get('/platform-settings/global_settings/');
      setGlobalSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to fetch financial administration details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!selectedCategory || !newRatePercent) {
      setMsg({ type: 'error', text: 'Please select a category and specify a rate.' });
      return;
    }

    const rateVal = parseFloat(newRatePercent);
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
      setMsg({ type: 'error', text: 'Rate must be between 0% and 100%.' });
      return;
    }

    try {
      const existing = rates.find(r => r.category === selectedCategory);
      if (existing) {
        // Update
        const res = await api.put(`/commission-rates/${existing.id}/`, {
          category: selectedCategory,
          rate_percent: rateVal.toFixed(2)
        });
        setMsg({ type: 'success', text: 'Commission rate updated successfully.' });
      } else {
        // Create
        const res = await api.post('/commission-rates/', {
          category: selectedCategory,
          rate_percent: rateVal.toFixed(2)
        });
        setMsg({ type: 'success', text: 'Commission rate created successfully.' });
      }
      setSelectedCategory('');
      setNewRatePercent('');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to save commission rate.' });
    }
  };

  const handlePayoutAction = async () => {
    if (!selectedPayout || !payoutAction) return;
    setMsg(null);

    try {
      await api.post(`/payout-requests/${selectedPayout.id}/${payoutAction}/`, {
        notes: notes
      });
      setMsg({ type: 'success', text: `Payout request marked as ${payoutAction.replace('_', ' ')}.` });
      setSelectedPayout(null);
      setPayoutAction(null);
      setNotes('');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to process payout action.' });
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'approved':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'paid':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><CheckCircle size={12} /> Paid</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-gray-150 rounded-3xl" />
          <div className="h-96 bg-gray-150 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financials & Commission Manager</h1>
        <p className="text-gray-500 mt-2">Configure custom category commissions and review payout requests from sellers.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{msg.text}</p>
        </div>
      )}

      {/* Action Modal for Notes */}
      {selectedPayout && payoutAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                Confirm {payoutAction.replace('_', ' ')}
              </h3>
              <p className="text-gray-500 text-xs mt-2">
                Provide transfer confirmations or reason for rejection notes to send to the seller.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Notes / Receipts</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Bank Transfer ID: TXN802897A" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => { setSelectedPayout(null); setPayoutAction(null); setNotes(''); }}
                className="flex-1 px-5 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handlePayoutAction}
                className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-150"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Commission Rate panel */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Percent size={18} className="text-indigo-600" /> Commission Rules
            </h2>
            <p className="text-gray-500 text-xs mb-6">
              Global Platform Default Rate: <strong>{globalSettings?.default_commission_rate || '10.00'}%</strong>
            </p>

            <form onSubmit={handleSaveRate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Category</label>
                <select 
                  required
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Commission Rate (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={newRatePercent}
                    onChange={e => setNewRatePercent(e.target.value)}
                    placeholder="e.g. 8.5" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">%</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-xs shadow-md"
              >
                Set Category Commission
              </button>
            </form>
          </div>

          {/* Applied Rules list */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-gray-400">Custom Category Rates</h3>
            {rates.length === 0 ? (
              <p className="text-xs text-gray-400">No category specific rates. Global default applies to all.</p>
            ) : (
              <div className="space-y-3">
                {rates.map(rate => (
                  <div key={rate.category} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-700">{rate.category_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-600">{parseFloat(rate.rate_percent).toFixed(1)}%</span>
                      <button 
                        onClick={() => { setSelectedCategory(rate.category); setNewRatePercent(rate.rate_percent); }}
                        className="text-gray-400 hover:text-indigo-600 transition"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payout Queue */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm lg:col-span-2 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wallet className="text-indigo-600" size={20} /> Shop Payout Requests
          </h2>

          {payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm font-bold">No payout requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-4">Shop</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {payouts.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4">
                        <p className="font-bold text-gray-900">{pay.shop_name}</p>
                        <p className="text-[10px] text-gray-400">Req #{pay.id}</p>
                      </td>
                      <td className="py-4 font-bold text-gray-950">NPR {parseFloat(pay.amount).toFixed(2)}</td>
                      <td className="py-4 text-gray-500">{new Date(pay.requested_at).toLocaleDateString()}</td>
                      <td className="py-4">{getStatusBadge(pay.status)}</td>
                      <td className="py-4 text-right">
                        {pay.status === 'pending' && (
                          <div className="inline-flex gap-2">
                            <button 
                              onClick={() => { setSelectedPayout(pay); setPayoutAction('approve'); }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-[10px] transition"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => { setSelectedPayout(pay); setPayoutAction('reject'); }}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-[10px] transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {pay.status === 'approved' && (
                          <button 
                            onClick={() => { setSelectedPayout(pay); setPayoutAction('mark_paid'); }}
                            className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold text-[10px] transition"
                          >
                            Mark Paid
                          </button>
                        )}
                        {pay.status === 'paid' && (
                          <span className="text-[10px] text-gray-400 italic font-medium">Processed</span>
                        )}
                        {pay.status === 'rejected' && (
                          <span className="text-[10px] text-red-400 italic font-medium">Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
