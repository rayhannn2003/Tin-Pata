import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { sendAIError } from '../utils/respond';

/**
 * Per-user fixed-window rate limiting, held in this process's memory.
 *
 * Scope and limits:
 * - Keyed by the authenticated Supabase user id, so it must run AFTER requireAuth.
 *   Keying on IP would punish everyone behind one NAT and would be trivially evaded.
 * - One PM2 fork holds the whole counter today. If the API is ever scaled to cluster
 *   mode or a second host, each process would keep its own window and the effective
 *   limit would multiply — that is the point at which this should move to Redis.
 *
 * The `RateLimitStore` interface below is the seam for that swap: implement it against
 * Redis and pass it to `createRateLimiter` — no caller changes.
 */

export interface RateLimitDecision {
  allowed: boolean;
  /** Seconds until the caller may retry. Only meaningful when `allowed` is false. */
  retryAfterSeconds: number;
}

export interface RateLimitStore {
  hit(key: string, now: number): RateLimitDecision | Promise<RateLimitDecision>;
}

/** Bounds memory if a very large number of distinct users appear in one window. */
const MAX_TRACKED_KEYS = 5_000;

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  hit(key: string, now: number): RateLimitDecision {
    if (this.hits.size > MAX_TRACKED_KEYS) {
      this.hits.clear();
    }

    const window = (this.hits.get(key) ?? []).filter(
      (at) => now - at < this.windowMs,
    );

    if (window.length >= this.maxRequests) {
      this.hits.set(key, window);
      const oldest = window[0] ?? now;
      const retryAfterMs = Math.max(0, this.windowMs - (now - oldest));
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    window.push(now);
    this.hits.set(key, window);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function createRateLimiter(store: RateLimitStore) {
  return async function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const key = req.auth?.userId;
    if (!key) {
      // requireAuth must run first; without an identity there is nothing to limit on.
      sendAIError(res, 'unauthorized', 'Sign in to use Tin Pata AI.');
      return;
    }

    const decision = await store.hit(key, Date.now());
    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds));
      logger.warn('rate limited', { requestId: req.requestId, userId: key });
      sendAIError(res, 'rate_limited', 'Too many requests. Try again shortly.');
      return;
    }

    next();
  };
}

/** The limiter used by the AI routes. Window and ceiling come from env. */
export const aiRateLimit = createRateLimiter(
  new MemoryRateLimitStore(config.rateLimitWindowMs, config.rateLimitMaxRequests),
);
