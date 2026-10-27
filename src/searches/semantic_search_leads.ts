import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { leadField, lineItemFields, matchOutputFields } from '../lib/fields.js';
import { matchSample } from '../lib/samples.js';
import { asNumber } from '../lib/inputs.js';

export const semanticSearchSample = {
  id: 'sea views near a golf course',
  matches: [matchSample],
  tookMs: 412,
  reranked: true,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const body: Record<string, unknown> = { query: input.query };
  for (const key of ['occurredFrom', 'occurredTo']) {
    if (input[key]) body[key] = input[key];
  }
  if (input.leadId) body.leadId = Number(input.leadId);
  if (input.maxResults) body.maxResults = asNumber(input.maxResults, 10);

  const result = await fondaro<Record<string, unknown>>(
    z,
    bundle,
    'POST',
    '/leads/semantic-search',
    { body, subject: input.leadId ? `Lead ${String(input.leadId)}` : undefined },
  );
  return [{ id: String(input.query), ...(result ?? { matches: [] }) }];
};

export default defineSearch({
  key: 'semantic_search_leads',
  noun: 'Lead Match',
  display: {
    label: 'Find Leads by Meaning',
    description:
      'Finds leads whose notes, call transcripts and summaries or emails match what you describe, best match first. Returns them as line items.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'query',
        label: 'What to Look For',
        type: 'string',
        required: true,
        helpText:
          'Describe it in your own words, for example "wants a sea view villa near a golf course". Up to 500 characters.',
      },
      {
        key: 'occurredFrom',
        label: 'From Date',
        type: 'datetime',
        helpText: 'Only conversations on or after this date.',
      },
      {
        key: 'occurredTo',
        label: 'To Date',
        type: 'datetime',
        helpText: 'Only conversations on or before this date.',
      },
      leadField({
        required: false,
        helpText: 'Limits the search to one lead’s history.',
      }),
      {
        key: 'maxResults',
        label: 'Maximum Results',
        type: 'integer',
        helpText: 'From 1 to 30.',
      },
    ],
    sample: semanticSearchSample,
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'tookMs', label: 'Took (Ms)', type: 'integer' },
      { key: 'reranked', label: 'Reranked', type: 'boolean' },
      ...lineItemFields('matches', 'Match', matchOutputFields),
    ],
  },
});
