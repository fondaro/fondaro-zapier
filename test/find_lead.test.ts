import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_lead.js';
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

describe('find_lead', () => {
  it('is Find Lead on the Lead noun', () => {
    expect(mod.key).toBe('find_lead');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Find Lead');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('looks up by email', async () => {
    const scope = nock(BASE).get(`${API}/leads/find`).query({ email: 'maria@example.com' }).reply(200, op.sample);
    const result = (await run({ email: 'maria@example.com', phone: '' })) as any[];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(op.sample.id);
    expect(scope.isDone()).toBe(true);
  });

  it('looks up by phone and by external ID', async () => {
    nock(BASE).get(`${API}/leads/find`).query({ phone: '+34612345678' }).reply(200, op.sample);
    nock(BASE).get(`${API}/leads/find`).query({ externalId: 'ext-1' }).reply(200, op.sample);
    expect(await run({ phone: '+34612345678' })).toHaveLength(1);
    expect(await run({ externalId: 'ext-1' })).toHaveLength(1);
  });

  it('returns an empty list on a 404', async () => {
    nock(BASE).get(`${API}/leads/find`).query({ email: 'none@example.com' }).reply(404, {});
    expect(await run({ email: 'none@example.com' })).toEqual([]);
  });

  it('passes the API 400 through', async () => {
    nock(BASE).get(`${API}/leads/find`).reply(400, { message: 'Provide exactly one of: email, phone, externalId' });
    const error = await rejection(run({}));
    expect(error.message).toContain('exactly one');
  });
});
