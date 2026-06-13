import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductCard, { Product } from '@/components/ProductCard';
import { MapPin, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import FollowButton from './FollowButton';
import ReviewsSection from '@/components/ReviewsSection';

async function getShop(id: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/shops/${id}/`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getShopProducts(shopId: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/products/?shop_id=${shopId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch { return []; }
}

export default async function ShopProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [shop, products] = await Promise.all([
    getShop(id),
    getShopProducts(id),
  ]);

  if (!shop) return notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Banner */}
      <div className="bg-indigo-600 h-64 w-full relative overflow-hidden">
        {shop.banner ? (
          <img 
            src={shop.banner.startsWith('http') ? shop.banner : `http://127.0.0.1:8000${shop.banner}`} 
            className="w-full h-full object-cover" 
            alt={shop.name} 
          />
        ) : (
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-indigo-800 to-purple-800" />
        )}
      </div>

      {/* Shop Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          {/* Shop Avatar */}
          <div className="h-32 w-32 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-indigo-600 font-bold text-5xl flex-shrink-0 overflow-hidden">
            {shop.logo ? (
              <img 
                src={shop.logo.startsWith('http') ? shop.logo : `http://127.0.0.1:8000${shop.logo}`} 
                className="w-full h-full object-cover" 
                alt={shop.name} 
              />
            ) : shop.name.charAt(0)}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between flex-1 gap-4 w-full">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{shop.name}</h1>
                {shop.verification_tier === 'business_verified' && (
                  <span title="Business Registered & Verified (PAN/VAT Approved)" className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> Business Verified
                  </span>
                )}
                {shop.verification_tier === 'personal_verified' && (
                  <span title="Identity Verified (Citizenship/ID Card Checked)" className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" /> Identity Verified
                  </span>
                )}
                {!shop.verification_tier && shop.is_verified && (
                  <span title="Identity Verified" className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-gray-500">
                {shop.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-indigo-500" />{shop.address}</span>}
                {shop.phone_number && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-indigo-500" />{shop.phone_number}</span>}
                {shop.verification_tier === 'business_verified' && shop.pan_vat_number && (
                  <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                    PAN/VAT: {shop.pan_vat_number}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <FollowButton shopId={shop.id} initialFollowing={shop.is_following || false} />
              <Link 
                href={`/chat?shop=${id}`}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Shop
              </Link>
            </div>
          </div>
        </div>

        {/* Description */}
        {shop.description && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="font-semibold text-gray-700 mb-2">About this shop</h2>
            <p className="text-gray-600">{shop.description}</p>
          </div>
        )}

        {/* Products Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Products
            <span className="ml-2 text-lg font-normal text-gray-400">({Array.isArray(products) ? products.length : 0})</span>
          </h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">No products listed yet</h3>
              <p className="text-gray-500 mt-1">This shop is still setting up their inventory.</p>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <ReviewsSection type="shop" id={shop.id} />
        </div>
      </div>
    </div>
  );
}
