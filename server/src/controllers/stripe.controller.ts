import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/User';
import PendingPayment from '../models/PendingPayment';
import { AuthRequest } from '../types';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' as any });
}

// POST /api/stripe/create-checkout-session
export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { months } = req.body as { months: 1 | 3 };
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const priceId = months === 3
    ? process.env.STRIPE_THREE_MONTH_PRICE_ID
    : process.env.STRIPE_MONTHLY_PRICE_ID;

  if (!priceId || priceId.includes('your_')) {
    res.status(503).json({ success: false, message: 'Stripe price IDs not configured yet' });
    return;
  }

  const stripe = getStripe();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${clientUrl}/stripe-success?session_id={CHECKOUT_SESSION_ID}&months=${months}`,
    cancel_url: `${clientUrl}/?stripe=cancelled`,
    metadata: {
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      months: String(months),
    },
  });

  res.json({ success: true, url: session.url });
};

// POST /api/stripe/webhook  (raw body — no JSON parse)
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: any;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature failed:', err);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, months } = session.metadata || {};

    if (userId && months) {
      const user = await User.findById(userId);
      if (user) {
        const monthsNum = parseInt(months, 10);
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + monthsNum);

        user.isSubscribed = true;
        user.subscriptionExpiry = expiry;
        user.generationCount = 0;
        user.billingCycleStart = new Date();
        await user.save();

        // Auto-create activated payment record
        const amountTotal = session.amount_total ? session.amount_total / 100 : undefined;
        await PendingPayment.create({
          userId: user._id,
          email: user.email,
          name: user.name,
          status: 'activated',
          activatedAt: new Date(),
          submittedAt: new Date(),
          paymentMethod: 'stripe',
          amount: amountTotal,
          currency: 'USD',
          months: monthsNum,
          stripeSessionId: session.id,
        });

        console.log(`✅ Stripe: activated ${monthsNum}-month subscription for ${user.email}`);
      }
    }
  }

  res.json({ received: true });
};

// GET /api/stripe/verify-session?session_id=xxx  (called by success page)
// Also activates the subscription here as a fallback in case the webhook hasn't fired yet
// (e.g. local dev where Stripe can't reach localhost). Uses stripeSessionId to prevent duplicates.
export const verifySession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { session_id } = req.query as { session_id: string };
  if (!session_id) {
    res.status(400).json({ success: false, message: 'session_id required' });
    return;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status === 'paid') {
    const { userId, months } = (session.metadata || {}) as { userId?: string; months?: string };

    if (userId && months) {
      // Skip if webhook already processed this session
      const already = await PendingPayment.findOne({ stripeSessionId: session_id });

      if (!already) {
        const user = await User.findById(userId);
        if (user) {
          const monthsNum = parseInt(months, 10);
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + monthsNum);

          user.isSubscribed = true;
          user.subscriptionExpiry = expiry;
          user.generationCount = 0;
          user.billingCycleStart = new Date();
          await user.save();

          const amountTotal = session.amount_total ? session.amount_total / 100 : undefined;
          await PendingPayment.create({
            userId: user._id,
            email: user.email,
            name: user.name,
            status: 'activated',
            activatedAt: new Date(),
            submittedAt: new Date(),
            paymentMethod: 'stripe',
            amount: amountTotal,
            currency: 'USD',
            months: monthsNum,
            stripeSessionId: session_id,
          });

          console.log(`✅ Stripe (verify-session): activated ${monthsNum}-month subscription for ${user.email}`);
        }
      }
    }

    res.json({ success: true, paid: true, customerEmail: session.customer_email });
  } else {
    res.json({ success: true, paid: false });
  }
};
