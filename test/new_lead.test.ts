import nock from 'nock';
import { describe, expect, it } from 'vitest';

import newLead from '../src/triggers/new_lead.js';
import { leadSample } from '../src/lib/samples.js';
import {
  API,
  BASE,
  appTester,
  bundle,
  signedDelivery,
} from './helpers.js';

const op = newLead.operation as any;
const TARGET = 'https://hooks.zapier.com/hooks/standard/1/abc/';

const delivery = (data: object, input: object = {}) =>
  signedDelivery({
    body: {
      event: 'lead.created',
      deliveryId: 'delivery-1',
      occurredAt: '2026-10-23T10:00:00.000Z',
      data,
    },
    extra: { inputData: input },
  });

const withPlan = (id: number) => ({ ...leadSample, id, leadPlanName: 'Plan A' });
const noPlan = (id: number) => ({ ...leadSample, id, leadPlanName: null });

describe('new_lead', () => {
  it('is an instant trigger with the filter input', () => {
    expect(newLead.display.label).toBe('New Lead');
    expect(newLead.display.description).toBe(
      'Triggers when a lead is added to your Fondaro CRM.',
    );
    expect(op.type).toBe('hook');
    expect(op.inputFields[0]).toMatchObject({
      key: 'onlyPlanLeads',
      label: 'Only Leads From Your Lead Plans',
      type: 'boolean',
    });
  });

  it('subscribes to lead.created', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, {
        eventTypes: ['lead.created'],
        targetUrl: TARGET,
      })
      .reply(201, { id: 'sub-1', secret: 's3cret' });
    const result = await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(result).toEqual({ id: 'sub-1', secret: 's3cret' });
    expect(scope.isDone()).toBe(true);
  });

  it('hydrates a signed delivery into the lead', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, withPlan(48213));
    const results = (await appTester(
      op.perform,
      delivery({ leadId: 48213 }),
    )) as any[];
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 48213,
      event: 'lead.created',
      deliveryId: 'delivery-1',
      firstName: 'Maria',
    });
  });

  it('drops a lead without a plan when the filter is on, keeps one with', async () => {
    nock(BASE).get(`${API}/leads/1`).reply(200, noPlan(1));
    expect(
      await appTester(op.perform, delivery({ leadId: 1 }, { onlyPlanLeads: true })),
    ).toEqual([]);

    nock(BASE).get(`${API}/leads/2`).reply(200, withPlan(2));
    const kept = (await appTester(
      op.perform,
      delivery({ leadId: 2 }, { onlyPlanLeads: true }),
    )) as any[];
    expect(kept.map((r) => r.id)).toEqual([2]);
  });

  it('keeps a lead without a plan when the filter is off', async () => {
    nock(BASE).get(`${API}/leads/3`).reply(200, noPlan(3));
    const results = (await appTester(op.perform, delivery({ leadId: 3 }))) as any[];
    expect(results.map((r) => r.id)).toEqual([3]);
  });

  it('returns [] when the lead is gone (404)', async () => {
    nock(BASE).get(`${API}/leads/9`).reply(404, { message: 'not found' });
    expect(await appTester(op.perform, delivery({ leadId: 9 }))).toEqual([]);
  });

  it('returns [] for a bad signature', async () => {
    const bad = signedDelivery({
      body: {
        event: 'lead.created',
        deliveryId: 'd',
        occurredAt: 'x',
        data: { leadId: 1 },
      },
      signingSecret: 'another-secret',
    });
    expect(await appTester(op.perform, bad)).toEqual([]);
  });

  it('emits one item per lead for a batch import', async () => {
    nock(BASE).get(`${API}/leads/10`).reply(200, withPlan(10));
    nock(BASE).get(`${API}/leads/11`).reply(404, {});
    nock(BASE).get(`${API}/leads/12`).reply(200, noPlan(12));
    const results = (await appTester(
      op.perform,
      delivery({ leadId: 10, leadIds: [10, 11, 12], batch: true }),
    )) as any[];
    expect(results.map((r) => r.id)).toEqual([10, 12]);
    expect(results[0]).toMatchObject({
      event: 'lead.created',
      deliveryId: 'delivery-1',
    });
    expect(results[0]).not.toHaveProperty('__batch');
  });

  it('applies the plan filter to each lead of a batch', async () => {
    nock(BASE).get(`${API}/leads/10`).reply(200, withPlan(10));
    nock(BASE).get(`${API}/leads/12`).reply(200, noPlan(12));
    const results = (await appTester(
      op.perform,
      delivery({ leadId: 10, leadIds: [10, 12], batch: true }, { onlyPlanLeads: true }),
    )) as any[];
    expect(results.map((r) => r.id)).toEqual([10]);
  });

  it('lists the newest 3 by createdAt', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '3' })
      .reply(200, { leads: [noPlan(5), noPlan(4), noPlan(3)], total: 3, hasMore: false });
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results.map((r) => r.id)).toEqual([5, 4, 3]);
    expect(results[0].deliveryId).toBeNull();
  });

  it('lists plan leads by purchasedAt and keeps the first 3 with a plan', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'purchasedAt', limit: '25' })
      .reply(200, {
        leads: [noPlan(9), withPlan(8), withPlan(7), noPlan(6), withPlan(5), withPlan(4)],
        total: 6,
        hasMore: false,
      });
    const results = (await appTester(
      op.performList,
      bundle({ inputData: { onlyPlanLeads: true } }),
    )) as any[];
    expect(results.map((r) => r.id)).toEqual([8, 7, 5]);
  });
});
