import nock from 'nock';
import zapier, { defineApp } from 'zapier-platform-core';
import { describe, expect, it, vi } from 'vitest';

import authentication from '../src/authentication.js';
import { fondaro, includeBearerToken, seg } from '../src/lib/api.js';
import { defineFondaroHook } from '../src/lib/hooks.js';
import { API, BASE, bundle, signedDelivery } from './helpers.js';

const TARGET = 'https://hooks.zapier.com/hooks/standard/1/abc/';

const hydrate = vi.fn(async (z, b, data) => {
  const lead = await fondaro(z, b, 'GET', `/leads/${seg(data.leadId)}`, {
    notFound: 'empty',
  });
  return lead ? { ...lead, tagId: data.tagId } : null;
});
const list = vi.fn(async () =>
  [1, 2, 3, 4, 5].map((id) => ({ id, firstName: `Lead ${id}`, createdAt: '2026-10-23T10:00:00.000Z' })),
);

const hook = defineFondaroHook({
  key: 'lead_tagged',
  noun: 'Lead',
  label: 'Lead Tagged',
  description: 'Triggers when a tag is added to a lead.',
  event: 'lead.tagged',
  inputFields: [{ key: 'tagIds', label: 'Tags', list: true }],
  filter: (data, input) => !input.tagIds?.length || input.tagIds.includes(data.tagId),
  hydrate,
  accept: (record, input) => !input.onlyPlanLeads || record.purchasedAt != null,
  list,
  sample: { id: 7, firstName: 'Maria', purchasedAt: '2026-10-23T08:00:00.000Z' },
  outputFields: [
    { key: 'id', label: 'Lead ID', type: 'integer' },
    { key: 'firstName', label: 'First Name' },
  ],
});

const App = defineApp({
  version: '0.0.0',
  platformVersion: zapier.version,
  authentication,
  beforeRequest: [includeBearerToken],
  triggers: { [hook.key]: hook },
});
const appTester = zapier.createAppTester(App);
const op = App.triggers.lead_tagged.operation as any;

const delivery = (data: object, input: object = {}, event = 'lead.tagged') =>
  signedDelivery({
    body: {
      event,
      deliveryId: 'delivery-1',
      occurredAt: '2026-10-23T10:00:00.000Z',
      data,
    },
    extra: { inputData: input },
  });

describe('defineFondaroHook', () => {
  it('builds a hook trigger with envelope output fields and sample', () => {
    expect(hook.display).toEqual({
      label: 'Lead Tagged',
      description: 'Triggers when a tag is added to a lead.',
    });
    expect(op.type).toBe('hook');
    const keys = op.outputFields.map((f: { key: string }) => f.key);
    expect(keys).toEqual(['event', 'deliveryId', 'occurredAt', 'id', 'firstName']);
    expect(op.sample).toMatchObject({
      id: 7,
      event: 'lead.tagged',
      deliveryId: expect.any(String),
      occurredAt: expect.any(String),
    });
  });

  it('subscribes with one event type and the Zapier target URL', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['lead.tagged'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's3cret', eventTypes: ['lead.tagged'], targetUrl: TARGET });
    const result = await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(result).toEqual({ id: 'sub-1', secret: 's3cret' });
    expect(scope.isDone()).toBe(true);
  });

  it('unsubscribes by subscription id, and treats a missing one as done', async () => {
    const scope = nock(BASE).delete(`${API}/subscriptions/sub-1`).reply(200, { success: true });
    await appTester(op.performUnsubscribe, bundle({ subscribeData: { id: 'sub-1' } }));
    expect(scope.isDone()).toBe(true);

    nock(BASE).delete(`${API}/subscriptions/sub-2`).reply(404, {});
    await expect(
      appTester(op.performUnsubscribe, bundle({ subscribeData: { id: 'sub-2' } })),
    ).resolves.toBeDefined();
  });

  it('verifies, hydrates and returns the record beside the envelope', async () => {
    nock(BASE)
      .get(`${API}/leads/7`)
      .reply(200, { id: 7, firstName: 'Maria', purchasedAt: '2026-10-23T08:00:00.000Z' });
    const results = await appTester(op.perform, delivery({ leadId: 7, tagId: 't-1' }));
    expect(results).toEqual([
      {
        id: 7,
        event: 'lead.tagged',
        deliveryId: 'delivery-1',
        occurredAt: '2026-10-23T10:00:00.000Z',
        firstName: 'Maria',
        purchasedAt: '2026-10-23T08:00:00.000Z',
        tagId: 't-1',
      },
    ]);
  });

  it('drops a delivery whose signature fails, without hydrating', async () => {
    hydrate.mockClear();
    const bad = signedDelivery({
      body: { event: 'lead.tagged', deliveryId: 'd', occurredAt: 'x', data: { leadId: 7 } },
      signingSecret: 'a-different-secret',
    });
    expect(await appTester(op.perform, bad)).toEqual([]);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it('drops a delivery for another event', async () => {
    hydrate.mockClear();
    expect(await appTester(op.perform, delivery({ leadId: 7 }, {}, 'lead.untagged'))).toEqual([]);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it('applies the filter to the payload before hydrating', async () => {
    hydrate.mockClear();
    const none = await appTester(
      op.perform,
      delivery({ leadId: 7, tagId: 't-2' }, { tagIds: ['t-1'] }),
    );
    expect(none).toEqual([]);
    expect(hydrate).not.toHaveBeenCalled();

    nock(BASE).get(`${API}/leads/7`).reply(200, { id: 7, firstName: 'Maria' });
    const some = await appTester(
      op.perform,
      delivery({ leadId: 7, tagId: 't-1' }, { tagIds: ['t-1', 't-9'] }),
    );
    expect(some).toHaveLength(1);
  });

  it('applies accept after hydration', async () => {
    nock(BASE).get(`${API}/leads/7`).reply(200, { id: 7, purchasedAt: null });
    const results = await appTester(
      op.perform,
      delivery({ leadId: 7, tagId: 't-1' }, { onlyPlanLeads: true }),
    );
    expect(results).toEqual([]);
  });

  it('turns a 404 on hydration into an empty result', async () => {
    nock(BASE).get(`${API}/leads/7`).reply(404, { message: 'Lead 7 not found' });
    expect(await appTester(op.perform, delivery({ leadId: 7, tagId: 't-1' }))).toEqual([]);
  });

  it('lists at most 3 records in the same shape', async () => {
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({
      id: 1,
      event: 'lead.tagged',
      deliveryId: null,
      occurredAt: '2026-10-23T10:00:00.000Z',
      firstName: 'Lead 1',
    });
  });
});
