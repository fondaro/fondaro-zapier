import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_deal.js';
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

describe('find_deal', () => {
  it('is Find Deal on the Deal noun', () => {
    expect(mod.key).toBe('find_deal');
    expect(mod.noun).toBe('Deal');
    expect(mod.display.label).toBe('Find Deal');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('gets the deal', async () => {
    const scope = nock(BASE).get(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63`).reply(200, op.sample);
    expect(await run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63' })).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list on a 404', async () => {
    nock(BASE).get(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63`).reply(404, {});
    expect(await run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63' })).toEqual([]);
  });
});
