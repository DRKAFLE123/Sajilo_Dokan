"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  Package, CheckCircle2, XCircle, Clock, 
  ExternalLink, Search, Filter, AlertCircle, Eye, Star
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  shop_name?: string;
  selling_price: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
  images: { image: string }[];
}

export default function ProductModerationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/?moderation_status=${filter}`);
      setProducts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/products/${id}/approve/`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/products/${id}/reject/`, { notes: rejectNotes });
      setProducts(prev => prev.filter(p => p.id !== id));
      setRejectTarget(null);
      setRejectNotes('');
    } catch (err) {
      console.error('Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/products/${id}/toggle_featured/`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !p.is_featured } : p));
    } catch (err) {
      console.error('Feature toggle failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Sajilo Platform</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Product Moderation
            {filter === 'pending' && products.length > 0 && (
              <span className="text-base bg-red-500 text-white font-black rounded-full px-3 py-0.5">{products.length}</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Review new listings to ensure they follow marketplace policies.</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {(['pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center flex flex-col items-center gap-4">
          <Package size={56} className="text-gray-100" />
          <h3 className="text-xl font-bold text-gray-400">No products in "{filter}" queue.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Image Preview */}
              <div className="relative h-48 bg-gray-50">
                {product.images?.[0] ? (
                  <img src={product.images[0].image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    filter === 'pending' ? 'bg-amber-100 text-amber-700' : 
                    filter === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {filter}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 flex-1 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold mt-1">NPR {product.selling_price}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>ID: #{product.id}</span>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-50 flex gap-2">
                  {rejectTarget === product.id ? (
                    <div className="w-full space-y-2">
                      <input 
                        type="text" 
                        placeholder="Reason..." 
                        value={rejectNotes}
                        onChange={e => setRejectNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-red-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setRejectTarget(null)} className="flex-1 text-[10px] font-black uppercase text-gray-400">Cancel</button>
                        <button onClick={() => handleReject(product.id)} className="flex-1 text-[10px] font-black uppercase text-red-600">Confirm</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleApprove(product.id)}
                        disabled={actionLoading === product.id}
                        className="flex-1 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-100 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleToggleFeatured(product.id)}
                        disabled={actionLoading === product.id}
                        className={`p-2 rounded-xl transition ${
                          product.is_featured 
                            ? 'bg-amber-50 text-amber-600' 
                            : 'text-gray-400 hover:bg-gray-50 hover:text-amber-500'
                        }`}
                        title={product.is_featured ? "Remove from Featured" : "Feature on Landing Page"}
                      >
                        <Star size={16} fill={product.is_featured ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => setRejectTarget(product.id)}
                        disabled={actionLoading === product.id}
                        className="flex-1 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
