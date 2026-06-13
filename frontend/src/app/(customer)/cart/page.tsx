"use client";
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, 
  ChevronRight, ShieldCheck, Truck, ShoppingCart
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, addToCart, decrementCartItem, cartCount, totalAmount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6">
          <ShoppingCart size={48} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Explore our shops and products to find something you love!</p>
        <Link href="/search" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
          Start Shopping <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Your Shopping Cart</span>
        </div>
        <Link href="/search" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
          <ArrowRight size={16} className="rotate-180" /> Back to Shopping
        </Link>
      </div>

      <h1 className="text-4xl font-black text-gray-900 mb-10 flex items-center gap-4">
        Shopping Cart <span className="text-indigo-600">({cartCount})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 items-center shadow-sm hover:shadow-md transition">
              <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={item.image || ''} className="w-full h-full object-cover" alt={item.name} />
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">Shop ID: {item.shopId}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 p-1">
                    <button 
                      onClick={() => decrementCartItem(item.id)}
                      className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg transition text-gray-400"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg transition text-gray-400"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-300 hover:text-red-500 transition p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Price</p>
                <p className="text-xl font-black text-indigo-600">NPR {item.price * item.quantity}</p>
              </div>
            </div>
          ))}

          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex gap-4 items-start mt-8">
            <ShieldCheck className="text-indigo-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-indigo-900 text-sm">Secure Checkout Guarantee</p>
              <p className="text-xs text-indigo-700/70 mt-1 leading-relaxed">
                Your orders are split by shop for faster processing. You can choose different delivery methods or self-pickup for each order.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden sticky top-24">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
              <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" /> Order Summary
              </h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-bold text-gray-900">NPR {totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-green-600 italic">Calculated at next step</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-dashed border-gray-200">
                  <span className="font-black text-gray-900 uppercase text-xs">Total Amount</span>
                  <span className="text-3xl font-black text-indigo-600">NPR {totalAmount}</span>
                </div>
              </div>

              <Link href="/checkout" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2 group">
                Proceed to Checkout 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
              </Link>
              
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <ShieldCheck size={12} /> Secure
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Truck size={12} /> Fast
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl">
            <div className="absolute -right-8 -bottom-8 bg-white/5 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition duration-1000" />
            <h4 className="font-bold text-sm mb-2 relative z-10">Have a coupon?</h4>
            <p className="text-[10px] text-gray-400 relative z-10 mb-4 uppercase tracking-widest">Apply at the checkout page</p>
            <div className="flex gap-2 relative z-10">
              <input placeholder="Code" className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:bg-white/20 transition flex-1" />
              <button className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
