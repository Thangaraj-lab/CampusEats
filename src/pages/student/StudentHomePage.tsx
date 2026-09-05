import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Vendor } from '../../types';
import { VendorCard } from '../../components/student/VendorCard';
import { Search, Store, Clock, Sparkles, Filter } from 'lucide-react';

export const StudentHomePage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vendors?search=${encodeURIComponent(search)}`);
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search]);

  const filteredVendors = vendors.filter((v) => {
    if (filterOpenOnly && !v.isOpen) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Campus Canteen Express
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Order Ahead. Skip Canteen Queues.
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-2 leading-relaxed">
            Choose your vendor, pick a scheduled pickup slot, pay online, and collect instantly with your 4-digit PIN.
          </p>

          {/* Search Input */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search food or vendors (e.g., Dosa, Coffee, South Canteen)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-4 focus:ring-white/30 shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Vendors Grid Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-600" />
            Approved Campus Vendors
          </h2>
          <p className="text-xs text-slate-500">Live vendor availability on campus</p>
        </div>

        <button
          onClick={() => setFilterOpenOnly(!filterOpenOnly)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
            filterOpenOnly
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{filterOpenOnly ? 'Showing Open Only' : 'Filter Open Vendors'}</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-5 h-64 animate-pulse">
              <div className="bg-slate-200 h-32 rounded-xl mb-4" />
              <div className="bg-slate-200 h-5 w-2/3 rounded-md mb-2" />
              <div className="bg-slate-200 h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Vendors Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or removing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor._id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
};
