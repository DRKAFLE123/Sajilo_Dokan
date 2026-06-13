"use client";
import React from 'react';
import Link from 'next/link';

interface ScrollerItem {
  id: number;
  name: string;
  image?: string | null;
  type: 'shop' | 'product';
  link: string;
}

interface FeaturedScrollerProps {
  items: ScrollerItem[];
}

export default function FeaturedScroller({ items }: FeaturedScrollerProps) {
  if (items.length === 0) return null;

  // Duplicate items to ensure infinite loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="bg-white border-b overflow-hidden py-4 group">
      <div className="flex whitespace-nowrap animate-scroll-left group-hover:pause">
        {displayItems.map((item, idx) => (
          <Link 
            key={`${item.type}-${item.id}-${idx}`}
            href={item.link}
            className="inline-flex items-center gap-3 px-8 py-2 mx-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all shadow-sm"
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                {item.name[0]}
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-black text-gray-900 leading-none mb-1">{item.name}</p>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                Featured {item.type}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .pause {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
