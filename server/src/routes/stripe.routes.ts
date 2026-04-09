import { Router, RequestHandler, Request, Response } from 'express';
import { createCheckoutSession, stripeWebhook, verifySession } from '../controllers/stripe.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const h = (fn: Function): RequestHandler => fn as RequestHandler;

// Webhook must use raw body — mounted BEFORE express.json() in server.ts
router.post(
  '/webhook',
  (req: Request, res: Response, next: Function) => {
    // Body is already raw Buffer when we use express.raw() in server.ts
    next();
  },
  h(stripeWebhook)
);

router.post('/create-checkout-session', h(verifyToken), h(requireRole('teacher')), h(createCheckoutSession));
router.get('/verify-session', h(verifyToken), h(requireRole('teacher')), h(verifySession));

export default router;
