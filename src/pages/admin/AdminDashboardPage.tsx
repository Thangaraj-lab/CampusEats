import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Vendor, Order, AuditLog } from '../../types';
import {
  ShieldCheck,
  Store,
  Users,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'VENDORS' | 'USERS' | 'ORDERS' | 'LOGS'>('ANALYTICS');

  const [analytics, setAnalytics] = useState<any>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const [aRes, vRes, uRes, oRes, lRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/vendors'),
        api.get('/admin/users'),
        api.get('/admin/orders'),
        api.get('/admin/audit-logs'),
      ]);

      const metrics = aRes.data.metrics || {};
      setAnalytics({
        totalRevenue: metrics.overallRevenue || 0,
        totalOrders: metrics.todayOrdersCount || 0,
        activeVendorsCount: metrics.activeVendors || 0,
        totalUsers: metrics.totalStudents || 0,
        topVendors: [],
      });
      setVendors((vRes.data.vendors || []).map((vendor: any) => ({
        ...vendor,
        isApproved: vendor.status === 'APPROVED',
        isSuspended: vendor.status === 'SUSPENDED',
      })));
      setUsers(uRes.data.users || []);
      setOrders(oRes.data.orders || []);
      setLogs(lRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateVendorStatus = async (vendorId: string, isApproved: boolean, isSuspended?: boolean) => {
    try {
      const action = !isApproved ? 'reject' : isSuspended ? 'suspend' : 'approve';
      await api.patch(`/admin/vendors/${vendorId}/${action}`);
      await fetchAdminData();
    } catch (err) {
      alert('Failed to update vendor status.');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      await fetchAdminData();
    } catch (err) {
      alert('Failed to toggle user status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Admin Platform Control Center
          </h1>
          <p className="text-xs text-slate-500">
            System overview, vendor approvals, user accounts, and platform analytics
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Analytics KPI Bar */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Revenue</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">₹{analytics.totalRevenue}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Platform Orders</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{analytics.totalOrders}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Active Vendors</span>
            <span className="text-2xl font-black text-orange-600 mt-1 block">{analytics.activeVendorsCount}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Registered Users</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{analytics.totalUsers}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'ANALYTICS', label: 'Overview' },
          { id: 'VENDORS', label: `Vendor Applications (${vendors.filter((v) => !v.isApproved).length} Pending)` },
          { id: 'USERS', label: `Users (${users.length})` },
          { id: 'ORDERS', label: `All Orders (${orders.length})` },
          { id: 'LOGS', label: `Audit Logs (${logs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading admin dataset...</div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'ANALYTICS' && analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Top Performing Vendors</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {analytics.topVendors.map((v: any) => (
                    <div key={v.vendorId} className="py-2.5 flex justify-between items-center">
                      <span className="font-bold text-slate-800">{v.vendorName}</span>
                      <span className="font-extrabold text-emerald-600">₹{v.revenue} ({v.count} orders)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">System Quick Status</h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Pending Vendor Applications</span>
                    <span className="font-bold text-orange-600">
                      {vendors.filter((v) => !v.isApproved).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Approved Vendors</span>
                    <span className="font-bold text-emerald-600">
                      {vendors.filter((v) => v.isApproved && !v.isSuspended).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Platform Service Fee</span>
                    <span className="font-bold text-slate-900">₹5.00 / Order</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENDOR APPROVALS & MANAGEMENT */}
          {activeTab === 'VENDORS' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
                Campus Food Vendors Directory
              </div>

              <div className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <div key={v._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            !v.isApproved
                              ? 'bg-amber-100 text-amber-800'
                              : v.isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {!v.isApproved ? 'PENDING APPROVAL' : v.isSuspended ? 'SUSPENDED' : 'APPROVED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.location} • {v.phone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!v.isApproved ? (
                        <>
                          <button
                            onClick={() => handleUpdateVendorStatus(v._id, true, false)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                          >
                            Approve Vendor
                          </button>
                          <button
                            onClick={() => handleUpdateVendorStatus(v._id, false, false)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateVendorStatus(v._id, true, !v.isSuspended)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                            v.isSuspended
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {v.isSuspended ? 'Reactivate Store' : 'Suspend Store'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USERS LIST */}
          {activeTab === 'USERS' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
                Platform Accounts Directory
              </div>

              <div className="divide-y divide-slate-100">
                {users.map((u) => (
                  <div key={u._id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md uppercase">
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {u.email} • {u.studentId || 'No Student ID'}
                      </p>
                    </div>

                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                          u.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive ? 'Deactivate Account' : 'Activate Account'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ALL ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
                All Campus Orders
              </div>

              <div className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <div key={o._id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">#{o.orderNumber}</span>
                      <p className="text-slate-500 mt-0.5">
                        Slot: {o.pickupStartTime} – {o.pickupEndTime} • {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 block text-sm">₹{o.totalAmount}</span>
                      <span className="font-bold text-orange-600 uppercase text-[10px]">{o.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'LOGS' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
                Security & System Audit Logs
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {logs.map((l) => (
                  <div key={l._id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{l.action}</span>
                      <p className="text-slate-500 mt-0.5">{l.details}</p>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(l.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
