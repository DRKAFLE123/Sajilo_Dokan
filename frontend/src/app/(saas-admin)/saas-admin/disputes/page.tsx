"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle, Clock, XCircle, ChevronRight, MessageSquare, Edit2 } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface Dispute {
  id: number;
  order: number;
  order_details: {
    id: number;
    total: string;
    status: string;
    shop_name: string;
    customer_username: string;
  };
  raised_by: number;
  customer_username: string;
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution_notes: string;
  created_at: string;
  updated_at: string;
}

export default function SaaSAdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Status edit state
  const [statusVal, setStatusVal] = useState<'open' | 'in_review' | 'resolved' | 'closed'>('open');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes/');
      setDisputes(res.data?.results ?? res.data);
    } catch (err) {
      console.error('Failed to load disputes queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleSelectDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setStatusVal(dispute.status);
    setResolutionNotes(dispute.resolution_notes || '');
    setMsg(null);
  };

  const handleUpdateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setUpdating(true);
    setMsg(null);

    try {
      const res = await api.post(`/disputes/${selectedDispute.id}/update_status/`, {
        status: statusVal,
        notes: resolutionNotes
      });
      setMsg({ type: 'success', text: `Dispute status updated to ${statusVal.toUpperCase()} successfully.` });
      // Reload and update selected
      await fetchDisputes();
      setSelectedDispute(prev => prev ? { ...prev, status: statusVal, resolution_notes: resolutionNotes } : null);
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to update dispute.' });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><AlertCircle size={12} /> Open</span>;
      case 'in_review':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><Clock size={12} /> In Review</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><CheckCircle size={12} /> Resolved</span>;
      case 'closed':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1"><XCircle size={12} /> Closed</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-gray-150 rounded-3xl lg:col-span-2" />
          <div className="h-96 bg-gray-150 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dispute Resolution Center</h1>
        <p className="text-gray-500 mt-2">Mediate transaction issues, review customer claims, and enforce marketplace resolutions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Disputes Queue */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm lg:col-span-2 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldAlert className="text-indigo-600" size={20} /> Active Claims Queue
          </h2>

          {disputes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm font-bold">No disputes raised on orders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-4">Claim Details</th>
                    <th className="pb-4">Shop</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {disputes.map(dispute => (
                    <tr 
                      key={dispute.id} 
                      onClick={() => handleSelectDispute(dispute)}
                      className={`hover:bg-gray-50/80 transition cursor-pointer ${
                        selectedDispute?.id === dispute.id ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-4">
                        <p className="font-bold text-gray-900">Order #{dispute.order}</p>
                        <p className="text-[10px] text-gray-400">Claimant: {dispute.customer_username}</p>
                      </td>
                      <td className="py-4 text-gray-600 font-medium">{dispute.order_details.shop_name}</td>
                      <td className="py-4 font-bold text-gray-950">NPR {parseFloat(dispute.order_details.total).toFixed(2)}</td>
                      <td className="py-4">{getStatusBadge(dispute.status)}</td>
                      <td className="py-4 text-right pr-2">
                        <ChevronRight size={16} className="text-gray-400 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dispute Detail / Actions Panel */}
        <div>
          {selectedDispute ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Claim Details</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">Dispute #{selectedDispute.id}</span>
                </div>
                {getStatusBadge(selectedDispute.status)}
              </div>

              {msg && (
                <div className={`p-4 rounded-xl flex items-center gap-2 border text-xs font-bold ${
                  msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <p>{msg.text}</p>
                </div>
              )}

              {/* Order Info Summary */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                <p className="text-gray-500 font-medium">Claim Details Summary</p>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Order Total:</span>
                  <span>NPR {parseFloat(selectedDispute.order_details.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Status:</span>
                  <span className="font-semibold text-gray-800 capitalize">{selectedDispute.order_details.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shop Name:</span>
                  <span className="font-semibold text-gray-855">{selectedDispute.order_details.shop_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Raised By:</span>
                  <span className="font-semibold text-indigo-650">{selectedDispute.customer_username}</span>
                </div>
              </div>

              {/* Dispute Reason */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Claimant Statement</span>
                <p className="text-xs text-gray-600 bg-red-50/30 p-4 rounded-2xl border border-red-50 leading-relaxed italic">
                  "{selectedDispute.reason}"
                </p>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateDispute} className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Resolve Status</label>
                  <select 
                    value={statusVal}
                    onChange={e => setStatusVal(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Resolution Notes</label>
                  <textarea 
                    rows={3}
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    placeholder="Provide mediation notes or actions taken..." 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={updating}
                  className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition text-xs shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {updating ? 'Updating claim...' : 'Save Resolution'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-150 p-8 text-center text-gray-400 h-96 flex flex-col items-center justify-center">
              <MessageSquare size={36} className="mb-3" />
              <p className="text-sm font-bold">No claim selected</p>
              <p className="text-xs mt-1">Select a dispute from the queue on the left to review details and document mediation notes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
