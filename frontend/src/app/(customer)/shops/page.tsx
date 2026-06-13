import React from 'react';
import Link from 'next/link';
import { Store, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ShopCard, { Shop } from '@/components/ShopCard';

async function getShops(): Promise<Shop[]> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/shops/', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch {
    return [];
  }
}

async function getProducts() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/products/', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch {
    return [];
  }
}

export default async function ShopsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const view = typeof searchParams.view === 'string' ? searchParams.view : 'shops';

  const shops    = view === 'shops'    ? await getShops()    : [];
  const products = view === 'products' ? await getProducts() : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Explore the Marketplace</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Discover amazing local businesses and their products.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-200 rounded-xl p-1 gap-1">
            <Link
              href="/shops?view=shops"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                view === 'shops' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="w-4 h-4" /> Shops
            </Link>
            <Link
              href="/shops?view=products"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                view === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4" /> Products
            </Link>
          </div>
        </div>

        {/* Content */}
        {view === 'products' ? (
          products.length === 0 ? (
            <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-gray-100">
              <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Check back later for new items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        ) : (
          shops.length === 0 ? (
            <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-gray-100">
              <Store className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops yet</h3>
              <p className="text-gray-500">Check back soon as new shops join the marketplace.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shops.map((shop: Shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
