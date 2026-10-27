import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/create_note.js';
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

describe('create_note', () => {
  it('is Create Note on the Note noun', () => {
    expect(mod.key).toBe('create_note');
    expect(mod.noun).toBe('Note');
    expect(mod.display.label).toBe('Create Note');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends the content', async () => {
    const scope = nock(BASE).post(`${API}/leads/12/notes`, { content: 'Likes sea views' }).reply(201, op.sample);
    const result = await run({ leadId: 12, content: 'Likes sea views' });
    expect(result).toMatchObject({ id: op.sample.id });
    expect(scope.isDone()).toBe(true);
  });

  it('names the lead on a 404', async () => {
    nock(BASE).post(`${API}/leads/99/notes`).reply(404, {});
    const error = await rejection(run({ leadId: 99, content: 'x' }));
    expect(error.message).toContain('Lead 99 was not found in your Fondaro CRM.');
  });
});
