import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/create_deal.js';
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

describe('create_deal', () => {
  it('is Create Deal on the Deal noun', () => {
    expect(mod.key).toBe('create_deal');
    expect(mod.noun).toBe('Deal');
    expect(mod.display.label).toBe('Create Deal');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends only the filled fields and no currency', async () => {
    const scope = nock(BASE).post(`${API}/deals`, { leadId: 12, title: 'Villa' }).reply(201, op.sample);
    await run({ leadId: 12, title: 'Villa', stage: '', amount: undefined, assigneeIds: [] });
    expect(scope.isDone()).toBe(true);
    expect((op.inputFields as any[]).map((f) => f.key)).not.toContain('currency');
  });

  it('maps every field to the DTO key', async () => {
    const body = { leadId: 12, title: 'Villa', stage: 'offer', amount: 950000.5, expectedCloseAt: '2026-12-15T00:00:00.000Z', assigneeIds: ['user_b'] };
    const scope = nock(BASE).post(`${API}/deals`, body).reply(201, op.sample);
    await run(body);
    expect(scope.isDone()).toBe(true);
  });

  it('passes the billing-currency 400 through', async () => {
    nock(BASE).post(`${API}/deals`).reply(400, { message: 'Set a billing currency before creating deals' });
    const error = await rejection(run({ leadId: 12, title: 'Villa' }));
    expect(error.message).toContain('billing currency');
  });

  it('names the lead on a 404', async () => {
    nock(BASE).post(`${API}/deals`).reply(404, {});
    const error = await rejection(run({ leadId: 99, title: 'Villa' }));
    expect(error.message).toContain('Lead 99 was not found in your Fondaro CRM.');
  });
});
