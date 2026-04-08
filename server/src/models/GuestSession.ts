import mongoose, { Schema } from 'mongoose';
import { IGuestSession } from '../types';

const GuestSessionSchema = new Schema<IGuestSession>(
  {
    guestId: { type: String, required: true, unique: true },
    generationCount: { type: Number, default: 0 },
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IGuestSession>('GuestSession', GuestSessionSchema);
