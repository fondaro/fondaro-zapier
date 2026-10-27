import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/creates/create_task.js';
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

describe('create_task', () => {
  it('is Create Task on the Task noun', () => {
    expect(mod.key).toBe('create_task');
    expect(mod.noun).toBe('Task');
    expect(mod.display.label).toBe('Create Task');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('sends only the filled fields', async () => {
    const scope = nock(BASE).post(`${API}/leads/12/tasks`, { title: 'Call back' }).reply(201, op.sample);
    await run({ leadId: 12, title: 'Call back', description: '', assigneeIds: [] });
    expect(scope.isDone()).toBe(true);
  });

  it('maps every field to the DTO key', async () => {
    const body = { title: 'Call back', description: 'Saturday', dueDate: '2026-10-24T09:00:00.000Z', assigneeIds: ['user_b'] };
    const scope = nock(BASE).post(`${API}/leads/12/tasks`, body).reply(201, op.sample);
    await run({ leadId: 12, ...body });
    expect(scope.isDone()).toBe(true);
  });

  it('names the lead on a 404', async () => {
    nock(BASE).post(`${API}/leads/99/tasks`).reply(404, {});
    const error = await rejection(run({ leadId: 99, title: 'x' }));
    expect(error.message).toContain('Lead 99 was not found in your Fondaro CRM.');
  });
});
