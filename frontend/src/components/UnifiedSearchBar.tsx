"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Globe, Star, Truck, Loader2, X, ChevronDown } from "lucide-react";

type Chip = {
  key: string;
  label: string;
  icon: React.ReactNode;
  filter: string;
  needsLocation?: boolean;
};

const CHIPS: Chip[] = [
  { key: "near_me",   label: "Near Me",   icon: <MapPin  className="h-3.5 w-3.5" />, filter: "near_me",   needsLocation: true },
  { key: "online",    label: "Online",    icon: <Globe   className="h-3.5 w-3.5" />, filter: "online" },
  { key: "top_rated", label: "Top Rated", icon: <Star    className="h-3.5 w-3.5" />, filter: "top_rated" },
  { key: "delivery",  label: "Delivery",  icon: <Truck   className="h-3.5 w-3.5" />, filter: "delivery" },
];

interface Category { id: number; name: string; }

interface Props {
  initialQuery?: string;
  initialFilter?: string;
}

export default function UnifiedSearchBar({ initialQuery = "", initialFilter = "" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [locLoading, setLocLoading] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/product-categories/")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.results || []))
      .catch(() => {});
  }, []);

  const buildSearch = useCallback(
    (query: string, filter: string, cat?: string, lat?: number | null, lng?: number | null) => {
      const p = new URLSearchParams();
      if (query.trim())  p.set("q", query.trim());
      if (filter)        p.set("filter", filter);
      if (cat)           p.set("category_id", cat);
      if (lat != null)   p.set("lat", String(lat));
      if (lng != null)   p.set("lng", String(lng));
      router.push(`/search?${p.toString()}`);
    },
    [router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buildSearch(q, activeFilter, selectedCategory, userLat, userLng);
  };

  const toggleChip = async (chip: Chip) => {
    const next = activeFilter === chip.filter ? "" : chip.filter;
    if (next === "near_me" && chip.needsLocation && userLat == null) {
      setLocLoading(true);
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocLoading(false); resolve(); },
          () => { setLocLoading(false); resolve(); }
        );
      });
    }
    setActiveFilter(next);
    buildSearch(q, next, selectedCategory, userLat, userLng);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* ── Search bar with category dropdown ── */}
      <form onSubmit={handleSubmit} className="flex w-full rounded-2xl overflow-hidden shadow-lg border-2 border-indigo-500 bg-white">

        {/* Category selector */}
        <div className="relative flex-shrink-0 border-r border-gray-200">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-12 pl-3 pr-8 text-sm font-medium text-gray-700 bg-gray-50 focus:outline-none appearance-none cursor-pointer hover:bg-gray-100 transition"
            style={{ minWidth: "140px" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Text input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products or shops..."
            className="w-full h-12 pl-11 pr-10 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none"
          />
          {q && (
            <button type="button" onClick={() => { setQ(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition flex items-center gap-2 flex-shrink-0"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </form>

      {/* ── Smart chips ── */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const isActive = activeFilter === chip.filter;
          const isLoading = chip.filter === "near_me" && locLoading;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => toggleChip(chip)}
              disabled={isLoading}
              className={`
                inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-medium
                transition-all duration-200 select-none
                ${isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white/80 text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                }
                disabled:opacity-60 disabled:cursor-wait
              `}
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : chip.icon}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
