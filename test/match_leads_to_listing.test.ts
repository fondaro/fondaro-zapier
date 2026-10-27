import nock from 'nock';
import { describe, expect, it } from 'vitest';

import mod from '../src/searches/match_leads_to_listing.js';
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

describe('match_leads_to_listing', () => {
  it('is Find Leads for a Listing on the Lead Match noun', () => {
    expect(mod.key).toBe('match_leads_to_listing');
    expect(mod.noun).toBe('Lead Match');
    expect(mod.display.label).toBe('Find Leads for a Listing');
  });

  it('has a sample that matches its output fields', sampleHasOutputFields);

  const LISTING = '5c9a7e21-4d38-4b60-8f12-a3e6d0b9c847';
  const reply = { listingQuery: 'Villa', matches: op.sample.matches, tookMs: 5, reranked: true };

  it('matches by Fondaro listing ID', async () => {
    const scope = nock(BASE).post(`${API}/leads/listing-match`, { propertyListingId: LISTING, maxResults: 3 }).reply(200, reply);
    const result = (await run({ propertyListingId: LISTING, maxResults: 3 })) as any[];
    expect(result[0]).toMatchObject({ id: LISTING, listingQuery: 'Villa' });
    expect(result[0].matches).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('matches by another source listing reference', async () => {
    const scope = nock(BASE).post(`${API}/leads/listing-match`, { listingRef: { source: 'resales', id: 'R123', country: 'ES' } }).reply(200, reply);
    await run({ listingSource: 'resales', listingId: 'R123', listingCountry: 'ES' });
    expect(scope.isDone()).toBe(true);
  });

  it('rejects both identities, neither, and a half reference without a request', async () => {
    expect((await rejection(run({ propertyListingId: LISTING, listingSource: 'resales', listingId: 'R1' }))).message).toContain('not both');
    expect((await rejection(run({}))).message).toContain('either');
    expect((await rejection(run({ listingSource: 'resales' }))).message).toContain('source and its ID');
  });
});
