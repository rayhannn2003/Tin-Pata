import type { Response } from 'express';
import { STATUS_BY_CODE, type AIErrorBody, type AIErrorCode } from '../types/ai';

/**
 * Every error the AI API returns has the same shape, so the clients can map a code to
 * a friendly message without parsing prose:
 *
 *   { "error": { "code": "rate_limited", "message": "Too many requests..." } }
 */
export function sendAIError(
  res: Response,
  code: AIErrorCode,
  message: string,
): void {
  const body: AIErrorBody = { error: { code, message } };
  res.status(STATUS_BY_CODE[code]).json(body);
}
