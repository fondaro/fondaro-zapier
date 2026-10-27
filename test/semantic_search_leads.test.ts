import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/semantic_search_leads.js';
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

describe('semantic_search_leads', () => {
  it('is Find Leads by Meaning on the Lead Match noun', () => {
    expect(mod.key).toBe('semantic_search_leads');
    expect(mod.noun).toBe('Lead Match');
    expect(mod.display.label).toBe('Find Leads by Meaning');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  it('posts only the filled fields', async () => {
    const scope = nock(BASE).post(`${API}/leads/semantic-search`, { query: 'sea views', maxResults: 5 }).reply(200, { matches: op.sample.matches, tookMs: 300, reranked: true });
    const result = (await run({ query: 'sea views', maxResults: 5, leadId: '', occurredFrom: '' })) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'sea views', reranked: true, tookMs: 300 });
    expect(result[0].matches).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('maps the date range and lead', async () => {
    const body = { query: 'golf', occurredFrom: '2026-01-01T00:00:00.000Z', occurredTo: '2026-06-01T00:00:00.000Z', leadId: 12 };
    const scope = nock(BASE).post(`${API}/leads/semantic-search`, body).reply(200, { matches: [], tookMs: 10, reranked: false });
    const result = (await run(body)) as any[];
    expect(result[0].matches).toEqual([]);
    expect(scope.isDone()).toBe(true);
  });

  it('surfaces the missing-scope 403', async () => {
    nock(BASE).post(`${API}/leads/semantic-search`).reply(403, { message: "This connection is missing the 'leads:read' scope" });
    const error = await rejection(run({ query: 'x' }));
    expect(error.message).toContain('leads:read');
  });
});
