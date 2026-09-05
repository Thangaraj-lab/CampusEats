import React from 'react';
import { useCart } from '../../context/CartContext';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const ConflictModal: React.FC = () => {
  const { vendorConflict, clearCart, resolveConflict } = useCart();

  if (!vendorConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
        <button
          onClick={resolveConflict}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Replace Cart Items?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Your cart already contains items from{' '}
            <strong className="text-slate-800">{vendorConflict.existingVendorName}</strong>. You can only order from one vendor at a time.
          </p>
        </div>

        <div className="space-y-2 mt-5">
          <button
            onClick={() => {
              clearCart();
              resolveConflict();
            }}
            className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart & Add New Items
          </button>

          <button
            onClick={resolveConflict}
            className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
          >
            Keep Existing Cart
          </button>
        </div>
      </div>
    </div>
  );
};
