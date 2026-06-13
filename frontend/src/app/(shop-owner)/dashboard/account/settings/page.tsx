"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { Tag, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AccountSettingsPage() {
  const [shop, setShop] = useState<any>(null);
  const [promotionLabel, setPromotionLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    api.get('/shops/my_shop/')
      .then(res => {
        setShop(res.data);
        setPromotionLabel(res.data.promotion_label || '');
      })
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.patch(`/shops/${shop.id}/`, { promotion_label: promotionLabel });
      setMessage({ type: 'success', text: 'Shop settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 animate-pulse text-gray-400">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-sm text-gray-500 flex gap-2">
        <Link href="/" className="hover:text-indigo-600">Homepage</Link> &gt; 
        <span>Setting</span> &gt; 
        <span className="font-bold text-gray-800">Account Settings</span>
      </div>
      
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500">Manage your shop preferences and security.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex gap-3 items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}
      
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-10 space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600"><Tag size={20} /></div>
            <h2 className="text-xl font-bold text-gray-800">Shop Promotion</h2>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Choose a promotional label to display on your shop card in the marketplace. 
              This helps attract more customers during sales or when you have new arrivals.
            </p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                value={promotionLabel} 
                onChange={(e) => setPromotionLabel(e.target.value)}
                placeholder="e.g. 50% OFF, Mega Sale, Holiday Special" 
                maxLength={20}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-600 focus:ring-0 transition font-medium"
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 font-medium py-2">Quick Picks:</span>
                {[
                  { id: '', label: 'None' },
                  { id: 'sale', label: 'Sale' },
                  { id: 'offer', label: 'Special Offer' },
                  { id: 'new', label: 'New Arrival' },
                  { id: 'hot', label: 'Hot Deal' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPromotionLabel(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border-2 ${
                      promotionLabel === opt.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-50" />

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded-lg border-gray-300 focus:ring-indigo-500 transition" />
              <span className="text-gray-600 text-sm font-medium group-hover:text-gray-900 transition">Email Notifications for New Orders</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded-lg border-gray-300 focus:ring-indigo-500 transition" />
              <span className="text-gray-600 text-sm font-medium group-hover:text-gray-900 transition">Email Notifications for New Messages</span>
            </label>
          </div>
        </div>

        <hr className="border-gray-50" />
        
        <div className="flex justify-between items-center pt-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Security</h2>
            <button className="mt-2 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
              Change Password
            </button>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition transform hover:-translate-y-1 active:scale-95 disabled:bg-indigo-300 flex items-center gap-2"
          >
            {loading ? 'Saving...' : <><Save size={20} /> Save All Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
}
