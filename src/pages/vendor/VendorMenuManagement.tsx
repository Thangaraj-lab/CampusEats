import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MenuCategory, MenuItem } from '../../types';
import { Plus, Trash2, Edit, Layers, ChefHat, Check, X, AlertCircle } from 'lucide-react';

export const VendorMenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCatLoading, setAddCatLoading] = useState(false);

  // Item Modal State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    image: '',
    preparationTime: '10',
    isVegetarian: true,
    isAvailable: true,
  });
  const [itemFormLoading, setItemFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/vendor/categories');
      setCategories(catRes.data.categories || []);

      const itemsRes = await api.get('/vendor/menu');
      setItems(itemsRes.data.items || []);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setAddCatLoading(true);
    try {
      await api.post('/vendor/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      await fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setAddCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category and all items inside it?')) return;
    try {
      await api.delete(`/vendor/categories/${id}`);
      await fetchMenu();
    } catch (err) {
      alert('Failed to delete category.');
    }
  };

  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        categoryId: (item.categoryId as any)?._id || (item.categoryId as any) || '',
        name: item.name,
        description: item.description || '',
        price: String(item.price),
        image: item.image || '',
        preparationTime: String(item.preparationTime || 10),
        isVegetarian: item.isVegetarian,
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        categoryId: categories[0]?._id || '',
        name: '',
        description: '',
        price: '',
        image: '',
        preparationTime: '10',
        isVegetarian: true,
        isAvailable: true,
      });
    }
    setError(null);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.categoryId || !itemForm.name || !itemForm.price) {
      setError('Category, name, and price are required.');
      return;
    }

    setItemFormLoading(true);
    setError(null);

    try {
      if (editingItem) {
        await api.patch(`/vendor/menu/${editingItem._id}`, itemForm);
      } else {
        await api.post('/vendor/menu', itemForm);
      }

      setItemModalOpen(false);
      await fetchMenu();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save menu item.');
    } finally {
      setItemFormLoading(false);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await api.patch(`/vendor/menu/${item._id}`, {
        isAvailable: !item.isAvailable,
      });
      await fetchMenu();
    } catch (err) {
      alert('Failed to update availability.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/vendor/menu/${id}`);
      await fetchMenu();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-600" />
            Vendor Menu Management
          </h1>
          <p className="text-xs text-slate-500">Manage your food categories, items, prices, and availability</p>
        </div>

        <button
          onClick={() => handleOpenItemModal()}
          disabled={categories.length === 0}
          className="px-4 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition shadow-md shadow-orange-600/20 flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add New Food Item
        </button>
      </div>

      {/* Category Creation Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Menu Categories</h3>

        <form onSubmit={handleCreateCategory} className="flex gap-3 max-w-md mb-4">
          <input
            type="text"
            required
            placeholder="New category name (e.g. Snacks, Drinks)..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
          />
          <button
            type="submit"
            disabled={addCatLoading}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
          >
            Add Category
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
            >
              <span>{cat.name}</span>
              <button
                onClick={() => handleDeleteCategory(cat._id)}
                className="text-slate-400 hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Items Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4">All Menu Items ({items.length})</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading menu...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No items in menu yet. Click "Add New Food Item" above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const catName = typeof item.categoryId === 'object' ? (item.categoryId as any).name : 'Uncategorized';

              return (
                <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          {catName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      <span className="text-xs font-bold text-orange-600">₹{item.price} • ~{item.preparationTime} mins</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </button>

                    <button
                      onClick={() => handleOpenItemModal(item)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setItemModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  required
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="60"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="10"
                    value={itemForm.preparationTime}
                    onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isVegetarian}
                    onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Vegetarian Item</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Available Now</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={itemFormLoading}
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition shadow-md shadow-orange-600/20 mt-4"
              >
                {itemFormLoading ? 'Saving...' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
