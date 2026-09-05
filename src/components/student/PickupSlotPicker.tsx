import React from 'react';
import { PickupSlot } from '../../types';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface PickupSlotPickerProps {
  slots: PickupSlot[];
  selectedSlot: PickupSlot | null;
  onSelectSlot: (slot: PickupSlot) => void;
}

export const PickupSlotPicker: React.FC<PickupSlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
}) => {
  if (slots.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">No pickup slots available for this time.</p>
        <p className="text-xs text-slate-400 mt-1">Please try choosing another time or vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600" />
          Select Scheduled Pickup Slot
        </h3>
        <span className="text-xs text-slate-500">Fast Express Counter Pickup</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
        {slots.map((slot) => {
          const isFull = slot.bookedOrders >= slot.maxOrders;
          const isAlmostFull = !isFull && slot.bookedOrders >= slot.maxOrders * 0.7;
          const isSelected = selectedSlot?._id === slot._id;

          let badgeText = 'AVAILABLE';
          let badgeColor = 'bg-emerald-100 text-emerald-800';

          if (isFull) {
            badgeText = 'FULL';
            badgeColor = 'bg-rose-100 text-rose-800';
          } else if (isAlmostFull) {
            badgeText = 'ALMOST FULL';
            badgeColor = 'bg-amber-100 text-amber-800';
          }

          return (
            <button
              key={slot._id}
              disabled={isFull || !slot.isActive}
              onClick={() => onSelectSlot(slot)}
              className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-600/20'
                  : isFull
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {slot.startTime} – {slot.endTime}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>
                  {badgeText}
                </span>
                <span className="text-[10px] text-slate-500">
                  {slot.bookedOrders}/{slot.maxOrders} orders
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
