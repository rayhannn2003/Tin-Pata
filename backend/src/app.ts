import express, { type Express } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { requestId } from './middleware/request-id.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';
import aiRoutes from './routes/ai.routes';
import healthRoutes from './routes/health.routes';

/**
 * Express application, separated from `server.ts` so tests can mount it without
 * binding a port.
 */

/** Rejects a body large enough to be an attack before it is parsed. */
const MAX_BODY_BYTES = 256 * 1024;

/**
 * Browser callers are restricted to the configured origins. Native mobile clients
 * send no Origin header at all and are unaffected by CORS — their gate is the
 * Supabase token, checked on every request.
 *
 * With no allowlist configured we fall back to reflecting the request origin, which
 * is the permissive development default. `credentials` stays false throughout: the
 * clients authenticate with an Authorization header, not a cookie, so the browser is
 * never asked to attach ambient credentials cross-origin.
 */
function corsOptions(): cors.CorsOptions {
  if (config.allowedOrigins.length === 0) {
    return { origin: true, credentials: false };
  }
  return {
    origin: config.allowedOrigins,
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    maxAge: 86_400,
  };
}

export function createApp(): Express {
  const app = express();

  // Behind Nginx: trust exactly one proxy hop so req.ip is the real client.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: MAX_BODY_BYTES }));

  app.use('/health', healthRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
