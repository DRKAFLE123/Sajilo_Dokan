"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBag, Store, Star, MapPin, Globe, Zap,
  Award, ChevronLeft, ChevronRight
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SearchResultItem {
  type: "product" | "shop";
  id: number;
  name: string;
  description: string;
  image: string | null;
  average_rating: string;
  rating_count: number;
  distance_km: number | null;
  is_featured: boolean;
  is_sponsored: boolean;
  _score: number;
  // product fields
  price?: string;
  shop_id?: number;
  shop_name?: string;
  category?: string | null;
  brand?: string | null;
  stock?: number;
  // shop fields
  shop_type?: string;
  business_type?: string;
  address?: string;
  is_verified?: boolean;
}

interface MixedFeedProps {
  results: SearchResultItem[];
  count: number;
  page: number;
  pages: number;
  q?: string;
  filter?: string;
}

// ─── Star rating display ───────────────────────────────────────────────────────
function StarBadge({ avg, count }: { avg: string; count: number }) {
  const rating = parseFloat(avg) || 0;
  if (rating === 0 && count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
      {count > 0 && <span className="text-gray-400 font-normal">({count})</span>}
    </span>
  );
}

// ─── Distance badge ───────────────────────────────────────────────────────────
function DistanceBadge({ km }: { km: number | null }) {
  if (km == null) return null;
  const label = km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
      <MapPin className="h-3 w-3" />
      {label}
    </span>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductResultCard({ item }: { item: SearchResultItem }) {
  return (
    <Link
      href={`/products/${item.id}`}
      className="group flex gap-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md shadow-sm transition-all duration-200 p-4 relative overflow-hidden"
    >
      {/* badge row */}
      {item.is_sponsored && (
        <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
          AD
        </span>
      )}
      {!item.is_sponsored && item.is_featured && (
        <span className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Featured
        </span>
      )}

      {/* thumbnail */}
      <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-100 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* info */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {item.category && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{item.category}</span>
          )}
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition line-clamp-1 mt-0.5">{item.name}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="font-bold text-indigo-700">NPR {parseFloat(item.price || "0").toLocaleString()}</span>
          <StarBadge avg={item.average_rating} count={item.rating_count} />
          <DistanceBadge km={item.distance_km} />
          {item.brand && <span className="text-xs text-gray-400">{item.brand}</span>}
          {item.shop_name && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Store className="h-3 w-3" /> {item.shop_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Shop card ─────────────────────────────────────────────────────────────────
function ShopResultCard({ item }: { item: SearchResultItem }) {
  return (
    <Link
      href={`/shops/${item.id}`}
      className="group flex gap-4 bg-gradient-to-r from-indigo-50/60 to-white rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md shadow-sm transition-all duration-200 p-4 relative overflow-hidden"
    >
      {item.is_sponsored && (
        <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
          AD
        </span>
      )}

      {/* logo */}
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-100 overflow-hidden flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Store className="h-8 w-8 text-indigo-400" />
        )}
      </div>

      {/* info */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{item.name}</h3>
            {item.is_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                <Award className="h-3 w-3" /> Verified
              </span>
            )}
            {item.shop_type === "online" ? (
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" /> Physical
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 capitalize">{item.business_type?.replace("_", " ")}</p>
          {item.description && (
            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StarBadge avg={item.average_rating} count={item.rating_count} />
          <DistanceBadge km={item.distance_km} />
          {item.address && (
            <span className="text-xs text-gray-400 line-clamp-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.address}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Score debug pill (dev only) ─────────────────────────────────────────────
function ScorePill({ score }: { score: number }) {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <span className="absolute bottom-2 left-3 text-[9px] text-gray-300 font-mono">
      ⚡{score.toFixed(3)}
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, q, filter }: { page: number; pages: number; q?: string; filter?: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {page > 1 && (
        <Link href={href(page - 1)} className="p-2 rounded-full border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 transition">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <span className="text-sm text-gray-500 px-2">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className="p-2 rounded-full border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 transition">
          <ChevronRight className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}

// ─── Main MixedFeed ───────────────────────────────────────────────────────────
export default function MixedFeed({ results, count, page, pages, q, filter }: MixedFeedProps) {
  const productCount = results.filter((r) => r.type === "product").length;
  const shopCount    = results.filter((r) => r.type === "shop").length;

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500 text-sm">
          Try a different search term or remove filters.
        </p>
        <Link href="/search" className="mt-4 inline-block text-indigo-600 font-medium hover:underline text-sm">
          Clear all filters
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* result meta */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-sm font-semibold text-gray-700">
          {count} result{count !== 1 ? "s" : ""}
        </h2>
        {productCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
            <ShoppingBag className="h-3 w-3" /> {productCount} products
          </span>
        )}
        {shopCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full">
            <Store className="h-3 w-3" /> {shopCount} shops
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <Zap className="h-3 w-3 text-indigo-400" /> ranked by relevance + distance + rating
        </span>
      </div>

      {/* cards */}
      <div className="flex flex-col gap-3">
        {results.map((item) =>
          item.type === "product" ? (
            <div key={`product-${item.id}`} className="relative">
              <ProductResultCard item={item} />
              <ScorePill score={item._score} />
            </div>
          ) : (
            <div key={`shop-${item.id}`} className="relative">
              <ShopResultCard item={item} />
              <ScorePill score={item._score} />
            </div>
          )
        )}
      </div>

      <Pagination page={page} pages={pages} q={q} filter={filter} />
    </div>
  );
}
