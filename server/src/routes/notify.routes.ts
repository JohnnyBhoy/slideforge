import { Router, RequestHandler } from 'express';
import { notifyPayment } from '../controllers/notify.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const h = (fn: Function): RequestHandler => fn as RequestHandler;

router.post('/payment', h(verifyToken), h(requireRole('teacher')), h(notifyPayment));

export default router;
