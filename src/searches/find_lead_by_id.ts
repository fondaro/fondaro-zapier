import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadField, leadOutputFields } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const lead = await fondaro<Record<string, unknown>>(
    z,
    bundle,
    'GET',
    `/leads/${seg(input.leadId as string | number)}`,
    { notFound: 'empty' },
  );
  return lead ? [lead] : [];
};

export default defineSearch({
  key: 'find_lead_by_id',
  noun: 'Lead',
  display: {
    label: 'Find Lead by ID',
    description: 'Finds one lead in your CRM by its Fondaro lead ID.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      leadField({ helpText: 'The number in the lead page address.' }),
    ],
    sample: leadSample,
    outputFields: leadOutputFields,
  },
});
