import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Vendor, MenuCategory, MenuItem } from '../../types';
import { MenuItemCard } from '../../components/student/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { MapPin, Clock, Search, ShoppingBag, ArrowLeft, Store, ArrowRight } from 'lucide-react';

export const VendorMenuPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { items: cartItems, cartVendor, totalAmount } = useCart();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vendors/${vendorId}/menu`);
      setCategories(res.data.categories || []);
      setMenuItems(res.data.items || []);

      const vRes = await api.get(`/vendors/${vendorId}`);
      setVendor(vRes.data.vendor);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchMenuData();
    }
  }, [vendorId]);

  const filteredItems = menuItems.filter((item) => {
    if (activeCategory !== 'ALL' && item.categoryId !== activeCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const cartCountForThisVendor =
    cartVendor?.id === vendorId ? cartItems.reduce((sum, i) => sum + i.quantity, 0) : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs font-semibold text-slate-500 mt-3">Loading menu...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Vendor Not Found</h2>
        <Link to="/student" className="text-xs font-bold text-orange-600 mt-2 inline-block">
          ← Back to Vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Back Link */}
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vendors
      </Link>

      {/* Vendor Profile Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
            <img
              src={
                vendor.logo ||
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'
              }
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{vendor.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                  vendor.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {vendor.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">{vendor.description}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                {vendor.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                ~{vendor.estimatedPreparationTime || 12} mins prep time
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-600 shrink-0 w-full md:w-auto text-left md:text-right">
          <span className="font-bold text-slate-800 block">Operating Hours</span>
          <span>{vendor.openingTime} – {vendor.closingTime}</span>
        </div>
      </div>

      {/* Categories & Search Controls */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                activeCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                  activeCategory === cat._id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search in menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">No food items found matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              vendor={{ id: vendor._id, name: vendor.name, location: vendor.location }}
            />
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cartCountForThisVendor > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-lg w-[calc(100%-2rem)] z-40">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block leading-tight">
                  {cartCountForThisVendor} items in cart
                </span>
                <span className="font-extrabold text-base text-white">₹{totalAmount}</span>
              </div>
            </div>

            <Link
              to="/student/cart"
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition flex items-center gap-1.5 shadow-md shadow-orange-600/30"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
