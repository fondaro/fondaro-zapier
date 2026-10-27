import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_viewings.js';
import { API, BASE, appTester, bundle, rejection } from './helpers.js';

const op = mod.operation as any;
const run = (inputData: Record<string, unknown>) =>
  appTester(op.perform, bundle({ inputData }));

/** Every output field is present in the sample (nested keys: first item). */
const sampleHasOutputFields = () => {
  const sample = op.sample as Record<string, any>;
  for (const { key } of op.outputFields as { key: string }[]) {
    if (key.includes('__')) continue;
    const [array, rest] = key.split('[]');
    if (rest === undefined) {
      expect(sample, key).toHaveProperty(key);
    } else if (rest === '') {
      expect(sample, key).toHaveProperty(array);
    } else {
      expect(sample[array]?.length, key).toBeGreaterThan(0);
      expect(sample[array][0], key).toHaveProperty(rest);
    }
  }
};

describe('find_viewings', () => {
  it('is Find Viewings on the Viewing noun', () => {
    expect(mod.key).toBe('find_viewings');
    expect(mod.noun).toBe('Viewing');
    expect(mod.display.label).toBe('Find Viewings');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends only the filled filters', async () => {
    const scope = nock(BASE).get(`${API}/viewings`).query({ status: 'scheduled', leadId: '12', limit: '5' }).reply(200, { viewings: op.sample.viewings, total: 1, hasMore: false, nextOffset: 1 });
    await run({ status: 'scheduled', leadId: 12, limit: 5, kind: '', dealId: undefined });
    expect(scope.isDone()).toBe(true);
  });

  it('maps every filter to the DTO query key', async () => {
    const q = { propertyListingId: 'p', leadId: '12', collaboratorLeadId: '13', agentUserId: 'user_b', dealId: 'd', status: 'completed', kind: 'virtual', from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z', limit: '10', offset: '10' };
    const scope = nock(BASE).get(`${API}/viewings`).query(q).reply(200, { viewings: [], total: 0, hasMore: false, nextOffset: 10 });
    await run({ ...q, leadId: 12, collaboratorLeadId: 13, limit: 10, offset: 10 });
    expect(scope.isDone()).toBe(true);
  });

  it('returns one result whose viewings are the line items', async () => {
    nock(BASE).get(`${API}/viewings`).reply(200, { viewings: op.sample.viewings, total: 4, hasMore: true, nextOffset: 1 });
    const result = (await run({})) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'offset-0', total: 4, hasMore: true, nextOffset: 1 });
    expect(result[0].viewings).toHaveLength(1);
  });

  it('surfaces the missing-scope 403', async () => {
    nock(BASE).get(`${API}/viewings`).reply(403, { message: "This connection is missing the 'viewings:read' scope" });
    const error = await rejection(run({}));
    expect(error.message).toContain('viewings:read');
  });
});
