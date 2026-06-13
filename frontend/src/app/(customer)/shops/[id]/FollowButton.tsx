"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/apiClient';
import { Heart } from 'lucide-react';

export default function FollowButton({ shopId, initialFollowing }: { shopId: number; initialFollowing: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggleFollow = async () => {
    if (isLoading || loading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/shops/${shopId}`);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/shop-follows/', { shop: shopId });
      setFollowing(res.data.following);
    } catch (err) {
      console.error('Failed to toggle follow', err);
      alert('Error updating follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition shadow-sm ${
        following
        ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
        : 'bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      <Heart className={`h-4 w-4 ${following ? 'fill-current' : ''}`} />
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
