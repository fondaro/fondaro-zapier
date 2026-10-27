import nock from 'nock';
import { describe, expect, it } from 'vitest';

import { leadSample, dealSample } from '../src/lib/samples.js';
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

import trigger from '../src/triggers/deal_stage_changed.js';

const op = trigger.operation as any;
const D = '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63';
const data = { dealId: D, leadId: 48213, fromStage: 'qualified', toStage: 'viewing', changedBy: 'user_1' };
const delivery = (d: object, input: object = {}) =>
  signedDelivery({
    body: { event: 'deal.stageChanged', deliveryId: 'delivery-1', occurredAt: '2026-10-23T10:00:00.000Z', data: d },
    extra: { inputData: input },
  });

describe('deal_stage_changed', () => {
  it('is an instant trigger with To Stage', () => {
    expect(trigger.display.label).toBe('Deal Stage Changed');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.inputFields[0]).toMatchObject({ key: 'toStage', label: 'To Stage', list: true });
  });

  it('subscribes to deal.stageChanged', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['deal.stageChanged'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(scope.isDone()).toBe(true);
  });

  it('hydrates deal, lead and the stage change', async () => {
    nock(BASE).get(`${API}/deals/${D}`).reply(200, dealSample);
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const [item] = (await appTester(op.perform, delivery(data))) as any[];
    expect(item).toMatchObject({ id: D, fromStage: 'qualified', toStage: 'viewing', changedBy: 'user_1' });
    expect(item.lead.id).toBe(48213);
  });

  it('applies To Stage', async () => {
    expect(await appTester(op.perform, delivery(data, { toStage: ['offer'] }))).toEqual([]);
    nock(BASE).get(`${API}/deals/${D}`).reply(200, dealSample);
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    expect(await appTester(op.perform, delivery(data, { toStage: ['offer', 'viewing'] }))).toHaveLength(1);
  });

  it('returns [] when the deal is gone', async () => {
    nock(BASE).get(`${API}/deals/${D}`).reply(404, {});
    expect(await appTester(op.perform, delivery(data))).toEqual([]);
  });

  it('walks recent leads, newest stage change first', async () => {
    nock(BASE).get(`${API}/leads`).query({ sort: 'createdAt', limit: '5' }).reply(200, { leads: [leadSample] });
    nock(BASE).get(`${API}/leads/48213/deals`).reply(200, [
      { ...dealSample, id: 'a', stageChangedAt: '2026-10-01T00:00:00.000Z' },
      { ...dealSample, id: 'b', stageChangedAt: '2026-10-22T00:00:00.000Z' },
    ]);
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results.map((r) => r.id)).toEqual(['b', 'a']);
    expect(results[0]).toMatchObject({ fromStage: null, toStage: 'viewing' });
  });

  it('has a sample that covers its output fields', () => {
    for (const field of op.outputFields) expect(resolves(op.sample, field.key), field.key).toBe(true);
  });
});
