import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  isSubscribed: boolean;
  subscriptionExpiry?: Date;
  generationCount: number;
  billingCycleStart?: Date;
  role: string;
  createdAt: Date;
}

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface IGuestSession extends Document {
  guestId: string;
  generationCount: number;
  lastUsed: Date;
  createdAt: Date;
}

export interface IGeneration extends Document {
  userId?: Types.ObjectId;
  guestId?: string;
  topic: string;
  gradeLevel: string;
  slideCount: number;
  filePath: string;
  fileName: string;
  downloadCount: number;
  createdAt: Date;
}

export interface IPendingPayment extends Document {
  userId: Types.ObjectId;
  email: string;
  name: string;
  submittedAt: Date;
  status: 'pending' | 'activated' | 'rejected';
  activatedAt?: Date;
  activatedBy?: Types.ObjectId;
}

export interface AuthRequest extends Request {
  user?: (IUser | IAdmin) & { role: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
}

export interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4: ["A. ...", "B. ...", "C. ...", "D. ..."]
  answer: string;    // "A", "B", "C", or "D"
}

export interface SlideContent {
  slideNumber: number;
  type: 'title' | 'content' | 'quiz' | 'summary';
  title: string;
  bullets: string[];
  keyFact: string;
  imageKeyword: string;
  speakerNotes: string;
  quizQuestions?: QuizQuestion[];
}
