import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_lead_tags.js';
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

describe('find_lead_tags', () => {
  it('is Find Lead Tags on the Lead Tag noun', () => {
    expect(mod.key).toBe('find_lead_tags');
    expect(mod.noun).toBe('Lead Tag');
    expect(mod.display.label).toBe('Find Lead Tags');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('returns the tags as line items', async () => {
    const scope = nock(BASE).get(`${API}/leads/12/tags`).reply(200, { tags: op.sample.tags });
    const result = (await run({ leadId: 12 })) as any[];
    expect(result).toEqual([{ id: 12, leadId: 12, tags: op.sample.tags }]);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list when the lead is not found', async () => {
    nock(BASE).get(`${API}/leads/99/tags`).reply(404, {});
    expect(await run({ leadId: 99 })).toEqual([]);
  });
});
