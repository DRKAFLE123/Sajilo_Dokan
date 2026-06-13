"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { Package, DollarSign, ShoppingCart, TrendingUp, ArrowRight, Store } from 'lucide-react';

export default function DashboardOverview() {
  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopRes, statsRes] = await Promise.all([
          api.get('/shops/my_shop/'),
          api.get('/shop-stats/')
        ]);
        setShop(shopRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!shop) return (
    <div className="max-w-7xl mx-auto text-center py-20">
      <Store className="h-16 w-16 text-gray-300 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to your Seller Hub!</h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        You don't have a shop set up yet. Go to Inventory to create your store and start listing products.
      </p>
      <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition">
        Set Up My Shop <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="mt-2 text-gray-500 font-medium">Welcome back! Here's what's happening with <span className="text-indigo-600 font-bold">{shop?.name}</span> today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-indigo-100 transition duration-300">
          <div className="h-16 w-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-500">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">NPR {parseFloat(stats?.total_revenue || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-indigo-100 transition duration-300">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-500">
            <ShoppingCart size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Active Orders</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">{stats?.new_orders || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-red-100 transition duration-300">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-500">
            <Package size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Low Stock</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">{stats?.low_stock_count || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-indigo-100 transition duration-300">
          <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-500">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Growth</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">+12.5%</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
        </div>
        
        {stats?.recent_orders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recent_orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-8 py-4 font-mono font-bold text-gray-900 text-sm">#{order.id}</td>
                    <td className="px-8 py-4 text-sm font-bold text-gray-900">{order.full_name}</td>
                    <td className="px-8 py-4 text-sm font-black text-gray-900">NPR {order.total}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <ShoppingCart size={48} className="text-gray-100" />
            <p className="text-gray-400 font-bold">No orders found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

