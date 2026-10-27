import nock from 'nock';
import { describe, expect, it } from 'vitest';

import { baseUrl, fondaro } from '../src/lib/api.js';
import { API, BASE, TOKEN, rejection, run } from './helpers.js';

const get = (path: string, options?: Parameters<typeof fondaro>[4]) =>
  run((z, b) => fondaro(z, b, 'GET', path, options));

describe('baseUrl', () => {
  it('is production by default and takes the override without a trailing slash', () => {
    expect(baseUrl()).toBe(BASE);
    process.env.FONDARO_BASE_URL = 'https://tunnel.example.test///';
    expect(baseUrl()).toBe('https://tunnel.example.test');
  });
});

describe('fondaro request helper', () => {
  it('sends the bearer token and JSON accept, with no api_key param', async () => {
    const scope = nock(BASE, {
      reqheaders: {
        authorization: `Bearer ${TOKEN}`,
        accept: 'application/json',
      },
    })
      .get(`${API}/leads/1`) // nock fails the match if a query string is present
      .reply(200, { id: 1 });
    expect(await get('/leads/1')).toEqual({ id: 1 });
    expect(scope.isDone()).toBe(true);
  });

  it('sends params without empty values, arrays comma-joined', async () => {
    const scope = nock(BASE)
      .get(`${API}/leads`)
      .query({ limit: '3', tags: 'a,b' })
      .reply(200, { leads: [] });
    await get('/leads', {
      params: { limit: 3, tags: ['a', 'b'], status: '', offset: undefined, x: null },
    });
    expect(scope.isDone()).toBe(true);
  });

  it('sends a JSON body', async () => {
    const scope = nock(BASE)
      .post(`${API}/leads`, { firstName: 'Ana', email: 'ana@example.com' })
      .reply(201, { id: 5 });
    const result = await run((z, b) =>
      fondaro(z, b, 'POST', '/leads', {
        body: { firstName: 'Ana', email: 'ana@example.com', lastName: undefined },
      }),
    );
    expect(result).toEqual({ id: 5 });
    expect(scope.isDone()).toBe(true);
  });

  it('maps 401 to a refresh-auth error', async () => {
    nock(BASE).get(`${API}/leads/1`).reply(401, { message: 'Unauthorized' });
    const error = await rejection(get('/leads/1'));
    expect(`${error.name} ${error.message}`).toMatch(/RefreshAuth/i);
  });

  it('maps 403 to an error with the API message', async () => {
    nock(BASE)
      .get(`${API}/viewings`)
      .reply(403, { message: "This connection is missing the 'viewings:read' scope" });
    const error = await rejection(get('/viewings'));
    expect(error.message).toMatch(/missing the 'viewings:read' scope/);
  });

  it('maps a disabled organization 403 to the API message', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .reply(403, { message: 'This organization is disabled' });
    const error = await rejection(get('/leads'));
    expect(error.message).toMatch(/This organization is disabled/);
  });

  it('returns null on a 404 when the caller says notFound: empty', async () => {
    nock(BASE).get(`${API}/leads/find`).query({ email: 'x@y.z' }).reply(404, {});
    expect(
      await get('/leads/find', { params: { email: 'x@y.z' }, notFound: 'empty' }),
    ).toBeNull();
  });

  it('names the record on a 404 otherwise', async () => {
    nock(BASE).get(`${API}/leads/123`).reply(404, { message: 'Lead not found' });
    const error = await rejection(get('/leads/123', { subject: 'Lead 123' }));
    expect(error.message).toMatch(/Lead 123 was not found in your Fondaro CRM\./);
  });

  it('joins class-validator messages on a 400', async () => {
    nock(BASE)
      .post(`${API}/leads`)
      .reply(400, {
        message: ['firstName must be a string', 'email must be an email'],
        error: 'Bad Request',
      });
    const error = await rejection(
      run((z, b) => fondaro(z, b, 'POST', '/leads', { body: {} })),
    );
    expect(error.message).toMatch(
      /firstName must be a string; email must be an email/,
    );
  });

  it('passes the subscription-cap text through', async () => {
    const text =
      'Subscription limit reached (100 per organization). Remove unused subscriptions first.';
    nock(BASE).post(`${API}/subscriptions`).reply(409, { message: text });
    const error = await rejection(
      run((z, b) =>
        fondaro(z, b, 'POST', '/subscriptions', { body: { eventTypes: ['lead.created'] } }),
      ),
    );
    expect(error.message).toContain(text);
  });

  it('leaves 5xx to core', async () => {
    nock(BASE).get(`${API}/leads`).reply(503, 'Service Unavailable');
    await rejection(get('/leads'));
  });

  it('leaves 429 to core', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .reply(429, { message: 'Too many requests' }, { 'Retry-After': '1' });
    await rejection(get('/leads'));
  });
});
