"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MessageSquare, Star, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

// Accepts both raw /api/products/ shape AND unified search shape
export interface Product {
  id: number;
  name: string;
  // Raw API fields
  selling_price?: string | number;
  images?: Array<{ image: string; is_main?: boolean }>;
  shop?: number | { id: number; name: string };
  category_name?: string | null;
  average_rating?: string | number;
  // Search/unified fields (already normalised by backend)
  price?: string | number;
  image?: string | null;
  shop_id?: number;
  shop_name?: string;
  category?: string | null;
  is_featured?: boolean;
  is_sponsored?: boolean;
  stock?: number;
  rating_count?: number;
}

function resolveFields(product: Product) {
  // Price
  const price = product.price ?? product.selling_price ?? 0;

  // Image: prefer normalised 'image', fallback to first images[] entry
  let image: string | null = product.image ?? null;
  if (!image && Array.isArray(product.images) && product.images.length > 0) {
    const main = product.images.find(i => i.is_main) || product.images[0];
    image = main?.image ?? null;
  }

  // Category label
  const category = product.category ?? product.category_name ?? null;

  // Shop id for chat link
  const shopId = product.shop_id ?? (typeof product.shop === 'number' ? product.shop : product.shop?.id) ?? 0;

  // Rating
  const rating = parseFloat(String(product.average_rating ?? 0));

  return { price, image, category, shopId, rating };
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const { price, image, category, shopId, rating } = resolveFields(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden"
    >
      {/* Image area */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.is_sponsored ? (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">SPONSORED</span>
        ) : product.is_featured ? (
          <span className="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">FEATURED</span>
        ) : null}

        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <ShoppingBag className="h-14 w-14" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-grow">
        {category && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">{category}</span>
        )}
        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition line-clamp-2 text-sm leading-snug">{product.name}</h3>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
            {product.rating_count != null && <span className="text-xs text-gray-400">({product.rating_count})</span>}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-1">
          <span className="font-bold text-base text-gray-900">
            NPR {Number(price).toLocaleString()}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); router.push(`/chat?shop=${shopId}`); }}
              className="bg-gray-50 text-gray-600 p-1.5 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition"
              title="Chat with Seller"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { 
                e.preventDefault(); 
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: Number(price),
                  image: image,
                  shopId: shopId
                });
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              className={`p-1.5 rounded-full transition ${
                added 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
              }`}
              title="Add to Cart"
            >
              {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
