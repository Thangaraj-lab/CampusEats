import React, { useState } from 'react';
import api from '../../services/api';
import { CreditCard, ShieldCheck, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    vendorId: string;
    items: any[];
    pickupSlotId: string;
    subtotal: number;
    platformFee: number;
    totalAmount: number;
    vendorName: string;
    slotTime: string;
  };
  onSuccess: (orderId: string) => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  orderData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Call Checkout API to validate items, prices, slot capacity and create pending order
      const checkoutRes = await api.post('/orders/checkout', {
        vendorId: orderData.vendorId,
        items: orderData.items,
        pickupSlotId: orderData.pickupSlotId,
      });

      const { order, razorpayOrder } = checkoutRes.data;

      if (razorpayOrder.testMode) {
        const verifyRes = await api.post('/payments/verify', {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
        });

        setLoading(false);
        onSuccess(verifyRes.data.order.id);
        return;
      }

      // 2. Check if Razorpay JS SDK is loaded
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: razorpayOrder.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_campus_eats',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'Campus Eats',
          description: `Order ahead at ${orderData.vendorName}`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              // Verify Payment on Backend
              const verifyRes = await api.post('/payments/verify', {
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id || razorpayOrder.id,
                razorpayPaymentId: response.razorpay_payment_id || `pay_test_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || 'test_signature',
              });

              setLoading(false);
              onSuccess(verifyRes.data.order.id);
            } catch (vErr: any) {
              setLoading(false);
              setError(vErr.response?.data?.message || 'Payment verification failed.');
            }
          },
          prefill: {
            name: 'Campus Student',
            email: 'student@campuseats.edu',
            contact: '9123456789',
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'Pay via UPI',
                  instruments: [{ method: 'upi' }],
                },
              },
              sequence: ['block.upi'],
              preferences: { show_default_blocks: true },
            },
          },
          theme: {
            color: '#ea580c',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback: Test Mode Instant Verification if Razorpay script is blocked
        const verifyRes = await api.post('/payments/verify', {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          // The server only accepts this path when ALLOW_TEST_PAYMENTS=true.
        });

        setLoading(false);
        onSuccess(verifyRes.data.order.id);
      }
    } catch (err: any) {
      console.error('Checkout/Payment error:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to process checkout. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 leading-tight">Razorpay Test Checkout</h3>
            <p className="text-xs text-slate-500">Secure Online Payment</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-700">
          <div className="flex justify-between font-medium">
            <span>Vendor</span>
            <span className="font-bold text-slate-900">{orderData.vendorName}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Scheduled Pickup Slot</span>
            <span className="font-bold text-orange-600">{orderData.slotTime}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between">
            <span>Food Subtotal</span>
            <span>₹{orderData.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>₹{orderData.platformFee}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
            <span>Total Payable</span>
            <span className="text-orange-600">₹{orderData.totalAmount}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handlePayNow}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Pay ₹{orderData.totalAmount} via Razorpay</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Razorpay Test Mode • Instant Server Signature Verification
        </p>
      </div>
    </div>
  );
};
