import { createApp } from './app';
import { config, missingRequiredEnv } from './config/env';
import { logger } from './utils/logger';

/**
 * Process entry point: bind the port, log a startup line, and shut down cleanly so
 * `pm2 reload` swaps processes without dropping an in-flight AI request.
 */

const app = createApp();

const missing = missingRequiredEnv();
if (missing.length > 0) {
  // Names only, never values. The service still starts so /health can report the
  // problem rather than leaving CI with an unexplained connection refused.
  logger.error('missing required environment variables', {
    variables: missing.join(','),
  });
}

const server = app.listen(config.port, () => {
  logger.info('tin-pata-api listening', {
    port: config.port,
    environment: config.nodeEnv,
    version: config.version,
  });
});

// AI calls can run for up to 60s; keep the socket open longer than that.
server.keepAliveTimeout = 75_000;
server.headersTimeout = 80_000;
server.requestTimeout = 90_000;

function shutdown(signal: string): void {
  logger.info('shutting down', { signal });
  server.close(() => process.exit(0));
  // Do not hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 15_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
