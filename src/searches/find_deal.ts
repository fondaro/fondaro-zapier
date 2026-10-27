import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { dealOutputFields } from '../lib/fields.js';
import { dealSample } from '../lib/samples.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const deal = await fondaro<Record<string, unknown>>(
    z,
    bundle,
    'GET',
    `/deals/${seg(input.dealId as string)}`,
    { notFound: 'empty' },
  );
  return deal ? [deal] : [];
};

export default defineSearch({
  key: 'find_deal',
  noun: 'Deal',
  display: {
    label: 'Find Deal',
    description: 'Finds one deal by its ID.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'dealId',
        label: 'Deal ID',
        type: 'string',
        required: true,
        helpText: 'Map the ID from an earlier step, such as Find Deals on Lead.',
        search: 'find_lead_deals.deals[]id',
      },
    ],
    sample: dealSample,
    outputFields: dealOutputFields,
  },
});
