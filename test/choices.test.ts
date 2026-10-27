import nock from 'nock';
import { describe, expect, it } from 'vitest';

import {
  assigneeChoices,
  leadSourceChoices,
  tagChoices,
} from '../src/lib/choices.js';
import { assigneesField, tagsField } from '../src/lib/fields.js';
import { API, BASE, rejection, run } from './helpers.js';
import leadSources from './fixtures/options-lead-sources.json' with { type: 'json' };

describe('function dropdowns', () => {
  it('maps tag options (by id) to Zapier choices', async () => {
    const scope = nock(BASE)
      .get(`${API}/options/tags`)
      .query({ value: 'id' })
      .reply(200, [
        { name: 'Cash buyer', value: 'tag-1' },
        { name: '', value: 'tag-2' },
        { name: 'No value', value: '' },
      ]);
    const choices = await run(tagChoices);
    expect(choices).toEqual({
      results: [
        { id: 'tag-1', label: 'Cash buyer' },
        { id: 'tag-2', label: 'tag-2' },
      ],
      paging_token: null,
    });
    expect(scope.isDone()).toBe(true);
  });

  it('maps assignees', async () => {
    nock(BASE)
      .get(`${API}/options/assignees`)
      .reply(200, [{ name: 'Sofia Marin', value: 'user_1' }]);
    expect(await run(assigneeChoices)).toEqual({
      results: [{ id: 'user_1', label: 'Sofia Marin' }],
      paging_token: null,
    });
  });

  it('maps lead sources', async () => {
    nock(BASE).get(`${API}/options/lead-sources`).reply(200, leadSources);
    const choices = await run(leadSourceChoices);
    expect(choices.results).toHaveLength(leadSources.length);
    expect(choices.results[0]).toEqual({ id: 'meta', label: 'Meta' });
    expect(choices.paging_token).toBeNull();
  });

  it('returns an empty list for an empty answer', async () => {
    nock(BASE).get(`${API}/options/assignees`).reply(200, []);
    expect(await run(assigneeChoices)).toEqual({ results: [], paging_token: null });
  });

  it('surfaces a missing scope instead of an empty dropdown', async () => {
    nock(BASE)
      .get(`${API}/options/tags`)
      .query(true)
      .reply(403, { message: "This connection is missing the 'leads:read' scope" });
    const error = await rejection(run(tagChoices));
    expect(error.message).toMatch(/leads:read/);
  });

  it('wires the shared fields to them', () => {
    expect((tagsField().choices as any).perform).toBe(tagChoices);
    expect((assigneesField().choices as any).perform).toBe(assigneeChoices);
    expect(tagsField().list).toBe(true);
  });
});
