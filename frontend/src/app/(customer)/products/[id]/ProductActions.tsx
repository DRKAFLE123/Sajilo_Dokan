"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, MessageSquare, Check, ChevronRight, Heart, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/apiClient';

export default function ProductActions({ product }: { product: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { addToCart, buyNow } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(product.is_wishlisted || false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAction = (actionType: 'add_to_cart' | 'buy_now' | 'chat') => {
    if (isLoading) return;
    
    const itemData = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.selling_price || product.price || 0),
      image: product.images?.[0]?.image || product.image || null,
      shopId: typeof product.shop === 'number' ? product.shop : product.shop?.id || 0,
      min_order_quantity: product.min_order_quantity,
      wholesale_price: product.wholesale_price ? parseFloat(product.wholesale_price) : undefined
    };

    if (actionType === 'add_to_cart') {
      addToCart(itemData);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else if (actionType === 'buy_now') {
      buyNow(itemData);
      router.push('/checkout');
    } else if (actionType === 'chat') {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/products/${product.id}`);
        return;
      }
      const shopId = typeof product.shop === 'number' ? product.shop : product.shop?.id || 0;
      router.push(`/chat?shop=${shopId}`);
    }
  };

  const handleToggleWishlist = async () => {
    if (isLoading || wishlistLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${product.id}`);
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await api.post('/wishlist/', { product: product.id });
      setWishlisted(res.data.wishlisted);
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      alert('Error updating wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-8">
      {product.min_order_quantity > 1 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 mb-2 shadow-sm animate-pulse">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
          <span>Wholesale MOQ Requirement: You must order at least {product.min_order_quantity} units of this item.</span>
        </div>
      )}
      <div className="flex gap-3">
        <button 
          onClick={() => handleAction('add_to_cart')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition shadow-lg ${
            added 
            ? 'bg-green-500 text-white shadow-green-500/20' 
            : 'bg-white border-2 border-gray-100 text-gray-900 hover:bg-gray-50'
          }`}
        >
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {added ? 'Added!' : 'Add to Cart'}
        </button>
        <button 
          onClick={() => handleAction('chat')}
          className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition flex items-center justify-center gap-2"
        >
          <MessageSquare size={18} /> Chat Seller
        </button>
        <button 
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`px-5 py-4 rounded-2xl border-2 transition flex items-center justify-center ${
            wishlisted 
            ? 'bg-red-50 border-red-500 text-red-500 hover:bg-red-100' 
            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Wishlist"
        >
          <Heart size={18} className={wishlisted ? 'fill-current' : ''} />
        </button>
      </div>
      
      <button 
        onClick={() => handleAction('buy_now')}
        className="w-full bg-[#FF6A00] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#e55f00] shadow-xl shadow-orange-500/20 transition transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
      >
        Buy Now <ChevronRight size={24} />
      </button>
    </div>
  );
}
