import { Response } from 'express';
import PendingPayment from '../models/PendingPayment';
import { AuthRequest, IUser } from '../types';

export const notifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user as IUser;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { months = 1, amount, currency = 'PHP' } = req.body as {
    months?: number;
    amount?: number;
    currency?: 'PHP' | 'USD';
  };

  const existing = await PendingPayment.findOne({ userId: user._id, status: 'pending' });
  if (existing) {
    res.json({ success: true, message: 'You already have a pending payment notification.' });
    return;
  }

  await PendingPayment.create({
    userId: user._id,
    email: user.email,
    name: user.name,
    paymentMethod: 'gcash',
    amount,
    currency,
    months,
  });

  res.json({ success: true, message: "Thanks! We'll activate your account within 24 hours." });
};
