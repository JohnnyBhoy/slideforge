import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isSubscribed: { type: Boolean, default: false },
    subscriptionExpiry: { type: Date },
    generationCount: { type: Number, default: 0 },
    billingCycleStart: { type: Date },
    role: { type: String, default: 'teacher' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
