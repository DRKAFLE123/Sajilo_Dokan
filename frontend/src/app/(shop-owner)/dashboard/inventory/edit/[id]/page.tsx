"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { 
  Plus, X, Info, Settings2, ShoppingBag, Truck, ShieldCheck, 
  ChevronRight, AlertCircle, Trash2, Camera, Tag as TagIcon,
  Calendar, Box, DollarSign, Barcode
} from 'lucide-react';

interface Category { id: number; name: string; }
interface Subcategory { id: number; name: string; category: number; }
interface ChildCategory { id: number; name: string; subcategory: number; }
interface Brand { id: number; name: string; }
interface Tag { id: number; name: string; }

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Data from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [highlights, setHighlights] = useState(['']);
  const [description, setDescription] = useState('');
  
  // Inventory Attributes
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  // Shipping
  const [pkgWeight, setPkgWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [dangerous, setDangerous] = useState('none');
  
  // Warranty
  const [warrantyType, setWarrantyType] = useState('none');
  const [warrantyPeriod, setWarrantyPeriod] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          api.get('/product-categories/'),
          api.get('/product-tags/')
        ]);
        setCategories(catRes.data?.results ?? catRes.data);
        setAvailableTags(tagRes.data?.results ?? tagRes.data);

        // Fetch existing product data
        const prodRes = await api.get(`/products/${id}/`);
        const p = prodRes.data;
        setName(p.name);
        if (p.category) setSelectedCat(String(p.category));
        if (p.subcategory) setSelectedSub(String(p.subcategory));
        if (p.child_category) setSelectedChild(String(p.child_category));
        if (p.brand) setSelectedBrand(String(p.brand));
        if (p.tags) setSelectedTags(p.tags);
        setDescription(p.description);
        setHighlights(p.highlights ? p.highlights.split('\n') : ['']);
        setSize(p.size);
        setColor(p.color);
        setWeight(p.weight);
        setUnit(p.unit);
        setCostPrice(String(p.cost_price));
        setSellingPrice(String(p.selling_price));
        setStockQuantity(String(p.stock_quantity));
        setBarcode(p.barcode);
        setSupplier(p.supplier);
        if (p.expiry_date) setExpiryDate(p.expiry_date);
        setPkgWeight(String(p.package_weight));
        setLength(String(p.package_length));
        setWidth(String(p.package_width));
        setHeight(String(p.package_height));
        setDangerous(p.is_dangerous);
        setWarrantyType(p.warranty_type);
        setWarrantyPeriod(p.warranty_period);
        setExistingImages(p.images || []);

      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (selectedCat) {
      api.get(`/product-subcategories/?category_id=${selectedCat}`)
        .then(res => setSubcategories(res.data?.results ?? res.data));
      api.get(`/brands/?category_id=${selectedCat}`)
        .then(res => setBrands(res.data?.results ?? res.data));
    } else {
      setSubcategories([]);
      api.get('/brands/').then(res => setBrands(res.data?.results ?? res.data));
    }
  }, [selectedCat]);

  useEffect(() => {
    if (selectedSub) {
      api.get(`/product-child-categories/?subcategory_id=${selectedSub}`)
        .then(res => setChildCategories(res.data?.results ?? res.data));
    } else {
      setChildCategories([]);
    }
  }, [selectedSub]);

  const calculateScore = () => {
    let s = 0;
    if (name.length > 5) s += 10;
    if (selectedCat && selectedSub) s += 10;
    if (selectedChild) s += 5;
    if ((existingImages.length + images.length) >= 3) s += 15;
    if (selectedBrand) s += 5;
    if (description.length > 20) s += 15;
    if (sellingPrice && stockQuantity) s += 10;
    if (pkgWeight && length && width && height) s += 15;
    if (selectedTags.length > 0) s += 10;
    if (barcode) s += 5;
    return s;
  };

  const score = calculateScore();

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!confirm('Delete this existing image permanently?')) return;
    try {
      await api.delete(`/product-images/${imageId}/`);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Failed to delete image', err);
      alert('Failed to delete image. It might be in use or already deleted.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      let finalBrandId = selectedBrand;
      if (selectedBrand === 'custom' && customBrand.trim()) {
        const brandRes = await api.post('/brands/', { name: customBrand.trim(), category: selectedCat ? parseInt(selectedCat) : null });
        finalBrandId = brandRes.data.id;
      }

      const payload = {
        name,
        category: parseInt(selectedCat),
        subcategory: parseInt(selectedSub),
        child_category: selectedChild ? parseInt(selectedChild) : null,
        brand: finalBrandId !== 'custom' && finalBrandId ? parseInt(String(finalBrandId)) : null,
        tags: selectedTags,
        description,
        highlights: highlights.filter(h => h.trim()).join('\n'),
        size,
        color,
        weight,
        unit,
        cost_price: parseFloat(costPrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        stock_quantity: parseInt(stockQuantity) || 0,
        barcode,
        supplier,
        expiry_date: expiryDate || null,
        package_weight: parseFloat(pkgWeight) || 0,
        package_length: parseFloat(length) || 0,
        package_width: parseFloat(width) || 0,
        package_height: parseFloat(height) || 0,
        is_dangerous: dangerous,
        warranty_type: warrantyType,
        warranty_period: warrantyPeriod,
      };

      const res = await api.patch(`/products/${id}/`, payload);
      const productId = res.data.id;

      // Handle newly added images (simplified for edit, appending new ones)
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const formData = new FormData();
          formData.append('product', productId);
          formData.append('image', images[i]);
          formData.append('is_main', i === 0 ? 'true' : 'false');
          await api.post('/product-images/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }

      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data) || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-8 relative max-w-7xl mx-auto">
      <div className="flex-1 space-y-8 pb-20">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Inventory</span>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Universal Product Entry</span>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Product</h1>
            <p className="text-gray-500 text-sm">Update your product information below.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Generated SKU</span>
            <div className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm font-bold text-gray-700">
              AUTO-GEN-SKU
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex gap-3 animate-shake"><AlertCircle className="flex-shrink-0" /> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Basic Information */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Info size={20} /></div>
              <h2 className="font-bold text-gray-800 text-lg">1. Basic Information</h2>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
                <input required placeholder="Ex. Wai Wai Instant Noodles - Red Packet" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Main Category <span className="text-red-500">*</span></label>
                  <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition" value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setSelectedSub(''); setSelectedChild(''); }}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory <span className="text-red-500">*</span></label>
                  <select required disabled={!selectedCat} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50" value={selectedSub} onChange={e => { setSelectedSub(e.target.value); setSelectedChild(''); }}>
                    <option value="">Select Subcategory</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Child Category</label>
                  <select disabled={!selectedSub} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                    <option value="">Select Child Category</option>
                    {childCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Images</label>
                <div className="grid grid-cols-6 gap-4">
                  {/* Existing Images */}
                  {existingImages.map((img) => (
                    <div key={`existing-${img.id}`} className="aspect-square rounded-2xl border border-indigo-100 relative overflow-hidden group shadow-sm bg-gray-50">
                      <img src={img.image} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleDeleteExistingImage(img.id)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-50"><Trash2 size={14} /></button>
                      <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/10 py-1 text-[8px] font-bold text-indigo-600 text-center uppercase tracking-widest">Existing</div>
                    </div>
                  ))}

                  {/* New (Pending) Images */}
                  {images.map((img, idx) => (
                    <div key={`new-${idx}`} className="aspect-square rounded-2xl border border-green-100 relative overflow-hidden group shadow-sm bg-gray-50">
                      <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-50"><X size={14} /></button>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-600/10 py-1 text-[8px] font-bold text-green-600 text-center uppercase tracking-widest">New</div>
                    </div>
                  ))}

                  {(existingImages.length + images.length) < 6 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer transition bg-gray-50/50">
                      <Camera size={28} className="mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Add Photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setImages([...images, e.target.files[0]])} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Inventory & Attributes */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Box size={20} /></div>
              <h2 className="font-bold text-gray-800 text-lg">2. Inventory & Attributes</h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Brand</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
                    <option value="">No Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    <option value="custom">Other (Custom Brand)</option>
                  </select>
                  {selectedBrand === 'custom' && (
                    <input autoFocus placeholder="Enter brand name..." className="mt-2 w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-900 placeholder-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none" value={customBrand} onChange={e => setCustomBrand(e.target.value)} required />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Size / Variation</label>
                  <input placeholder="e.g. Medium, XL" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={size} onChange={e => setSize(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Color</label>
                  <input placeholder="e.g. Red, Blue" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={color} onChange={e => setColor(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Weight / Vol</label>
                  <div className="flex gap-2">
                    <input placeholder="70" className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={weight} onChange={e => setWeight(e.target.value)} />
                    <select className="w-16 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold" value={unit} onChange={e => setUnit(e.target.value)}>
                      <option value="pcs">PCS</option>
                      <option value="pkt">PKT</option>
                      <option value="kg">KG</option>
                      <option value="gm">GM</option>
                      <option value="ml">ML</option>
                      <option value="ltr">LTR</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><DollarSign size={14} className="text-gray-400"/> Cost Price</label>
                  <input type="number" placeholder="0.00" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-indigo-600" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><DollarSign size={14} className="text-gray-400"/> Selling Price <span className="text-red-500">*</span></label>
                  <input required type="number" placeholder="0.00" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl font-extrabold text-green-600" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><ShoppingBag size={14} className="text-gray-400"/> Stock Quantity <span className="text-red-500">*</span></label>
                  <input required type="number" placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Barcode / EAN</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={barcode} onChange={e => setBarcode(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Supplier</label>
                  <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={supplier} onChange={e => setSupplier(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Smart Filtering Tags */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><TagIcon size={20} /></div>
              <h2 className="font-bold text-gray-800 text-lg">3. Smart Filtering Tags</h2>
            </div>
            <div className="p-8">
              <div className="flex flex-wrap gap-3">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                      selectedTags.includes(tag.id) 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {selectedTags.includes(tag.id) && <ShieldCheck size={12} />}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Description & Logistics */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Truck size={20} /></div>
              <h2 className="font-bold text-gray-800 text-lg">4. Logistics & Warranty</h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Pkg Weight (kg)</label>
                  <input type="number" step="0.001" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={pkgWeight} onChange={e => setPkgWeight(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Length (cm)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={length} onChange={e => setLength(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Width (cm)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={width} onChange={e => setWidth(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Height (cm)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={height} onChange={e => setHeight(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Dangerous Goods</label>
                  <div className="flex gap-4">
                    {['none', 'battery', 'flammable', 'liquid'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="dangerous" checked={dangerous === opt} onChange={() => setDangerous(opt)} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 transition flex items-center justify-center ${dangerous === opt ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                          {dangerous === opt && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                        </div>
                        <span className={`text-xs capitalize font-medium ${dangerous === opt ? 'text-indigo-600' : 'text-gray-400'}`}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Warranty Info</label>
                  <div className="flex gap-3">
                    <select className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={warrantyType} onChange={e => setWarrantyType(e.target.value)}>
                      <option value="none">No Warranty</option>
                      <option value="local">Local Seller</option>
                      <option value="brand">Brand Warranty</option>
                    </select>
                    {warrantyType !== 'none' && (
                      <input placeholder="e.g. 1 Year" className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={warrantyPeriod} onChange={e => setWarrantyPeriod(e.target.value)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pb-20">
            <button type="button" onClick={() => router.back()} className="px-10 py-4 rounded-2xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-16 py-4 rounded-2xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95 disabled:bg-indigo-300">
              {loading ? 'Updating Product...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Floating Content Score Sidebar */}
      <div className="w-80 sticky top-8 h-fit space-y-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-gray-800 tracking-tight">Listing Quality</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                score < 40 ? 'bg-red-50 text-red-500' : score < 70 ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'
              }`}>
                {score < 40 ? 'Poor' : score < 70 ? 'Good' : 'Premium'}
              </span>
            </div>
            <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
              <div className={`h-full transition-all duration-700 ease-out ${
                score < 40 ? 'bg-red-500' : score < 70 ? 'bg-amber-500' : 'bg-indigo-600'
              }`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-3 font-medium leading-relaxed italic text-center">"Premium listings appear higher in search results."</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            {[
              { label: 'Basic Info & Categories', met: name && selectedCat && selectedSub },
              { label: 'Min 3 Product Images', met: (existingImages.length + images.length) >= 3 },
              { label: 'Brand & Specifications', met: selectedBrand && (size || color || weight) },
              { label: 'Pricing & Stock Control', met: sellingPrice && stockQuantity },
              { label: 'Smart Filtering Tags', met: selectedTags.length > 0 },
              { label: 'Detailed Logistics', met: pkgWeight && length && width && height },
              { label: 'Barcode/SKU System', met: barcode },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  task.met ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200'
                }`}>
                  {task.met ? <ShieldCheck size={12} /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />}
                </div>
                <span className={`text-[11px] font-semibold ${task.met ? 'text-gray-900' : 'text-gray-400'}`}>{task.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl">
          <div className="absolute -right-8 -bottom-8 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition duration-1000" />
          <h4 className="font-bold text-lg mb-3 relative z-10">Smart Inventory</h4>
          <p className="text-xs text-indigo-100 relative z-10 leading-relaxed mb-6 opacity-80">Our SKU system automatically categorizes your products for instant searching across all platforms.</p>
          <button type="button" className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl text-xs hover:bg-indigo-50 transition relative z-10">Learn about SKU System</button>
        </div>
      </div>
    </div>
  );
}
