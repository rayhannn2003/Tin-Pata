import type { Request, Response } from 'express';
import { validateExplainRequest } from '../schemas/ai.schema';
import { explain } from '../services/ai.service';
import { logger } from '../utils/logger';
import { sendAIError } from '../utils/respond';

/**
 * HTTP concerns only: validate the body, delegate, shape the response.
 * No OpenAI call, no prompt, and no Supabase query lives here.
 */
export async function explainTextController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = validateExplainRequest(req.body);
  if (!validation.ok) {
    logger.info('ai.explain rejected', {
      requestId: req.requestId,
      status: validation.code,
    });
    sendAIError(res, validation.code, validation.message);
    return;
  }

  // requireAuth guarantees this; the check keeps the type honest.
  const auth = req.auth;
  if (!auth) {
    sendAIError(res, 'unauthorized', 'Sign in to use Tin Pata AI.');
    return;
  }

  const outcome = await explain({
    request: validation.request,
    userId: auth.userId,
    accessToken: auth.accessToken,
    requestId: req.requestId,
  });

  if (!outcome.ok) {
    sendAIError(res, outcome.code, outcome.message);
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(outcome.response);
}
