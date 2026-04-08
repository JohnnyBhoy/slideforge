import { Router, Request, Response } from 'express';

const router = Router();

router.get('/payment', (_req: Request, res: Response): void => {
  res.json({
    gcashNumber: process.env.GCASH_NUMBER || '09XX-XXX-XXXX',
    gcashAccountName: process.env.GCASH_ACCOUNT_NAME || 'Class Generator',
    monthlyPrice: parseInt(process.env.MONTHLY_PRICE || '299', 10),
    threeMonthPrice: parseInt(process.env.THREE_MONTH_PRICE || '799', 10),
  });
});

export default router;
