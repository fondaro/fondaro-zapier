import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/update_lead_status.js';
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

describe('update_lead_status', () => {
  it('is Update Lead Status on the Lead noun', () => {
    expect(mod.key).toBe('update_lead_status');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Update Lead Status');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends the CRM status', async () => {
    const scope = nock(BASE).patch(`${API}/leads/12/status`, { crmStatus: 'potential' }).reply(200, op.sample);
    await run({ leadId: 12, crmStatus: 'potential' });
    expect(scope.isDone()).toBe(true);
  });

  it('shows lead as New in the dropdown', () => {
    const field = (op.inputFields as any[]).find((f) => f.key === 'crmStatus');
    expect(field.choices.find((c: any) => c.value === 'lead').label).toBe('New');
    expect(field.required).toBe(true);
  });

  it('names the lead on a 404', async () => {
    nock(BASE).patch(`${API}/leads/99/status`).reply(404, {});
    const error = await rejection(run({ leadId: 99, crmStatus: 'client' }));
    expect(error.message).toContain('Lead 99 was not found in your Fondaro CRM.');
  });
});
