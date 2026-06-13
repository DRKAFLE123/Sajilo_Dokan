"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Globe, Star, Truck, Loader2, X,
  ChevronDown, ShoppingBag, Store, ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";

interface Category { id: number; name: string; }

interface Props {
  q: string;
  filter: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  resultType: string;
  sort: string;
  categories: Category[];
  detectedMin: number;
  detectedMax: number;
}

const FILTER_CHIPS = [
  { key: "near_me",   label: "Near Me",   icon: <MapPin  className="h-3.5 w-3.5" />, needsLocation: true },
  { key: "online",    label: "Online",    icon: <Globe   className="h-3.5 w-3.5" /> },
  { key: "top_rated", label: "Top Rated", icon: <Star    className="h-3.5 w-3.5" /> },
  { key: "delivery",  label: "Delivery",  icon: <Truck   className="h-3.5 w-3.5" /> },
];

const SORT_OPTIONS = [
  { key: "relevance",  label: "Relevance" },
  { key: "price_asc",  label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "rating",     label: "Top Rated" },
  { key: "newest",     label: "Newest First" },
];

const TYPE_TABS = [
  { key: "all",      label: "All",      icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
  { key: "products", label: "Products", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { key: "shops",    label: "Shops",    icon: <Store className="h-3.5 w-3.5" /> },
];

export default function SearchFilterBar({
  q, filter, categoryId, minPrice, maxPrice,
  resultType, sort, categories, detectedMin, detectedMax,
}: Props) {
  const router = useRouter();
  const [locLoading, setLocLoading] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  // Price state
  const [showPrice, setShowPrice] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const priceRef = useRef<HTMLDivElement>(null);

  // Close price popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) setShowPrice(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildUrl = useCallback((overrides: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (q)          p.set("q",           q);
    if (filter)     p.set("filter",      filter);
    if (categoryId) p.set("category_id", categoryId);
    if (minPrice)   p.set("min_price",   minPrice);
    if (maxPrice)   p.set("max_price",   maxPrice);
    if (sort && sort !== "relevance") p.set("sort", sort);
    if (resultType && resultType !== "all") p.set("type", resultType);
    if (userLat != null) p.set("lat", String(userLat));
    if (userLng != null) p.set("lng", String(userLng));

    Object.entries(overrides).forEach(([k, v]) => {
      if (v == null || v === "" || v === "all" || v === "relevance") p.delete(k);
      else p.set(k, v);
    });
    return `/search?${p.toString()}`;
  }, [q, filter, categoryId, minPrice, maxPrice, sort, resultType, userLat, userLng]);

  const navigate = (overrides: Record<string, string | null>) => router.push(buildUrl(overrides));

  const toggleFilter = async (key: string, needsLocation?: boolean) => {
    const next = filter === key ? "" : key;
    if (next === "near_me" && needsLocation && userLat == null) {
      setLocLoading(true);
      await new Promise<void>((resolve) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocLoading(false); resolve(); },
          () => { setLocLoading(false); resolve(); }
        )
      );
    }
    navigate({ filter: next || null, page: "1" });
  };

  const applyPrice = () => {
    navigate({ min_price: localMin || null, max_price: localMax || null, page: "1" });
    setShowPrice(false);
  };

  const clearPrice = () => {
    setLocalMin(""); setLocalMax("");
    navigate({ min_price: null, max_price: null });
    setShowPrice(false);
  };

  const hasActiveFilters = filter || categoryId || minPrice || maxPrice || (resultType && resultType !== "all") || (sort && sort !== "relevance");
  const hasPriceFilter   = !!(minPrice || maxPrice);
  const priceLabel       = hasPriceFilter ? `NPR ${minPrice || detectedMin.toLocaleString()} – ${maxPrice || detectedMax.toLocaleString()}` : "Price";

  return (
    <div className="py-2.5 flex flex-col gap-0">
      <div className="flex items-center gap-2 flex-wrap">

        {/* ── Type toggle ── */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
          {TYPE_TABS.map((t) => (
            <button key={t.key}
              onClick={() => navigate({ type: t.key === "all" ? null : t.key, page: "1" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${(resultType || "all") === t.key ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-indigo-600 hover:bg-white"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* ── Smart chips ── */}
        {FILTER_CHIPS.map((chip) => {
          const isActive  = filter === chip.key;
          const isLoading = chip.key === "near_me" && locLoading;
          return (
            <button key={chip.key}
              onClick={() => toggleFilter(chip.key, chip.needsLocation)}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition disabled:opacity-60 ${isActive ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"}`}>
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : chip.icon}
              {chip.label}
            </button>
          );
        })}

        <div className="h-6 w-px bg-gray-200" />

        {/* ── Price range ── */}
        <div className="relative" ref={priceRef}>
          <button
            onClick={() => setShowPrice(!showPrice)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${hasPriceFilter ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {priceLabel}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {showPrice && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
              {/* Detected range hint */}
              {detectedMax > 0 && (
                <p className="text-[11px] text-gray-400 mb-3">
                  Results range: <span className="font-semibold text-gray-600">NPR {detectedMin.toLocaleString()} – {detectedMax.toLocaleString()}</span>
                </p>
              )}

              {/* Quick preset buttons */}
              {detectedMax > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { label: "Under 1K",   min: "",       max: "1000" },
                    { label: "1K – 5K",    min: "1000",   max: "5000" },
                    { label: "5K – 20K",   min: "5000",   max: "20000" },
                    { label: "Above 20K",  min: "20000",  max: "" },
                  ].map((preset) => (
                    <button key={preset.label}
                      onClick={() => { setLocalMin(preset.min); setLocalMax(preset.max); }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${localMin === preset.min && localMax === preset.max ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"}`}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Range (NPR)</p>
              <div className="flex items-center gap-2 mb-3">
                <input type="number" placeholder={String(detectedMin || "Min")} value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                <span className="text-gray-400 flex-shrink-0">–</span>
                <input type="number" placeholder={String(detectedMax || "Max")} value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={applyPrice} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">Apply</button>
                <button onClick={clearPrice} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sort dropdown ── */}
        <div className="relative ml-auto">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <select
              value={sort || "relevance"}
              onChange={(e) => navigate({ sort: e.target.value, page: "1" })}
              className="appearance-none pl-1 pr-6 py-1.5 text-sm font-medium text-gray-700 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-indigo-600 transition"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Clear all ── */}
        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <button onClick={() => router.push(q ? `/search?q=${q}` : "/search")}
              className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium transition">
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
