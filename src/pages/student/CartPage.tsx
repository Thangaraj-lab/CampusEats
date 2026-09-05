import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { PickupSlot } from '../../types';
import { PickupSlotPicker } from '../../components/student/PickupSlotPicker';
import { RazorpayCheckoutModal } from '../../components/student/RazorpayCheckoutModal';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Clock,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    items,
    cartVendor,
    selectedSlot,
    subtotal,
    platformFee,
    totalAmount,
    updateQuantity,
    removeItem,
    selectSlot,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPickupSlots = async () => {
    if (!cartVendor) return;
    try {
      setLoadingSlots(true);
      const res = await api.get(`/vendors/${cartVendor.id}/pickup-slots`);
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error('Failed to fetch pickup slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchPickupSlots();
  }, [cartVendor]);

  const handleProceedToCheckout = () => {
    if (!selectedSlot) {
      setError('Please select a scheduled pickup slot before proceeding.');
      return;
    }
    setError(null);
    setCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = (orderId: string) => {
    clearCart();
    setCheckoutModalOpen(false);
    navigate(`/student/orders/${orderId}`);
  };

  if (items.length === 0 || !cartVendor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Explore our campus food vendors, add your favorite items, and pick a convenient pickup time slot.
        </p>
        <Link
          to="/student"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition shadow-md shadow-orange-600/20"
        >
          <span>Browse Campus Vendors</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to={`/student/vendor/${cartVendor.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {cartVendor.name} Menu
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout Order</h1>
          <p className="text-xs text-slate-500">Review items and choose scheduled pickup time</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart Items & Slot Picker */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vendor Details Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                Selected Vendor
              </span>
              <h3 className="font-bold text-slate-900 text-base">{cartVendor.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                {cartVendor.location}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Order Items ({items.length})
            </h3>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.menuItemId} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                      <span className="text-xs text-slate-500">₹{item.price} each</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-extrabold text-slate-900 text-sm min-w-[50px] text-right">
                      ₹{item.price * item.quantity}
                    </span>

                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pickup Slot Picker */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            {loadingSlots ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading pickup slots...</div>
            ) : (
              <PickupSlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => {
                  setError(null);
                  selectSlot(slot);
                }}
              />
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Payment Button */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs sticky top-24 space-y-6">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
              Payment Summary
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Food Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Convenience Fee</span>
                <span className="font-bold text-slate-900">₹{platformFee}</span>
              </div>
              {selectedSlot && (
                <div className="flex justify-between text-orange-600 font-semibold bg-orange-50 p-2.5 rounded-xl border border-orange-200">
                  <span>Scheduled Pickup Time</span>
                  <span>{selectedSlot.startTime} – {selectedSlot.endTime}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-orange-600">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition shadow-md shadow-orange-600/25 flex items-center justify-center gap-2"
            >
              <span>Proceed to Pay ₹{totalAmount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Express Counter Pickup</span>
              </div>
              <p className="leading-normal">
                After payment verification, you will receive a 4-digit pickup PIN to present at the vendor counter.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Test Modal */}
      {selectedSlot && cartVendor && (
        <RazorpayCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          orderData={{
            vendorId: cartVendor.id,
            items,
            pickupSlotId: selectedSlot._id,
            subtotal,
            platformFee,
            totalAmount,
            vendorName: cartVendor.name,
            slotTime: `${selectedSlot.startTime} – ${selectedSlot.endTime}`,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
