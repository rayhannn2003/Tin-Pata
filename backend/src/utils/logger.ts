/**
 * Structured JSON logging to stdout, collected by PM2.
 *
 * Deliberately minimal and deliberately incurious: nothing here ever receives the
 * selected passage, the prompt, the model's answer, or a bearer token. Callers pass
 * scalars only — see `docs/AI_BACKEND.md` for what may and may not be logged.
 */

type Level = 'info' | 'warn' | 'error';

export type LogFields = Record<string, string | number | boolean | undefined>;

function emit(level: Level, message: string, fields: LogFields = {}): void {
  const entry = {
    time: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  error: (message: string, fields?: LogFields) => emit('error', message, fields),
};
