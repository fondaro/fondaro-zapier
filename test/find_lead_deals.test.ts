import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_lead_deals.js';
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

describe('find_lead_deals', () => {
  it('is Find Deals on Lead on the Lead Deal noun', () => {
    expect(mod.key).toBe('find_lead_deals');
    expect(mod.noun).toBe('Lead Deal');
    expect(mod.display.label).toBe('Find Deals on Lead');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('wraps the deal list in one result', async () => {
    const scope = nock(BASE).get(`${API}/leads/12/deals`).reply(200, [op.sample.deals[0], { ...op.sample.deals[0], id: 'x' }]);
    const result = (await run({ leadId: 12 })) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 12, leadId: 12, total: 2 });
    expect(result[0].deals).toHaveLength(2);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list when the lead is not found', async () => {
    nock(BASE).get(`${API}/leads/99/deals`).reply(404, {});
    expect(await run({ leadId: 99 })).toEqual([]);
  });
});
