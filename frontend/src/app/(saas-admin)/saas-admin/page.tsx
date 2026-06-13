"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { 
  Store, Users, ShieldCheck, CreditCard, TrendingUp,
  ArrowUpRight, Clock, CheckCircle2, XCircle, Package
} from 'lucide-react';

interface Stats {
  total_shops: number;
  verified_shops: number;
  total_customers: number;
  active_subscriptions: number;
  pending_products: number;
  estimated_monthly_revenue: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function StatCard({ title, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-6">
        <div className={`h-12 w-12 ${color} rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
        <ArrowUpRight size={18} className="text-gray-300" />
      </div>
      <p className="text-4xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-bold text-gray-500">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function SaaSAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentShops, setRecentShops] = useState<any[]>([]);
  const [pendingKYC, setPendingKYC] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, shopsRes, kycRes] = await Promise.all([
          api.get('/admin/stats/'),
          api.get('/shops/?ordering=-created_at&page_size=5'),
          api.get('/admin/kyc/?kyc_status=pending'),
        ]);
        setStats(statsRes.data);
        setRecentShops(Array.isArray(shopsRes.data) ? shopsRes.data.slice(0, 5) : (shopsRes.data.results || []).slice(0, 5));
        setPendingKYC(Array.isArray(kycRes.data) ? kycRes.data.slice(0, 5) : (kycRes.data.results || []).slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">SaaS Admin</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Real-time metrics for your Local Connect marketplace.</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Shops"
            value={stats.total_shops}
            icon={<Store size={24} className="text-indigo-600" />}
            color="bg-indigo-50"
          />
          <StatCard
            title="Verified Shops"
            value={stats.verified_shops}
            icon={<ShieldCheck size={24} className="text-green-600" />}
            color="bg-green-50"
            sub={`${stats.total_shops > 0 ? Math.round((stats.verified_shops / stats.total_shops) * 100) : 0}% verified`}
          />
          <StatCard
            title="Total Customers"
            value={stats.total_customers}
            icon={<Users size={24} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Monthly Revenue"
            value={`NPR ${Number(stats.estimated_monthly_revenue).toLocaleString()}`}
            icon={<TrendingUp size={24} className="text-amber-600" />}
            color="bg-amber-50"
            sub={`${stats.active_subscriptions} active subscriptions`}
          />
          <StatCard
            title="Pending Products"
            value={stats.pending_products}
            icon={<Package size={24} className="text-red-600" />}
            color="bg-red-50"
            sub="Requires review"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Shops */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Store size={18} className="text-indigo-600" /> Recently Registered Shops
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentShops.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No shops registered yet.</p>
            ) : recentShops.map((shop: any) => (
              <div key={shop.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm">
                    {shop.name?.[0] || 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{shop.name}</p>
                    <p className="text-xs text-gray-400">{shop.category_name || 'General'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shop.is_verified ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending KYC */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" /> Pending KYC Applications
            </h2>
            {pendingKYC.length > 0 && (
              <span className="text-xs font-black bg-red-500 text-white rounded-full px-2 py-0.5">{pendingKYC.length}</span>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {pendingKYC.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <CheckCircle2 size={40} className="text-green-300" />
                <p className="text-sm font-bold text-gray-400">All KYC applications reviewed!</p>
              </div>
            ) : pendingKYC.map((kyc: any) => (
              <div key={kyc.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{kyc.shop_name || `Shop #${kyc.shop}`}</p>
                  <p className="text-xs text-gray-400">Submitted: {new Date(kyc.submitted_at).toLocaleDateString()}</p>
                </div>
                <a 
                  href="/saas-admin/kyc"
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                >
                  Review →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
