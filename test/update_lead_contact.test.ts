import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/update_lead_contact.js';
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

describe('update_lead_contact', () => {
  it('is Update Lead Contact on the Lead noun', () => {
    expect(mod.key).toBe('update_lead_contact');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Update Lead Contact');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('patches only the filled fields', async () => {
    const scope = nock(BASE)
      .patch(`${API}/leads/12/contact`, { email: 'new@example.com', companyName: 'Casa SL' })
      .reply(200, op.sample);
    const result = await run({ leadId: 12, email: 'new@example.com', companyName: 'Casa SL', firstName: '', lastName: undefined });
    expect(result).toMatchObject({ id: op.sample.id });
    expect(scope.isDone()).toBe(true);
  });

  it('maps every field to the DTO key', async () => {
    const body = { firstName: 'A', lastName: 'B', email: 'a@b.co', phoneNumber: '+34612345678', leadType: 'seller', companyName: 'C', language: 'es-ES' };
    const scope = nock(BASE).patch(`${API}/leads/12/contact`, body).reply(200, op.sample);
    await run({ leadId: 12, ...body });
    expect(scope.isDone()).toBe(true);
  });

  it('names the lead on a 404', async () => {
    nock(BASE).patch(`${API}/leads/99/contact`).reply(404, { message: 'nope' });
    const error = await rejection(run({ leadId: 99, email: 'a@b.co' }));
    expect(error.message).toContain('Lead 99 was not found in your Fondaro CRM.');
  });
});
