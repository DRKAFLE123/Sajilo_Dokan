"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Star, Trash2, Calendar, MessageSquare, Check, LogIn } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  user: number;
  username: string;
  created_at: string;
}

interface ReviewsSectionProps {
  type: 'product' | 'shop';
  id: number | string;
}

export default function ReviewsSection({ type, id }: ReviewsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [type, id]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'product' ? '/product-reviews/' : '/shop-reviews/';
      const paramName = type === 'product' ? 'product_id' : 'shop_id';
      const res = await api.get(`${endpoint}?${paramName}=${id}`);
      
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      // Sort newest reviews first
      list.sort((a: Review, b: Review) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviews(list);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isAuthenticated) {
      setError('You must be logged in to submit a review.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = type === 'product' ? '/product-reviews/' : '/shop-reviews/';
      const payload: Record<string, any> = {
        rating,
        comment
      };
      if (type === 'product') {
        payload.product = id;
      } else {
        payload.shop = id;
      }

      await api.post(endpoint, payload);
      setSuccess('Thank you! Your review has been submitted.');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'You have already reviewed this item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    try {
      const endpoint = type === 'product' ? `/product-reviews/${reviewId}/` : `/shop-reviews/${reviewId}/`;
      await api.delete(endpoint);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review', err);
      alert('Failed to delete review.');
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header and Summary stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            Reviews & Ratings
          </h2>
          <p className="text-gray-500 text-xs mt-1">See what others say, or submit your own review.</p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 py-3 px-5 rounded-2xl">
            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 leading-none">{averageRating}</span>
              <span className="text-[10px] block font-semibold text-slate-400 mt-0.5">out of 5</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.round(parseFloat(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-500 mt-1 block">{reviews.length} total reviews</span>
            </div>
          </div>
        )}
      </div>

      {/* Form Submission */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="bg-slate-50/60 border border-slate-100 p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Write a Review</h3>

          {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}
          {success && <p className="text-emerald-700 text-xs font-semibold">{success}</p>}

          {/* Star selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Your Rating:</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => {
                const starVal = i + 1;
                const active = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`h-6 w-6 transition ${active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} 
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment text area */}
          <div className="space-y-1">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="What did you like or dislike about this? Add details..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-xs transition bg-white resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition shadow-sm"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
          <LogIn size={20} className="text-indigo-500" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Share your thoughts!</h4>
            <p className="text-gray-500 text-xs mt-1">Please sign in to submit ratings and reviews.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-5 rounded-lg transition mt-1"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="py-8 text-center text-gray-400 text-xs">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl">
          No reviews yet. Be the first to share your experience!
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            const isOwner = user && user.id === rev.user;
            return (
              <div key={rev.id} className="border-b border-gray-50 pb-5 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  {/* Reviewer Details */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-xs flex items-center justify-center">
                      {rev.username ? rev.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs capitalize">{rev.username || 'Anonymous'}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-gray-400 text-[10px]">
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(rev.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Delete if owner) */}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Delete Review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Comment */}
                {rev.comment && (
                  <p className="text-gray-600 text-xs mt-3 pl-10 leading-relaxed">
                    {rev.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
