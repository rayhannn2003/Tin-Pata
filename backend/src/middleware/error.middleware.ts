import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { sendAIError } from '../utils/respond';

/** 404 for anything the routers did not claim. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'invalid_request', message: 'Not found.' },
  });
}

/**
 * Terminal error handler.
 *
 * Clients get a generic message; the stack goes to the server log only. Leaking an
 * internal error string would expose file paths and dependency versions.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // A malformed JSON body surfaces here from express.json().
  const isBodyParseError =
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed';

  const isTooLarge =
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large';

  if (isBodyParseError) {
    sendAIError(res, 'invalid_request', 'Invalid request body.');
    return;
  }

  if (isTooLarge) {
    sendAIError(
      res,
      'text_too_long',
      'This selection is too large. Select a smaller passage.',
    );
    return;
  }

  logger.error('unhandled error', {
    requestId: req.requestId,
    path: req.path,
    detail: err instanceof Error ? err.message : 'unknown error',
  });

  if (res.headersSent) {
    return;
  }
  sendAIError(res, 'unknown', 'Something went wrong. Please try again.');
}
