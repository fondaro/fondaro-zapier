import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/add_lead_assignees.js';
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

describe('add_lead_assignees', () => {
  it('is Add Lead Assignees on the Lead noun', () => {
    expect(mod.key).toBe('add_lead_assignees');
    expect(mod.noun).toBe('Lead');
    expect(mod.display.label).toBe('Add Lead Assignees');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('posts userIds and keeps added and removed', async () => {
    const reply = { ...op.sample, added: ['user_b'], removed: [] };
    const scope = nock(BASE).post(`${API}/leads/12/assignees`, { userIds: ['user_b'] }).reply(201, reply);
    const result = (await run({ leadId: 12, assigneeIds: ['user_b'] })) as any;
    expect(result.added).toEqual(['user_b']);
    expect(result.removed).toEqual([]);
    expect(scope.isDone()).toBe(true);
  });

  it('names the lead on a 404', async () => {
    nock(BASE).post(`${API}/leads/99/assignees`).reply(404, {});
    const error = await rejection(run({ leadId: 99, assigneeIds: ['user_b'] }));
    expect(error.message).toContain('Lead 99 was not found in your Fondaro CRM.');
  });
});
