import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_lead_by_id.js';
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

describe('find_lead_by_id', () => {
  it('is Find Lead by ID on the Lead noun', () => {
    expect(mod.key).toBe('find_lead_by_id');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Find Lead by ID');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('gets the lead', async () => {
    const scope = nock(BASE).get(`${API}/leads/48213`).reply(200, op.sample);
    const result = (await run({ leadId: 48213 })) as any[];
    expect(result).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list on a 404', async () => {
    nock(BASE).get(`${API}/leads/99`).reply(404, {});
    expect(await run({ leadId: 99 })).toEqual([]);
  });
});
