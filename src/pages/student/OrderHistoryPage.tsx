import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Order } from '../../types';
import { Clock, ArrowRight, ShoppingBag, CheckCircle2 } from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const activeOrders = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.orderStatus));
  const pastOrders = orders.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.orderStatus));

  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : pastOrders;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Order History</h1>
        <p className="text-xs text-slate-500">Track current food orders or view past pickups</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-3 text-xs font-bold transition relative ${
            activeTab === 'ACTIVE'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('PAST')}
          className={`pb-3 text-xs font-bold transition relative ${
            activeTab === 'PAST'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Past Orders ({pastOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No {activeTab.toLowerCase()} orders</h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'ACTIVE'
              ? 'You have no orders currently in progress.'
              : 'You have no completed or past orders.'}
          </p>
          <Link
            to="/student"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline"
          >
            Browse vendors to order food
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const vendorName =
              typeof order.vendorId === 'object' ? order.vendorId.name : 'Campus Vendor';

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">#{order.orderNumber}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        order.orderStatus === 'READY'
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : order.orderStatus === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.orderStatus === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 mt-1">{vendorName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Slot: {order.pickupStartTime} – {order.pickupEndTime} • {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  <div className="mt-2 text-xs text-slate-600">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="font-extrabold text-slate-900 text-base">₹{order.totalAmount}</span>

                  <Link
                    to={`/student/orders/${order._id}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
