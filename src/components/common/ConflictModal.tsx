import React from 'react';
import { useCart } from '../../context/CartContext';
import { AlertCircle, Trash2, X } from 'lucide-react';

export const ConflictModal: React.FC = () => {
  const {
    conflictModalOpen,
    cartVendor,
    pendingItemToAdd,
    confirmClearAndAdd,
    cancelConflict,
  } = useCart();

  if (!conflictModalOpen || !pendingItemToAdd) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <button
            onClick={cancelConflict}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-900">Items from another vendor</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Your cart already contains items from <strong className="text-slate-900">{cartVendor?.name}</strong>. A single order can only include food from one vendor.
          </p>
          <div className="mt-4 bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-200">
            Would you like to clear your current cart and start a new order from{' '}
            <strong>{pendingItemToAdd.vendor.name}</strong>?
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={cancelConflict}
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={confirmClearAndAdd}
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
