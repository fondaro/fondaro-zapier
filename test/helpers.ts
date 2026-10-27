import { createHmac } from 'node:crypto';

import zapier from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import App from '../src/index.js';

export const appTester = zapier.createAppTester(App);

export const BASE = 'https://api.fondaro.com';
export const API = '/integrations/v1';
export const TOKEN = 'fdr_oat_test_access_token';

/** A bundle carrying the connected account, like a Zap step. */
export const bundle = (extra: Record<string, unknown> = {}) => ({
  authData: { access_token: TOKEN, refresh_token: 'fdr_ort_test_refresh_token' },
  inputData: {},
  ...extra,
});

/** Run an arbitrary `(z, bundle)` function through core's request stack. */
export const run = <T>(
  fn: (z: ZObject, b: Bundle) => Promise<T>,
  extra: Record<string, unknown> = {},
): Promise<T> => appTester((z: ZObject, b: Bundle) => fn(z, b), bundle(extra));

/** Resolve a rejected promise to its error (fails the test if it resolves). */
export const rejection = async (promise: Promise<unknown>): Promise<Error> => {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the promise to reject');
};

/** Sign a body the way the API does (`webhook-signing.ts`). */
export const sign = (secret: string, timestamp: number | string, body: string) =>
  `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')}`;

/** A Zapier hook bundle for a signed Fondaro delivery (`Http-` prefixed, Camel-Cased headers). */
export const signedDelivery = (opts: {
  secret?: string;
  signingSecret?: string;
  body: unknown;
  timestamp?: number;
  extra?: Record<string, unknown>;
}) => {
  const content = JSON.stringify(opts.body);
  const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
  const secret = opts.secret ?? 'subscription-secret';
  return bundle({
    subscribeData: { id: 'sub-1', secret: opts.signingSecret ?? secret },
    rawRequest: {
      method: 'POST',
      querystring: '',
      content,
      headers: {
        'Content-Type': 'application/json',
        'Http-X-Fondaro-Signature': sign(secret, timestamp, content),
        'Http-X-Fondaro-Timestamp': String(timestamp),
        'Http-X-Fondaro-Event': 'lead.tagged',
      },
    },
    ...opts.extra,
  });
};
