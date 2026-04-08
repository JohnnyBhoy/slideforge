import { Router, Response, RequestHandler } from 'express';
import passport from 'passport';
import { googleCallback, adminLogin, getMe, logout } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import User from '../models/User';
import { AuthRequest } from '../types';

const router = Router();
const h = (fn: Function): RequestHandler => fn as RequestHandler;

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}?error=auth_failed` }),
  googleCallback as RequestHandler
);

router.post('/admin/login', adminLogin);
router.get('/me', h(verifyToken), h(getMe));
router.post('/logout', h(verifyToken), h(logout));

router.put(
  '/profile',
  h(verifyToken),
  h(requireRole('teacher')),
  (async (req: AuthRequest, res: Response): Promise<void> => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Name required' });
      return;
    }
    const user = await User.findByIdAndUpdate(req.user?._id, { name: name.trim() }, { new: true });
    res.json({ success: true, user });
  }) as RequestHandler
);

export default router;
