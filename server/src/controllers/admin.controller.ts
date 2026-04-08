import { Response } from 'express';
import User from '../models/User';
import Generation from '../models/Generation';
import PendingPayment from '../models/PendingPayment';
import { AuthRequest } from '../types';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [totalTeachers, activeTeachers, subscribedTeachers, totalGenerations, totalGuestGenerations] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isSubscribed: true }),
      Generation.countDocuments({ userId: { $ne: null } }),
      Generation.countDocuments({ guestId: { $ne: null } }),
    ]);

  res.json({ success: true, totalTeachers, activeTeachers, subscribedTeachers, totalGenerations, totalGuestGenerations });
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const filter = req.query.filter as string;

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (filter === 'subscribed') query.isSubscribed = true;
  if (filter === 'active') query.isActive = true;
  if (filter === 'inactive') query.isActive = false;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, users, total, page, totalPages: Math.ceil(total / limit) });
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  const generations = await Generation.find({ userId: user._id }).sort({ createdAt: -1 });
  res.json({ success: true, user, generations });
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, user });
};

export const subscribeUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { isSubscribed, months } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (isSubscribed) {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + (months || 1));
    user.isSubscribed = true;
    user.subscriptionExpiry = expiry;
    user.generationCount = 0;
    user.billingCycleStart = new Date();
  } else {
    user.isSubscribed = false;
    user.subscriptionExpiry = undefined;
  }

  await user.save();
  res.json({ success: true, user });
};

export const resetQuota = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findByIdAndUpdate(req.params.id, { generationCount: 0 }, { new: true });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, user });
};

export const getUserGenerations = async (req: AuthRequest, res: Response): Promise<void> => {
  const generations = await Generation.find({ userId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, generations });
};

export const getAllGenerations = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string) || '';
  const type = req.query.type as string;

  const query: Record<string, unknown> = {};
  if (search) query.topic = { $regex: search, $options: 'i' };
  if (type === 'teacher') query.userId = { $ne: null };
  if (type === 'guest') query.guestId = { $ne: null };

  const total = await Generation.countDocuments(query);
  const generations = await Generation.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, generations, total, page, totalPages: Math.ceil(total / limit) });
};

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const payments = await PendingPayment.find(query)
    .populate('userId', 'name email avatar')
    .sort({ submittedAt: -1 });

  res.json({ success: true, payments });
};

export const activatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { months } = req.body;
  const payment = await PendingPayment.findById(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment not found' });
    return;
  }

  const user = await User.findById(payment.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + (months || 1));
  user.isSubscribed = true;
  user.subscriptionExpiry = expiry;
  user.generationCount = 0;
  user.billingCycleStart = new Date();
  await user.save();

  payment.status = 'activated';
  payment.activatedAt = new Date();
  payment.activatedBy = req.user?._id as unknown as import('mongoose').Types.ObjectId;
  await payment.save();

  res.json({ success: true, payment, user });
};
