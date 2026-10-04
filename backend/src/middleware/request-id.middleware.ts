import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlates every log line for one request. Echoed back as `X-Request-Id`. */
      requestId: string;
      /** Set by requireAuth. Absent on unauthenticated routes. */
      auth?: { userId: string; accessToken: string };
    }
  }
}

/**
 * Assigns a request id. An inbound `X-Request-Id` is accepted so a trace can span
 * Nginx and the app, but it is length-capped and stripped of anything that could
 * forge a new field in a JSON log line.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header('x-request-id')?.replace(/[^\w.-]/g, '').slice(0, 64);
  req.requestId = inbound || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
