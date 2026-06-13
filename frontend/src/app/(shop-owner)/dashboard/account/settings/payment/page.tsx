"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  CreditCard, QrCode, Save, AlertCircle, CheckCircle2, 
  ChevronRight, Info, Upload, Trash2
} from 'lucide-react';

export default function PaymentSettingsPage() {
  const [shop, setShop] = useState<any>(null);
  const [merchantCode, setMerchantCode] = useState('');
  const [qrCode, setQrCode] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    api.get('/shops/my_shop/')
      .then(res => {
        setShop(res.data);
        setMerchantCode(res.data.merchant_code || '');
        if (res.data.qr_code) {
          setQrPreview(res.data.qr_code);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setFetching(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setQrCode(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('merchant_code', merchantCode);
      if (qrCode) {
        formData.append('qr_code', qrCode);
      }

      await api.patch(`/shops/${shop.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage({ type: 'success', text: 'Payment settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update payment settings.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 animate-pulse text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <span>Dashboard</span>
        <ChevronRight size={14} />
        <span>Account</span>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">Payment Settings</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Settings</h1>
        <p className="text-gray-500 text-sm">Configure how customers pay you for online orders.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex gap-3 items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><CreditCard size={20} /></div>
            <h2 className="font-bold text-gray-800 text-lg">Merchant Identification</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex gap-4">
              <Info className="text-indigo-600 flex-shrink-0" size={24} />
              <div className="text-sm text-indigo-900 leading-relaxed">
                <p className="font-bold mb-1">How it works:</p>
                When a customer chooses <strong>Online Payment</strong> during checkout, they will be shown your QR code and Merchant code. After paying, they will complete the order. You must then manually verify the payment in your bank/wallet app and mark the order as "Paid" in your dashboard.
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Merchant ID / Phone Number</label>
              <input 
                placeholder="Ex. 9841XXXXXX or Merchant Code" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={merchantCode}
                onChange={e => setMerchantCode(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-400 font-medium italic">This will be displayed to customers during the checkout process.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><QrCode size={20} /></div>
            <h2 className="font-bold text-gray-800 text-lg">Payment QR Code</h2>
          </div>
          
          <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Upload your shop's payment QR code (Fonepay, Khalti, eSewa, etc.). 
                Make sure the QR is clear and contains your business name for verification.
              </p>
              
              <label className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                <Upload size={18} />
                Upload New QR Code
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>

            <div className="w-full md:w-64 aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
              {qrPreview ? (
                <>
                  <img src={qrPreview} className="w-full h-full object-contain p-4" alt="QR Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button type="button" onClick={() => {setQrCode(null); setQrPreview(null);}} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <QrCode size={48} strokeWidth={1} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">No QR Uploaded</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button type="submit" disabled={loading} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95 disabled:bg-indigo-300 flex items-center gap-2">
            {loading ? 'Saving Settings...' : <><Save size={20} /> Save Payment Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
}
