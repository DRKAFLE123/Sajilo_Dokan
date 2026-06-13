"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, MessageSquare, Star, ShieldCheck } from 'lucide-react';

export interface Shop {
  id: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  address?: string | null;
  is_featured?: boolean;
  is_sponsored?: boolean;
  is_verified?: boolean;
  verification_tier?: 'unverified' | 'personal_verified' | 'business_verified';
  average_rating?: string | number;
  rating_count?: number;
  distance_km?: number | null;
  promotion_label?: string;
}

const API_BASE = 'http://127.0.0.1:8000';

function resolveLogoUrl(shop: Shop): string | null {
  const raw = shop.logo_url || shop.logo;
  if (!raw) return null;
  // If already absolute URL return as-is
  if (raw.startsWith('http')) return raw;
  // Relative path — prepend backend base
  return `${API_BASE}${raw}`;
}

const getPromotionBadge = (label: string) => {
  switch (label.toLowerCase()) {
    case 'sale': return 'bg-rose-500 text-white shadow-rose-100';
    case 'offer': return 'bg-amber-500 text-white shadow-amber-100';
    case 'new': return 'bg-emerald-500 text-white shadow-emerald-100';
    case 'hot': return 'bg-orange-600 text-white shadow-orange-100';
    case 'featured': return 'bg-indigo-600 text-white shadow-indigo-100';
    default: return 'bg-gray-900 text-white shadow-gray-200';
  }
};

const getPromotionText = (label: string) => {
  switch (label.toLowerCase()) {
    case 'sale': return 'SALE';
    case 'offer': return 'OFFER';
    case 'new': return 'NEW';
    case 'hot': return 'HOT DEAL';
    case 'featured': return 'FEATURED';
    default: return label.toUpperCase();
  }
};

const renderVerificationBadge = (tier?: string) => {
  if (tier === 'business_verified') {
    return (
      <span title="Business Registered & Verified (PAN/VAT Approved)" className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
        <ShieldCheck className="h-3 w-3 text-emerald-500 fill-emerald-500/10" />
        <span>Business</span>
      </span>
    );
  }
  if (tier === 'personal_verified') {
    return (
      <span title="Identity Verified (Citizenship/ID Card Checked)" className="flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
        <ShieldCheck className="h-3 w-3 text-blue-500 fill-blue-500/10" />
        <span>Verified</span>
      </span>
    );
  }
  return null;
};

export default function ShopCard({ shop }: { shop: Shop }) {
  const router = useRouter();
  const logoUrl = resolveLogoUrl(shop);
  const rating  = parseFloat(String(shop.average_rating ?? 0));

  return (
    <Link
      href={`/shops/${shop.id}`}
      className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden relative"
    >
      {/* Banner / header gradient */}
      <div className="h-28 bg-indigo-50 relative overflow-hidden">
        {shop.banner_url ? (
          <img src={shop.banner_url} alt={shop.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-80" />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {shop.promotion_label && (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-lg transform -rotate-1 ${getPromotionBadge(shop.promotion_label)}`}>
              {getPromotionText(shop.promotion_label)}
            </span>
          )}
          {shop.is_sponsored && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded shadow-sm w-fit tracking-tighter">SPONSORED</span>
          )}
        </div>

        {shop.is_featured && !shop.promotion_label && (
          <span className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">FEATURED</span>
        )}

        {/* Logo circle overlapping banner */}
        <div className="absolute -bottom-6 left-5 h-14 w-14 bg-white rounded-full border-2 border-white shadow overflow-hidden flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={shop.name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-9 px-4 pb-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-1 text-sm flex-1">{shop.name}</h3>
          {renderVerificationBadge(shop.verification_tier || (shop.is_verified ? 'personal_verified' : undefined))}
        </div>

        {shop.address && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{shop.address}</span>
          </p>
        )}

        {/* Rating & distance */}
        <div className="flex items-center gap-3 mt-1.5">
          {rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              {rating.toFixed(1)}
              {shop.rating_count ? <span className="text-gray-400">({shop.rating_count})</span> : null}
            </span>
          )}
          {shop.distance_km != null && (
            <span className="text-xs text-indigo-500 font-medium">{shop.distance_km.toFixed(1)} km</span>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2 line-clamp-2 flex-grow">
          {shop.description || 'Welcome to our shop!'}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="flex-1 text-center text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold py-2 rounded-lg transition">
            Visit Store
          </span>
          <button
            onClick={(e) => { e.preventDefault(); router.push(`/chat?shop=${shop.id}`); }}
            className="bg-gray-50 text-gray-500 p-2 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition"
            title="Chat"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
