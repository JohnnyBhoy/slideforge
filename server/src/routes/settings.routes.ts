import { Router, Request, Response } from 'express';

const router = Router();

router.get('/payment', (_req: Request, res: Response): void => {
  res.json({
    gcashNumber: process.env.GCASH_NUMBER || '0930-255-5359',
    gcashAccountName: process.env.GCASH_ACCOUNT_NAME || 'SlideForge',
    monthlyPrice: parseInt(process.env.MONTHLY_PRICE || '299', 10),
    threeMonthPrice: parseInt(process.env.THREE_MONTH_PRICE || '799', 10),
    monthlyPriceUsd: parseInt(process.env.MONTHLY_PRICE_USD || '5', 10),
    threeMonthPriceUsd: parseInt(process.env.THREE_MONTH_PRICE_USD || '13', 10),
    lsEnabled: !!(
      process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_STORE_ID !== '12345' &&
      process.env.LEMONSQUEEZY_VARIANT_MONTHLY &&
      !process.env.LEMONSQUEEZY_VARIANT_MONTHLY.includes('your_') &&
      process.env.LEMONSQUEEZY_VARIANT_QUARTERLY &&
      !process.env.LEMONSQUEEZY_VARIANT_QUARTERLY.includes('your_')
    ),
  });
});

export default router;
