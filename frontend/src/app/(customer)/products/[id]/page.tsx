import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductActions from './ProductActions';
import { ShoppingBag, ChevronRight, Tag, ShieldCheck, Truck } from 'lucide-react';
import ReviewsSection from '@/components/ReviewsSection';

async function getProduct(id: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/products/${id}/`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Use main image or fallback
  const mainImage = product.images && product.images.length > 0 
    ? product.images.find((img: any) => img.is_main)?.image || product.images[0].image
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="hover:text-indigo-600 transition">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <Link href="/products" className="hover:text-indigo-600 transition">Products</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0">
            
            {/* Product Image Gallery (Left Side) */}
            <div className="lg:col-span-2 bg-gray-50 p-8 flex items-center justify-center border-r border-gray-100 relative min-h-[400px]">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="max-w-full max-h-[500px] object-contain drop-shadow-xl" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <ShoppingBag className="w-32 h-32 mb-4 opacity-50" />
                  <p>No Image Available</p>
                </div>
              )}
              {product.category_name && (
                <span className="absolute top-6 left-6 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category_name}
                </span>
              )}
            </div>

            {/* Product Info (Right Side) */}
            <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-4 mb-2 text-indigo-600 font-medium">
                <span className="flex items-center gap-1.5"><Tag size={16} /> {product.brand_name || 'Generic Brand'}</span>
                {product.shop_name && (
                  <div className="flex items-center gap-1.5 border-l border-gray-300 pl-4">
                    <span className="text-gray-500 text-xs font-semibold">Sold by:</span>
                    <Link href={`/shops/${product.shop}`} className="hover:underline font-extrabold text-gray-800 text-xs">
                      {product.shop_name}
                    </Link>
                    {product.shop_verification_tier === 'business_verified' && (
                      <span title="Business Registered & Verified" className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                        <span>Business</span>
                      </span>
                    )}
                    {product.shop_verification_tier === 'personal_verified' && (
                      <span title="Identity Verified" className="flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-blue-200">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl font-black text-[#FF6A00]">NPR {Number(product.selling_price || product.price || 0).toLocaleString()}</span>
                {product.cost_price && product.cost_price > product.selling_price && (
                  <span className="text-lg text-gray-400 line-through">NPR {Number(product.cost_price).toLocaleString()}</span>
                )}
              </div>

              {/* Badges / Guarantees */}
              <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <ShieldCheck size={16} className="text-green-500" />
                  {product.warranty_type !== 'none' ? `${product.warranty_period} Warranty` : 'No Warranty'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Truck size={16} className="text-blue-500" />
                  Fast Local Delivery
                </div>
              </div>

              <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
                <h3 className="text-gray-900 font-semibold text-lg mb-2">Description</h3>
                <p className="whitespace-pre-line">{product.description || 'No description provided for this product.'}</p>
                
                {product.highlights && (
                  <>
                    <h3 className="text-gray-900 font-semibold text-lg mt-6 mb-2">Highlights</h3>
                    <p className="whitespace-pre-line">{product.highlights}</p>
                  </>
                )}
              </div>

              {/* Client Component for Actions */}
              <div className="mt-auto pt-4">
                <ProductActions product={product} />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <ReviewsSection type="product" id={product.id} />
        </div>

      </div>
    </div>
  );
}
