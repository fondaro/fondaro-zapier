import nock from 'nock';
import { describe, expect, it } from 'vitest';

import App from '../src/index.js';
import { INTEGRATION_SCOPES } from '../src/authentication.js';
import { API, BASE, TOKEN, appTester, bundle, rejection } from './helpers.js';

const oauth = App.authentication.oauth2Config;

describe('authentication', () => {
  it('turns on PKCE and automatic refresh', () => {
    expect(oauth.enablePkce).toBe(true);
    expect(oauth.autoRefresh).toBe(true);
    expect(App.authentication.type).toBe('oauth2');
    expect(App.authentication.connectionLabel).toBe(
      '{{json.organizationName}}',
    );
  });

  it('builds the authorize URL with resource, scope and state', async () => {
    const result = await appTester(oauth.authorizeUrl, {
      inputData: { state: 'st4te', redirect_uri: 'https://zapier.com/cb' },
      environment: { CLIENT_ID: 'test-client-id' },
    });
    const url = new URL(String(result));
    expect(`${url.origin}${url.pathname}`).toBe(`${BASE}/oauth/authorize`);
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('state')).toBe('st4te');
    expect(url.searchParams.get('redirect_uri')).toBe('https://zapier.com/cb');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('resource')).toBe(`${BASE}${API}`);
    const scopes = (url.searchParams.get('scope') ?? '').split(' ');
    expect(scopes).toEqual([...INTEGRATION_SCOPES]);
    expect(scopes).toContain('viewings:read');
    // The PKCE challenge is added by Zapier itself, after this function runs.
  });

  it('exchanges the code with resource, client_secret_post and the PKCE verifier', async () => {
    const scope = nock(BASE, { badheaders: ['authorization'] })
      .post('/oauth/token', (body) => {
        expect(body).toMatchObject({
          grant_type: 'authorization_code',
          code: 'the-code',
          redirect_uri: 'https://zapier.com/cb',
          code_verifier: 'the-verifier',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          resource: `${BASE}${API}`,
        });
        return true;
      })
      .reply(200, {
        access_token: 'at-1',
        refresh_token: 'rt-1',
        expires_in: 900,
      });

    const result = await appTester(oauth.getAccessToken, {
      inputData: {
        code: 'the-code',
        redirect_uri: 'https://zapier.com/cb',
        code_verifier: 'the-verifier',
      },
    });
    expect(result).toEqual({
      access_token: 'at-1',
      refresh_token: 'rt-1',
      expires_in: 900,
    });
    expect(scope.isDone()).toBe(true);
  });

  it('refreshes with resource and stores the rotated refresh token', async () => {
    const scope = nock(BASE, { badheaders: ['authorization'] })
      .post('/oauth/token', (body) => {
        expect(body).toMatchObject({
          grant_type: 'refresh_token',
          refresh_token: 'fdr_ort_test_refresh_token',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          resource: `${BASE}${API}`,
        });
        return true;
      })
      .reply(200, { access_token: 'at-2', refresh_token: 'rt-2' });

    const result = await appTester(oauth.refreshAccessToken, bundle());
    expect(result.access_token).toBe('at-2');
    expect(result.refresh_token).toBe('rt-2');
    expect(scope.isDone()).toBe(true);
  });

  it('keeps the old refresh token only when the server sends none', async () => {
    nock(BASE).post('/oauth/token').reply(200, { access_token: 'at-3' });
    const result = await appTester(oauth.refreshAccessToken, bundle());
    expect(result.refresh_token).toBe('fdr_ort_test_refresh_token');
  });

  it('honours FONDARO_BASE_URL for the OAuth URLs but not the resource', async () => {
    process.env.FONDARO_BASE_URL = 'https://tunnel.example.test/';

    const url = new URL(
      String(
        await appTester(oauth.authorizeUrl, {
          inputData: { state: 's', redirect_uri: 'https://zapier.com/cb' },
        }),
      ),
    );
    expect(url.origin).toBe('https://tunnel.example.test');
    expect(url.pathname).toBe('/oauth/authorize');
    expect(url.searchParams.get('resource')).toBe(`${BASE}${API}`);

    const scope = nock('https://tunnel.example.test')
      .post('/oauth/token', (body) => body.resource === `${BASE}${API}`)
      .reply(200, { access_token: 'at', refresh_token: 'rt' });
    await appTester(oauth.getAccessToken, {
      inputData: { code: 'c', redirect_uri: 'https://zapier.com/cb' },
    });
    expect(scope.isDone()).toBe(true);
  });

  it('sends only the browser to FONDARO_AUTHORIZE_BASE_URL', async () => {
    process.env.FONDARO_BASE_URL = 'https://tunnel.example.test';
    process.env.FONDARO_AUTHORIZE_BASE_URL = 'http://localhost:3001/';

    const url = new URL(
      String(
        await appTester(oauth.authorizeUrl, {
          inputData: { state: 's', redirect_uri: 'https://zapier.com/cb' },
        }),
      ),
    );
    expect(`${url.origin}${url.pathname}`).toBe(
      'http://localhost:3001/oauth/authorize',
    );

    const scope = nock('https://tunnel.example.test')
      .post('/oauth/token')
      .reply(200, { access_token: 'at', refresh_token: 'rt' });
    await appTester(oauth.getAccessToken, {
      inputData: { code: 'c', redirect_uri: 'https://zapier.com/cb' },
    });
    expect(scope.isDone()).toBe(true);
  });

  it('tests the connection with whoami and exposes the organization name', async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${TOKEN}` } })
      .get(`${API}/whoami`)
      .reply(200, {
        organizationId: 'org-1',
        organizationName: 'Costa Homes',
        principal: 'oauth',
        scopes: [...INTEGRATION_SCOPES],
      });

    const response = await appTester(App.authentication.test, bundle());
    expect(response.data.organizationName).toBe('Costa Homes');
  });

  it('turns a 403 into the API message', async () => {
    nock(BASE)
      .get(`${API}/whoami`)
      .reply(403, { message: 'Only organization admins can connect Fondaro.' });

    const error = await rejection(appTester(App.authentication.test, bundle()));
    expect(error.message).toMatch(/Only organization admins can connect Fondaro/);
  });
});
