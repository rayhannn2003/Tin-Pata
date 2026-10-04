import { Router } from 'express';
import { config, isOpenAIConfigured, isSupabaseConfigured } from '../config/env';

/**
 * Liveness endpoint used by CI/CD after a deploy and by any uptime monitor.
 *
 * It reports whether required configuration is *present*, never what it contains:
 * no URLs, no key fragments, no paths, no dependency versions.
 */
const router: Router = Router();

const startedAt = Date.now();

router.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    service: 'tin-pata-api',
    version: config.version,
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    // Booleans only — enough to diagnose a bad deploy, useless to an attacker.
    dependencies: {
      supabase: isSupabaseConfigured(),
      openai: isOpenAIConfigured(),
    },
  });
});

export default router;
