import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_leads.js';
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

describe('find_leads', () => {
  it('is Find Leads on the Lead noun', () => {
    expect(mod.key).toBe('find_leads');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Find Leads');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends only the filled filters', async () => {
    const scope = nock(BASE).get(`${API}/leads`).query({ crmStatus: 'client', limit: '10' }).reply(200, { leads: [op.sample], total: 1, hasMore: false });
    await run({ crmStatus: 'client', limit: 10, tags: [], assigneeId: '', unassigned: false });
    expect(scope.isDone()).toBe(true);
  });

  it('comma-joins tags and sends unassigned only when ticked', async () => {
    const scope = nock(BASE).get(`${API}/leads`).query({ tags: 'a,b', unassigned: 'true', offset: '50' }).reply(200, { leads: [], total: 0, hasMore: false });
    await run({ tags: ['a', 'b'], unassigned: true, offset: 50 });
    expect(scope.isDone()).toBe(true);
  });

  it('returns one result whose leads are the line items', async () => {
    nock(BASE).get(`${API}/leads`).query({ limit: '2' }).reply(200, { leads: [op.sample, { ...op.sample, id: 2 }], total: 9, hasMore: true });
    const result = (await run({ limit: 2 })) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'offset-0', total: 9, hasMore: true, nextOffset: 2 });
    expect(result[0].leads).toHaveLength(2);
  });

  it('returns an empty page, not an empty list, when nothing matches', async () => {
    nock(BASE).get(`${API}/leads`).reply(200, { leads: [], total: 0, hasMore: false });
    const result = (await run({})) as any[];
    expect(result[0].leads).toEqual([]);
  });

  it('passes the unknown-tag 404 through', async () => {
    nock(BASE).get(`${API}/leads`).query({ tags: 'ghost' }).reply(404, { message: 'Tag ghost not found' });
    const error = await rejection(run({ tags: ['ghost'] }));
    expect(error.message).toContain('not found');
  });
});
