import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/close_deal_won.js';
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

describe('close_deal_won', () => {
  it('is Close Deal as Won on the Deal noun', () => {
    expect(mod.key).toBe('close_deal_won');
    expect(mod.noun).toBe('Deal');
    expect(mod.display.label).toBe('Close Deal as Won');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('posts an empty body without a date', async () => {
    const scope = nock(BASE).post(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63/won`, {}).reply(201, op.sample);
    await run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63', wonAt: '' });
    expect(scope.isDone()).toBe(true);
  });

  it('sends the won date when given', async () => {
    const scope = nock(BASE).post(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63/won`, { wonAt: '2026-10-23T11:00:00.000Z' }).reply(201, op.sample);
    await run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63', wonAt: '2026-10-23T11:00:00.000Z' });
    expect(scope.isDone()).toBe(true);
  });

  it('names the deal on a 404', async () => {
    nock(BASE).post(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63/won`).reply(404, {});
    const error = await rejection(run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63' }));
    expect(error.message).toContain('Deal 7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63 was not found in your Fondaro CRM.');
  });
});
