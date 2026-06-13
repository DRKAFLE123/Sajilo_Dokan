"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { Plus, Pencil, Trash2, Package, X, Store, Globe, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';

interface Shop { id: number; name: string; description: string; address: string; phone_number: string; shop_type: string; pan_vat_number: string; is_verified: boolean; kyc_status: string | null; }
interface Category { id: number; name: string; }
interface Product { 
  id: number; 
  name: string; 
  selling_price: string; 
  stock_quantity: number; 
  sku: string; 
  description: string; 
  category: number | null; 
  category_name: string | null; 
  subcategory_name?: string | null;
  images?: { image: string }[];
  content_score: number;
}

// ── Wizard Step 1: Store Type ─────────────────────────────────────────────────
function StepType({ onNext }: { onNext: (type: 'physical' | 'online') => void }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What kind of store do you have?</h2>
      <p className="text-gray-500 mb-8">Choose your store type to get started.</p>
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        <button onClick={() => onNext('physical')} className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition group">
          <Store className="h-12 w-12 text-gray-400 group-hover:text-indigo-600 transition" />
          <div>
            <p className="font-bold text-gray-900">Physical Store</p>
            <p className="text-xs text-gray-500 mt-1">Brick & mortar with real location</p>
          </div>
        </button>
        <button onClick={() => onNext('online')} className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition group">
          <Globe className="h-12 w-12 text-gray-400 group-hover:text-indigo-600 transition" />
          <div>
            <p className="font-bold text-gray-900">Online Store</p>
            <p className="text-xs text-gray-500 mt-1">Sell online, ship anywhere</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Wizard Step 2: Store Details ─────────────────────────────────────────────
function StepDetails({ shopType, onBack, onNext }: { shopType: string; onBack: () => void; onNext: (data: any) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [panVat, setPanVat] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getLocation = () => {
    setLocLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        setLat(parseFloat(pos.coords.latitude.toFixed(6))); 
        setLng(parseFloat(pos.coords.longitude.toFixed(6))); 
        setLocLoading(false); 
      },
      () => { setLocError('Location access denied. Please enter address manually.'); setLocLoading(false); }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = { name, description: desc, phone_number: phone, shop_type: shopType, pan_vat_number: panVat, address };
      if (shopType === 'physical' && lat && lng) { payload.latitude = lat; payload.longitude = lng; }
      const res = await api.post('/shops/', payload);
      onNext(res.data);
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-gray-600">← Back</button>
        <h2 className="text-2xl font-bold text-gray-900">
          {shopType === 'physical' ? '🏢 Physical Store Details' : '🌐 Online Store Details'}
        </h2>
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}
      <input required placeholder="Store Name *" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
      <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
      <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
      <input placeholder="PAN / VAT / Registration Number" value={panVat} onChange={e => setPanVat(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />

      {shopType === 'physical' ? (
        <div>
          <button type="button" onClick={getLocation} disabled={locLoading} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition w-full justify-center mb-2">
            <MapPin className="h-4 w-4" /> {locLoading ? 'Getting location...' : '📍 Use My Real-Time Location'}
          </button>
          {lat && lng && <p className="text-sm text-green-600 text-center">✓ Location captured: {lat.toFixed(4)}, {lng.toFixed(4)}</p>}
          {locError && <p className="text-sm text-red-500">{locError}</p>}
          <input placeholder="Or enter address manually" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 mt-2" />
        </div>
      ) : (
        <div>
          <textarea required placeholder="Permanent Address *" value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg mt-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">Online stores require KYC verification. You'll be asked to upload your documents after setup.</p>
          </div>
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-300">
        {loading ? 'Creating Store...' : 'Create Store & Continue →'}
      </button>
    </form>
  );
}

// ── Wizard Step 3: KYC Documents ─────────────────────────────────────────────
function StepKYC({ shop, onDone }: { shop: Shop; onDone: () => void }) {
  const [docType, setDocType] = useState('citizenship');
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [permAddress, setPermAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front) { setError('Document front image is required.'); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('document_front', front);
    if (back) formData.append('document_back', back);
    formData.append('father_name', fatherName);
    formData.append('mother_name', motherName);
    formData.append('permanent_address', permAddress);
    try {
      await api.post('/kyc/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onDone();
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
        </div>
        <p className="text-gray-500 text-sm">Your documents will be reviewed by our team within 1-2 business days.</p>
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

      <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
        <option value="citizenship">Citizenship Certificate</option>
        <option value="passport">Passport</option>
        <option value="national_id">National ID Card</option>
        <option value="driving_license">Driving License</option>
      </select>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Front *</label>
        <input type="file" accept="image/*" required onChange={e => setFront(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Back (optional)</label>
        <input type="file" accept="image/*" onChange={e => setBack(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Father's Name" value={fatherName} onChange={e => setFatherName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
        <input placeholder="Mother's Name" value={motherName} onChange={e => setMotherName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <textarea placeholder="Permanent Address" value={permAddress} onChange={e => setPermAddress(e.target.value)} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-300">
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
        <button type="button" onClick={onDone} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
          Skip for now
        </button>
      </div>
    </form>
  );
}

// ── Main Inventory Page ───────────────────────────────────────────────────────
export default function InventoryPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState<'type' | 'details' | 'kyc' | 'done'>('done');
  const [selectedType, setSelectedType] = useState<'physical' | 'online'>('physical');
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const shopRes = await api.get('/shops/my_shop/');
      setShop(shopRes.data);
      
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products/?shop_id=${shopRes.data.id}`),
        api.get('/product-categories/')
      ]);

      // Handle both paginated {results:[]} and plain array responses
      const prodData = prodRes.data?.results ?? prodRes.data;
      setProducts(Array.isArray(prodData) ? prodData : []);

      const catData = catRes.data?.results ?? catRes.data;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch { setShop(null); setWizardStep('type'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}/`); fetchData();
  };

  if (loading) return <div className="text-gray-500">Loading inventory...</div>;

  // ── Wizard Flow ─────────────────────────────────────────────────────────────
  if (!shop) {
    if (wizardStep === 'type') return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12"><StepType onNext={(t) => { setSelectedType(t); setWizardStep('details'); }} /></div>
    );
    if (wizardStep === 'details') return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
        <StepDetails shopType={selectedType} onBack={() => setWizardStep('type')} onNext={(shopData) => { setCreatedShop(shopData); setWizardStep('kyc'); }} />
      </div>
    );
    if (wizardStep === 'kyc' && createdShop) return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
        <StepKYC shop={createdShop} onDone={() => { router.push('/dashboard'); }} />
      </div>
    );
  }

  // ── Inventory Table ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory Management</h1>
            {shop?.is_verified ? (
              <span className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200"><ShieldCheck className="h-3 w-3" /> VERIFIED</span>
            ) : (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200"><AlertCircle className="h-3 w-3" /> PENDING VERIFICATION</span>
            )}
          </div>
          {shop && <p className="text-gray-500 mt-1 text-sm font-medium">{shop.name} · {shop.shop_type === 'physical' ? '🏢 Physical' : '🌐 Online'}</p>}
        </div>
        <button onClick={() => router.push('/dashboard/inventory/add')} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
          <Plus className="h-5 w-5" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-20 text-center">
            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Your store is empty</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">Start adding your products to the marketplace and reach thousands of customers.</p>
            <button onClick={() => router.push('/dashboard/inventory/add')} className="inline-flex mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
              Create First Product
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  {['Product Info','Category','Price','Stock','Score','Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0].image} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: PROD-{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{p.category_name}</span>
                      <div className="text-[10px] text-gray-400 mt-1">{p.subcategory_name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900">NPR {p.selling_price || 'Multi'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`text-xs font-bold ${p.stock_quantity < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.stock_quantity} <span className="text-[10px] font-normal text-gray-400 ml-1">UNITS</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.content_score > 70 ? 'bg-green-500' : p.content_score > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.content_score}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">{p.content_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/dashboard/inventory/edit/${p.id}`)} className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Pencil size={16} /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
