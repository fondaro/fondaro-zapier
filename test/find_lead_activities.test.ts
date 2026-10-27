import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_lead_activities.js';
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

describe('find_lead_activities', () => {
  it('is Find Lead Activities on the Lead Activity noun', () => {
    expect(mod.key).toBe('find_lead_activities');
    expect(mod.noun).toBe('Lead Activity');
    expect(mod.display.label).toBe('Find Lead Activities');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends the types and paging', async () => {
    const scope = nock(BASE).get(`${API}/leads/12/activities`).query({ types: 'call,note', limit: '5', offset: '10' }).reply(200, { entries: op.sample.entries, total: 11, hasMore: false, totalIsExact: true, nextOffset: 11 });
    const result = (await run({ leadId: 12, types: ['call', 'note'], limit: 5, offset: 10 })) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 12, leadId: 12, nextOffset: 11 });
    expect(result[0].entries).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list when the lead is not found', async () => {
    nock(BASE).get(`${API}/leads/99/activities`).reply(404, {});
    expect(await run({ leadId: 99 })).toEqual([]);
  });
});
