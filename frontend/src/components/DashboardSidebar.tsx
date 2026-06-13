import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Package, ShoppingCart, 
  Wallet, Settings, HelpCircle, MessageSquare, 
  Users, ChevronDown, ChevronRight, Globe, ShieldCheck, 
  BarChart3, RefreshCw, AlertCircle, Store, Bell, User, LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string;
  badgeColor?: string;
  submenu?: { title: string; path: string; badge?: string; badgeColor?: string }[];
}

const DashboardSidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(['Inventory', 'Finance', 'My Account']);
  const [myShopId, setMyShopId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.user_type === 2) {
      import('@/lib/apiClient').then(({ api }) => {
        api.get('/shops/my_shop/').then(res => setMyShopId(res.data.id));
      });
    }
  }, [user]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const menuItems: MenuItem[] = [
    { title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { 
      title: 'Products', 
      icon: <Package size={18} />, 
      submenu: [
        { title: 'Manage Products', path: '/dashboard/inventory' },
        { title: 'Add New Product', path: '/dashboard/inventory/add' },
        { title: 'Subcategories', path: '/dashboard/inventory/subcategories' },
        { title: 'Brands', path: '/dashboard/products/brands' },
      ]
    },
    { 
      title: 'Orders', 
      icon: <ShoppingCart size={18} />, 
      submenu: [
        { title: 'All Orders', path: '/dashboard/orders' },
        { title: 'Returns & Refunds', path: '/dashboard/orders/returns' },
      ]
    },
    { 
      title: 'Marketing', 
      icon: <RefreshCw size={18} />, 
      submenu: [
        { title: 'Promotions', path: '/dashboard/marketing/promotions', badge: 'New', badgeColor: 'bg-indigo-500' },
        { title: 'Shop Vouchers', path: '/dashboard/marketing/vouchers' },
      ]
    },
    { 
      title: 'Finance', 
      icon: <Wallet size={18} />, 
      submenu: [
        { title: 'Income & Payouts', path: '/dashboard/financials' },
      ]
    },
    { 
      title: 'Customer Service', 
      icon: <MessageSquare size={18} />, 
      submenu: [
        { title: 'Messages', path: '/dashboard/support/chat', badge: '3', badgeColor: 'bg-indigo-600' },
        { title: 'Product Reviews', path: '/dashboard/orders/reviews' },
        { title: 'Chat Settings', path: '/dashboard/support/chat-settings' },
      ]
    },
    { 
      title: 'Store Management', 
      icon: <Store size={18} />, 
      submenu: [
        { title: 'User Management', path: '/dashboard/account/sub-accounts' },
        { title: 'Store Profile', path: '/dashboard/account/profile' },
        { title: 'KYC Verification', path: '/dashboard/account/kyc' },
        { title: 'Store Decoration', path: '/dashboard/store/decoration' },
        { title: 'Account Settings', path: '/dashboard/account/settings' },
        { title: 'Payment Settings', path: '/dashboard/account/settings/payment' },
      ]
    },
    { 
      title: 'Support', 
      icon: <HelpCircle size={18} />, 
      submenu: [
        { title: 'Help Center', path: '/dashboard/support/help' },
        { title: 'Contact Support', path: '/dashboard/support/contact' },
      ]
    }
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col overflow-y-auto sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sajilo Dokan" className="h-8 w-8 object-contain" />
          <span className="text-indigo-600 font-black text-xl tracking-tighter">Sajilo<span className="text-gray-900">Dokan</span></span>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Seller Center</p>
        
        <Link href="/" className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition" /> 
          Back to Marketplace
        </Link>
        
        {user?.user_type === 2 && myShopId && (
          <Link 
            href={`/shops/${myShopId}`} 
            className="mt-4 flex items-center justify-between px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition border border-indigo-100"
          >
            <span>View Public Shop</span>
            <Globe size={14} />
          </Link>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 pb-10">
        {menuItems.map((item) => {
          const isOpen = openMenus.includes(item.title);
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isActive = item.path === pathname || (item.submenu?.some(sub => sub.path === pathname));

          return (
            <div key={item.title} className="mb-1">
              {hasSubmenu ? (
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                    isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                  {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </button>
              ) : (
                <Link
                  href={item.path || '#'}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                    pathname === item.path ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={pathname === item.path ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              )}

              {hasSubmenu && isOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                  {item.submenu?.map((sub) => (
                    <Link
                      key={sub.path}
                      href={sub.path}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
                        pathname === sub.path ? 'text-indigo-600 bg-indigo-50/80' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>{sub.title}</span>
                      {sub.badge && (
                        <span className={`${sub.badgeColor} text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold uppercase`}>
                          {sub.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-50 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600">
              <User size={16} />
            </div>
            <span className="text-sm font-bold text-gray-700 truncate max-w-[90px]">
              {user?.username || 'Shop'}
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <Link href="/dashboard/notifications" className="relative text-gray-400 hover:text-indigo-600 transition">
              <Bell size={18} />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white leading-none">
                5
              </span>
            </Link>
            <Link href="/dashboard/support/chat" className="relative text-gray-400 hover:text-indigo-600 transition">
              <MessageSquare size={18} />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white leading-none">
                3
              </span>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-100/50">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1">
            <ShieldCheck size={14} />
            <span>Store Health</span>
          </div>
          <div className="w-full bg-indigo-200/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full w-[85%]" />
          </div>
          <p className="text-[10px] text-indigo-600/70 mt-1 font-medium text-right">Excellent</p>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
