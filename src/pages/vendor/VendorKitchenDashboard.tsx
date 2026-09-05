import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { useSocket } from '../../context/SocketContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Key,
  DollarSign,
  ShoppingBag,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const VendorKitchenDashboard: React.FC = () => {
  const { lastOrderUpdate } = useSocket();

  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ACTIVE');
  const [search, setSearch] = useState('');

  // PIN Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrderForVerify, setSelectedOrderForVerify] = useState<Order | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const fetchKitchenData = async () => {
    try {
      setLoading(true);
      const dashRes = await api.get('/vendor/dashboard');
      setMetrics(dashRes.data.metrics);

      const ordersRes = await api.get('/vendor/orders');
      setOrders(ordersRes.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch kitchen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();
  }, []);

  // Refresh on Socket order updates
  useEffect(() => {
    if (lastOrderUpdate) {
      fetchKitchenData();
    }
  }, [lastOrderUpdate]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await api.patch(`/vendor/orders/${orderId}/status`, { nextStatus });
      await fetchKitchenData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const handleOpenVerifyModal = (order: Order) => {
    setSelectedOrderForVerify(order);
    setPinInput('');
    setVerifyError(null);
    setVerifyModalOpen(true);
  };

  const handleConfirmVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForVerify || !pinInput) return;

    setVerifyLoading(true);
    setVerifyError(null);

    try {
      await api.post(`/vendor/orders/${selectedOrderForVerify._id}/verify-pickup`, {
        pin: pinInput.trim(),
      });

      setVerifyLoading(false);
      setVerifyModalOpen(false);
      setSelectedOrderForVerify(null);
      await fetchKitchenData();
    } catch (err: any) {
      setVerifyLoading(false);
      setVerifyError(err.response?.data?.message || 'Incorrect PIN. Verification failed.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ACTIVE') {
      if (!['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.orderStatus)) return false;
    } else if (activeTab !== 'ALL' && o.orderStatus !== activeTab) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return o.orderNumber.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-600" />
            Kitchen Operations Queue
          </h1>
          <p className="text-xs text-slate-500">Live order management for canteen staff</p>
        </div>

        <button
          onClick={fetchKitchenData}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Orders
        </button>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Today's Revenue</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">₹{metrics.todayRevenue}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">New Orders</span>
            <span className="text-xl font-black text-orange-600 mt-1 block">{metrics.pendingPlaced}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">In Preparation</span>
            <span className="text-xl font-black text-amber-600 mt-1 block">{metrics.preparing}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Ready for Pickup</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">{metrics.ready}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Completed Today</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{metrics.completed}</span>
          </div>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {['ACTIVE', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'ACTIVE' ? 'Live Active' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading kitchen queue...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Orders in this queue</h3>
          <p className="text-xs text-slate-500 mt-1">New incoming student orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const student = typeof order.studentId === 'object' ? order.studentId : null;

            return (
              <div
                key={order._id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between relative transition ${
                  order.urgency === 'OVERDUE'
                    ? 'border-rose-400 ring-2 ring-rose-500/10'
                    : order.urgency === 'DUE SOON'
                    ? 'border-amber-400 ring-2 ring-amber-500/10'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-black text-slate-900 text-base block">#{order.orderNumber}</span>
                      {student && (
                        <span className="text-xs font-semibold text-slate-600 block mt-0.5">
                          {student.name} • {student.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          order.orderStatus === 'PLACED'
                            ? 'bg-orange-100 text-orange-800'
                            : order.orderStatus === 'ACCEPTED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : order.orderStatus === 'PREPARING'
                            ? 'bg-amber-100 text-amber-800'
                            : order.orderStatus === 'READY'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {order.orderStatus}
                      </span>

                      {order.urgency && order.urgency !== 'NORMAL' && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            order.urgency === 'OVERDUE'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {order.urgency}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pickup Slot & Time */}
                  <div className="py-3 flex items-center justify-between text-xs text-slate-600 border-b border-slate-100">
                    <span className="flex items-center gap-1 font-semibold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      Slot: {order.pickupStartTime} – {order.pickupEndTime}
                    </span>
                    <span className="font-bold text-slate-900">₹{order.subtotal}</span>
                  </div>

                  {/* Food Items List */}
                  <div className="py-3 space-y-1.5 text-xs">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between font-medium text-slate-800">
                        <span>
                          <strong className="text-slate-900 font-bold">{i.quantity}x</strong> {i.name}
                        </span>
                        <span className="text-slate-500">₹{i.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-4 border-t border-slate-100 mt-3">
                  {order.orderStatus === 'PLACED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'CANCELLED')}
                        className="w-1/3 py-2 rounded-xl border border-slate-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'ACCEPTED')}
                        className="w-2/3 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition shadow-xs"
                      >
                        Accept Order
                      </button>
                    </div>
                  )}

                  {order.orderStatus === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Flame className="w-4 h-4" />
                      Start Preparing
                    </button>
                  )}

                  {order.orderStatus === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'READY')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Ready for Pickup
                    </button>
                  )}

                  {order.orderStatus === 'READY' && (
                    <button
                      onClick={() => handleOpenVerifyModal(order)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-4 h-4 text-orange-400" />
                      Verify Pickup PIN
                    </button>
                  )}

                  {order.orderStatus === 'COMPLETED' && (
                    <div className="text-center py-1 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
                      ✓ Pickup Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verify Pickup PIN Modal */}
      {verifyModalOpen && selectedOrderForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Verify Student Pickup PIN</h3>
              <p className="text-xs text-slate-500">Order #{selectedOrderForVerify.orderNumber}</p>
            </div>

            {verifyError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  Enter 4-Digit Student PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  placeholder="_ _ _ _"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full tracking-[1em] text-center font-black text-2xl py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || pinInput.length !== 4}
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying PIN...</span>
                  </>
                ) : (
                  <span>Confirm Pickup</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
