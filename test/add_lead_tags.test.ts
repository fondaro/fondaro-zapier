import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/add_lead_tags.js';
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

describe('add_lead_tags', () => {
  it('is Add Tags to Lead on the Lead noun', () => {
    expect(mod.key).toBe('add_lead_tags');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Add Tags to Lead');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('posts the tags and returns them with the lead id', async () => {
    const scope = nock(BASE).post(`${API}/leads/12/tags`, { tags: ['VIP', 'c1a4e9d2-6b3f-4f0a-8d57-91a2b7e5c310'] }).reply(201, { tags: op.sample.tags });
    const result = (await run({ leadId: 12, tags: ['VIP', 'c1a4e9d2-6b3f-4f0a-8d57-91a2b7e5c310'] })) as any;
    expect(result).toMatchObject({ id: 12, leadId: 12 });
    expect(result.tags).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('names the lead or tag on a 404', async () => {
    nock(BASE).post(`${API}/leads/12/tags`).reply(404, { message: 'Tag not found' });
    const error = await rejection(run({ leadId: 12, tags: ['c1a4e9d2-6b3f-4f0a-8d57-91a2b7e5c310'] }));
    expect(error.message).toContain('Lead 12 or one of the tags was not found in your Fondaro CRM.');
  });
});
