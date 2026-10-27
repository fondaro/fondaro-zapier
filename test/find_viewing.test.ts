import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_viewing.js';
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

describe('find_viewing', () => {
  it('is Find Viewing on the Viewing noun', () => {
    expect(mod.key).toBe('find_viewing');
    expect(mod.noun).toBe('Viewing');
    expect(mod.display.label).toBe('Find Viewing');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('gets the viewing', async () => {
    const scope = nock(BASE).get(`${API}/viewings/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63`).reply(200, op.sample);
    expect(await run({ viewingId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63' })).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list on a 404', async () => {
    nock(BASE).get(`${API}/viewings/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63`).reply(404, {});
    expect(await run({ viewingId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63' })).toEqual([]);
  });

  it('surfaces the missing-scope 403', async () => {
    nock(BASE).get(`${API}/viewings/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63`).reply(403, { message: "This connection is missing the 'viewings:read' scope" });
    const error = await rejection(run({ viewingId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63' }));
    expect(error.message).toContain('viewings:read');
  });
});
