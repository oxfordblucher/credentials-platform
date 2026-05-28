import { Router, Request, Response, NextFunction } from 'express';
import { processExpirationAlerts } from '../services/expirationAlert.serv.js';

const router = Router();

function requireInternalSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.INTERNAL_CRON_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

router.post('/expiration-alerts', requireInternalSecret, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await processExpirationAlerts();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
