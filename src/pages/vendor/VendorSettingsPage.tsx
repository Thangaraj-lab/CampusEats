import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Vendor } from '../../types';
import { Store, Clock, Save, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const VendorSettingsPage: React.FC = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    openingTime: '08:00',
    closingTime: '21:00',
    estimatedPreparationTime: 12,
    slotIntervalMinutes: 15,
    maxOrdersPerSlot: 10,
    isOpen: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendor/settings');
      const v = res.data.vendor;
      setVendor(v);
      if (v) {
        setForm({
          name: v.name || '',
          description: v.description || '',
          location: v.location || '',
          phone: v.phone || '',
          openingTime: v.openingTime || '08:00',
          closingTime: v.closingTime || '21:00',
          estimatedPreparationTime: v.estimatedPreparationTime || 12,
          slotIntervalMinutes: v.slotIntervalMinutes || 15,
          maxOrdersPerSlot: v.maxOrdersPerSlot || 10,
          isOpen: v.isOpen ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await api.patch('/vendor/settings', form);
      setSuccessMsg('Vendor settings and scheduled pickup slot generator updated successfully!');
      setVendor(res.data.vendor);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto py-12 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Store className="w-6 h-6 text-orange-600" />
          Vendor Store Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure canteen operating hours, prep times, and scheduled pickup slot capacity.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {/* Toggle Open / Closed */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Store Open Status</span>
            <span className="text-xs text-slate-500">
              When closed, students cannot place new orders for your store.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              form.isOpen
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-rose-600 text-white shadow-xs'
            }`}
          >
            {form.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Store Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Campus Location
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Store Description / Tagline
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Slot Generator Settings */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            Scheduled Pickup Slots Capacity & Timing
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Opening Time
              </label>
              <input
                type="time"
                required
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Closing Time
              </label>
              <input
                type="time"
                required
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Est. Prep Time (m)
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.estimatedPreparationTime}
                onChange={(e) => setForm({ ...form, estimatedPreparationTime: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Slot Interval (m)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                required
                value={form.slotIntervalMinutes}
                onChange={(e) => setForm({ ...form, slotIntervalMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Capacity/Slot
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.maxOrdersPerSlot}
                onChange={(e) => setForm({ ...form, maxOrdersPerSlot: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Settings & Update Slots'}</span>
        </button>
      </form>
    </div>
  );
};
