import mongoose, { Schema } from 'mongoose';
import { IGeneration } from '../types';

const GenerationSchema = new Schema<IGeneration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestId: { type: String, default: null },
    topic: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    slideCount: { type: Number, required: true },
    filePath: { type: String, required: true },
    fileName: { type: String, required: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IGeneration>('Generation', GenerationSchema);
