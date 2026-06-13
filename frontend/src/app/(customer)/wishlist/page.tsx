"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/apiClient';
import ProductCard from '@/components/ProductCard';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await api.get('/wishlist/');
        setWishlistItems(res.data.results || res.data || []);
      } catch (err) {
        console.error('Error fetching wishlist', err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || loadingItems) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500 text-sm">Products you saved to buy later</p>
          </div>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {wishlistItems.map((item) => (
              <ProductCard key={item.id} product={item.product_details} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <ShoppingBag size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Your wishlist is empty</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Explore our local stores and save items you love here to easily find them later.
              </p>
            </div>
            <Link 
              href="/search"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl transition shadow-lg shadow-indigo-600/10"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
