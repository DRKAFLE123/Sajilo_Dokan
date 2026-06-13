"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, ShieldCheck, Store, CreditCard, 
  Settings, LogOut, ChevronRight, Users, Package,
  Wallet, ShieldAlert
} from 'lucide-react';

export default function SaaSAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?redirect=/saas-admin');
      } else if (!user.is_staff) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.is_staff) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { title: 'Overview', path: '/saas-admin', icon: <LayoutDashboard size={20} /> },
    { title: 'User Management', path: '/saas-admin/users', icon: <Users size={20} /> },
    { title: 'Product Moderation', path: '/saas-admin/products', icon: <Package size={20} /> },
    { title: 'KYC Verification', path: '/saas-admin/kyc', icon: <ShieldCheck size={20} /> },
    { title: 'Shops & Subscriptions', path: '/saas-admin/shops', icon: <Store size={20} /> },
    { title: 'Financials & Payouts', path: '/saas-admin/financials', icon: <Wallet size={20} /> },
    { title: 'Dispute Center', path: '/saas-admin/disputes', icon: <ShieldAlert size={20} /> },
    { title: 'Plans & Billing', path: '/saas-admin/billing', icon: <CreditCard size={20} /> },
    { title: 'Platform Settings', path: '/saas-admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-20">
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <Link href="/saas-admin" className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg text-lg">SD</span> 
            Sajilo Admin
          </Link>
        </div>
        
        <div className="p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Sajilo Platform</p>
          <nav className="space-y-2">
            {navLinks.map(link => {
              const active = pathname === link.path || (link.path !== '/saas-admin' && pathname.startsWith(link.path));
              return (
                <Link 
                  key={link.path} 
                  href={link.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl transition font-bold text-sm ${
                    active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    {link.title}
                  </div>
                  {active && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 text-red-500 hover:text-red-600 font-bold text-sm w-full px-4 py-2 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
