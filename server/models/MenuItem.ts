import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  vendorId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  image?: string;
  preparationTime: number; // in minutes
  isAvailable: boolean;
  isVegetarian: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    preparationTime: { type: Number, default: 10 },
    isAvailable: { type: Boolean, default: true },
    isVegetarian: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuItemSchema.index({ vendorId: 1, categoryId: 1 });
MenuItemSchema.index({ isAvailable: 1 });

export default mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
