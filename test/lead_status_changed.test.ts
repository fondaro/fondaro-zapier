import nock from 'nock';
import { describe, expect, it } from 'vitest';

import trigger, { leadStatusChangedSample } from '../src/triggers/lead_status_changed.js';
import { leadSample } from '../src/lib/samples.js';
import { API, BASE, appTester, bundle, signedDelivery } from './helpers.js';

const op = trigger.operation as any;
const TARGET = 'https://hooks.zapier.com/hooks/standard/1/abc/';

const delivery = (data: object, input: object = {}) =>
  signedDelivery({
    body: {
      event: 'lead.statusChanged',
      deliveryId: 'delivery-1',
      occurredAt: '2026-10-23T10:00:00.000Z',
      data,
    },
    extra: { inputData: input },
  });

const change = (to: string) => ({
  leadId: 48213,
  fromStatus: 'lead',
  toStatus: to,
  changedBy: 'user_1',
  assigneeIds: [],
  source: 'dashboard',
});

describe('lead_status_changed', () => {
  it('is an instant trigger with the status filter', () => {
    expect(trigger.display.label).toBe('Lead Status Changed');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.type).toBe('hook');
    expect(op.inputFields[0]).toMatchObject({ key: 'toStatuses', list: true });
    expect(op.inputFields[0].choices.map((c: any) => c.label)).toContain('New');
  });

  it('subscribes to lead.statusChanged', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['lead.statusChanged'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    expect(await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }))).toEqual({
      id: 'sub-1',
      secret: 's',
    });
    expect(scope.isDone()).toBe(true);
  });

  it('hydrates a signed delivery with from, to and changedBy', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const results = (await appTester(op.perform, delivery(change('potential')))) as any[];
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 48213,
      event: 'lead.statusChanged',
      deliveryId: 'delivery-1',
      fromStatus: 'lead',
      toStatus: 'potential',
      changedBy: 'user_1',
    });
  });

  it('keeps a matching To Status and drops the others without hydrating', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    const kept = (await appTester(
      op.perform,
      delivery(change('client'), { toStatuses: ['potential', 'client'] }),
    )) as any[];
    expect(kept).toHaveLength(1);
    expect(
      await appTester(op.perform, delivery(change('unqualified'), { toStatuses: ['client'] })),
    ).toEqual([]);
  });

  it('returns [] when the lead is gone (404)', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(404, {});
    expect(await appTester(op.perform, delivery(change('client')))).toEqual([]);
  });

  it('lists the newest leads with fromStatus null', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '3' })
      .reply(200, { leads: [leadSample], total: 1, hasMore: false });
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results[0]).toMatchObject({
      id: 48213,
      fromStatus: null,
      toStatus: leadSample.crmStatus,
      deliveryId: null,
    });
  });

  it('lists with the status filter applied', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '25', crmStatus: 'client' })
      .reply(200, {
        leads: [leadSample, { ...leadSample, id: 2, crmStatus: 'client' }],
        total: 2,
        hasMore: false,
      });
    const results = (await appTester(
      op.performList,
      bundle({ inputData: { toStatuses: ['client'] } }),
    )) as any[];
    expect(results.map((r) => r.id)).toEqual([2]);
  });

  it('has a sample that the output fields describe', () => {
    for (const field of op.outputFields as { key: string }[]) {
      expect(op.sample).toHaveProperty(field.key.split('[]')[0]);
    }
    expect(leadStatusChangedSample.id).toBe(op.sample.id);
  });
});
