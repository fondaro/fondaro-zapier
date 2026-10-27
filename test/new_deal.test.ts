import nock from 'nock';
import { describe, expect, it } from 'vitest';

import { dealSample, leadSample } from '../src/lib/samples.js';
import { API, BASE, appTester, bundle, signedDelivery } from './helpers.js';

const TARGET = 'https://hooks.zapier.com/hooks/standard/1/abc/';

/** Every output field key resolves in the sample (`a__b` nested, `[]` arrays). */
const resolves = (sample: any, key: string): boolean => {
  const path = key.replace(/\[\]/g, '__').split('__').filter(Boolean);
  let cur: any = sample;
  for (const part of path) {
    if (Array.isArray(cur)) cur = cur[0];
    if (cur === null || cur === undefined || !(part in cur)) return false;
    cur = cur[part];
  }
  return true;
};

import trigger from '../src/triggers/new_deal.js';

const op = trigger.operation as any;
const D = '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63';
const data = { dealId: D, leadId: 48213, stage: 'viewing' };
const delivery = (d: object, input: object = {}) =>
  signedDelivery({
    body: { event: 'deal.created', deliveryId: 'delivery-1', occurredAt: '2026-10-23T10:00:00.000Z', data: d },
    extra: { inputData: input },
  });

describe('new_deal', () => {
  it('is an instant trigger with the Stage input', () => {
    expect(trigger.display.label).toBe('New Deal');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.type).toBe('hook');
    expect(op.inputFields[0]).toMatchObject({ key: 'stage', label: 'Stage', list: true });
  });

  it('subscribes to deal.created', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['deal.created'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    expect(await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }))).toEqual({ id: 'sub-1', secret: 's' });
    expect(scope.isDone()).toBe(true);
  });

  it('hydrates the deal and its lead', async () => {
    nock(BASE).get(`${API}/deals/${D}`).reply(200, dealSample);
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const [item] = (await appTester(op.perform, delivery(data))) as any[];
    expect(item).toMatchObject({ id: D, event: 'deal.created', deliveryId: 'delivery-1', stage: 'viewing' });
    expect(item.lead.email).toBe('maria.lopez@example.com');
  });

  it('filters by Stage on the payload', async () => {
    expect(await appTester(op.perform, delivery({ ...data, stage: 'offer' }, { stage: ['viewing'] }))).toEqual([]);
    nock(BASE).get(`${API}/deals/${D}`).reply(200, dealSample);
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    expect(await appTester(op.perform, delivery(data, { stage: ['viewing', 'offer'] }))).toHaveLength(1);
  });

  it('returns [] when the deal or the lead is gone', async () => {
    nock(BASE).get(`${API}/deals/${D}`).reply(404, {});
    expect(await appTester(op.perform, delivery(data))).toEqual([]);
    nock(BASE).get(`${API}/deals/${D}`).reply(200, dealSample);
    nock(BASE).get(`${API}/leads/48213`).reply(404, {});
    expect(await appTester(op.perform, delivery(data))).toEqual([]);
  });

  it('returns [] for a bad signature', async () => {
    const bad = signedDelivery({
      body: { event: 'deal.created', deliveryId: 'd', occurredAt: 'x', data },
      signingSecret: 'another',
    });
    expect(await appTester(op.perform, bad)).toEqual([]);
  });

  it('walks the 5 newest leads for the test step, newest first, with the Stage filter', async () => {
    const older = { ...dealSample, id: 'old', createdAt: '2026-10-01T00:00:00.000Z' };
    nock(BASE).get(`${API}/leads`).query({ sort: 'createdAt', limit: '5' })
      .reply(200, { leads: [leadSample, { ...leadSample, id: 2 }], total: 2, hasMore: false });
    nock(BASE).get(`${API}/leads/48213/deals`).reply(200, [older]);
    nock(BASE).get(`${API}/leads/2/deals`).reply(200, [dealSample, { ...dealSample, id: 'x', stage: 'offer' }]);
    const results = (await appTester(op.performList, bundle({ inputData: { stage: ['viewing'] } }))) as any[];
    expect(results.map((r) => r.id)).toEqual([dealSample.id, 'old']);
    expect(results[0].deliveryId).toBeNull();
    expect(results[0].lead.id).toBe(2);
  });

  it('has a sample that covers its output fields', () => {
    for (const field of op.outputFields) expect(resolves(op.sample, field.key), field.key).toBe(true);
    expect(op.sample.id).toBeDefined();
  });
});
