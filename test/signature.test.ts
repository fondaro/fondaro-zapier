import { describe, expect, it } from 'vitest';

import {
  FRESHNESS_WINDOW_SECONDS,
  findHeader,
  verifyFondaroSignature,
} from '../src/lib/signature.js';
import { sign } from './helpers.js';

const SECRET = 'subscription-secret';
const BODY = JSON.stringify({
  event: 'lead.tagged',
  deliveryId: 'd-1',
  occurredAt: '2026-10-23T10:00:00.000Z',
  data: { leadId: 7, tagId: 't-1' },
});
const NOW = 1_800_000_000;

const bundleWith = (
  headers: Record<string, string>,
  overrides: { content?: string; subscribeData?: unknown } = {},
) => ({
  subscribeData:
    'subscribeData' in overrides
      ? overrides.subscribeData
      : { id: 'sub-1', secret: SECRET },
  rawRequest: { content: overrides.content ?? BODY, headers },
});

const goodHeaders = (timestamp = NOW) => ({
  'Http-X-Fondaro-Signature': sign(SECRET, timestamp, BODY),
  'Http-X-Fondaro-Timestamp': String(timestamp),
});

describe('verifyFondaroSignature', () => {
  it('accepts a correctly signed, fresh delivery', () => {
    expect(verifyFondaroSignature(bundleWith(goodHeaders()), NOW)).toEqual({
      ok: true,
    });
  });

  it('accepts the digest without the sha256= prefix', () => {
    const headers = goodHeaders();
    headers['Http-X-Fondaro-Signature'] = headers[
      'Http-X-Fondaro-Signature'
    ].replace('sha256=', '');
    expect(verifyFondaroSignature(bundleWith(headers), NOW)).toEqual({ ok: true });
  });

  it('rejects a tampered body', () => {
    const result = verifyFondaroSignature(
      bundleWith(goodHeaders(), { content: BODY.replace('t-1', 't-2') }),
      NOW,
    );
    expect(result).toEqual({ ok: false, reason: 'Signature does not match' });
  });

  it('rejects the wrong secret', () => {
    const result = verifyFondaroSignature(
      bundleWith(goodHeaders(), { subscribeData: { id: 's', secret: 'other' } }),
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a missing secret', () => {
    const result = verifyFondaroSignature(
      bundleWith(goodHeaders(), { subscribeData: { id: 's' } }),
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a stale timestamp, even when correctly signed', () => {
    const stale = NOW - FRESHNESS_WINDOW_SECONDS - 1;
    const result = verifyFondaroSignature(bundleWith(goodHeaders(stale)), NOW);
    expect(result).toEqual({
      ok: false,
      reason: 'Delivery timestamp is outside the allowed freshness window',
    });
  });

  it('accepts a timestamp exactly at the edge of the window', () => {
    const edge = NOW - FRESHNESS_WINDOW_SECONDS;
    expect(verifyFondaroSignature(bundleWith(goodHeaders(edge)), NOW).ok).toBe(true);
  });

  it('rejects a timestamp too far in the future', () => {
    const future = NOW + FRESHNESS_WINDOW_SECONDS + 1;
    expect(verifyFondaroSignature(bundleWith(goodHeaders(future)), NOW).ok).toBe(false);
  });

  it('rejects missing headers and a non-integer timestamp', () => {
    expect(verifyFondaroSignature(bundleWith({}), NOW).ok).toBe(false);
    expect(
      verifyFondaroSignature(
        bundleWith({
          'Http-X-Fondaro-Signature': 'sha256=00',
          'Http-X-Fondaro-Timestamp': 'yesterday',
        }),
        NOW,
      ),
    ).toEqual({ ok: false, reason: 'Invalid timestamp header' });
  });

  it('rejects a malformed digest without throwing', () => {
    const result = verifyFondaroSignature(
      bundleWith({
        'Http-X-Fondaro-Signature': 'sha256=not-hex',
        'Http-X-Fondaro-Timestamp': String(NOW),
      }),
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it('finds headers whatever their casing or Http- prefix', () => {
    const variants = [
      ['Http-X-Fondaro-Signature', 'Http-X-Fondaro-Timestamp'],
      ['http-x-fondaro-signature', 'http-x-fondaro-timestamp'],
      ['HTTP-X-FONDARO-SIGNATURE', 'HTTP-X-FONDARO-TIMESTAMP'],
      ['X-Fondaro-Signature', 'X-Fondaro-Timestamp'],
      ['x-fondaro-signature', 'x-fondaro-timestamp'],
    ] as const;
    for (const [sigKey, tsKey] of variants) {
      const headers = {
        [sigKey]: sign(SECRET, NOW, BODY),
        [tsKey]: String(NOW),
      };
      expect(verifyFondaroSignature(bundleWith(headers), NOW)).toEqual({ ok: true });
    }
  });
});

describe('findHeader', () => {
  it('returns undefined for an absent header', () => {
    expect(findHeader({ 'Content-Type': 'x' }, 'x-fondaro-event')).toBeUndefined();
    expect(findHeader(undefined, 'x-fondaro-event')).toBeUndefined();
  });
});
