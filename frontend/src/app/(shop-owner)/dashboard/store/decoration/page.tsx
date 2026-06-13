"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Image as ImageIcon, Check, Save, 
  Smartphone, Monitor, Star, Package, 
  Loader2, AlertCircle, ShieldCheck, MapPin
} from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: number;
  name: string;
  selling_price: string;
  image?: string;
  is_featured: boolean;
  images?: { image: string, is_main: boolean }[];
}

interface Shop {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  banner?: string | null;
  address: string;
  is_verified: boolean;
}

export default function StoreDecorationPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Local state for edits
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const shopRes = await api.get('/shops/my_shop/');
      setShop(shopRes.data);
      setLogoPreview(shopRes.data.logo);
      setBannerPreview(shopRes.data.banner);

      const productsRes = await api.get(`/products/?shop_id=${shopRes.data.id}`);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results || []);
    } catch (err) {
      setError('Failed to load store data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const toggleFeatured = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const newStatus = !product.is_featured;
      await api.patch(`/products/${productId}/`, { is_featured: newStatus });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_featured: newStatus } : p));
    } catch (err) {
      console.error('Failed to toggle featured status', err);
    }
  };

  const saveDecoration = async () => {
    if (!shop) return;
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      if (selectedLogo) formData.append('logo', selectedLogo);
      if (selectedBanner) formData.append('banner', selectedBanner);
      
      // Also allow updating name/description if needed, but here we focus on decoration
      await api.patch(`/shops/${shop.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchData(); // Refresh
      alert('Store decoration saved successfully!');
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-600 h-10 w-10 mb-4" />
        <p className="text-gray-500">Loading store settings...</p>
      </div>
    );
  }

  const featuredProducts = products.filter(p => p.is_featured);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Controls */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Store Decoration</h2>
              <button 
                onClick={saveDecoration}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Visuals */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Store Logo (Profile Picture)</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center group cursor-pointer"
                       onClick={() => logoInputRef.current?.click()}>
                    {logoPreview ? (
                      <img src={logoPreview} className="h-full w-full object-cover" alt="Logo preview" />
                    ) : (
                      <Camera className="text-gray-400 group-hover:text-indigo-500 transition" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <ImageIcon className="text-white h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-2">Recommended: Square image, min 400x400px. PNG or JPG.</p>
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="text-indigo-600 text-sm font-semibold hover:underline"
                    >
                      Change Logo
                    </button>
                    <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Store Banner (Cover Image)</label>
                <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center group cursor-pointer"
                     onClick={() => bannerInputRef.current?.click()}>
                  {bannerPreview ? (
                    <img src={bannerPreview} className="h-full w-full object-cover" alt="Banner preview" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="text-gray-400 h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to upload banner</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button className="bg-white text-gray-900 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
                      <Camera size={18} /> Replace Banner
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Best for: 1200x400px. High-quality landscape image.</p>
                <input ref={bannerInputRef} type="file" className="hidden" accept="image/*" onChange={handleBannerChange} />
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="text-yellow-500 h-5 w-5" />
              Featured Products
            </h3>
            <p className="text-sm text-gray-500 mb-6">Select up to 5 products to showcase at the top of your shop profile.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => toggleFeatured(product.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    product.is_featured ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0].image} className="h-full w-full object-cover" alt={product.name} />
                    ) : (
                      <Package className="h-full w-full p-3 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-indigo-600 font-bold">NPR {parseFloat(product.selling_price).toLocaleString()}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition ${
                    product.is_featured ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                  }`}>
                    {product.is_featured && <Check className="text-white h-3 w-3" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:w-[400px]">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Preview</h3>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-md transition ${previewMode === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                  <Smartphone size={18} />
                </button>
                <button 
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-md transition ${previewMode === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                  <Monitor size={18} />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className={`mx-auto bg-gray-50 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[320px] h-[640px]' : 'w-full h-[500px] rounded-xl border-4'
            }`}>
              <div className="h-full w-full overflow-y-auto scrollbar-hide bg-gray-50">
                {/* Simulated Shop Header */}
                <div className="relative">
                  {/* Banner */}
                  <div className="h-24 bg-indigo-600">
                    {bannerPreview && <img src={bannerPreview} className="h-full w-full object-cover" />}
                  </div>
                  
                  {/* Profile Section */}
                  <div className="px-4 -mt-8 relative z-10">
                    <div className="h-16 w-16 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-2xl">{shop?.name.charAt(0)}</span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                          {shop?.name}
                          {shop?.is_verified && <ShieldCheck size={14} className="text-green-500" />}
                        </h4>
                        <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <MapPin size={10} /> {shop?.address || 'Local Seller'}
                        </p>
                      </div>
                      <button className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">Follow</button>
                    </div>
                  </div>
                </div>

                {/* Tabs Simulator */}
                <div className="flex border-b border-gray-100 mt-4 px-4 gap-4">
                  <span className="text-[11px] font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">Products</span>
                  <span className="text-[11px] font-bold text-gray-400 pb-1">Reviews</span>
                </div>

                {/* Featured Products List */}
                <div className="p-4">
                  <h5 className="text-[11px] font-bold text-gray-900 mb-3 uppercase tracking-wider">Featured Items</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {featuredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                           {p.images?.[0] ? <img src={p.images[0].image} className="h-full w-full object-cover" /> : <Package className="h-full w-full p-2 text-gray-200" />}
                        </div>
                        <p className="text-[10px] font-bold text-gray-800 truncate">{p.name}</p>
                        <p className="text-[9px] text-indigo-600 font-bold">NPR {parseFloat(p.selling_price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
