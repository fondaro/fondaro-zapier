import { createHmac, timingSafeEqual } from 'node:crypto';

/** Deliveries older (or newer) than this many seconds are rejected. */
export const FRESHNESS_WINDOW_SECONDS = 300;

export type SignatureResult = { ok: true } | { ok: false; reason: string };

interface SignedBundle {
  rawRequest?: { headers?: Record<string, string>; content?: string };
  subscribeData?: unknown;
}

/**
 * Zapier hands incoming headers over `Http-` prefixed and Camel-Cased
 * (`Http-X-Fondaro-Signature`). Match case-insensitively, with or without the
 * prefix. `name` is the lowercase wire name (`x-fondaro-signature`).
 */
export const findHeader = (
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined => {
  for (const [key, value] of Object.entries(headers ?? {})) {
    const normalised = key.toLowerCase().replace(/^http-/, '');
    if (normalised === name) return value;
  }
  return undefined;
};

/**
 * Verify a Fondaro delivery exactly as the API signs it
 * (`apps/api/src/webhooks/webhook-signing.ts`): HMAC-SHA256, hex, over
 * `${timestampSeconds}.${rawBody}` with the subscription secret, sent as
 * `X-Fondaro-Signature: sha256=<hex>` beside `X-Fondaro-Timestamp`.
 * Constant-time compare, 5-minute window. The secret is the `secret` the
 * subscribe call returned (`bundle.subscribeData.secret`).
 */
export function verifyFondaroSignature(
  bundle: SignedBundle,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SignatureResult {
  const secret = (bundle.subscribeData as { secret?: unknown } | undefined)
    ?.secret;
  if (typeof secret !== 'string' || !secret) {
    return { ok: false, reason: 'No signing secret in the subscription data' };
  }

  const content = bundle.rawRequest?.content;
  if (typeof content !== 'string') {
    return { ok: false, reason: 'No raw request body to verify' };
  }

  const headers = bundle.rawRequest?.headers;
  const signatureHeader = findHeader(headers, 'x-fondaro-signature');
  const timestampHeader = findHeader(headers, 'x-fondaro-timestamp');
  if (!signatureHeader || !timestampHeader) {
    return { ok: false, reason: 'Missing signature or timestamp header' };
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isInteger(timestamp)) {
    return { ok: false, reason: 'Invalid timestamp header' };
  }
  if (Math.abs(nowSeconds - timestamp) > FRESHNESS_WINDOW_SECONDS) {
    return {
      ok: false,
      reason: 'Delivery timestamp is outside the allowed freshness window',
    };
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestampHeader}.${content}`)
    .digest();
  const providedHex = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader;
  const provided = Buffer.from(providedHex, 'hex');
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return { ok: false, reason: 'Signature does not match' };
  }
  return { ok: true };
}
