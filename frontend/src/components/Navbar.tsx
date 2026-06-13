"use client";
import Link from 'next/link';
import { 
  ShoppingBag, Search, User, MapPin, LogOut, 
  Bell, MessageSquare, X, ChevronDown, ShoppingCart, 
  Package, Settings, Camera, CreditCard, Heart, ChevronRight, Store, Menu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/apiClient';
import ConfirmationModal from './ConfirmationModal';

interface Category { id: number; name: string; }

// Inner component that uses useSearchParams (must be inside <Suspense>)
function NavbarInner() {
  const { isAuthenticated, user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cartCount } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Reactive: derive values from URL whenever it changes
  const urlQ   = searchParams.get('q')           || '';
  const urlCat = searchParams.get('category_id') || '';

  const [q, setQ] = useState(urlQ);
  const [selectedCat, setSelectedCat] = useState(urlCat);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const res = await api.patch('/users/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(res.data);
    } catch (err) {
      console.error('Failed to upload profile picture', err);
    }
  };

  // Keep local input state in sync whenever URL changes (e.g. sidebar click)
  useEffect(() => {
    setQ(urlQ);
    setSelectedCat(urlCat);
  }, [urlQ, urlCat]);

  // Load categories for dropdown
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/product-categories/')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => {});
  }, []);

  // Unread messages
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fetchUnread = () => {
      api.get(`/conversations/unread_count/?role=${user.user_type === 2 ? 'shop_owner' : 'customer'}`)
        .then(res => setUnreadCount(res.data.unread_count))
        .catch(console.error);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Load notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = () => {
      api.get('/notifications/')
        .then(res => {
          const list = res.data.results || res.data || [];
          setNotifications(list);
          setNotifUnreadCount(list.filter((n: any) => !n.is_read).length);
        })
        .catch(console.error);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkAllNotifRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotifUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    setShowNotifDropdown(false);
    if (!notif.is_read) {
      try {
        await api.post(`/notifications/${notif.id}/mark_read/`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setNotifUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Preserve any existing filter/sort params from the current search page
    const existing = new URLSearchParams(window.location.search);
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (selectedCat) p.set('category_id', selectedCat);
    // preserve filter chip
    const f = existing.get('filter');
    if (f) p.set('filter', f);
    router.push(`/search?${p.toString()}`);
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="w-full px-4">
        <div className="flex items-center gap-4 h-[60px]">

          {/* ── Mobile Menu Button ── */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-indigo-600 transition"
          >
            <Menu size={24} />
          </button>

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-6 w-6 relative">
              <img src="/logo.png" alt="Sajilo Dokan" className="h-full w-full object-contain" />
            </div>
            <span className="font-black text-lg tracking-tighter text-gray-900 hidden sm:block">
              Sajilo<span className="text-indigo-600">Dokan</span>
            </span>
          </Link>

          {/* ── Amazon-style Search Bar ── */}
          <form onSubmit={handleSearch} className="flex-1 flex max-w-7xl mx-auto h-[40px]">
            <div className="flex w-full rounded-xl overflow-hidden border border-indigo-600 focus-within:border-indigo-700 bg-white shadow-sm transition-all duration-300">

              {/* Category dropdown - slim left section */}
              <div className="relative flex-shrink-0 border-r border-gray-200 bg-gray-50 hidden sm:flex items-center">
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="appearance-none h-full pl-3 pr-7 text-[10px] font-bold text-gray-600 bg-transparent focus:outline-none cursor-pointer uppercase tracking-tight"
                >
                  <option value="">All</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Text input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products or shops..."
                  className="w-full h-full pl-9 pr-8 text-xs text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-[40px] flex items-center justify-center transition flex-shrink-0"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-5 flex-shrink-0">
            {(!isAuthenticated || user?.user_type !== 2) && (
              <Link 
                href="/register?type=seller" 
                className="relative flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:border-indigo-300 transition group hidden md:flex"
              >
                <div className="absolute inset-0 bg-indigo-200/20 rounded-full animate-ping opacity-75" />
                <Store size={12} className="relative z-10 group-hover:scale-110 transition" />
                <span className="relative z-10">Become a Seller</span>
              </Link>
            )}

            <Link href="/search" className="text-gray-600 hover:text-indigo-600 font-semibold hidden lg:flex items-center gap-1.5 text-sm uppercase tracking-wider">
              <ShoppingBag className="h-4 w-4" /> Shop Now
            </Link>

            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-5">
                <div className="flex items-center gap-5">
                  {/* Notifications Bell */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setShowNotifDropdown(!showNotifDropdown);
                        setShowProfileDropdown(false);
                      }}
                      className="relative text-gray-500 hover:text-indigo-600 transition p-1"
                    >
                      <Bell className="h-5 w-5" />
                      {notifUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full border-2 border-white flex items-center justify-center leading-none">
                          {notifUnreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                          <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="font-extrabold text-sm text-gray-955">Notifications</span>
                            {notifUnreadCount > 0 && (
                              <button 
                                onClick={handleMarkAllNotifRead}
                                className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                            {notifications.length > 0 ? (
                              notifications.slice(0, 5).map((n: any) => (
                                <button
                                  key={n.id}
                                  type="button"
                                  onClick={() => handleNotificationClick(n)}
                                  className={`w-full text-left p-4 hover:bg-gray-50/80 transition flex flex-col gap-1 ${!n.is_read ? 'bg-indigo-50/20' : ''}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-bold ${!n.is_read ? 'text-gray-955' : 'text-gray-600'}`}>{n.title}</span>
                                    <span className="text-[9px] text-gray-400 font-medium shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 leading-relaxed">{n.message}</p>
                                </button>
                              ))
                            ) : (
                              <div className="p-8 text-center text-gray-400 text-xs">
                                No notifications yet
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <Link
                              href={user?.user_type === 2 ? "/dashboard/notifications" : "/notifications"}
                              onClick={() => setShowNotifDropdown(false)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              View All Notifications
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <Link href="/cart" className="relative text-gray-500 hover:text-indigo-600 transition">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white leading-none">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link href={user?.user_type === 2 ? "/dashboard/support/chat" : "/chat"} className="relative text-gray-500 hover:text-indigo-600 transition">
                    <MessageSquare className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white leading-none">{unreadCount}</span>
                    )}
                  </Link>
                </div>
                {user?.user_type === 2 && (
                  <Link href="/dashboard" className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition text-sm">
                    Dashboard
                  </Link>
                )}
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center hover:bg-gray-50 p-1 rounded-xl transition group"
                  >
                    <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-indigo-700 transition overflow-hidden">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 ml-1 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showProfileDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                      <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                        {/* Profile Header */}
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100 relative overflow-hidden">
                          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-200/20 rounded-full blur-2xl" />
                          <div className="flex items-center gap-4 relative z-10">
                            <div className="relative group">
                              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-indigo-600 border-2 border-white overflow-hidden font-black text-2xl">
                                {user?.profile_picture ? (
                                  <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                  user?.username?.charAt(0).toUpperCase() || 'U'
                                )}
                              </div>
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition"
                              >
                                <Camera size={12} />
                              </button>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*" 
                              />
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-lg leading-tight">{user?.username}</p>
                              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                                {user?.user_type === 2 ? 'Shop Owner' : 'Customer Account'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-3">
                          <Link 
                            href="/orders" 
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                                <Package size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">My Orders</p>
                                <p className="text-[10px] text-gray-500 font-medium">Track your purchases</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                          </Link>

                          <Link 
                            href={user?.user_type === 2 ? "/dashboard/account/settings" : "/settings"} 
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                                <Settings size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">Account Settings</p>
                                <p className="text-[10px] text-gray-500 font-medium">Privacy & Security</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                          </Link>
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-3 bg-gray-50">
                          <button 
                            onClick={() => {
                              setShowProfileDropdown(false);
                              setShowLogoutModal(true);
                            }}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl text-rose-600 hover:bg-rose-50 transition group"
                          >
                            <div className="p-2 bg-rose-100 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                              <LogOut size={18} />
                            </div>
                            <span className="text-sm font-bold">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/login" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1 text-sm">
                  <User className="h-4 w-4" /> Sign In
                </Link>
                <Link href="/register" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition text-sm">
                  Join Free
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        type="danger"
      />

      {/* ── Mobile Drawer ── */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-[80%] max-w-xs bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 ease-out">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Sajilo Dokan" className="h-10 w-10 object-contain" />
                  <span className="font-black text-xl tracking-tight">Sajilo Dokan</span>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
                  <X size={24} />
                </button>
              </div>
              
              {isAuthenticated ? (
                <div className="mt-8 flex items-center gap-5 relative z-10 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <div className="w-11 h-11 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg font-black text-xl overflow-hidden shrink-0">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user?.username?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg leading-tight">{user?.username}</p>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
                      {user?.user_type === 2 ? 'Shop Owner' : 'Customer Account'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-8 relative z-10">
                  <p className="font-bold text-lg leading-tight">Welcome!</p>
                  <p className="text-sm text-indigo-100">Sign in for the best experience.</p>
                </div>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
              <Link 
                href="/search" 
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition group"
              >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                  <ShoppingBag size={20} />
                </div>
                <span className="font-bold text-gray-900">Shop Now</span>
              </Link>

              {(!isAuthenticated || user?.user_type !== 2) && (
                <Link 
                  href="/register?type=seller" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 transition group"
                >
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                    <Store size={20} />
                  </div>
                  <span className="font-bold text-gray-900">Become a Seller</span>
                </Link>
              )}

              <hr className="my-4 border-gray-50" />

              <Link 
                href="/cart" 
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition">
                    <ShoppingCart size={20} />
                  </div>
                  <span className="font-bold text-gray-900">My Cart</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{cartCount}</span>
                )}
              </Link>

              <Link 
                href="/orders" 
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition group"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                  <Package size={20} />
                </div>
                <span className="font-bold text-gray-900">My Orders</span>
              </Link>

              <Link 
                href={user?.user_type === 2 ? "/dashboard/support/chat" : "/chat"} 
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition group"
              >
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                  <MessageSquare size={20} />
                </div>
                <span className="font-bold text-gray-900">Messages</span>
              </Link>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              {isAuthenticated ? (
                <button 
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl text-rose-600 hover:bg-rose-50 transition font-bold"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    href="/login" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl bg-white border border-gray-200 font-bold text-sm text-gray-700 shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl bg-indigo-600 font-bold text-sm text-white shadow-md shadow-indigo-200"
                  >
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

// Wrap in Suspense because useSearchParams() requires it
export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  );
}
