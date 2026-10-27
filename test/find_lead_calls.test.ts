import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_lead_calls.js';
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

describe('find_lead_calls', () => {
  it('is Find Lead Calls on the Lead Call noun', () => {
    expect(mod.key).toBe('find_lead_calls');
    expect(mod.noun).toBe('Lead Call');
    expect(mod.display.label).toBe('Find Lead Calls');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('returns the calls as line items', async () => {
    const scope = nock(BASE).get(`${API}/leads/12/calls`).query({ limit: '5' }).reply(200, { calls: op.sample.calls, total: 1, totalIsExact: true, hasMore: false, nextOffset: 1 });
    const result = (await run({ leadId: 12, limit: 5 })) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 12, leadId: 12, total: 1 });
    expect(result[0].calls[0]).toHaveProperty('outcome');
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list when the lead is not found', async () => {
    nock(BASE).get(`${API}/leads/99/calls`).reply(404, {});
    expect(await run({ leadId: 99 })).toEqual([]);
  });
});
