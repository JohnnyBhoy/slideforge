import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { AuthRequest } from '../types';

function signToken(id: string, role: string): string {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}

export const googleCallback = (req: Request, res: Response): void => {
  const user = req.user as { _id: string; role?: string } | undefined;
  if (!user) {
    res.redirect(`${process.env.CLIENT_URL}?error=auth_failed`);
    return;
  }
  const token = signToken(user._id.toString(), user.role || 'teacher');
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password required' });
    return;
  }

  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.comparePassword(password))) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = signToken(admin._id.toString(), 'admin');
  res.json({
    success: true,
    token,
    user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
};

export const getMe = (req: AuthRequest, res: Response): void => {
  res.json({ success: true, user: req.user });
};

export const logout = (_req: AuthRequest, res: Response): void => {
  res.json({ success: true, message: 'Logged out successfully' });
};
