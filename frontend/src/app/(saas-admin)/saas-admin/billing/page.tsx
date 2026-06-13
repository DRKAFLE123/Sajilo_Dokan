"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { CreditCard, Plus, Save, Trash2, Edit2, X, Check, Zap } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  price_monthly: string;
  product_limit: number;
  features: string[];
  is_active: boolean;
}

const FEATURE_PRESETS = [
  'Unlimited Products',
  'Priority Listing',
  'Marketing Tools',
  'Analytics Dashboard',
  'Verified Badge',
  'Customer Support',
  'Custom Promotions',
];

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: '', price_monthly: '', product_limit: 50, features: [] as string[], is_active: true };
  const [form, setForm] = useState(emptyForm);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscription-plans/');
      setPlans(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      price_monthly: plan.price_monthly,
      product_limit: plan.product_limit,
      features: [...plan.features],
      is_active: plan.is_active,
    });
  };

  const handleSave = async (id?: number) => {
    setSaving(true);
    try {
      if (id) {
        await api.patch(`/subscription-plans/${id}/`, form);
      } else {
        await api.post('/subscription-plans/', form);
      }
      await fetchPlans();
      setIsCreating(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this plan? Shops on this plan will lose their subscription.')) return;
    try {
      await api.delete(`/subscription-plans/${id}/`);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete failed');
    }
  };

  const addFeature = (feature: string) => {
    if (feature && !form.features.includes(feature)) {
      setForm(prev => ({ ...prev, features: [...prev.features, feature] }));
    }
    setNewFeature('');
  };

  const removeFeature = (f: string) => {
    setForm(prev => ({ ...prev, features: prev.features.filter(x => x !== f) }));
  };

  const PlanForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-6 space-y-5">
      <h3 className="font-black text-gray-900">{editingId ? 'Edit Plan' : 'New Subscription Plan'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Plan Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Pro"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Monthly Price (NPR)</label>
          <input
            type="number"
            value={form.price_monthly}
            onChange={e => setForm(prev => ({ ...prev, price_monthly: e.target.value }))}
            placeholder="e.g. 999"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Product Limit (0 = unlimited)</label>
          <input
            type="number"
            value={form.product_limit}
            onChange={e => setForm(prev => ({ ...prev, product_limit: parseInt(e.target.value) || 0 }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 outline-none transition"
          />
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">Plan Features</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.features.map(f => (
            <span key={f} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl">
              {f}
              <button onClick={() => removeFeature(f)} className="text-indigo-400 hover:text-indigo-700 ml-1">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        {/* Quick add presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {FEATURE_PRESETS.filter(p => !form.features.includes(p)).map(preset => (
            <button
              key={preset}
              onClick={() => addFeature(preset)}
              className="text-xs font-bold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition"
            >
              + {preset}
            </button>
          ))}
        </div>
        {/* Custom feature */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addFeature(newFeature)}
            placeholder="Custom feature..."
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 outline-none transition text-sm"
          />
          <button onClick={() => addFeature(newFeature)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800 transition">Cancel</button>
        <button
          onClick={onSave}
          disabled={saving || !form.name || !form.price_monthly}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save Plan'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">SaaS Admin</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Plans & Billing</h1>
          <p className="text-gray-500 mt-1">Create and manage subscription tiers for your marketplace.</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingId(null); setForm(emptyForm); }}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Plus size={20} /> New Plan
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <PlanForm
          onSave={() => handleSave()}
          onCancel={() => { setIsCreating(false); setForm(emptyForm); }}
        />
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 && !isCreating ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center flex flex-col items-center gap-4">
          <CreditCard size={56} className="text-gray-200" />
          <h3 className="text-xl font-bold text-gray-500">No subscription plans yet.</h3>
          <button
            onClick={() => setIsCreating(true)}
            className="text-indigo-600 font-bold border-2 border-indigo-100 px-6 py-2 rounded-xl hover:bg-indigo-50 transition"
          >
            Create your first plan →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id}>
              {editingId === plan.id ? (
                <PlanForm
                  onSave={() => handleSave(plan.id)}
                  onCancel={() => { setEditingId(null); setForm(emptyForm); }}
                />
              ) : (
                <div className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col h-full ${
                  plan.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                }`}>
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 opacity-10"><Zap size={120} /></div>
                    <div className="relative z-10">
                      <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Plan</p>
                      <h3 className="text-2xl font-black">{plan.name}</h3>
                      <p className="text-3xl font-black mt-2">
                        NPR {plan.price_monthly}
                        <span className="text-base font-normal text-indigo-200">/mo</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                      {plan.product_limit === 0 ? 'Unlimited products' : `Up to ${plan.product_limit} products`}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check size={14} className="text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => handleStartEdit(plan)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
