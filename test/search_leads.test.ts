import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/search_leads.js';
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

describe('search_leads', () => {
  it('is Search Leads on the Lead noun', () => {
    expect(mod.key).toBe('search_leads');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Search Leads');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('returns the leads as a list', async () => {
    const scope = nock(BASE).get(`${API}/leads/search`).query({ q: 'maria', limit: '5' }).reply(200, { leads: [op.sample, { ...op.sample, id: 2 }], total: 2, hasMore: false });
    const result = (await run({ q: 'maria', limit: 5 })) as any[];
    expect(result.map((lead) => lead.id)).toEqual([op.sample.id, 2]);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list when nothing matches', async () => {
    nock(BASE).get(`${API}/leads/search`).query({ q: 'zzz' }).reply(200, { leads: [], total: 0, hasMore: false });
    expect(await run({ q: 'zzz' })).toEqual([]);
  });
});
