import nock from 'nock';
import { describe, expect, it } from 'vitest';

import trigger from '../src/triggers/lead_assigned.js';
import { leadSample, userSample } from '../src/lib/samples.js';
import { API, BASE, appTester, bundle, signedDelivery } from './helpers.js';

const op = trigger.operation as any;
const TARGET = 'https://hooks.zapier.com/hooks/standard/1/abc/';

const delivery = (data: object, input: object = {}) =>
  signedDelivery({
    body: {
      event: 'lead.assigned',
      deliveryId: 'delivery-1',
      occurredAt: '2026-10-23T10:00:00.000Z',
      data,
    },
    extra: { inputData: input },
  });

const assigned = (added: string[]) => ({
  leadId: 48213,
  added,
  removed: [],
  assigneeIds: added,
  status: 'lead',
  changedBy: 'user_9',
});

describe('lead_assigned', () => {
  it('is an instant trigger with the team member filter', () => {
    expect(trigger.display.label).toBe('Lead Assigned');
    expect(trigger.display.description).toMatch(/^Triggers when .*\.$/);
    expect(op.inputFields[0]).toMatchObject({
      key: 'onlyAssignedTo',
      label: 'Only When Assigned To',
      list: true,
    });
  });

  it('subscribes to lead.assigned', async () => {
    const scope = nock(BASE)
      .post(`${API}/subscriptions`, { eventTypes: ['lead.assigned'], targetUrl: TARGET })
      .reply(201, { id: 'sub-1', secret: 's' });
    await appTester(op.performSubscribe, bundle({ targetUrl: TARGET }));
    expect(scope.isDone()).toBe(true);
  });

  it('hydrates the lead and resolves each added member', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/users/${userSample.id}`).reply(200, userSample);
    const results = (await appTester(
      op.perform,
      delivery(assigned([userSample.id])),
    )) as any[];
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 48213,
      event: 'lead.assigned',
      addedAssignees: [userSample],
    });
  });

  it('keeps only the id of a departed member (404)', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/users/user_gone`).reply(404, {});
    const results = (await appTester(op.perform, delivery(assigned(['user_gone'])))) as any[];
    expect(results[0].addedAssignees).toEqual([{ id: 'user_gone' }]);
  });

  it('matches any added member against the filter, drops the rest', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(200, leadSample);
    nock(BASE).get(`${API}/users/user_b`).reply(200, { ...userSample, id: 'user_b' });
    nock(BASE).get(`${API}/users/user_a`).reply(200, { ...userSample, id: 'user_a' });
    const kept = (await appTester(
      op.perform,
      delivery(assigned(['user_a', 'user_b']), { onlyAssignedTo: ['user_b'] }),
    )) as any[];
    expect(kept).toHaveLength(1);
    expect(
      await appTester(
        op.perform,
        delivery(assigned(['user_a']), { onlyAssignedTo: ['user_b'] }),
      ),
    ).toEqual([]);
  });

  it('ignores an event that only removed members', async () => {
    expect(await appTester(op.perform, delivery(assigned([])))).toEqual([]);
  });

  it('returns [] when the lead is gone (404)', async () => {
    nock(BASE).get(`${API}/leads/48213`).reply(404, {});
    expect(await appTester(op.perform, delivery(assigned([userSample.id])))).toEqual([]);
  });

  it('lists the newest leads that have assignees', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '25' })
      .reply(200, {
        leads: [{ ...leadSample, id: 1, assigneeIds: [] }, leadSample],
        total: 2,
        hasMore: false,
      });
    nock(BASE).get(`${API}/users/${userSample.id}`).reply(200, userSample);
    const results = (await appTester(op.performList, bundle())) as any[];
    expect(results.map((r) => r.id)).toEqual([48213]);
    expect(results[0].addedAssignees).toEqual([userSample]);
    expect(results[0].deliveryId).toBeNull();
  });

  it('passes a single selected member to the lead list', async () => {
    nock(BASE)
      .get(`${API}/leads`)
      .query({ sort: 'createdAt', limit: '25', assigneeId: userSample.id })
      .reply(200, { leads: [leadSample], total: 1, hasMore: false });
    nock(BASE).get(`${API}/users/${userSample.id}`).reply(200, userSample);
    const results = (await appTester(
      op.performList,
      bundle({ inputData: { onlyAssignedTo: [userSample.id] } }),
    )) as any[];
    expect(results).toHaveLength(1);
  });

  it('has a sample that the output fields describe', () => {
    for (const field of op.outputFields as { key: string }[]) {
      const [head, rest] = field.key.split('[]');
      expect(op.sample).toHaveProperty(head);
      if (rest) expect(op.sample[head][0]).toHaveProperty(rest);
    }
  });
});
