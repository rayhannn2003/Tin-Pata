import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../config/supabase';
import { isSupabaseConfigured } from '../config/env';
import { logger } from '../utils/logger';
import { sendAIError } from '../utils/respond';

/**
 * Establishes who the caller is, from their Supabase access token alone.
 *
 * Nothing about identity is ever read from the request body: no `user_id`, no
 * `email`, no ownership claim. The token is verified against Supabase Auth on every
 * request, so a revoked session stops working immediately.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    logger.error('auth unavailable', {
      requestId: req.requestId,
      detail: 'supabase env missing',
    });
    sendAIError(res, 'server_misconfigured', 'AI explanation is temporarily unavailable.');
    return;
  }

  const header = req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const accessToken = match?.[1]?.trim();

  if (!accessToken) {
    sendAIError(res, 'unauthorized', 'Sign in to use Tin Pata AI.');
    return;
  }

  const result = await verifyAccessToken(accessToken);
  if (!result.ok) {
    // Reason is logged, never returned — it would tell an attacker why a token failed.
    logger.warn('auth rejected', { requestId: req.requestId, detail: result.reason });
    sendAIError(res, 'unauthorized', 'Sign in to use Tin Pata AI.');
    return;
  }

  req.auth = { userId: result.user.id, accessToken };
  next();
}
