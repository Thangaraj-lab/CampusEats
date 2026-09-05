import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  location: string;
  phone: string;
  openingTime: string; // e.g. "08:00"
  closingTime: string; // e.g. "21:00"
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isOpen: boolean;
  estimatedPreparationTime: number; // minutes
  pickupSlotDuration: number; // minutes, default 15
  pickupSlotCapacity: number; // orders per slot, default 10
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '21:00' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING' },
    isOpen: { type: Boolean, default: true },
    estimatedPreparationTime: { type: Number, default: 15 },
    pickupSlotDuration: { type: Number, default: 15 },
    pickupSlotCapacity: { type: Number, default: 10 },
  },
  { timestamps: true }
);

VendorSchema.index({ status: 1 });

export default mongoose.model<IVendor>('Vendor', VendorSchema);
