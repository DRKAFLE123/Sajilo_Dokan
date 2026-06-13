"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, CreditCard, Settings, Store, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Point of Sale', href: '/dashboard/pos', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full min-h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 bg-gray-950 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-indigo-400 transition">
          <Store className="h-6 w-6 text-indigo-500" />
          <span className="font-bold text-lg tracking-tight">Seller Hub</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        <nav className="px-3 space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition
                  ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 transition"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
