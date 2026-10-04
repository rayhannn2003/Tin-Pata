import { Router } from 'express';
import { explainTextController } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { aiRateLimit } from '../middleware/rate-limit.middleware';

/**
 * AI routes.
 *
 * Order matters and encodes the security model:
 *   authenticate → rate limit (per user) → validate → controller.
 * Rate limiting after auth means the limit is per account, not per IP.
 */
const router: Router = Router();

router.post('/explain', requireAuth, aiRateLimit, explainTextController);

export default router;
