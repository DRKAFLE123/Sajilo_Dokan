import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Store, MessageSquare, Star, ShieldCheck, Compass, Sparkles } from "lucide-react";
import ShopCard, { Shop } from "@/components/ShopCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

async function fetchFromApi(endpoint: string, fallback: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) return fallback;
    return await res.json();
  } catch (err) {
    console.warn(`Fetch to ${endpoint} timed out or failed:`, err);
    return fallback;
  }
}

async function getBazaarDetails(id: string) {
  return fetchFromApi(`/market-hubs/${id}/`, null);
}

async function getBazaarShops(id: string) {
  const res = await fetchFromApi(`/shops/?market_hub=${id}`, []);
  return Array.isArray(res) ? res : (res.results || []);
}

export default async function BazaarStreetPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;

  const [bazaar, shops] = await Promise.all([
    getBazaarDetails(id),
    getBazaarShops(id),
  ]);

  if (!bazaar) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm max-w-md text-center">
          <Compass className="h-16 w-16 text-indigo-400 mx-auto animate-spin-slow mb-4" />
          <h2 className="text-xl font-bold text-gray-950">Bazaar Not Found</h2>
          <p className="text-gray-500 text-sm mt-2">
            The virtual bazaar you are looking for does not exist or has been relocated.
          </p>
          <Link
            href="/search?type=bazaars"
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bazaars List
          </Link>
        </div>
      </div>
    );
  }

  const renderVerificationIcon = (tier?: string) => {
    if (tier === 'business_verified') {
      return <span title="Business Verified"><ShieldCheck className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /></span>;
    }
    if (tier === 'personal_verified') {
      return <span title="Identity Verified"><ShieldCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" /></span>;
    }
    return null;
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 overflow-x-hidden relative flex flex-col">
      {/* Dynamic starry sky gradient header */}
      <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-b border-indigo-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 z-10 relative">
          <Link
            href="/search?type=bazaars"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold mb-4 bg-slate-900/60 border border-indigo-900/50 py-1.5 px-4 rounded-xl transition backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Bazaar
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Virtual Bazaars Street Walk
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
                {bazaar.name}
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <span>{bazaar.city_name} {bazaar.street_name ? `• ${bazaar.street_name}` : ""}</span>
              </p>
              <p className="text-slate-400 text-sm mt-3 max-w-3xl leading-relaxed">
                {bazaar.description || "Welcome to our virtual bazaar! Stroll down the street, explore verified local storefronts, view products, and order direct."}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-indigo-900/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-md max-w-xs md:self-end">
              <span className="text-3xl font-black text-white">{shops.length}</span>
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mt-1">Verified Shops</span>
            </div>
          </div>
        </div>

        {/* Custom ambient clouds and stars */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Interactive horizontal scrolling street walk (The core immersive feature) */}
      <div className="flex-grow flex flex-col justify-center py-12 relative bg-slate-950">
        <div className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

        {shops.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-8 backdrop-blur z-10">
            <Store className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Bazaar is Quiet Today</h3>
            <p className="text-slate-400 text-xs mt-2">
              There are no stores registered on this street yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="max-w-7xl mx-auto px-4 mb-4 text-slate-400 text-xs flex justify-between items-center">
              <span className="font-semibold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                Scroll right to walk down the street
              </span>
              <span>Total Storefronts: {shops.length}</span>
            </div>

            {/* Horizontal street scroller */}
            <div className="flex gap-8 overflow-x-auto px-8 py-6 pb-12 scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-transparent">
              {shops.map((shop: Shop, idx: number) => {
                const rating = parseFloat(String(shop.average_rating ?? 0));
                return (
                  <div
                    key={shop.id}
                    className="w-[300px] flex-shrink-0 group relative transition-all duration-300 transform hover:-translate-y-3 hover:scale-[1.02]"
                  >
                    {/* Street lamp light effect overlay on active hover */}
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-48 h-32 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

                    {/* Immersive Storefront Layout */}
                    <div className="bg-slate-900/90 border border-indigo-900/50 rounded-3xl p-5 shadow-2xl flex flex-col justify-between h-[400px] backdrop-blur-md relative overflow-hidden group-hover:border-indigo-500/60">
                      {/* Decorative roof awning */}
                      <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-indigo-700 to-indigo-900 flex justify-between px-2 overflow-hidden border-b border-indigo-950">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="w-5 h-5 bg-indigo-950 rounded-full -mt-2.5 border-2 border-indigo-800" />
                        ))}
                      </div>

                      {/* Store sign header */}
                      <div className="mt-4 bg-slate-950 border border-indigo-900/60 rounded-xl py-2 px-3 text-center shadow-inner relative z-10 flex flex-col items-center">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Door No. {idx + 1}</span>
                        <h3 className="font-extrabold text-white group-hover:text-indigo-400 transition text-sm tracking-tight line-clamp-1">
                          {shop.name}
                        </h3>
                      </div>

                      {/* Storefront window / display */}
                      <div className="my-4 h-32 bg-slate-950/80 border border-indigo-900/40 rounded-2xl p-4 flex items-center justify-center shadow-inner relative group-hover:border-indigo-500/30 transition">
                        {shop.logo_url || shop.logo ? (
                          <img
                            src={shop.logo_url || shop.logo || ""}
                            alt={shop.name}
                            className="h-16 w-16 object-cover rounded-full border-2 border-indigo-900/60 group-hover:border-indigo-400 transition"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-900 font-black text-2xl group-hover:text-indigo-300">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Badges in window */}
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                          {renderVerificationIcon(shop.verification_tier || (shop.is_verified ? 'personal_verified' : undefined))}
                        </div>
                      </div>

                      {/* Door info */}
                      <div className="flex-grow flex flex-col justify-end">
                        <div className="flex items-center gap-3 text-xs mb-2">
                          {rating > 0 && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                              {rating.toFixed(1)}
                            </span>
                          )}
                          <span className="text-slate-400 truncate flex-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                            <span className="truncate">{shop.address || "Inside Bazaar"}</span>
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                          {shop.description || "Welcome to our virtual store! Walk inside to view our full collection."}
                        </p>
                      </div>

                      {/* Store doorway (Enter action) */}
                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          href={`/shops/${shop.id}`}
                          className="flex-1 text-center text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition shadow-md group-hover:shadow-indigo-500/10 flex items-center justify-center gap-1"
                        >
                          <Store className="h-3.5 w-3.5" />
                          Enter Shop
                        </Link>
                        <Link
                          href={`/chat?shop=${shop.id}`}
                          className="bg-slate-950 hover:bg-indigo-950 border border-indigo-900/50 hover:border-indigo-500/50 text-indigo-400 hover:text-white p-2.5 rounded-xl transition"
                          title="Chat with Store Manager"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Classic Grid view option below */}
      <div className="bg-slate-900/40 border-t border-indigo-900/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-400" />
              All Verified Storefronts list
            </h2>
            <span className="text-xs text-slate-400 font-medium">Bazaar grid view</span>
          </div>

          {shops.length === 0 ? (
            <p className="text-slate-400 text-sm">No storefronts available in list view.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shops.map((shop: Shop) => (
                <div key={shop.id} className="bg-slate-950 p-1.5 rounded-3xl border border-indigo-900/40 hover:border-indigo-500/30 transition">
                  <ShopCard shop={shop} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
