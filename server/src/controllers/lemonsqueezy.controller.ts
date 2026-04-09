import { Request, Response } from 'express';
import crypto from 'crypto';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import User from '../models/User';
import PendingPayment from '../models/PendingPayment';
import { AuthRequest } from '../types';

function setupLS() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error('LEMONSQUEEZY_API_KEY not configured');
  lemonSqueezySetup({ apiKey });
}

// POST /api/ls/create-checkout
export const createLSCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { months } = req.body as { months: 1 | 3 };
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = months === 3
    ? process.env.LEMONSQUEEZY_VARIANT_QUARTERLY
    : process.env.LEMONSQUEEZY_VARIANT_MONTHLY;

  if (!storeId || !variantId || variantId.includes('your_') || storeId === '12345') {
    res.status(503).json({ success: false, message: 'LemonSqueezy variant IDs not configured yet' });
    return;
  }

  setupLS();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutOptions: { dark: false },
    checkoutData: {
      email: user.email,
      name: user.name,
      custom: {
        userId: user._id.toString(),
        months: String(months),
      },
    },
    productOptions: {
      redirectUrl: `${clientUrl}/ls-success`,
      receiptButtonText: 'Go to Dashboard',
      receiptThankYouNote: 'Thank you! Your subscription is now active.',
    },
  });

  if (error || !data?.data?.attributes?.url) {
    console.error('LemonSqueezy checkout error:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session' });
    return;
  }

  res.json({ success: true, url: data.data.attributes.url });
};

// POST /api/ls/webhook
export const lsWebhook = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
  const signature = req.headers['x-signature'] as string;

  // Verify HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(req.body as Buffer).digest('hex');

  if (!signature || digest !== signature) {
    console.error('LemonSqueezy webhook signature mismatch');
    res.status(400).send('Invalid signature');
    return;
  }

  const payload = JSON.parse((req.body as Buffer).toString('utf8'));
  const eventName: string = payload.meta?.event_name || '';

  if (eventName === 'order_created') {
    const order = payload.data;
    const status: string = order?.attributes?.status;

    // Only process paid orders
    if (status !== 'paid') {
      res.json({ received: true });
      return;
    }

    const custom = payload.meta?.custom_data || {};
    const userId: string = custom.userId;
    const months: number = parseInt(custom.months || '1', 10);
    const orderTotal: number = order?.attributes?.total ? order.attributes.total / 100 : 0;
    const orderId: string = order?.id || '';

    if (userId) {
      const already = await PendingPayment.findOne({ stripeSessionId: orderId });
      if (!already) {
        const user = await User.findById(userId);
        if (user) {
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + months);

          user.isSubscribed = true;
          user.subscriptionExpiry = expiry;
          user.generationCount = 0;
          user.billingCycleStart = new Date();
          await user.save();

          await PendingPayment.create({
            userId: user._id,
            email: user.email,
            name: user.name,
            status: 'activated',
            activatedAt: new Date(),
            submittedAt: new Date(),
            paymentMethod: 'stripe',     // reusing 'stripe' enum value for card payments
            amount: orderTotal,
            currency: 'USD',
            months,
            stripeSessionId: orderId,    // reusing field for LS order ID
          });

          console.log(`✅ LemonSqueezy: activated ${months}-month subscription for ${user.email}`);
        }
      }
    }
  }

  res.json({ received: true });
};

// GET /api/ls/verify?order_id=xxx
// Called by the success page to activate subscription if webhook hasn't fired yet
export const verifyLSOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { order_id, months: monthsParam } = req.query as { order_id?: string; months?: string };
  const reqUser = req.user;

  if (!order_id || !reqUser) {
    res.status(400).json({ success: false, message: 'order_id required' });
    return;
  }

  const months = parseInt(monthsParam || '1', 10);

  // Skip if webhook already handled it
  const already = await PendingPayment.findOne({ stripeSessionId: order_id });
  if (already) {
    res.json({ success: true, paid: true });
    return;
  }

  // Fetch the User document so we have IUser fields (not the union req.user type)
  const user = await User.findById(reqUser._id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  user.isSubscribed = true;
  user.subscriptionExpiry = expiry;
  user.generationCount = 0;
  user.billingCycleStart = new Date();
  await user.save();

  await PendingPayment.create({
    userId: user._id,
    email: user.email,
    name: user.name,
    status: 'activated',
    activatedAt: new Date(),
    submittedAt: new Date(),
    paymentMethod: 'stripe',
    amount: undefined,
    currency: 'USD',
    months,
    stripeSessionId: order_id,
  });

  console.log(`✅ LemonSqueezy (verify): activated ${months}-month subscription for ${user.email}`);
  res.json({ success: true, paid: true });
};
