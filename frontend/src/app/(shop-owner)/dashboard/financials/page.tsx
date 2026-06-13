"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle, ArrowUpRight, DollarSign, CreditCard } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface PayoutRequest {
  id: number;
  amount: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  admin_notes: string;
}

export default function ShopFinancialsPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [minPayout, setMinPayout] = useState(1000);
  const [requesting, setRequesting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/shop-stats/');
      setStats(statsRes.data);

      const histRes = await api.get('/payout-requests/');
      setHistory(histRes.data?.results ?? histRes.data);

      // Fetch global platform settings to get minimum payout amount
      try {
        const settingsRes = await api.get('/platform-settings/global_settings/');
        setMinPayout(parseFloat(settingsRes.data.minimum_payout_amount) || 1000);
      } catch (e) {
        // Fallback if platform settings fails or not allowed
        setMinPayout(1000);
      }
    } catch (err) {
      console.error('Failed to load financial details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const amount = parseFloat(payoutAmount);

    if (isNaN(amount) || amount <= 0) {
      setMsg({ type: 'error', text: 'Please enter a valid payout amount.' });
      return;
    }

    if (amount < minPayout) {
      setMsg({ type: 'error', text: `Minimum payout request amount is NPR ${minPayout.toFixed(2)}.` });
      return;
    }

    if (stats && amount > parseFloat(stats.withdrawable_balance)) {
      setMsg({ type: 'error', text: `Insufficient withdrawable balance. Available: NPR ${parseFloat(stats.withdrawable_balance).toFixed(2)}` });
      return;
    }

    setRequesting(true);
    try {
      await api.post('/payout-requests/', { amount });
      setMsg({ type: 'success', text: 'Payout request submitted successfully.' });
      setPayoutAmount('');
      // Reload stats and history
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.amount?.[0] || err.response?.data?.non_field_errors?.[0] || 'Failed to submit payout request.' });
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5"><Clock size={12} /> Pending</span>;
      case 'approved':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5"><CheckCircle size={12} /> Approved</span>;
      case 'paid':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5"><CheckCircle size={12} /> Paid</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5"><XCircle size={12} /> Rejected</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded-lg" />
        <div className="h-12 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-150 rounded-3xl" />)}
        </div>
        <div className="h-96 bg-gray-150 rounded-3xl" />
      </div>
    );
  }

  const withdrawableVal = stats ? parseFloat(stats.withdrawable_balance) : 0;
  const netEarningsVal = stats ? parseFloat(stats.net_earnings) : 0;
  const totalRevenueVal = stats ? parseFloat(stats.total_revenue) : 0;
  const commissionVal = stats ? parseFloat(stats.commission_deducted) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="text-sm text-gray-500 flex gap-2">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link> &gt; 
        <span>Finance</span> &gt; 
        <span className="font-bold text-gray-800">Income & Payouts</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Overview</h1>
          <p className="text-gray-500 mt-2">Manage your shop earnings, view marketplace commissions, and request payout distributions.</p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{msg.text}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sales</span>
          <p className="text-2xl font-black text-gray-900 mt-2">NPR {totalRevenueVal.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">From all completed orders</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Commission Deducted</span>
          <p className="text-2xl font-black text-gray-900 mt-2">NPR {commissionVal.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Marketplace platform fees</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Net Income</span>
          <p className="text-2xl font-black text-indigo-600 mt-2">NPR {netEarningsVal.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total revenue minus commission</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-md">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Withdrawable Balance</span>
          <p className="text-2xl font-black mt-2">NPR {withdrawableVal.toFixed(2)}</p>
          <p className="text-[10px] text-indigo-100 mt-1">Available to payout right now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payout Request Form */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Wallet className="text-indigo-600" size={20} /> Request Withdrawal
          </h2>
          <p className="text-gray-500 text-xs mb-6 leading-relaxed">
            Transfer your earnings to your registered payout account. Minimum request is <strong>NPR {minPayout.toFixed(0)}</strong>.
          </p>

          <form onSubmit={handleRequestPayout} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Payout Amount (NPR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">NPR</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 5000" 
                  className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={requesting || withdrawableVal < minPayout}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition text-xs shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {requesting ? 'Submitting...' : 'Submit Payout Request'}
            </button>
          </form>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="text-indigo-600" size={20} /> Payout History
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm font-bold">No payout history found.</p>
              <p className="text-xs mt-1">Your requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-4">Request ID</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {history.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 font-mono font-bold text-indigo-600">#{req.id}</td>
                      <td className="py-4 text-gray-500">{new Date(req.requested_at).toLocaleDateString()}</td>
                      <td className="py-4 font-bold">NPR {parseFloat(req.amount).toFixed(2)}</td>
                      <td className="py-4">{getStatusBadge(req.status)}</td>
                      <td className="py-4 text-gray-400 max-w-[200px] truncate" title={req.admin_notes}>
                        {req.admin_notes || '-'}
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
