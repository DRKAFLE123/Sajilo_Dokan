"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/apiClient';
import { Bell, Loader2, Check, CheckSquare, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/notifications');
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, isLoading, router]);

  const handleMarkRead = async (notifId: number) => {
    try {
      await api.post(`/notifications/${notifId}/mark_read/`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (notifId: number) => {
    try {
      await api.delete(`/notifications/${notifId}/`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || loadingItems) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading notifications...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Notifications</h1>
              <p className="text-gray-500 text-sm">
                {unreadCount > 0 ? `You have ${unreadCount} unread alerts` : 'You are all caught up'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-200 rounded-xl font-bold text-xs text-indigo-600 transition shadow-sm self-start sm:self-auto"
            >
              <CheckSquare size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id}
                className={`bg-white rounded-2xl border transition shadow-sm p-5 flex gap-4 relative overflow-hidden group ${
                  !n.is_read 
                  ? 'border-indigo-100 bg-indigo-50/10' 
                  : 'border-gray-100'
                }`}
              >
                {!n.is_read && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600" />
                )}
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-sm ${!n.is_read ? 'text-gray-955' : 'text-gray-700'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                    {n.message}
                  </p>
                  
                  {n.link && (
                    <div className="pt-2">
                      <Link 
                        href={n.link}
                        onClick={() => handleMarkRead(n.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        View details <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-1 self-start opacity-0 group-hover:opacity-100 transition duration-200">
                  {!n.is_read && (
                    <button 
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteNotif(n.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Bell size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">No notifications yet</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                We will notify you here about order updates, security notices, and KYC alerts.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
