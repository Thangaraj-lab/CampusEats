import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { joinOrderRoom } from '../../services/socket';
import {
  Clock,
  MapPin,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Phone,
  Key,
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { lastOrderUpdate } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.order);
      if (res.data.order?._id) {
        joinOrderRoom(res.data.order._id);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Handle Socket.IO real-time status update
  useEffect(() => {
    if (lastOrderUpdate && lastOrderUpdate.order && (lastOrderUpdate.order.id === orderId || lastOrderUpdate.order._id === orderId)) {
      fetchOrderDetails();
    }
  }, [lastOrderUpdate]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs font-semibold text-slate-500 mt-3">Fetching real-time order status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/student/orders" className="text-xs font-bold text-orange-600 mt-2 inline-block">
          ← View Order History
        </Link>
      </div>
    );
  }

  const vendor = typeof order.vendorId === 'object' ? order.vendorId : null;

  // Pipeline Steps Definition
  const steps: { status: OrderStatus; title: string; desc: string }[] = [
    { status: 'PLACED', title: 'Order Placed', desc: 'Payment verified & order sent to kitchen' },
    { status: 'ACCEPTED', title: 'Accepted by Kitchen', desc: 'Vendor confirmed your order' },
    { status: 'PREPARING', title: 'Food Preparing', desc: 'Chefs are cooking your meal' },
    { status: 'READY', title: 'Ready for Pickup', desc: 'Head to the counter with your PIN' },
    { status: 'COMPLETED', title: 'Pickup Verified', desc: 'Food handed over successfully' },
  ];

  const statusOrder: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(order.orderStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/student/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        All Student Orders
      </Link>

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
              Real-Time Tracker
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Scheduled Slot</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {order.pickupStartTime} – {order.pickupEndTime}
            </span>
          </div>
        </div>

        {/* Pickup PIN Hero Display Card */}
        {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
          <div className="mt-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-[11px] font-bold mb-3 border border-white/10">
              <Key className="w-3.5 h-3.5" />
              <span>YOUR VERIFIED PICKUP PIN</span>
            </div>

            <div className="flex items-center justify-center gap-3 my-2">
              {(order.pickupPin || '7429').split('').map((digit, idx) => (
                <span
                  key={idx}
                  className="w-12 h-14 bg-white/15 border border-white/20 rounded-xl font-black text-2xl sm:text-3xl flex items-center justify-center text-orange-400 shadow-inner"
                >
                  {digit}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-300 mt-3 font-medium">
              Show this 4-digit PIN at the <strong className="text-white">{vendor?.name || 'Vendor'}</strong> counter to receive your food.
            </p>
          </div>
        )}

        {/* Banner if READY */}
        {order.orderStatus === 'READY' && (
          <div className="mt-4 p-4 bg-emerald-500 text-white rounded-2xl text-center shadow-lg animate-bounce-short">
            <Sparkles className="w-6 h-6 mx-auto mb-1" />
            <h3 className="font-black text-lg">Your Order is READY for Pickup!</h3>
            <p className="text-xs opacity-90">Please proceed to {vendor?.name || 'the vendor counter'} now.</p>
          </div>
        )}
      </div>

      {/* Visual Status Pipeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs mb-6">
        <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600" />
          Live Kitchen Progress
        </h3>

        {order.orderStatus === 'CANCELLED' ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs text-center font-bold">
            ❌ Order Cancelled
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((step, idx) => {
              const isPassed = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step.status} className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-orange-100 scale-110' : ''}`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div className="pt-0.5">
                    <h4
                      className={`font-bold text-sm ${
                        isCurrent
                          ? 'text-orange-600 text-base'
                          : isPassed
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vendor & Items Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Order Summary
        </h3>

        {vendor && (
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 block text-sm">{vendor.name}</span>
              <span className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-orange-500" />
                {vendor.location}
              </span>
            </div>
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center gap-1 hover:bg-slate-200 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Vendor
              </a>
            )}
          </div>
        )}

        <div className="divide-y divide-slate-100 text-xs">
          {order.items.map((i, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <span className="font-medium text-slate-800">
                {i.quantity}x {i.name}
              </span>
              <span className="font-bold text-slate-900">₹{i.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
          <span>Total Paid</span>
          <span className="text-orange-600">₹{order.totalAmount}</span>
        </div>
      </div>
    </div>
  );
};
