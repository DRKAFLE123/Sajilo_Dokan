import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MixedFeed, { SearchResultItem } from "@/components/MixedFeed";
import SearchFilterBar from "@/components/SearchFilterBar";

interface Category { id: number; name: string; }

async function getUnifiedResults(params: { [key: string]: string | undefined }) {
  const p = new URLSearchParams();
  if (params.q)           p.set("q",           params.q);
  if (params.filter)      p.set("filter",       params.filter);
  if (params.category_id) p.set("category_id",  params.category_id);
  if (params.sort)        p.set("sort",          params.sort);
  if (params.min_price)   p.set("min_price",     params.min_price);
  if (params.max_price)   p.set("max_price",     params.max_price);
  if (params.lat)         p.set("lat",           params.lat);
  if (params.lng)         p.set("lng",           params.lng);
  if (params.radius)      p.set("radius",        params.radius);
  if (params.page)        p.set("page",          params.page);
  p.set("page_size", "24");

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/search/?${p.toString()}`, { cache: "no-store" });
    if (!res.ok) return { results: [], count: 0, page: 1, pages: 1, price_range: { min: 0, max: 0 } };
    return await res.json();
  } catch {
    return { results: [], count: 0, page: 1, pages: 1, price_range: { min: 0, max: 0 } };
  }
}

async function getCategories() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/product-categories/", { cache: "force-cache" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch { return []; }
}

async function getBazaars(params: { [key: string]: string | undefined }) {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/market-hubs/?${p.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch { return []; }
}

function CategorySidebar({ categories, activeId, q, filter, type, sort }: {
  categories: Category[]; activeId: string; q: string; filter: string; type: string; sort: string;
}) {
  const buildLink = (catId?: number) => {
    const p = new URLSearchParams();
    if (q)      p.set("q", q);
    if (filter) p.set("filter", filter);
    if (sort && sort !== "relevance") p.set("sort", sort);
    if (type && type !== "all")       p.set("type", type);
    if (catId)  p.set("category_id", String(catId));
    return `/search?${p.toString()}`;
  };

  return (
    <aside className="w-52 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-32">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</h3>
        </div>
        <ul className="py-1">
          <li>
            <Link href={buildLink()}
              className={`flex items-center px-4 py-2.5 text-sm transition hover:bg-indigo-50 hover:text-indigo-700 ${!activeId ? "bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600" : "text-gray-700"}`}>
              All Categories
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link href={buildLink(cat.id)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition hover:bg-indigo-50 hover:text-indigo-700 ${activeId === String(cat.id) ? "bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600" : "text-gray-700"}`}>
                <span>{cat.name}</span>
                {activeId === String(cat.id) && <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default async function SearchPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const [data, categories] = await Promise.all([
    getUnifiedResults(searchParams),
    getCategories(),
  ]);

  const q          = searchParams.q           || "";
  const filter     = searchParams.filter      || "";
  const categoryId = searchParams.category_id || "";
  const sort       = searchParams.sort        || "relevance";
  const type       = searchParams.type        || "all";
  const page       = parseInt(searchParams.page || "1", 10);
  const minPrice   = searchParams.min_price   || "";
  const maxPrice   = searchParams.max_price   || "";

  let allResults: SearchResultItem[] = data.results || [];
  let bazaars: any[] = [];

  if (type === "products") {
    allResults = allResults.filter(r => r.type === "product");
  } else if (type === "shops") {
    allResults = allResults.filter(r => r.type === "shop");
  } else if (type === "bazaars") {
    bazaars = await getBazaars(searchParams);
  }

  const count: number       = type === "bazaars" ? bazaars.length : (data.count  || 0);
  const pages: number       = data.pages  || 1;
  const priceRange          = data.price_range || { min: 0, max: 0 };
  const activeCategoryName  = categories.find((c: Category) => String(c.id) === categoryId)?.name;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Sticky filter bar ── */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchFilterBar
            q={q}
            filter={filter}
            categoryId={categoryId}
            minPrice={minPrice}
            maxPrice={maxPrice}
            resultType={type}
            sort={sort}
            categories={categories}
            detectedMin={priceRange.min}
            detectedMax={priceRange.max}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-4 flex-wrap gap-1">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/search" className="hover:text-indigo-600">Search</Link>
          {q && (<><ChevronRight className="h-4 w-4" /><span className="text-gray-900 font-medium">"{q}"</span></>)}
          {activeCategoryName && (<><ChevronRight className="h-4 w-4" /><span className="text-indigo-600 font-medium">{activeCategoryName}</span></>)}
          <span className="ml-auto text-gray-400 text-xs">{count} results</span>
        </div>

        <div className="flex gap-6">
          {/* Left sidebar */}
          <CategorySidebar categories={categories} activeId={categoryId} q={q} filter={filter} type={type} sort={sort} />

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 gap-6">
              <Link
                href={{ pathname: '/search', query: { ...searchParams, type: 'products' } }}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${type === 'products' || type === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Products
              </Link>
              <Link
                href={{ pathname: '/search', query: { ...searchParams, type: 'shops' } }}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${type === 'shops' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Storefronts & Shops
              </Link>
              <Link
                href={{ pathname: '/search', query: { ...searchParams, type: 'bazaars' } }}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${type === 'bazaars' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Virtual Bazaars & Streets
              </Link>
            </div>

            <Suspense fallback={<div className="bg-white rounded-2xl border p-12 text-center text-gray-400">Searching…</div>}>
              {type === 'bazaars' ? (
                bazaars.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-12 text-center text-gray-500 shadow-sm">
                    <p className="text-lg font-medium text-gray-700">No Bazaars found matching "{q}"</p>
                    <p className="text-gray-400 text-sm mt-1">Try checking another location or street.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bazaars.map((bazaar) => (
                      <div key={bazaar.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                        <div className="h-36 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 relative flex items-center justify-center text-white font-black text-xl">
                          {bazaar.banner ? (
                            <img src={bazaar.banner} className="w-full h-full object-cover opacity-60" alt={bazaar.name} />
                          ) : (
                            <span className="tracking-widest uppercase text-center px-4">{bazaar.name}</span>
                          )}
                          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold py-0.5 px-2.5 rounded-full">
                            Nepal Local Bazaar
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h4 className="font-bold text-gray-900 text-base">{bazaar.name}</h4>
                          <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                            <span className="bg-indigo-50 px-2.5 py-0.5 rounded-full">
                              {bazaar.city_name} {bazaar.street_name ? `> ${bazaar.street_name}` : ''}
                            </span>
                          </p>
                          <p className="text-gray-500 text-xs mt-3 line-clamp-2 flex-grow">
                            {bazaar.description || "Take a virtual street walk and order directly from local verified storefronts."}
                          </p>
                          <Link
                            href={`/bazaars/${bazaar.id}`}
                            className="mt-4 block text-center text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-sm hover:shadow"
                          >
                            Explore Bazaar Street
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <MixedFeed results={allResults} count={allResults.length} page={page} pages={pages} q={q} filter={filter} />
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
