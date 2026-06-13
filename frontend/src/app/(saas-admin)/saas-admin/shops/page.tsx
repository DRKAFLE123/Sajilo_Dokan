"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  Store, ShieldCheck, ShieldOff, CreditCard, Search, ChevronDown,
  CheckCircle2, XCircle, Clock, Ticket, Star
} from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  owner_username?: string;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  subscription?: {
    id: number;
    status: string;
    plan: number;
    plan_details?: { name: string; price_monthly: string };
  };
}

interface Plan {
  id: number;
  name: string;
  price_monthly: string;
}

export default function ShopsAndSubscriptionsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, plansRes, subsRes] = await Promise.all([
        api.get('/shops/'),
        api.get('/subscription-plans/'),
        api.get('/shop-subscriptions/'),
      ]);
      const shopsArr = Array.isArray(shopsRes.data) ? shopsRes.data : shopsRes.data.results || [];
      const subsArr = Array.isArray(subsRes.data) ? subsRes.data : subsRes.data.results || [];
      
      // Merge subscription data into shops
      const subsMap: Record<number, any> = {};
      subsArr.forEach((s: any) => { subsMap[s.shop] = s; });
      const enriched = shopsArr.map((sh: Shop) => ({ ...sh, subscription: subsMap[sh.id] }));
      
      setShops(enriched);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : plansRes.data.results || []);
    } catch (err) {
      console.error('Failed to load shops/subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (shopId: number, planId: number, subId?: number) => {
    setActionLoading(shopId);
    try {
      if (subId) {
        await api.patch(`/shop-subscriptions/${subId}/`, { plan: planId, status: 'active' });
      } else {
        await api.post('/shop-subscriptions/', { shop: shopId, plan: planId, status: 'active' });
      }
      await fetchData();
    } catch (err) {
      console.error('Plan change failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (shopId: number) => {
    setActionLoading(shopId);
    try {
      await api.post(`/shops/${shopId}/toggle_featured/`);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, is_featured: !s.is_featured } : s));
    } catch (err) {
      console.error('Feature toggle failed');
      // Refetch if state is out of sync
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSub = async (subId: number) => {
    setActionLoading(subId);
    try {
      await api.patch(`/shop-subscriptions/${subId}/`, { status: 'cancelled' });
      await fetchData();
    } catch (err) {
      console.error('Cancellation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = shops.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">SaaS Admin</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Shops & Subscriptions</h1>
        <p className="text-gray-500 mt-1">Manage shop statuses, verify owners, and update subscription plans.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search shops..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
      </div>

      {/* Plans Quick Reference */}
      {plans.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="font-black text-gray-900">{plan.name}</p>
              <p className="text-indigo-600 font-bold">NPR {plan.price_monthly}<span className="text-gray-400 font-normal text-xs">/mo</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Shop Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Shop</th>
                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Current Plan</th>
                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Sub Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No shops found.</td>
                  </tr>
                ) : filtered.map(shop => (
                  <tr key={shop.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm">
                          {shop.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{shop.name}</p>
                          <p className="text-xs text-gray-400">ID #{shop.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {shop.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          <Clock size={12} /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        {shop.subscription?.plan_details?.name || 
                         (plans.find(p => p.id === shop.subscription?.plan)?.name) || 
                         <span className="text-gray-400 font-normal">No Plan</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {shop.subscription ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                          shop.subscription.status === 'active' ? 'bg-green-50 text-green-700' :
                          shop.subscription.status === 'past_due' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {shop.subscription.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Change Plan dropdown */}
                        <div className="relative">
                          <select
                            className="text-xs font-bold bg-indigo-50 text-indigo-600 border-0 rounded-xl px-3 py-2 cursor-pointer hover:bg-indigo-100 transition appearance-none pr-8"
                            defaultValue=""
                            onChange={e => {
                              if (e.target.value) {
                                handleChangePlan(shop.id, parseInt(e.target.value), shop.subscription?.id);
                                e.target.value = '';
                              }
                            }}
                            disabled={actionLoading === shop.id}
                          >
                            <option value="" disabled>Set Plan</option>
                            {plans.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none" />
                        </div>

                        {/* Feature Toggle */}
                        <button
                          onClick={() => handleToggleFeatured(shop.id)}
                          disabled={actionLoading === shop.id}
                          className={`p-2 rounded-xl transition ${
                            shop.is_featured 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'text-gray-400 hover:bg-gray-50 hover:text-amber-500'
                          }`}
                          title={shop.is_featured ? "Remove from Featured" : "Feature on Landing Page"}
                        >
                          <Star size={16} fill={shop.is_featured ? "currentColor" : "none"} />
                        </button>

                        {/* Cancel Sub */}
                        {shop.subscription?.status === 'active' && (
                          <button
                            onClick={() => handleCancelSub(shop.subscription!.id)}
                            disabled={actionLoading === shop.subscription.id}
                            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
