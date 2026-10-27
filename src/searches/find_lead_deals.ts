import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { dealOutputFields, leadField, lineItemFields } from '../lib/fields.js';
import { dealSample } from '../lib/samples.js';

export const findLeadDealsSample = {
  id: 48213,
  leadId: 48213,
  deals: [dealSample],
  total: 1,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const leadId = input.leadId as string | number;
  const deals = await fondaro<unknown[]>(
    z,
    bundle,
    'GET',
    `/leads/${seg(leadId)}/deals`,
    { notFound: 'empty' },
  );
  if (!deals) return [];
  return [{ id: leadId, leadId, deals, total: deals.length }];
};

export default defineSearch({
  key: 'find_lead_deals',
  noun: 'Lead Deal',
  display: {
    label: 'Find Deals on Lead',
    description: 'Finds every deal on a lead. Returns them as line items.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [leadField()],
    sample: findLeadDealsSample,
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'leadId', label: 'Lead ID', type: 'integer' },
      { key: 'total', label: 'Total', type: 'integer' },
      ...lineItemFields('deals', 'Deal', dealOutputFields),
    ],
  },
});
