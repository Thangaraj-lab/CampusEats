import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface IOrder extends Document {
  orderNumber: string;
  studentId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  pickupSlotId: mongoose.Types.ObjectId;
  pickupDate: string;
  pickupStartTime: string;
  pickupEndTime: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  pickupPinHash: string;
  pickupPinPlain: string; // Plain 4-digit PIN stored securely for authorized student view
  createdAt: Date;
  acceptedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, default: 5 },
    totalAmount: { type: Number, required: true },
    pickupSlotId: { type: Schema.Types.ObjectId, ref: 'PickupSlot', required: true },
    pickupDate: { type: String, required: true },
    pickupStartTime: { type: String, required: true },
    pickupEndTime: { type: String, required: true },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
      default: 'PLACED',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    pickupPinHash: { type: String, required: true },
    pickupPinPlain: { type: String, required: true },
    acceptedAt: { type: Date },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.index({ studentId: 1, createdAt: -1 });
OrderSchema.index({ vendorId: 1, createdAt: -1 });
OrderSchema.index({ vendorId: 1, orderStatus: 1 });
export default mongoose.model<IOrder>('Order', OrderSchema);
