import nock from 'nock';
import { describe, expect, it } from 'vitest';

import { leadSample } from '../src/lib/samples.js';
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

import trigger from '../src/triggers/call_analyzed.js';

const op = trigger.operation as any;
const CALL = 'f4c8a2d0-1b6e-4973-a5d9-3e7b0c1f8a24';
const data = {
  callId: CALL,
  leadId: 48213,
  ownerId: 'user_2abc123def456ghi789',
  direction: 'outbound',
  occurredAt: '2026-10-23T09:35:00.000Z',
  analysis: { summary: 'Wants a villa.', sentiment: 'positive', leadInterestLevel: 'high', nextSteps: ['Book viewing'] },
};
const delivery = (d: object = data) =>
  signedDelivery({
    body: { event: 'call.analyzed', deliveryId: 'delivery-1', occurredAt: '2026-10-23T09:36:00.000Z', data: d },
  });

describe('call_analyzed', () => {
  it('is an instant trigger', () => {
    expect(trigger.display.label).toBe('Call Analyzed');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.type).toBe('hook');
  });

  it('subscribes to call.analyzed', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['call.analyzed'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(scope.isDone()).toBe(true);
  });

  it('carries the analysis and adds the lead', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const [item] = (await appTester(op.perform, delivery())) as any[];
    expect(item).toMatchObject({ id: CALL, event: 'call.analyzed', leadId: 48213 });
    expect(item.analysis).toMatchObject({ summary: 'Wants a villa.', sentiment: 'positive', leadInterest: 'high' });
    expect(item.lead.id).toBe(48213);
  });

  it('returns [] when the lead is gone', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(404, {});
    expect(await appTester(op.perform, delivery())).toEqual([]);
  });

  it('returns [] for a bad signature', async () => {
    const bad = signedDelivery({
      body: { event: 'call.analyzed', deliveryId: 'd', occurredAt: 'x', data },
      signingSecret: 'another',
    });
    expect(await appTester(op.perform, bad)).toEqual([]);
  });

  it('lists nothing: the test step uses the static sample', async () => {
    expect(await appTester(op.performList, bundle())).toEqual([]);
  });

  it('has a sample that covers its output fields', () => {
    for (const field of op.outputFields) expect(resolves(op.sample, field.key), field.key).toBe(true);
  });
});
