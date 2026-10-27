import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { dealField, dealOutputFields } from '../lib/fields.js';
import { dealSample } from '../lib/samples.js';
import { DEAL_STAGE_CHOICES } from '../lib/vocabulary.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'PATCH',
    `/deals/${seg(input.dealId as string)}/stage`,
    {
      body: { stage: input.stage },
      subject: `Deal ${String(input.dealId)}`,
    },
  );
};

export default defineCreate({
  key: 'change_deal_stage',
  noun: 'Deal',
  display: {
    label: 'Change Deal Stage',
    description:
      'Moves an open deal to another stage: Interested, Viewing, Offer, Reserved or Under Contract.',
  },
  operation: {
    perform,
    inputFields: [
      dealField(),
      {
        key: 'stage',
        label: 'Stage',
        type: 'string',
        required: true,
        choices: DEAL_STAGE_CHOICES,
      },
    ],
    sample: dealSample,
    outputFields: dealOutputFields,
  },
});
