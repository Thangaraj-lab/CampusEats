import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuCategory extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuCategorySchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuCategorySchema.index({ vendorId: 1, sortOrder: 1 });

export default mongoose.model<IMenuCategory>('MenuCategory', MenuCategorySchema);
