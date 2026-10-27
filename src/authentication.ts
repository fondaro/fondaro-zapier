import type { Authentication, Bundle, ZObject } from 'zapier-platform-core';

import {
  INTEGRATIONS_RESOURCE,
  apiMessage,
  authorizeBaseUrl,
  baseUrl,
} from './lib/api.js';

/**
 * Every scope in `apps/api/src/integrations/scopes.ts` (`INTEGRATION_SCOPES`),
 * `viewings:read` included, so the viewing searches work. The consent screen
 * lists each in plain words; Fondaro admins only.
 */
export const INTEGRATION_SCOPES = [
  'leads:read',
  'leads:write',
  'deals:read',
  'deals:write',
  'tasks:write',
  'notes:write',
  'tags:read',
  'tags:write',
  'triggers:subscribe',
  'users:read',
  'viewings:read',
] as const;

const q = encodeURIComponent;

/** Async because the schema types a function `authorizeUrl` as returning a promise. */
const authorizeUrl = async (_z: ZObject, bundle: Bundle) =>
  `${authorizeBaseUrl()}/oauth/authorize` +
  `?client_id=${q(process.env.CLIENT_ID ?? '')}` +
  `&state=${q(String(bundle.inputData.state ?? ''))}` +
  `&redirect_uri=${q(String(bundle.inputData.redirect_uri ?? ''))}` +
  `&response_type=code` +
  `&resource=${q(INTEGRATIONS_RESOURCE)}` +
  `&scope=${q(INTEGRATION_SCOPES.join(' '))}`;

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

/** POST the form body to `/oauth/token` (client_secret_post) and keep the pair. */
const tokenRequest = async (
  z: ZObject,
  body: Record<string, string | undefined>,
  previousRefreshToken?: string,
) => {
  const response = await z.request({
    url: `${baseUrl()}/oauth/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: {
      ...body,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      resource: INTEGRATIONS_RESOURCE,
    },
  });
  const data = response.data as TokenResponse;
  return {
    access_token: data.access_token,
    // Refresh tokens rotate: always keep the newest. A reused old one revokes
    // the whole family on the server.
    refresh_token: data.refresh_token ?? previousRefreshToken,
    ...(data.expires_in !== undefined ? { expires_in: data.expires_in } : {}),
  };
};

/**
 * With `enablePkce` Zapier generates the verifier, sends the challenge on the
 * authorize redirect and passes the verifier to a function-based
 * `getAccessToken` as `bundle.inputData.code_verifier`.
 */
const getAccessToken = (z: ZObject, bundle: Bundle) =>
  tokenRequest(z, {
    grant_type: 'authorization_code',
    code: String(bundle.inputData.code ?? ''),
    redirect_uri: String(bundle.inputData.redirect_uri ?? ''),
    code_verifier: bundle.inputData.code_verifier
      ? String(bundle.inputData.code_verifier)
      : undefined,
  });

const refreshAccessToken = (z: ZObject, bundle: Bundle) =>
  tokenRequest(
    z,
    {
      grant_type: 'refresh_token',
      refresh_token: bundle.authData.refresh_token,
    },
    bundle.authData.refresh_token,
  );

/**
 * `GET /integrations/v1/whoami`; returns the response so the label can read
 * `{{json.organizationName}}`. A member (not an admin) gets the API's 403
 * message instead of a bare status.
 */
const test = async (z: ZObject, _bundle: Bundle) => {
  const response = await z.request({
    url: `${baseUrl()}/integrations/v1/whoami`,
    skipThrowForStatus: true,
  });
  if (response.status === 403) {
    throw new z.errors.Error(
      apiMessage(response.data) ??
        'Only Fondaro admins can connect Fondaro to Zapier.',
      'Forbidden',
      403,
    );
  }
  response.throwForStatus();
  return response;
};

export default {
  type: 'oauth2',
  oauth2Config: {
    authorizeUrl,
    getAccessToken,
    refreshAccessToken,
    enablePkce: true,
    autoRefresh: true,
  },
  fields: [],
  test,
  connectionLabel: '{{json.organizationName}}',
} satisfies Authentication;
