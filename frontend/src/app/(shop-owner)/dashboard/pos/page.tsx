"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/apiClient';
import { 
  Search, Barcode, Trash2, Plus, Minus, Receipt, Percent, 
  Printer, Coins, CreditCard, QrCode, ShoppingBag, Store,
  CheckCircle, User, Phone, MapPin, AlertCircle, RefreshCw
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: string;
  stock_quantity: number;
  barcode: string;
  images: { image: string }[];
  category_name?: string;
  category?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number; // selling_price as number
}

export default function POSPage() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod'); // cod=Cash, online=Card/QR
  const [posPaymentType, setPosPaymentType] = useState<'cash' | 'card' | 'qr'>('cash');
  
  // Customer info
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Voucher/Discount
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  
  // POS Order success
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Focus and barcode scan input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data: Shop and Categories
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [shopRes, catRes] = await Promise.all([
          api.get('/shops/my_shop/'),
          api.get('/product-categories/')
        ]);
        setShop(shopRes.data);
        setCategories(catRes.data?.results ?? catRes.data ?? []);
      } catch (err) {
        console.error('Failed to load initial POS data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitData();
  }, []);

  // Fetch products based on category and search query
  const fetchProducts = useCallback(async () => {
    if (!shop?.id) return;
    try {
      let url = `/products/?shop_id=${shop.id}&moderation_status=approved`;
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const res = await api.get(url);
      setProducts(res.data?.results ?? res.data ?? []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  }, [shop?.id, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Barcode/Keyboard scanning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F10 to trigger quick checkout
      if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout();
      }
      // Focus search on Escape
      if (e.key === 'Escape') {
        searchInputRef.current?.focus();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentMethod, customerName, customerPhone, appliedVoucher]);

  // Add item to cart
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Cannot add more. Only ${product.stock_quantity} items available in stock.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, price: parseFloat(product.selling_price) }];
    });
  };

  // Update quantity in cart
  const updateQuantity = (productId: number, val: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + val;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock_quantity) {
            alert(`Only ${item.product.stock_quantity} items available in stock.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  // Validate voucher
  const validateVoucher = async () => {
    if (!voucherCode) return;
    setValidatingVoucher(true);
    setVoucherError('');
    try {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const res = await api.post('/vouchers/validate/', {
        code: voucherCode,
        shop_id: shop.id,
        total: subtotal
      });
      setAppliedVoucher(res.data);
    } catch (err: any) {
      setVoucherError(err.response?.data?.error ?? 'Invalid voucher code.');
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === 'percentage') {
      discountAmount = subtotal * (parseFloat(appliedVoucher.discount_value) / 100);
    } else {
      discountAmount = parseFloat(appliedVoucher.discount_value);
    }
  }

  const taxRate = 0.13; // 13% VAT standard in Nepal
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;

  // Checkout order
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    setCheckoutLoading(true);
    try {
      const orderItems = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price
      }));

      const payload = {
        shop: shop.id,
        order_type: 'pickup',
        payment_method: paymentMethod,
        payment_status: 'paid', // POS is paid immediately
        status: 'completed', // POS completes immediately
        full_name: customerName,
        phone_number: customerPhone || '9999999999',
        shipping_address: 'In-Store POS Purchase',
        city: shop.city || 'Kathmandu',
        order_items: orderItems,
        voucher_code: appliedVoucher?.code || ''
      };

      const res = await api.post('/orders/', payload);
      setCreatedOrder(res.data);
      clearCart();
      // Refetch products to get updated stock levels
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail ?? err.response?.data?.non_field_errors?.[0] ?? 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Search submit (barcode trigger)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Check if the query is an exact match for SKU or barcode
    const exactMatch = products.find(
      p => p.barcode === searchQuery || p.sku === searchQuery || p.name.toLowerCase() === searchQuery.toLowerCase()
    );
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery('');
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <Store className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Setup Required</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Please set up your store in store details before accessing the POS system.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 print:p-0">
      
      {/* Hide rest of page on print */}
      <style media="print">{`
        body * {
          visibility: hidden;
        }
        #pos-receipt-modal, #pos-receipt-modal * {
          visibility: visible;
        }
        #pos-receipt-modal {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          border: none !important;
          box-shadow: none !important;
        }
        .print-btn-container {
          display: none !important;
        }
      `}</style>

      {/* POS Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{shop.name} — POS Terminal</h1>
            <p className="text-gray-500 text-xs font-semibold">Active Cashier Session | Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">F10</kbd> to Checkout</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl">
            <Coins size={16} />
            <span>Till Balance: NPR 12,450.00</span>
          </div>
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
        
        {/* Left Side: Product Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Search bar & Barcode */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 transition">
              <Search className="text-gray-400" size={18} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search products by Name, SKU or scan Barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-sm font-medium"
              />
              <button type="submit" className="hidden" />
            </form>
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl flex items-center justify-center shadow-inner">
              <Barcode size={20} />
            </div>
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 uppercase tracking-widest ${
                selectedCategory === null 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 uppercase tracking-widest ${
                  selectedCategory === cat.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
            {products.length === 0 ? (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center gap-4 text-gray-400">
                <ShoppingBag size={48} className="text-gray-200" />
                <p className="font-bold">No products found matching filters.</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="text-indigo-600 font-semibold text-sm hover:underline">Reset Filters</button>
              </div>
            ) : (
              products.map(product => {
                const isOutOfStock = product.stock_quantity <= 0;
                return (
                  <div 
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-indigo-100 transition duration-300 cursor-pointer flex flex-col relative group overflow-hidden ${
                      isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Stock badge */}
                    <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                      product.stock_quantity > 10 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : isOutOfStock 
                          ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {isOutOfStock ? 'Out of Stock' : `${product.stock_quantity} left`}
                    </span>

                    {/* Image */}
                    <div className="w-full h-32 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden mb-4 border border-gray-50/50">
                      {product.images?.[0] ? (
                        <img src={product.images[0].image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={product.name} />
                      ) : (
                        <Store size={36} className="text-gray-300" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition">{product.name}</h4>
                        <span className="text-[10px] font-mono text-gray-400">SKU: {product.sku || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                        <span className="text-sm font-black text-gray-900">NPR {parseFloat(product.selling_price).toFixed(2)}</span>
                        {!isOutOfStock && (
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition">
                            <Plus size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Order summary & Cart panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
            
            {/* Header info */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" /> Current Checkout Cart
              </h3>
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-600 font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>

            {/* Customer input fields */}
            <div className="p-6 border-b border-gray-50 grid grid-cols-2 gap-4 bg-gray-50/10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1"><User size={12} /> Customer Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1"><Phone size={12} /> Phone Number</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="98xxxxxxxx"
                  className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Cart list */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 p-6 flex-1 min-h-[200px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10 gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">POS Cart is Empty</p>
                    <p className="text-xs text-gray-400">Scan barcode or select items from grid to add.</p>
                  </div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0].image} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Store size={20} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 text-xs line-clamp-1 max-w-[150px]">{item.product.name}</h5>
                        <span className="text-[10px] font-bold text-gray-400">NPR {item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-1 shrink-0">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      
                      {/* Subtotal & delete */}
                      <span className="text-xs font-black text-gray-900 w-20 text-right">NPR {(item.price * item.quantity).toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations panel */}
            <div className="bg-gray-50/50 p-6 border-t border-gray-50 space-y-4">
              
              {/* Voucher apply */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <Percent size={14} className="text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Apply Voucher..."
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    className="bg-transparent outline-none text-xs font-semibold w-full"
                    disabled={cart.length === 0}
                  />
                </div>
                <button 
                  onClick={validateVoucher}
                  disabled={!voucherCode || validatingVoucher || cart.length === 0}
                  className="bg-indigo-600 disabled:bg-gray-200 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
                >
                  {validatingVoucher ? <RefreshCw size={12} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {voucherError && <span className="text-[10px] text-red-500 font-bold pl-1">{voucherError}</span>}
              {appliedVoucher && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 flex justify-between items-center text-xs font-semibold text-green-700">
                  <span>Voucher '{appliedVoucher.code}' applied</span>
                  <span>- NPR {discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Subtotal, tax, grand total */}
              <div className="space-y-2 text-xs font-bold text-gray-500 pt-2 border-t border-dashed border-gray-200">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="text-gray-900">NPR {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount</span>
                    <span>- NPR {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>VAT (13%)</span>
                  <span className="text-gray-900">NPR {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                  <span className="font-black text-gray-900 uppercase">Grand Total</span>
                  <span className="text-lg font-black text-indigo-600">NPR {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment selector */}
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => { setPaymentMethod('cod'); setPosPaymentType('cash'); }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition ${
                      posPaymentType === 'cash' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' 
                        : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Coins size={18} />
                    <span className="text-[10px] font-black uppercase">Cash</span>
                  </button>
                  
                  <button 
                    onClick={() => { setPaymentMethod('online'); setPosPaymentType('qr'); }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition ${
                      posPaymentType === 'qr' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' 
                        : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <QrCode size={18} />
                    <span className="text-[10px] font-black uppercase">QR Code</span>
                  </button>

                  <button 
                    onClick={() => { setPaymentMethod('online'); setPosPaymentType('card'); }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition ${
                      posPaymentType === 'card' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' 
                        : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[10px] font-black uppercase">Card</span>
                  </button>
                </div>
              </div>

              {/* Checkout buttons */}
              <div className="pt-2">
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || checkoutLoading}
                  className="w-full bg-indigo-600 disabled:bg-gray-200 text-white font-black uppercase py-4 rounded-2xl text-xs hover:bg-indigo-700 tracking-wider shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition"
                >
                  {checkoutLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Receipt size={14} /> Process checkout (F10)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POS Receipt Modal (Visible when createdOrder is set) */}
      {createdOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 print:bg-transparent print:relative print:inset-auto">
          <div 
            id="pos-receipt-modal"
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-md w-full p-8 space-y-6 relative print:p-0 print:border-none print:shadow-none animate-in scale-in-95 duration-200"
          >
            {/* Success icon */}
            <div className="text-center print:hidden">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Checkout Successful</h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">Order #{createdOrder.id} generated</p>
            </div>

            {/* Receipt Area */}
            <div className="border border-gray-100 p-6 rounded-3xl bg-gray-50/50 space-y-6 print:p-0 print:bg-white print:border-none">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-lg text-gray-900">{shop.name}</h4>
                <p className="text-[10px] text-gray-400 font-medium">{shop.address || 'Kathmandu, Nepal'}</p>
                {shop.pan_vat_number && <p className="text-[10px] text-gray-400 font-mono">PAN: {shop.pan_vat_number}</p>}
                <div className="border-t border-dashed border-gray-200 my-4" />
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                  <span>ORDER: #{createdOrder.id}</span>
                  <span>{new Date(createdOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                  <span>CUST: {createdOrder.full_name || 'Walk-in'}</span>
                  <span>PH: {createdOrder.phone_number || 'N/A'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 my-4" />

              {/* Items List */}
              <table className="w-full text-xs font-semibold text-gray-700">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-black uppercase text-left">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {createdOrder.items?.map((item: any) => (
                    <tr key={item.id} className="py-2">
                      <td className="py-2 text-gray-900 max-w-[180px] truncate">{item.product?.name}</td>
                      <td className="py-2 text-center text-gray-500">{item.quantity}</td>
                      <td className="py-2 text-right text-gray-900">NPR {(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-gray-200 my-4" />

              {/* Summary */}
              <div className="space-y-1.5 text-xs font-bold text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-gray-900">NPR {parseFloat(createdOrder.total - (createdOrder.tax || 0) + (createdOrder.discount_amount || 0)).toFixed(2)}</span>
                </div>
                {parseFloat(createdOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- NPR {parseFloat(createdOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT (13%)</span>
                  <span className="text-gray-900">NPR {((parseFloat(createdOrder.total) - parseFloat(createdOrder.discount_amount || 0)) * 0.13).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-black text-gray-900 uppercase">Paid Total</span>
                  <span className="font-black text-indigo-600">NPR {parseFloat(createdOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                  <span>PAYMENT TYPE</span>
                  <span className="uppercase">{createdOrder.payment_method === 'cod' ? 'Cash' : posPaymentType}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 my-4" />

              {/* Thank you */}
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Thank you for your purchase!</p>
                <p className="text-[9px] text-gray-400 font-medium">Sajilo Dokan Local Connect Marketplace</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-50 print-btn-container print:hidden">
              <button 
                onClick={() => setCreatedOrder(null)}
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-xs uppercase py-3.5 rounded-2xl transition"
              >
                Close Window
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-indigo-600 text-white font-bold text-xs uppercase py-3.5 rounded-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-100"
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
