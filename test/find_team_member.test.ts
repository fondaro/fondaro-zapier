import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/find_team_member.js';
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

describe('find_team_member', () => {
  it('is Find Team Member on the Team Member noun', () => {
    expect(mod.key).toBe('find_team_member');
    expect(mod.noun).toBe('Team Member');
    expect(mod.display.label).toBe('Find Team Member');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('finds by ID', async () => {
    const scope = nock(BASE).get(`${API}/users/user_b`).reply(200, op.sample);
    expect(await run({ userId: 'user_b' })).toEqual([op.sample]);
    expect(scope.isDone()).toBe(true);
  });

  it('finds by email and uses the first match', async () => {
    const scope = nock(BASE).get(`${API}/users`).query({ email: 'sofia@example-agency.com' }).reply(200, [op.sample]);
    expect(await run({ email: 'sofia@example-agency.com' })).toEqual([op.sample]);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty list for an unknown ID or email', async () => {
    nock(BASE).get(`${API}/users/ghost`).reply(404, {});
    nock(BASE).get(`${API}/users`).query({ email: 'no@example.com' }).reply(200, []);
    expect(await run({ userId: 'ghost' })).toEqual([]);
    expect(await run({ email: 'no@example.com' })).toEqual([]);
  });

  it('needs exactly one of ID and email', async () => {
    expect((await rejection(run({}))).message).toContain('either');
    expect((await rejection(run({ userId: 'a', email: 'b@c.de' }))).message).toContain('either');
  });
});
