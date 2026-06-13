"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  Settings, Save, ShieldCheck, CreditCard, 
  MessageSquare, Star, Truck, Globe, AlertCircle
} from 'lucide-react';

interface SettingsData {
  shop_approval_required: boolean;
  product_approval_required: boolean;
  default_commission_rate: string;
  minimum_payout_amount: string;
  enable_chat: boolean;
  enable_reviews: boolean;
  enable_cod: boolean;
  marketplace_name: string;
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform-settings/global_settings/');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.patch('/platform-settings/global_settings/', settings);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Sajilo Platform</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Platform Settings</h1>
          <p className="text-gray-500 mt-1">Configure global marketplace rules and master toggles.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Rules Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <ShieldCheck size={24} className="text-indigo-600" />
            <h3 className="text-xl font-black text-gray-900">Marketplace Rules</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">Manual Shop Approval</p>
                <p className="text-xs text-gray-500">Require admin review for new shops</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings?.shop_approval_required}
                onChange={e => setSettings(s => s ? {...s, shop_approval_required: e.target.checked} : null)}
                className="w-12 h-6 rounded-full appearance-none bg-gray-200 checked:bg-indigo-600 transition-colors cursor-pointer relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-transform checked:after:translate-x-6"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">Product Moderation</p>
                <p className="text-xs text-gray-500">Review all products before live</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings?.product_approval_required}
                onChange={e => setSettings(s => s ? {...s, product_approval_required: e.target.checked} : null)}
                className="w-12 h-6 rounded-full appearance-none bg-gray-200 checked:bg-indigo-600 transition-colors cursor-pointer relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-transform checked:after:translate-x-6"
              />
            </div>
          </div>
        </div>

        {/* Financial Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <CreditCard size={24} className="text-amber-500" />
            <h3 className="text-xl font-black text-gray-900">Financial Settings</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Default Commission (%)</label>
              <input 
                type="number" 
                value={settings?.default_commission_rate}
                onChange={e => setSettings(s => s ? {...s, default_commission_rate: e.target.value} : null)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Min Payout Amount (NPR)</label>
              <input 
                type="number" 
                value={settings?.minimum_payout_amount}
                onChange={e => setSettings(s => s ? {...s, minimum_payout_amount: e.target.value} : null)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition font-bold"
              />
            </div>
          </div>
        </div>

        {/* Features Toggle Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Globe size={24} className="text-green-600" />
            <h3 className="text-xl font-black text-gray-900">Feature Toggles</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Live Chat', key: 'enable_chat', icon: <MessageSquare size={16} /> },
              { label: 'Reviews', key: 'enable_reviews', icon: <Star size={16} /> },
              { label: 'Cash on Delivery', key: 'enable_cod', icon: <Truck size={16} /> },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setSettings(s => s ? {...s, [item.key]: !s[item.key as keyof SettingsData]} : null)}
                className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition ${
                  settings?.[item.key as keyof SettingsData] 
                    ? 'border-indigo-100 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-50 bg-white text-gray-400'
                }`}
              >
                <div className={`p-3 rounded-2xl ${settings?.[item.key as keyof SettingsData] ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                  {item.icon}
                </div>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Branding Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Settings size={24} className="text-purple-600" />
            <h3 className="text-xl font-black text-gray-900">Platform Branding</h3>
          </div>
          
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Marketplace Name</label>
            <input 
              type="text" 
              value={settings?.marketplace_name}
              onChange={e => setSettings(s => s ? {...s, marketplace_name: e.target.value} : null)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
