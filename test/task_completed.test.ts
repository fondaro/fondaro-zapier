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

import trigger from '../src/triggers/task_completed.js';

const op = trigger.operation as any;
const ID = '2e9b5c71-8a04-4d36-a5f2-6b1c7d8e3f90';
const data = { leadId: 48213, taskId: ID, changedBy: 'user_1' };
const entry = (id: string, at: string) => ({
  type: 'task-completed',
  occurredAt: at,
  task: { id, title: 'Call Maria back', status: 'pending', dueDate: null, preview: 'hi', authorId: 'user_1' },
});
const delivery = (d: object = data) =>
  signedDelivery({
    body: { event: 'task.completed', deliveryId: 'delivery-1', occurredAt: '2026-10-23T10:00:00.000Z', data: d },
  });
const feed = (leadId: number) => nock(BASE).get(`${API}/leads/${leadId}/activities`);

describe('task_completed', () => {
  it('is an instant trigger', () => {
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.type).toBe('hook');
  });

  it('subscribes to task.completed', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['task.completed'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(scope.isDone()).toBe(true);
  });

  it('picks the entry by id from the lead feed and adds the lead', async () => {
    feed(48213).query({ types: 'task-completed', limit: '50' }).reply(200, { entries: [entry('other', '2026-10-23T09:00:00.000Z'), entry(ID, '2026-10-23T10:00:00.000Z')] });
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const [item] = (await appTester(op.perform, delivery())) as any[];
    expect(item).toMatchObject({ id: ID, event: 'task.completed', deliveryId: 'delivery-1', leadId: 48213, occurredAt: '2026-10-23T10:00:00.000Z' });
    expect(item.lead.firstName).toBe('Maria');
  });

  it('returns [] when the entry is not in the feed', async () => {
    feed(48213).query({ types: 'task-completed', limit: '50' }).reply(200, { entries: [entry('other', '2026-10-23T09:00:00.000Z')] });
    expect(await appTester(op.perform, delivery())).toEqual([]);
  });

  it('returns [] when the lead (and so its feed) is gone', async () => {
    feed(48213).query({ types: 'task-completed', limit: '50' }).reply(404, {});
    expect(await appTester(op.perform, delivery())).toEqual([]);
  });

  it('returns [] for a bad signature', async () => {
    const bad = signedDelivery({
      body: { event: 'task.completed', deliveryId: 'd', occurredAt: 'x', data },
      signingSecret: 'another',
    });
    expect(await appTester(op.perform, bad)).toEqual([]);
  });

  it('walks the 5 newest leads feeds, newest first', async () => {
    nock(BASE).get(`${API}/leads`).query({ sort: 'createdAt', limit: '5' })
      .reply(200, { leads: [leadSample, { ...leadSample, id: 2 }] });
    feed(48213).query({ types: 'task-completed', limit: '50' }).reply(200, { entries: [entry('a', '2026-10-01T00:00:00.000Z')] });
    feed(2).query({ types: 'task-completed', limit: '50' }).reply(200, { entries: [entry('b', '2026-10-22T00:00:00.000Z')] });
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results.map((r) => r.id)).toEqual(['b', 'a']);
    expect(results[0]).toMatchObject({ leadId: 2, deliveryId: null });
  });

  it('has a sample that covers its output fields', () => {
    for (const field of op.outputFields) expect(resolves(op.sample, field.key), field.key).toBe(true);
    expect(op.sample.id).toBeDefined();
  });
});
