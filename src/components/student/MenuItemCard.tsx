import React from 'react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, Clock } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  vendor: {
    id: string;
    name: string;
    location: string;
  };
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, vendor }) => {
  const { items, addItem, updateQuantity } = useCart();

  const cartItem = items.find((i) => i.menuItemId === item._id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex gap-4 hover:border-slate-300 transition shadow-xs">
      {/* Item Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0">
        <img
          src={
            item.image ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
          }
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {/* Veg / Non-Veg Badge */}
        <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-md border border-slate-200">
          <span
            className={`block w-3 h-3 rounded-full border-2 ${
              item.isVegetarian
                ? 'border-emerald-600 bg-emerald-500'
                : 'border-rose-600 bg-rose-500'
            }`}
          />
        </div>
      </div>

      {/* Item Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-slate-900 text-base leading-snug truncate">
              {item.name}
            </h4>
            <span className="font-extrabold text-slate-900 text-base shrink-0">
              ₹{item.price}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description || 'Freshly prepared on order.'}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            {item.preparationTime || 10} mins
          </span>

          {/* Quantity Controls */}
          {currentQuantity === 0 ? (
            <button
              onClick={() => addItem(item, vendor)}
              disabled={!item.isAvailable}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                item.isAvailable
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {item.isAvailable ? 'ADD' : 'Unavailable'}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-0.5">
              <button
                onClick={() => updateQuantity(item._id, currentQuantity - 1)}
                className="w-7 h-7 rounded-md bg-white text-orange-600 flex items-center justify-center font-bold hover:bg-orange-100 transition shadow-2xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-orange-900 px-1">
                {currentQuantity}
              </span>
              <button
                onClick={() => updateQuantity(item._id, currentQuantity + 1)}
                className="w-7 h-7 rounded-md bg-orange-600 text-white flex items-center justify-center font-bold hover:bg-orange-700 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
