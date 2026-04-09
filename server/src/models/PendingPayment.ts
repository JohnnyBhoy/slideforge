import mongoose, { Schema } from 'mongoose';
import { IPendingPayment } from '../types';

const PendingPaymentSchema = new Schema<IPendingPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'activated', 'rejected'], default: 'pending' },
    activatedAt: { type: Date },
    activatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    paymentMethod: { type: String, enum: ['gcash', 'stripe'], default: 'gcash' },
    amount: { type: Number },
    currency: { type: String, enum: ['PHP', 'USD'], default: 'PHP' },
    months: { type: Number, default: 1 },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPendingPayment>('PendingPayment', PendingPaymentSchema);
