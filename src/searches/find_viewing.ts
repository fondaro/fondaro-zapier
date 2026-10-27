import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { viewingOutputFields } from '../lib/fields.js';
import { viewingSample } from '../lib/samples.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const viewing = await fondaro<Record<string, unknown>>(
    z,
    bundle,
    'GET',
    `/viewings/${seg(input.viewingId as string)}`,
    { notFound: 'empty' },
  );
  return viewing ? [viewing] : [];
};

export default defineSearch({
  key: 'find_viewing',
  noun: 'Viewing',
  display: {
    label: 'Find Viewing',
    description:
      'Finds one registered viewing of your own listings by its ID, with its full notes.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'viewingId',
        label: 'Viewing ID',
        type: 'string',
        required: true,
        helpText: 'Map the ID from an earlier step, such as Find Viewings.',
        search: 'find_viewings.viewings[]id',
      },
    ],
    sample: viewingSample,
    outputFields: viewingOutputFields,
  },
});
