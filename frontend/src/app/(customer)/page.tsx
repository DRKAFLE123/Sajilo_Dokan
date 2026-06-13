import Link from 'next/link';
import ShopCard, { Shop } from '@/components/ShopCard';
import ProductCard, { Product } from '@/components/ProductCard';
import FeaturedScroller from '@/components/FeaturedScroller';
import { MapPin, Zap, ShieldCheck, Star, Package } from 'lucide-react';

async function getFeaturedShops() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/shops/?is_featured=true', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch { return []; }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/products/?is_featured=true', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch { return []; }
}

async function getSponsoredProducts() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/products/?is_sponsored=true', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch { return []; }
}

const QUICK_LINKS = [
  { label: '📱 Electronics', q: 'electronics' },
  { label: '👗 Fashion', q: 'fashion' },
  { label: '🛒 Grocery', q: 'grocery' },
  { label: '🏠 Home', q: 'home' },
  { label: '💄 Beauty', q: 'beauty' },
  { label: '🏥 Health', q: 'health' },
  { label: '⚽ Sports', q: 'sports' },
  { label: '🍕 Food', q: 'food' },
];

export default async function Home() {
  const featuredShops: Shop[] = await getFeaturedShops();
  const featuredProducts: Product[] = await getFeaturedProducts();
  const sponsoredProducts: Product[] = await getSponsoredProducts();

  const scrollerItems = [
    ...featuredShops.map(s => ({ id: s.id, name: s.name, image: s.logo, type: 'shop' as const, link: `/shops/${s.id}` })),
    ...featuredProducts.map(p => ({ id: p.id, name: p.name, image: p.images?.[0]?.image, type: 'product' as const, link: `/products/${p.id}` }))
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500 border border-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="h-4 w-4" /> Nepal's #1 Local Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
            Discover Local Shops.<br />
            <span className="text-indigo-200">Shop Anywhere in Nepal.</span>
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-10">
            Use the search bar above to find products and shops near you — ranked by relevance, distance & ratings.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shops" className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg">
              Explore Shops
            </Link>
            <Link href="/register" className="bg-indigo-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-indigo-400 transition border border-indigo-400">
              Open a Shop
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.q}
                href={`/search?q=${l.q}`}
                className="text-sm bg-indigo-500 hover:bg-indigo-400 border border-indigo-400 px-4 py-1.5 rounded-full font-medium transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Scroller ──────────────────────────────────────── */}
      <FeaturedScroller items={scrollerItems} />

      {/* ── Trust bar ────────────────────────────────────────────── */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> KYC Verified Shops</span>
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-500" /> Location-Based Search</span>
          <span className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> AI-Ranked Results</span>
          <span className="flex items-center gap-2"><Package className="h-4 w-4 text-indigo-400" /> Thousands of Products</span>
        </div>
      </section>

      {/* ── Featured Shops ───────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Local Shops</h2>
            <p className="text-gray-500 mt-2">Discover top-rated stores right in your neighborhood.</p>
          </div>
          <Link href="/shops" className="text-indigo-600 font-medium hover:underline text-sm">View all →</Link>
        </div>
        {featuredShops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredShops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No shops yet</h3>
            <p className="text-gray-500 mt-1">Check back soon for new local businesses.</p>
          </div>
        )}
      </section>

      {/* ── Sponsored Products ───────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-gray-900">Sponsored Products</h2>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">Ad</span>
              </div>
              <p className="text-gray-500 mt-2">Top products featured by our partners.</p>
            </div>
            <Link href="/search" className="text-indigo-600 font-medium hover:underline text-sm">Browse all →</Link>
          </div>
          {sponsoredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sponsoredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
              <p className="text-gray-500 mt-1">Shops are still setting up their inventory.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Seller CTA ───────────────────────────────────────────── */}
      <section className="bg-indigo-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Sell Locally?</h2>
          <p className="text-indigo-100 mb-8">Join thousands of shopkeepers already growing on Sajilo Dokan.</p>
          <Link href="/register" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg">
            Open a Free Shop Today
          </Link>
        </div>
      </section>
    </div>
  );
}
