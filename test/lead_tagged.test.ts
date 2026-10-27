import nock from 'nock';
import { describe, expect, it } from 'vitest';

import trigger from '../src/triggers/lead_tagged.js';
import { leadSample, tagSample } from '../src/lib/samples.js';
import { API, BASE, appTester, bundle, signedDelivery } from './helpers.js';

const op = trigger.operation as any;
const TARGET = 'https://hooks.zapier.com/hooks/standard/1/abc/';
const TAG_ID = tagSample.id;
const OTHER_ID = '00000000-0000-4000-8000-000000000000';

const delivery = (data: object, input: object = {}) =>
  signedDelivery({
    body: {
      event: 'lead.tagged',
      deliveryId: 'delivery-1',
      occurredAt: '2026-10-23T10:00:00.000Z',
      data,
    },
    extra: { inputData: input },
  });

const payload = (tagId = TAG_ID) => ({
  leadId: 48213,
  tagId,
  changedBy: 'user_1',
});

describe('lead_tagged', () => {
  it('is an instant trigger with the tag filter', () => {
    expect(trigger.display.label).toBe('Lead Tagged');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.inputFields[0]).toMatchObject({
      key: 'tagIds',
      label: 'Only For Tags',
      list: true,
    });
  });

  it('subscribes to lead.tagged', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['lead.tagged'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(scope.isDone()).toBe(true);
  });

  it('hydrates the lead and the tag, with a per-tag id', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/tags/${TAG_ID}`).reply(200, tagSample);
    const results = (await appTester(op.perform, delivery(payload()))) as any[];
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: `48213:${TAG_ID}`,
      leadId: 48213,
      event: 'lead.tagged',
      deliveryId: 'delivery-1',
      tag: tagSample,
      changedBy: 'user_1',
      firstName: 'Maria',
    });
  });

  it('matches the tag filter and drops other tag ids without hydrating', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/tags/${TAG_ID}`).reply(200, tagSample);
    const kept = (await appTester(
      op.perform,
      delivery(payload(), { tagIds: [OTHER_ID, TAG_ID] }),
    )) as any[];
    expect(kept).toHaveLength(1);
    expect(
      await appTester(op.perform, delivery(payload(), { tagIds: [OTHER_ID] })),
    ).toEqual([]);
  });

  it('matches a typed tag name, ignoring case, after hydrating', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/tags/${TAG_ID}`).reply(200, tagSample);
    const kept = (await appTester(
      op.perform,
      delivery(payload(), { tagIds: ` ${String(tagSample.name).toUpperCase()} ` }),
    )) as any[];
    expect(kept).toHaveLength(1);

    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/tags/${TAG_ID}`).reply(200, tagSample);
    expect(
      await appTester(op.perform, delivery(payload(), { tagIds: ['some other tag'] })),
    ).toEqual([]);
  });

  it('returns [] when the lead is gone (404)', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(404, {});
    expect(await appTester(op.perform, delivery(payload()))).toEqual([]);
  });

  it('returns [] when the tag is gone (404)', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/tags/${TAG_ID}`).reply(404, {});
    expect(await appTester(op.perform, delivery(payload()))).toEqual([]);
  });

  it('lists tagged leads with their first tag', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '25' })
      .reply(200, {
        leads: [{ ...leadSample, id: 1, tags: [] }, leadSample],
        total: 2,
        hasMore: false,
      });
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: `48213:${TAG_ID}`,
      leadId: 48213,
      tag: tagSample,
      deliveryId: null,
    });
  });

  it('lists only leads carrying a selected tag', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '25' })
      .reply(200, { leads: [leadSample], total: 1, hasMore: false });
    expect(
      await appTester(op.performList, bundle({ inputData: { tagIds: [OTHER_ID] } })),
    ).toEqual([]);
  });

  it('has a sample that the output fields describe', () => {
    for (const field of op.outputFields as { key: string }[]) {
      const [head] = field.key.split('[]');
      if (head.includes('__')) {
        const [parent, child] = head.split('__');
        expect(op.sample[parent]).toHaveProperty(child);
      } else {
        expect(op.sample).toHaveProperty(head);
      }
    }
  });
});
