import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, default: 'RAZORPAY' },
    providerOrderId: { type: String, required: true },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED'], default: 'CREATED' },
  },
  { timestamps: true }
);

PaymentSchema.index({ providerOrderId: 1 });
PaymentSchema.index({ providerPaymentId: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
