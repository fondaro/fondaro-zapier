import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadField, lineItemFields, tagOutputFields } from '../lib/fields.js';
import { tagSample } from '../lib/samples.js';

export const findLeadTagsSample = {
  id: 48213,
  leadId: 48213,
  tags: [tagSample],
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const leadId = input.leadId as string | number;
  const result = await fondaro<{ tags?: unknown[] }>(
    z,
    bundle,
    'GET',
    `/leads/${seg(leadId)}/tags`,
    { notFound: 'empty' },
  );
  if (!result) return [];
  return [{ id: leadId, leadId, tags: result.tags ?? [] }];
};

export default defineSearch({
  key: 'find_lead_tags',
  noun: 'Lead Tag',
  display: {
    label: 'Find Lead Tags',
    description: 'Finds the tags on a lead. Returns them as line items.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [leadField()],
    sample: findLeadTagsSample,
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'leadId', label: 'Lead ID', type: 'integer' },
      ...lineItemFields('tags', 'Tag', tagOutputFields),
    ],
  },
});
