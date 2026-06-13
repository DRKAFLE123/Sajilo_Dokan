"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, Star, ArrowRight, LayoutTemplate, Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface Shop {
  id: number;
  name: string;
  is_featured: boolean;
  is_sponsored: boolean;
  promotion_label: string;
}

interface SubscriptionPlan {
  name: string;
  price_monthly: string;
  product_limit: number;
  features: string[];
}

interface ShopSubscription {
  id: number;
  status: string;
  plan_details: SubscriptionPlan | null;
}

export default function PromotionsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [subscription, setSubscription] = useState<ShopSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoLabel, setPromoLabel] = useState('');
  const [updatingLabel, setUpdatingLabel] = useState(false);
  const [requestingFeatured, setRequestingFeatured] = useState(false);
  const [requestingSponsored, setRequestingSponsored] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    try {
      const shopRes = await api.get('/shops/my_shop/');
      setShop(shopRes.data);
      setPromoLabel(shopRes.data.promotion_label || '');

      const subRes = await api.get('/shop-subscriptions/');
      const subs = subRes.data?.results ?? subRes.data;
      if (subs && subs.length > 0) {
        setSubscription(subs[0]);
      }
    } catch (err) {
      console.error('Failed to load promotions details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setUpdatingLabel(true);
    setMsg(null);
    try {
      const res = await api.patch(`/shops/${shop.id}/`, {
        promotion_label: promoLabel
      });
      setShop(res.data);
      setMsg({ type: 'success', text: 'Promotion badge updated successfully!' });
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.promotion_label?.[0] || 'Failed to update badge.' });
    } finally {
      setUpdatingLabel(false);
    }
  };

  const handleRequestPromotion = async (type: 'featured' | 'sponsored') => {
    if (!shop) return;
    if (type === 'featured') setRequestingFeatured(true);
    else setRequestingSponsored(true);
    setMsg(null);

    try {
      await api.post(`/shops/${shop.id}/request-promotion/`, { type });
      setMsg({ type: 'success', text: `Your request for ${type.toUpperCase()} placement has been sent to admin.` });
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to send promotion request.' });
    } finally {
      setRequestingFeatured(false);
      setRequestingSponsored(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded-lg" />
        <div className="h-12 w-64 bg-gray-200 rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-150 rounded-3xl" />
          <div className="h-64 bg-gray-150 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="text-sm text-gray-500 flex gap-2">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link> &gt; 
        <span>Marketing</span> &gt; 
        <span className="font-bold text-gray-800">Promotions</span>
      </div>

      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shop Promotions & Visibility</h1>
        <p className="text-gray-500 mt-2">Drive sales by highlighting your products and store with promotional badges, featured status, and sponsored listings.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{msg.text}</p>
        </div>
      )}

      {/* Subscription Plans Limit info */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-[2.5rem] p-8 md:p-10 shadow-lg border border-indigo-750 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Active Plan Info</span>
          <h2 className="text-2xl font-black mt-1">{subscription?.plan_details?.name || 'Free Plan'}</h2>
          <p className="text-indigo-200 text-xs mt-1 leading-relaxed max-w-md">
            Your current subscription allows a maximum of <strong>{subscription?.plan_details?.product_limit || 10}</strong> active product listings.
            Upgrade your plan to unlock higher limits and premium exposure.
          </p>
        </div>
        <Link href="/saas-admin/billing" className="bg-white text-indigo-900 px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-50 transition text-xs shrink-0 shadow-md">
          Change Plan
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Promotion Label Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-14 w-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Tag size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Custom Promotion Badge</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Stand out in the marketplace by adding a custom promotional badge (e.g. "SALE", "50% OFF") on your shop card. 
              This instantly grabs customers' attention when they search for shops near them.
            </p>
          </div>
          
          <form onSubmit={handleUpdateLabel} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Badge Text (Max 20 chars)</label>
              <input 
                type="text" 
                maxLength={20}
                value={promoLabel}
                onChange={e => setPromoLabel(e.target.value)}
                placeholder="e.g. 50% OFF" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <button 
              type="submit"
              disabled={updatingLabel}
              className="w-full bg-rose-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-rose-600 transition text-xs disabled:opacity-50"
            >
              {updatingLabel ? 'Saving...' : 'Update Badge'}
            </button>
          </form>
        </div>

        {/* Featured Placement Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
              <Star size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Featured & Sponsored Status</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Get placed at the very top of search feeds and the landing page carousel. Featured and sponsored shops get up to 5x more customer views.
            </p>
            
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-gray-700">Featured Placement</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  shop?.is_featured ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {shop?.is_featured ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-gray-700">Sponsored Status</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  shop?.is_sponsored ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {shop?.is_sponsored ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleRequestPromotion('featured')}
              disabled={shop?.is_featured || requestingFeatured}
              className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-amber-600 transition text-[11px] disabled:opacity-50"
            >
              {requestingFeatured ? 'Requesting...' : shop?.is_featured ? 'Featured active' : 'Request Featured'}
            </button>
            <button 
              onClick={() => handleRequestPromotion('sponsored')}
              disabled={shop?.is_sponsored || requestingSponsored}
              className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-[11px] disabled:opacity-50"
            >
              {requestingSponsored ? 'Requesting...' : shop?.is_sponsored ? 'Sponsored active' : 'Request Sponsored'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
