import { Request, Response } from 'express';
import GuestSession from '../models/GuestSession';
import Generation from '../models/Generation';
import User from '../models/User';
import { generateSlides } from '../services/openai.service';
import { generatePptx } from '../services/pptx.service';
import { AuthRequest } from '../types';

const GUEST_LIMIT = parseInt(process.env.GUEST_FREE_LIMIT || '3', 10);
const TEACHER_LIMIT = parseInt(process.env.TEACHER_FREE_LIMIT || '5', 10);

export const generateGuest = async (req: Request, res: Response): Promise<void> => {
  const guestId = req.headers['x-guest-id'] as string;
  if (!guestId) {
    res.status(400).json({ success: false, message: 'Guest ID required' });
    return;
  }

  const { topic, gradeLevel = 'Elementary' } = req.body;
  if (!topic || !topic.trim()) {
    res.status(400).json({ success: false, message: 'Topic is required' });
    return;
  }

  let session = await GuestSession.findOne({ guestId });
  if (!session) {
    session = await GuestSession.create({ guestId, generationCount: 0 });
  }

  if (session.generationCount >= GUEST_LIMIT) {
    res.status(403).json({
      success: false,
      limitReached: true,
      message: "You've used all 3 free tries. Sign in to get 5 more!",
    });
    return;
  }

  const slides = await generateSlides(topic.trim(), gradeLevel);
  const { filePath, fileName, fileUrl } = await generatePptx(slides, topic.trim(), gradeLevel);

  await Generation.create({
    userId: null,
    guestId,
    topic: topic.trim(),
    gradeLevel,
    slideCount: slides.length,
    filePath,
    fileName,
  });

  session.generationCount += 1;
  session.lastUsed = new Date();
  await session.save();

  const remainingTries = GUEST_LIMIT - session.generationCount;
  res.json({ success: true, fileUrl, fileName, slidesGenerated: slides.length, remainingTries });
};

export const generateAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  const { topic, gradeLevel = 'Elementary' } = req.body;
  if (!topic || !topic.trim()) {
    res.status(400).json({ success: false, message: 'Topic is required' });
    return;
  }

  const user = await User.findById(req.user?._id || (req.user as { id?: string })?.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    return;
  }

  const now = new Date();
  const isSubscribedActive = user.isSubscribed && user.subscriptionExpiry && user.subscriptionExpiry > now;

  if (!isSubscribedActive && user.generationCount >= TEACHER_LIMIT) {
    res.status(403).json({
      success: false,
      limitReached: true,
      needsSubscription: true,
      message: "You've used all 5 free generations. Subscribe via GCash to continue!",
    });
    return;
  }

  const slides = await generateSlides(topic.trim(), gradeLevel);
  const { filePath, fileName, fileUrl } = await generatePptx(slides, topic.trim(), gradeLevel);

  await Generation.create({
    userId: user._id,
    guestId: null,
    topic: topic.trim(),
    gradeLevel,
    slideCount: slides.length,
    filePath,
    fileName,
  });

  if (!isSubscribedActive) {
    user.generationCount += 1;
    if (!user.billingCycleStart) {
      user.billingCycleStart = now;
    }
    await user.save();
  }

  const remainingTries = isSubscribedActive ? null : TEACHER_LIMIT - user.generationCount;
  res.json({ success: true, fileUrl, fileName, slidesGenerated: slides.length, remainingTries });
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || (req.user as { id?: string })?.id;
  const generations = await Generation.find({ userId }).sort({ createdAt: -1 });
  const serverUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace('5173', '5000') : 'http://localhost:5000';

  const result = generations.map((g) => ({
    _id: g._id,
    topic: g.topic,
    gradeLevel: g.gradeLevel,
    fileName: g.fileName,
    fileUrl: `${serverUrl}/files/${g.fileName}`,
    slideCount: g.slideCount,
    createdAt: g.createdAt,
  }));

  res.json({ success: true, generations: result });
};

export const getQuota = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?._id || (req.user as { id?: string })?.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const now = new Date();
  const isSubscribedActive = user.isSubscribed && user.subscriptionExpiry && user.subscriptionExpiry > now;
  const remainingTries = isSubscribedActive ? null : Math.max(0, TEACHER_LIMIT - user.generationCount);

  res.json({
    success: true,
    generationCount: user.generationCount,
    freeLimit: TEACHER_LIMIT,
    isSubscribed: isSubscribedActive,
    subscriptionExpiry: user.subscriptionExpiry,
    remainingTries,
  });
};

export const getGuestQuota = async (req: Request, res: Response): Promise<void> => {
  const guestId = req.headers['x-guest-id'] as string;
  if (!guestId) {
    res.json({ success: true, generationCount: 0, freeLimit: GUEST_LIMIT, remainingTries: GUEST_LIMIT });
    return;
  }

  const session = await GuestSession.findOne({ guestId });
  const count = session?.generationCount || 0;
  res.json({
    success: true,
    generationCount: count,
    freeLimit: GUEST_LIMIT,
    remainingTries: Math.max(0, GUEST_LIMIT - count),
  });
};
