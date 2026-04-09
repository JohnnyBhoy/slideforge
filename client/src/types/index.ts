export interface User {
  _id: string;
  googleId?: string;
  name: string;
  email: string;
  avatar?: string;
  isActive?: boolean;
  isSubscribed?: boolean;
  subscriptionExpiry?: string;
  generationCount?: number;
  billingCycleStart?: string;
  role: string;
  createdAt?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface Generation {
  _id: string;
  userId?: string | User;
  guestId?: string;
  topic: string;
  gradeLevel: string;
  slideCount: number;
  fileName: string;
  fileUrl: string;
  downloadCount?: number;
  createdAt: string;
}

export interface PendingPayment {
  _id: string;
  userId: string | User;
  email: string;
  name: string;
  submittedAt: string;
  status: 'pending' | 'activated' | 'rejected';
  activatedAt?: string;
  paymentMethod?: 'gcash' | 'stripe';
  amount?: number;
  currency?: 'PHP' | 'USD';
  months?: number;
  stripeSessionId?: string;
}

export interface QuotaData {
  generationCount: number;
  freeLimit: number;
  isSubscribed: boolean | null;
  subscriptionExpiry?: string;
  remainingTries: number | null;
}

export interface GenerationResult {
  fileUrl: string;
  fileName: string;
  slidesGenerated: number;
  remainingTries: number | null;
}

export interface PaymentSettings {
  gcashNumber: string;
  gcashAccountName: string;
  monthlyPrice: number;
  threeMonthPrice: number;
  monthlyPriceUsd: number;
  threeMonthPriceUsd: number;
  lsEnabled: boolean;
}
