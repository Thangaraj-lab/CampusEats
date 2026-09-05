import mongoose, { Schema, Document } from 'mongoose';

export interface IPickupSlot extends Document {
  vendorId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "12:30"
  endTime: string; // e.g. "12:45"
  maxOrders: number;
  bookedOrders: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PickupSlotSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxOrders: { type: Number, required: true, default: 10 },
    bookedOrders: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PickupSlotSchema.index({ vendorId: 1, date: 1 });

export default mongoose.model<IPickupSlot>('PickupSlot', PickupSlotSchema);
