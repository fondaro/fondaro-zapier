import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { leadOutputFields } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';
import { asNumber } from '../lib/inputs.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const result = await fondaro<{ leads?: Record<string, unknown>[] }>(
    z,
    bundle,
    'GET',
    '/leads/search',
    {
      params: {
        q: input.q,
        limit: input.limit === undefined ? undefined : asNumber(input.limit, 15),
      },
    },
  );
  return result?.leads ?? [];
};

export default defineSearch({
  key: 'search_leads',
  noun: 'Lead',
  display: {
    label: 'Search Leads',
    description:
      'Finds leads whose name, email, phone number or company matches your text. Later steps use the first match.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'q',
        label: 'Search Text',
        type: 'string',
        required: true,
        helpText: 'A name, email, phone number or company. Up to 200 characters.',
      },
      {
        key: 'limit',
        label: 'Maximum Results',
        type: 'integer',
        default: '15',
        helpText: 'From 1 to 50.',
      },
    ],
    sample: leadSample,
    outputFields: leadOutputFields,
  },
});
