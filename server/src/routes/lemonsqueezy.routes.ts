import { Router, RequestHandler } from 'express';
import { createLSCheckout, lsWebhook, verifyLSOrder } from '../controllers/lemonsqueezy.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const h = (fn: Function): RequestHandler => fn as RequestHandler;

// Webhook needs raw body — mounted with express.raw() in server.ts
router.post('/webhook', h(lsWebhook));

router.post('/create-checkout', h(verifyToken), h(requireRole('teacher')), h(createLSCheckout));
router.get('/verify', h(verifyToken), h(requireRole('teacher')), h(verifyLSOrder));

export default router;
