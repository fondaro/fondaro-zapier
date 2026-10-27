import nock from 'nock';
import { describe, expect, it } from 'vitest';

import { leadSample, userSample } from '../src/lib/samples.js';
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

import trigger from '../src/triggers/call_logged.js';

const op = trigger.operation as any;
const CALL = 'f4c8a2d0-1b6e-4973-a5d9-3e7b0c1f8a24';
const data = {
  callId: CALL,
  leadId: 48213,
  ownerId: 'user_2abc123def456ghi789',
  direction: 'outbound',
  outcome: 'no_answer',
  status: 'no-answer',
  durationSeconds: 0,
  missed: true,
  occurredAt: '2026-10-23T09:30:25.000Z',
};
const delivery = (d: object = data, input: object = {}) =>
  signedDelivery({
    body: { event: 'call.logged', deliveryId: 'delivery-1', occurredAt: '2026-10-23T09:30:30.000Z', data: d },
    extra: { inputData: input },
  });

describe('call_logged', () => {
  it('is an instant trigger with Outcome and Missed Calls Only', () => {
    expect(trigger.display.label).toBe('Call Logged');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.inputFields.map((f: any) => [f.key, f.label])).toEqual([
      ['outcome', 'Outcome'],
      ['missedOnly', 'Missed Calls Only'],
    ]);
    expect(op.inputFields[0].choices.map((c: any) => c.value)).toContain('no_answer');
  });

  it('subscribes to call.logged', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['call.logged'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(scope.isDone()).toBe(true);
  });

  it('adds the lead and the owner', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/users/user_2abc123def456ghi789`).reply(200, userSample);
    const [item] = (await appTester(op.perform, delivery())) as any[];
    expect(item).toMatchObject({ id: CALL, event: 'call.logged', outcome: 'no_answer', missed: true, leadId: 48213 });
    expect(item.owner.firstName).toBe('Sofia');
    expect(item.lead.id).toBe(48213);
  });

  it('gives owner null for an unowned call without asking for a user', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const [item] = (await appTester(op.perform, delivery({ ...data, ownerId: null }))) as any[];
    expect(item.owner).toBeNull();
  });

  it('gives owner null for a departed team member (404)', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/users/user_2abc123def456ghi789`).reply(404, {});
    const [item] = (await appTester(op.perform, delivery())) as any[];
    expect(item.owner).toBeNull();
    expect(item.ownerId).toBe('user_2abc123def456ghi789');
  });

  it('filters by Outcome and Missed Calls Only before any request', async () => {
    expect(await appTester(op.perform, delivery(data, { outcome: ['busy', 'failed'] }))).toEqual([]);
    expect(
      await appTester(op.perform, delivery({ ...data, outcome: 'success', missed: false }, { missedOnly: true })),
    ).toEqual([]);
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/users/user_2abc123def456ghi789`).reply(200, userSample);
    expect(await appTester(op.perform, delivery(data, { outcome: ['no_answer'], missedOnly: true }))).toHaveLength(1);
  });

  it('returns [] when the lead is gone', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(404, {});
    expect(await appTester(op.perform, delivery())).toEqual([]);
  });

  it('returns [] for a bad signature', async () => {
    const bad = signedDelivery({
      body: { event: 'call.logged', deliveryId: 'd', occurredAt: 'x', data },
      signingSecret: 'another',
    });
    expect(await appTester(op.perform, bad)).toEqual([]);
  });

  it('walks the newest leads call logs, newest first, with the filters', async () => {
    const call = (id: string, outcome: string, endedAt: string) => ({
      id, ownerId: 'user_1', direction: 'inbound', outcome, status: 'completed',
      durationSeconds: 5, startedAt: endedAt, endedAt, hasRecording: false,
    });
    nock(BASE).get(`${API}/leads`).query({ sort: 'createdAt', limit: '5' }).reply(200, { leads: [leadSample, { ...leadSample, id: 2 }] });
    nock(BASE).get(`${API}/leads/48213/calls`).query({ limit: '10' }).reply(200, { calls: [call('a', 'no_answer', '2026-10-01T00:00:00.000Z'), call('s', 'success', '2026-10-21T00:00:00.000Z')] });
    nock(BASE).get(`${API}/leads/2/calls`).query({ limit: '10' }).reply(200, { calls: [call('b', 'busy', '2026-10-22T00:00:00.000Z')] });
    const results = (await appTester(op.performList, bundle({ inputData: { missedOnly: true } }))) as any[];
    expect(results.map((r) => r.id)).toEqual(['b', 'a']);
    expect(results[0]).toMatchObject({ missed: true, leadId: 2, owner: null, deliveryId: null });
  });

  it('has a sample that covers its output fields', () => {
    for (const field of op.outputFields) expect(resolves(op.sample, field.key), field.key).toBe(true);
  });
});
