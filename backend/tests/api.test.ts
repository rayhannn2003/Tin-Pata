import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';

// Set before importing the app: config/env reads process.env once, at module load.
// Fake values only — these tests never reach Supabase or OpenAI.
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.AI_USAGE_LOGGING = '0';
process.env.NODE_ENV = 'test';

/** `Response.json()` is `unknown` under strict TS; these tests know their own shapes. */
interface ErrorBody {
  error: { code: string; message: string };
}

interface HealthBody {
  status: string;
  service: string;
  timestamp: string;
  dependencies: { supabase: boolean; openai: boolean };
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

let server: Server;
let baseUrl: string;

before(async () => {
  const { createApp } = await import('../src/app');
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server?.close();
});

describe('GET /health', () => {
  it('reports ok without leaking configuration values', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);

    const body = await json<HealthBody>(response);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'tin-pata-api');
    assert.equal(typeof body.timestamp, 'string');

    // Presence booleans only — never the URL or any part of a key.
    assert.deepEqual(body.dependencies, { supabase: true, openai: true });
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes('test-openai-key'), false);
    assert.equal(serialized.includes('example.supabase.co'), false);
  });
});

describe('POST /api/ai/explain', () => {
  const body = { text: 'A reasonably long passage to explain.', mode: 'simple_english' };

  it('returns 401 when the Authorization header is missing', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 401);

    const payload = await json<ErrorBody>(response);
    assert.equal(payload.error.code, 'unauthorized');
  });

  it('returns 401 when the Authorization header is not a Bearer token', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic abc123' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 401);
  });

  it('authenticates before validating, so an invalid body still needs a token', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'nonsense' }),
    });
    assert.equal(response.status, 401);
  });

  it('rejects GET on the explain route', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`);
    assert.equal(response.status, 404);
  });
});

describe('error handling', () => {
  it('returns a structured 404 for an unknown route', async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    assert.equal(response.status, 404);

    const payload = await json<ErrorBody>(response);
    assert.equal(payload.error.code, 'invalid_request');
  });

  it('echoes a sanitised X-Request-Id', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'abc-123"evil' },
    });
    assert.equal(response.headers.get('x-request-id'), 'abc-123evil');
  });

  it('generates a request id when none is supplied', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/);
  });
});
