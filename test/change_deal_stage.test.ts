import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/change_deal_stage.js';
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

describe('change_deal_stage', () => {
  it('is Change Deal Stage on the Deal noun', () => {
    expect(mod.key).toBe('change_deal_stage');
    expect(mod.noun).toBe('Deal');
    expect(mod.display.label).toBe('Change Deal Stage');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends the stage', async () => {
    const scope = nock(BASE).patch(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63/stage`, { stage: 'offer' }).reply(200, op.sample);
    await run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63', stage: 'offer' });
    expect(scope.isDone()).toBe(true);
  });

  it('labels qualified as Interested', () => {
    const field = (op.inputFields as any[]).find((f) => f.key === 'stage');
    expect(field.choices.find((c: any) => c.value === 'qualified').label).toBe('Interested');
  });

  it('names the deal on a 404', async () => {
    nock(BASE).patch(`${API}/deals/7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63/stage`).reply(404, {});
    const error = await rejection(run({ dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63', stage: 'offer' }));
    expect(error.message).toContain('Deal 7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63 was not found in your Fondaro CRM.');
  });
});
