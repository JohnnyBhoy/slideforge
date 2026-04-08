import { Router, RequestHandler } from 'express';
import {
  generateGuest,
  generateAuth,
  getHistory,
  getQuota,
  getGuestQuota,
} from '../controllers/generator.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const h = (fn: Function): RequestHandler => fn as RequestHandler;

router.post('/', generateGuest);
router.post('/auth', h(verifyToken), h(requireRole('teacher')), h(generateAuth));
router.get('/history', h(verifyToken), h(requireRole('teacher')), h(getHistory));
router.get('/quota', h(verifyToken), h(requireRole('teacher')), h(getQuota));
router.get('/guest-quota', getGuestQuota);

export default router;
