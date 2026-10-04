import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemoryRateLimitStore } from '../src/middleware/rate-limit.middleware';

describe('MemoryRateLimitStore', () => {
  it('allows requests up to the ceiling and blocks the next one', () => {
    const store = new MemoryRateLimitStore(60_000, 3);
    const now = Date.now();

    for (let i = 0; i < 3; i += 1) {
      assert.equal(store.hit('user-a', now).allowed, true, `request ${i + 1}`);
    }
    assert.equal(store.hit('user-a', now).allowed, false);
  });

  it('keeps each user in a separate window', () => {
    const store = new MemoryRateLimitStore(60_000, 1);
    const now = Date.now();

    assert.equal(store.hit('user-a', now).allowed, true);
    assert.equal(store.hit('user-a', now).allowed, false);
    // One user exhausting their quota must not affect anybody else.
    assert.equal(store.hit('user-b', now).allowed, true);
  });

  it('lets the window expire', () => {
    const store = new MemoryRateLimitStore(1_000, 1);
    const now = Date.now();

    assert.equal(store.hit('user-a', now).allowed, true);
    assert.equal(store.hit('user-a', now + 500).allowed, false);
    assert.equal(store.hit('user-a', now + 1_500).allowed, true);
  });

  it('reports a positive retry-after when blocking', () => {
    const store = new MemoryRateLimitStore(10_000, 1);
    const now = Date.now();

    store.hit('user-a', now);
    const decision = store.hit('user-a', now + 2_000);
    assert.equal(decision.allowed, false);
    assert.ok(decision.retryAfterSeconds >= 1 && decision.retryAfterSeconds <= 10);
  });
});
