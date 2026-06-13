"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function PaymentCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    const purchaseOrderId = searchParams.get('purchase_order_id');

    if (!pidx || !purchaseOrderId) {
      setStatus('failed');
      setErrorMsg('Invalid or missing payment details.');
      return;
    }

    setOrderId(purchaseOrderId);

    const verifyPayment = async () => {
      try {
        const res = await api.post(`/orders/${purchaseOrderId}/verify-khalti/`, {
          pidx: pidx
        });
        if (res.data.status === 'success') {
          setStatus('success');
        } else {
          setStatus('failed');
          setErrorMsg(res.data.detail || 'Payment verification failed.');
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setErrorMsg(err.response?.data?.detail || 'Failed to verify payment with the server.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="max-w-lg mx-auto my-20 p-8 sm:p-12 bg-white rounded-[2rem] border border-gray-100 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {status === 'verifying' && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Verifying Payment...</h1>
            <p className="text-gray-500 text-sm">Please do not refresh, close, or navigate away from this page.</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto animate-bounce">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Successful!</h1>
            <p className="text-gray-500 text-sm">Your payment for Order #{orderId} has been successfully verified.</p>
          </div>
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => router.push('/orders')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black transition shadow-lg shadow-indigo-150 flex items-center justify-center gap-2 group"
            >
              Go to My Orders <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-650 mx-auto">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Failed</h1>
            <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
          </div>
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => router.push('/orders')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black transition"
            >
              View My Orders
            </button>
            <button 
              onClick={() => router.push('/')}
              className="w-full border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-gray-50 transition"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto my-20 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-bold">Loading payment status...</p>
      </div>
    }>
      <PaymentCallbackHandler />
    </Suspense>
  );
}
