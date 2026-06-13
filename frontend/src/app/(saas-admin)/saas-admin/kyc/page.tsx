"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle, User, FileText, ChevronDown } from 'lucide-react';

interface KYCRecord {
  id: number;
  shop: number;
  shop_name?: string;
  document_type: string;
  document_front: string;
  document_back?: string;
  father_name: string;
  mother_name: string;
  permanent_address: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  admin_notes?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  approved: <CheckCircle2 size={14} />,
  rejected: <XCircle size={14} />,
};

export default function KYCVerificationPage() {
  const [kycs, setKycs] = useState<KYCRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchKYC();
  }, [filter]);

  const fetchKYC = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?kyc_status=${filter}` : '';
      const res = await api.get(`/admin/kyc/${params}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setKycs(data);
    } catch (err) {
      console.error('Failed to load KYC records');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/kyc/${id}/approve/`);
      setKycs(prev => prev.map(k => k.id === id ? { ...k, kyc_status: 'approved' } : k));
    } catch (err) {
      console.error('Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/kyc/${id}/reject/`, { notes: rejectNotes });
      setKycs(prev => prev.map(k => k.id === id ? { ...k, kyc_status: 'rejected', admin_notes: rejectNotes } : k));
      setRejectTarget(null);
      setRejectNotes('');
    } catch (err) {
      console.error('Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = kycs.filter(k => k.kyc_status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">SaaS Admin</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            KYC Verification
            {pendingCount > 0 && filter === 'pending' && (
              <span className="text-base bg-red-500 text-white font-black rounded-full px-3 py-0.5">{pendingCount}</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Review and approve shop owner identity documents.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition capitalize ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : kycs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center flex flex-col items-center gap-4">
          <CheckCircle2 size={56} className="text-green-300" />
          <h3 className="text-xl font-bold text-gray-600">No {filter} KYC applications.</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {kycs.map(kyc => (
            <div key={kyc.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Row Header */}
              <div 
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition"
                onClick={() => setExpandedId(expandedId === kyc.id ? null : kyc.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <ShieldCheck size={22} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Shop #{kyc.shop} – KYC #{kyc.id}</h3>
                    <p className="text-xs text-gray-400">Submitted: {new Date(kyc.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-xl ${STATUS_STYLES[kyc.kyc_status]}`}>
                    {STATUS_ICONS[kyc.kyc_status]} {kyc.kyc_status.charAt(0).toUpperCase() + kyc.kyc_status.slice(1)}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${expandedId === kyc.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === kyc.id && (
                <div className="border-t border-gray-100 p-6 space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Document Type', value: kyc.document_type?.replace('_', ' ') || '—' },
                      { label: "Father's Name", value: kyc.father_name || '—' },
                      { label: "Mother's Name", value: kyc.mother_name || '—' },
                      { label: 'Permanent Address', value: kyc.permanent_address || '—' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Documents */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                      <FileText size={14} /> Identity Documents
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {kyc.document_front && (
                        <a href={kyc.document_front} target="_blank" rel="noopener noreferrer" className="block group">
                          <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-indigo-400 transition">
                            <img src={kyc.document_front} alt="Front" className="w-full h-48 object-cover" />
                          </div>
                          <p className="text-center text-xs font-bold text-gray-500 mt-2">Front Side (click to enlarge)</p>
                        </a>
                      )}
                      {kyc.document_back && (
                        <a href={kyc.document_back} target="_blank" rel="noopener noreferrer" className="block group">
                          <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-indigo-400 transition">
                            <img src={kyc.document_back} alt="Back" className="w-full h-48 object-cover" />
                          </div>
                          <p className="text-center text-xs font-bold text-gray-500 mt-2">Back Side (click to enlarge)</p>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes if rejected */}
                  {kyc.kyc_status === 'rejected' && kyc.admin_notes && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-700">{kyc.admin_notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions — only for pending */}
                  {kyc.kyc_status === 'pending' && (
                    <div className="pt-4 border-t border-gray-100">
                      {rejectTarget === kyc.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={rejectNotes}
                            onChange={e => setRejectNotes(e.target.value)}
                            placeholder="Reason for rejection (required)..."
                            className="w-full px-4 py-3 border-2 border-red-200 rounded-2xl focus:border-red-400 focus:ring-0 outline-none text-sm resize-none"
                            rows={3}
                          />
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setRejectTarget(null)}
                              className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleReject(kyc.id)}
                              disabled={!rejectNotes.trim() || actionLoading === kyc.id}
                              className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition disabled:opacity-50"
                            >
                              {actionLoading === kyc.id ? 'Rejecting…' : 'Confirm Rejection'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setRejectTarget(kyc.id)}
                            className="flex-1 py-3 border-2 border-red-100 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(kyc.id)}
                            disabled={actionLoading === kyc.id}
                            className="flex-[2] py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle2 size={18} />
                            {actionLoading === kyc.id ? 'Approving…' : 'Approve & Verify Shop'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
