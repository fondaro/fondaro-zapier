import type {
  BeforeRequestMiddleware,
  Bundle,
  ZObject,
} from 'zapier-platform-core';

/** Production origin. Public versions never override it. */
export const PROD_BASE_URL = 'https://api.fondaro.com';

/**
 * The OAuth resource indicator. Always the production constant, even when
 * `FONDARO_BASE_URL` points the app at the dev tunnel: the dev API issues
 * tokens for the same resource string.
 */
export const INTEGRATIONS_RESOURCE = 'https://api.fondaro.com/integrations/v1';

const API_PREFIX = '/integrations/v1';

/**
 * `process.env.FONDARO_BASE_URL` (private dev versions only) or production,
 * without a trailing slash.
 */
export const baseUrl = (): string => {
  const override = process.env.FONDARO_BASE_URL?.trim();
  return (override ? override : PROD_BASE_URL).replace(/\/+$/, '');
};

/**
 * Where the browser is sent to approve the connection. Private dev versions can
 * set `FONDARO_AUTHORIZE_BASE_URL` (e.g. `http://localhost:3001`) so the consent
 * binding cookie lands on the same site as the dev consent page; the code
 * exchange and API calls still go through `FONDARO_BASE_URL`.
 */
export const authorizeBaseUrl = (): string => {
  const override = process.env.FONDARO_AUTHORIZE_BASE_URL?.trim();
  return override ? override.replace(/\/+$/, '') : baseUrl();
};

/** URL-encode one path segment (ids, names). */
export const seg = (value: string | number): string =>
  encodeURIComponent(String(value));

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface FondaroRequestOptions {
  /** Query string values. `undefined`, `null` and empty strings are dropped; arrays are comma-joined. */
  params?: Record<string, unknown>;
  /** JSON body. `undefined` keys are dropped by JSON serialisation. */
  body?: unknown;
  /**
   * `'empty'`: a 404 returns `null` (searches, hook hydration). Default: a 404
   * throws "<subject> was not found in your Fondaro CRM."
   */
  notFound?: 'empty' | 'throw';
  /** Names the record in the 404 message, e.g. `Lead 123`. */
  subject?: string;
}

/** API messages are a string or a class-validator array of strings. */
export const apiMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') {
    return typeof data === 'string' && data.trim() ? data.trim() : undefined;
  }
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) {
    const joined = message.filter((m) => typeof m === 'string').join('; ');
    return joined || undefined;
  }
  if (typeof message === 'string' && message.trim()) return message.trim();
  const error = (data as { error?: unknown }).error;
  return typeof error === 'string' && error.trim() ? error.trim() : undefined;
};

const cleanParams = (params?: Record<string, unknown>) => {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value.join(',');
      continue;
    }
    out[key] = value as string | number | boolean;
  }
  return out;
};

/**
 * The one request helper. `path` is relative to `/integrations/v1`
 * (`'/leads/12'`). Every module calls this; nothing builds a request inline.
 *
 * Returns the parsed JSON body (`null` on a 404 when `notFound: 'empty'`).
 * Errors (docs/plans/2026-10-23-zapier-parity/03-zapier-app.md §5):
 * 401 → RefreshAuthError; 403 → Error with the API message; 404 → null or a
 * named Error; 400/409/422 → Error with the (joined) API message, which also
 * carries the subscription-cap text; 429 and 5xx → left to core.
 */
export async function fondaro<T = any>(
  z: ZObject,
  bundle: Bundle,
  method: HttpMethod,
  path: string,
  options: FondaroRequestOptions & { notFound: 'empty' },
): Promise<T | null>;
export async function fondaro<T = any>(
  z: ZObject,
  bundle: Bundle,
  method: HttpMethod,
  path: string,
  options?: FondaroRequestOptions,
): Promise<T>;
export async function fondaro<T = any>(
  z: ZObject,
  bundle: Bundle,
  method: HttpMethod,
  path: string,
  options: FondaroRequestOptions = {},
): Promise<T | null> {
  const hasBody = options.body !== undefined;
  const response = await z.request({
    url: `${baseUrl()}${API_PREFIX}${path}`,
    method,
    params: cleanParams(options.params),
    headers: hasBody ? { 'Content-Type': 'application/json' } : {},
    body: hasBody ? JSON.stringify(options.body) : undefined,
    skipThrowForStatus: true,
  });

  const { status } = response;
  if (status >= 200 && status < 300) {
    return (response.data ?? null) as T | null;
  }

  const message = apiMessage(response.data);

  if (status === 401) throw new z.errors.RefreshAuthError();
  if (status === 403) {
    throw new z.errors.Error(
      message ?? 'Fondaro refused this request.',
      'Forbidden',
      403,
    );
  }
  if (status === 404) {
    if (options.notFound === 'empty') return null;
    throw new z.errors.Error(
      `${options.subject ?? 'That record'} was not found in your Fondaro CRM.`,
      'NotFound',
      404,
    );
  }
  if (status === 400 || status === 409 || status === 422) {
    throw new z.errors.Error(
      message ?? 'Fondaro could not accept this request.',
      status === 409 ? 'Conflict' : 'BadRequest',
      status,
    );
  }
  // 429 is thrown earlier by core (ThrottledError, honours Retry-After);
  // 5xx and anything unmapped become core's ResponseError.
  response.throwForStatus();
  return (response.data ?? null) as T | null;
}

/**
 * beforeRequest middleware: bearer token and JSON accept. Token-endpoint
 * requests skip it, because the server rejects a request that carries both a
 * bearer header and `client_secret_post` credentials.
 */
export const includeBearerToken: BeforeRequestMiddleware = (
  request,
  _z,
  bundle,
) => {
  request.headers = request.headers ?? {};
  request.headers.Accept = request.headers.Accept ?? 'application/json';
  const isTokenRequest = request.url?.startsWith(`${baseUrl()}/oauth/`);
  if (!isTokenRequest && bundle.authData?.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};
