import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { callOutputFields, leadField, lineItemFields, pageOutputFields } from '../lib/fields.js';
import { callSample } from '../lib/samples.js';
import { asNumber } from '../lib/inputs.js';

export const findLeadCallsSample = {
  id: 48213,
  leadId: 48213,
  calls: [callSample],
  total: 1,
  hasMore: false,
  totalIsExact: true,
  nextOffset: 1,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const leadId = input.leadId as string | number;
  const result = await fondaro<Record<string, any>>(
    z,
    bundle,
    'GET',
    `/leads/${seg(leadId)}/calls`,
    {
      params: {
        limit: input.limit === undefined ? undefined : asNumber(input.limit, 20),
        offset:
          input.offset === undefined ? undefined : asNumber(input.offset, 0),
      },
      notFound: 'empty',
    },
  );
  if (!result) return [];
  return [{ ...result, id: leadId, leadId }];
};

export default defineSearch({
  key: 'find_lead_calls',
  noun: 'Lead Call',
  display: {
    label: 'Find Lead Calls',
    description:
      "Finds a page of a lead's calls, newest first, with outcome, owner and duration. Returns them as line items.",
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      {
        key: 'limit',
        label: 'Page Size',
        type: 'integer',
        default: '20',
        helpText: 'From 1 to 100.',
      },
      {
        key: 'offset',
        label: 'Offset',
        type: 'integer',
        default: '0',
        helpText: 'Calls to skip. Use Next Offset from the previous page.',
      },
    ],
    sample: findLeadCallsSample,
    outputFields: [
      // The result's id is the lead's (an integer).
      { key: 'id', label: 'ID', type: 'integer' },
      ...pageOutputFields.filter((field) => field.key !== 'id'),
      { key: 'leadId', label: 'Lead ID', type: 'integer' },
      { key: 'totalIsExact', label: 'Total Is Exact', type: 'boolean' },
      ...lineItemFields('calls', 'Call', callOutputFields),
    ],
  },
});
