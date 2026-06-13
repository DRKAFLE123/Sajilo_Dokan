"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/apiClient';
import { 
  ShoppingBag, Truck, MapPin, Phone, User, CreditCard, 
  ChevronRight, CheckCircle2, AlertCircle, Package, QrCode, ArrowRight, Ticket, X
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalAmount, groupedByShop, clearCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    orderType: 'delivery', // delivery | pickup
    paymentMethod: 'cod', // cod | online
  });
  
  const [shopDetails, setShopDetails] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [placedOrders, setPlacedOrders] = useState<any[]>([]);
  
  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVouchers, setAppliedVouchers] = useState<{[shopId: string]: {code: string, discount: number}}>({});
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    if (cart.length === 0 && orderIds.length === 0) {
      router.push('/');
    }
  }, [cart, orderIds]);

  useEffect(() => {
    const shopIds = Object.keys(groupedByShop);
    shopIds.forEach(id => {
      if (!shopDetails[id]) {
        api.get(`/shops/${id}/`).then(res => {
          setShopDetails((prev: any) => ({ ...prev, [id]: res.data }));
        });
      }
    });
  }, [groupedByShop]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherError('');
    setVoucherLoading(true);
    let applied = false;
    
    for (const shopId in groupedByShop) {
      const shopSubtotal = groupedByShop[shopId].reduce((acc, item) => acc + (item.price * item.quantity), 0);
      try {
        const res = await api.post('/vouchers/validate/', {
          code: voucherCode.toUpperCase(),
          shop_id: parseInt(shopId),
          total: shopSubtotal
        });
        
        if (res.data.valid) {
          setAppliedVouchers(prev => ({
            ...prev,
            [shopId]: { code: res.data.code, discount: res.data.discount_amount }
          }));
          applied = true;
          setVoucherCode('');
          break;
        }
      } catch (err: any) {
        // Will throw 400 if invalid for this shop, just continue to next shop
      }
    }
    
    if (!applied) {
      setVoucherError('Invalid, expired, or inapplicable voucher code.');
    }
    setVoucherLoading(false);
  };

  const removeVoucher = (shopId: string) => {
    setAppliedVouchers(prev => {
      const newVouchers = { ...prev };
      delete newVouchers[shopId];
      return newVouchers;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [moqError, setMoqError] = useState('');
  
  useEffect(() => {
    const invalidItem = cart.find(item => item.quantity < (item.min_order_quantity || 1));
    if (invalidItem) {
      setMoqError(`The item "${invalidItem.name}" requires a minimum order quantity of ${invalidItem.min_order_quantity} units.`);
    } else {
      setMoqError('');
    }
  }, [cart]);

  const handleNext = () => {
    if (moqError) {
      setError(moqError);
      return;
    }
    if (step === 1 && (!formData.fullName || !formData.phone || (formData.orderType === 'delivery' && !formData.address))) {
      setError('Please fill all required shipping fields.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmitOrders = async () => {
    setLoading(true);
    setError('');
    const newOrderIds: number[] = [];
    const newOrders: any[] = [];

    try {
      for (const shopId in groupedByShop) {
        const items = groupedByShop[shopId];
        const payload = {
          shop: parseInt(shopId),
          order_type: formData.orderType,
          payment_method: formData.paymentMethod,
          full_name: formData.fullName,
          phone_number: formData.phone,
          shipping_address: formData.address,
          city: formData.city,
          voucher_code: appliedVouchers[shopId]?.code || '',
          order_items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        };

        const res = await api.post('/orders/', payload);
        newOrders.push(res.data);
        newOrderIds.push(res.data.id);
      }

      setPlacedOrders(newOrders);
      setOrderIds(newOrderIds);
      clearCart();
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.voucher_code?.[0] || 'Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    const handlePayNow = async (orderId: number) => {
      try {
        const res = await api.post(`/orders/${orderId}/initiate-khalti/`, {
          return_url: `${window.location.origin}/orders/payment-callback`,
          website_url: window.location.origin
        });
        if (res.data.payment_url) {
          window.location.href = res.data.payment_url;
        } else {
          alert('Could not initiate payment. Please try again.');
        }
      } catch (err) {
        console.error('Khalti initiate error', err);
        alert('Failed to connect to Khalti payment gateway.');
      }
    };

    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-500">Your order has been sent to the shop owners for processing.</p>
          
          <div className="mt-8 space-y-4 max-w-md mx-auto">
            {placedOrders.map(order => (
              <div key={order.id} className="bg-white border border-gray-150 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="text-left">
                  <p className="font-bold text-gray-950">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">{order.shop_details?.name || 'Shop'}</p>
                  <p className="text-sm font-black text-indigo-600 mt-1">NPR {order.total}</p>
                </div>
                {formData.paymentMethod === 'online' && order.payment_status === 'unpaid' ? (
                  <button 
                    onClick={() => handlePayNow(order.id)}
                    className="w-full sm:w-auto bg-[#5C2D91] hover:bg-[#4a2475] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} /> Pay with Khalti
                  </button>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-bold">
                    {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => router.push('/orders')}
            className="border-2 border-gray-200 text-gray-600 px-8 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition"
          >
            View My Orders
          </button>
          <button 
            onClick={() => router.push('/search')}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
        <Link href="/cart" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
          <ArrowRight size={16} className="rotate-180" /> Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 bg-gray-100 rounded-full ${step > s ? 'bg-indigo-600' : ''}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex gap-3 animate-shake">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-gray-900">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Enter your full name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Phone for delivery contact" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Order Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, orderType: 'delivery' }))}
                      className={`p-4 rounded-2xl border-2 transition text-left flex items-center gap-4 ${
                        formData.orderType === 'delivery' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <Truck className={formData.orderType === 'delivery' ? 'text-indigo-600' : 'text-gray-400'} />
                      <div>
                        <p className="font-bold text-sm">Delivery</p>
                        <p className="text-[10px] text-gray-400">To your address</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, orderType: 'pickup' }))}
                      className={`p-4 rounded-2xl border-2 transition text-left flex items-center gap-4 ${
                        formData.orderType === 'pickup' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <Package className={formData.orderType === 'pickup' ? 'text-indigo-600' : 'text-gray-400'} />
                      <div>
                        <p className="font-bold text-sm">Self-Pickup</p>
                        <p className="text-[10px] text-gray-400">From the shop</p>
                      </div>
                    </button>
                  </div>
                </div>
                {formData.orderType === 'delivery' && (
                  <>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Street Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="address" value={formData.address} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Area, Building, House No." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">City</label>
                      <input name="city" value={formData.city} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Ex. Kathmandu" />
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleNext} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                Continue to Payment <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-gray-900">Payment Method</h2>
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                  className={`p-6 rounded-3xl border-2 transition text-left flex items-center justify-between ${
                    formData.paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm"><Truck className="text-indigo-600" /></div>
                    <div>
                      <p className="font-bold text-lg">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Pay when you receive the product.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-indigo-600' : 'border-gray-200'}`}>
                    {formData.paymentMethod === 'cod' && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
                  </div>
                </button>

                <button 
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
                  className={`p-6 rounded-3xl border-2 transition text-left flex items-center justify-between ${
                    formData.paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm"><CreditCard className="text-indigo-600" /></div>
                    <div>
                      <p className="font-bold text-lg">Online Payment</p>
                      <p className="text-xs text-gray-500">Pay using QR codes of individual shops.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'online' ? 'border-indigo-600' : 'border-gray-200'}`}>
                    {formData.paymentMethod === 'online' && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
                  </div>
                </button>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-5 border-2 border-gray-100 text-gray-400 rounded-2xl font-black hover:bg-gray-50 transition">Back</button>
                <button onClick={handleNext} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                  Review Order <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-gray-900">Final Review</h2>
              
              {formData.paymentMethod === 'online' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-amber-800 text-sm leading-relaxed">
                    <p className="font-bold flex items-center gap-2 mb-2"><QrCode size={18} /> Important Payment Notice:</p>
                    Please scan the QR codes below to pay the respective shops. Your order will be processed after the shop owner verifies the payment.
                  </div>
                  
                  {Object.keys(groupedByShop).map(shopId => (
                    <div key={shopId} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-sm">
                      <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                        {shopDetails[shopId]?.qr_code ? (
                          <img src={shopDetails[shopId].qr_code} className="w-full h-full object-contain p-2" alt="Shop QR" />
                        ) : (
                          <div className="text-[10px] text-gray-300 font-bold text-center p-2">QR NOT<br/>UPLOADED</div>
                        )}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="font-black text-gray-900">{shopDetails[shopId]?.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">Merchant ID: <span className="font-mono font-bold text-gray-900">{shopDetails[shopId]?.merchant_code || 'N/A'}</span></p>
                        <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                          Total to pay: NPR {groupedByShop[parseInt(shopId)].reduce((acc, item) => acc + (item.price * item.quantity), 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6 shadow-sm">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Shipping To</h5>
                    <p className="text-sm font-bold text-gray-900">{formData.fullName}</p>
                    <p className="text-xs text-gray-600">{formData.address}</p>
                    <p className="text-xs text-gray-600">{formData.city}</p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Contact</h5>
                    <p className="text-sm font-bold text-gray-900">{formData.phone}</p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Method</h5>
                    <p className="text-sm font-bold text-gray-900 capitalize">{formData.orderType}</p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Payment</h5>
                    <p className="text-sm font-bold text-gray-900 uppercase">{formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 py-5 border-2 border-gray-100 text-gray-400 rounded-2xl font-black hover:bg-gray-50 transition">Back</button>
                <button 
                  onClick={handleSubmitOrders} 
                  disabled={loading}
                  className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:bg-indigo-300"
                >
                  {loading ? 'Placing Order...' : 'Confirm & Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden sticky top-8">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
              <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" /> Order Summary
              </h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                        <img src={item.image || ''} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{item.name}</span>
                        <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-900">NPR {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                
                {/* Voucher Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Voucher Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value)}
                      placeholder="e.g. SAVE20" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition uppercase font-mono text-sm"
                    />
                    <button 
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                      className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      {voucherLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {voucherError && <p className="text-xs font-medium text-red-500">{voucherError}</p>}
                </div>

                {/* Applied Vouchers List */}
                {Object.entries(appliedVouchers).length > 0 && (
                  <div className="space-y-2 mt-4">
                    {Object.entries(appliedVouchers).map(([shopId, voucher]) => (
                      <div key={shopId} className="flex justify-between items-center bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 text-sm">
                        <div className="flex items-center gap-2">
                          <Ticket size={16} />
                          <span className="font-bold font-mono uppercase">{voucher.code}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">- NPR {voucher.discount}</span>
                          <button onClick={() => removeVoucher(shopId)} className="text-green-600 hover:text-green-800"><X size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">NPR {totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-green-600">{formData.orderType === 'pickup' ? 'FREE' : 'NPR 0'}</span>
                  </div>
                  {Object.keys(appliedVouchers).length > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Total Discount</span>
                      <span className="font-bold">- NPR {Object.values(appliedVouchers).reduce((acc, curr) => acc + curr.discount, 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200">
                    <span className="font-black text-gray-900 uppercase text-xs">Total Amount</span>
                    <span className="text-3xl font-black text-indigo-600">
                      NPR {Math.max(0, totalAmount - Object.values(appliedVouchers).reduce((acc, curr) => acc + curr.discount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
