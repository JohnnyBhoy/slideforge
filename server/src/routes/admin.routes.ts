import { Router, RequestHandler } from 'express';
import {
  getStats,
  getUsers,
  getUserById,
  updateUserStatus,
  subscribeUser,
  resetQuota,
  getUserGenerations,
  getAllGenerations,
  getPayments,
  activatePayment,
} from '../controllers/admin.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();

const h = (fn: Function): RequestHandler => fn as RequestHandler;

router.use(h(verifyToken), h(requireRole('admin')));

router.get('/stats', h(getStats));
router.get('/users', h(getUsers));
router.get('/users/:id', h(getUserById));
router.put('/users/:id/status', h(updateUserStatus));
router.put('/users/:id/subscribe', h(subscribeUser));
router.put('/users/:id/reset-quota', h(resetQuota));
router.get('/users/:id/generations', h(getUserGenerations));
router.get('/generations', h(getAllGenerations));
router.get('/payments', h(getPayments));
router.put('/payments/:id/activate', h(activatePayment));

export default router;
