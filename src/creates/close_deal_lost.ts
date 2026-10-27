import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { dealField, dealOutputFields } from '../lib/fields.js';
import { dealSample } from '../lib/samples.js';
import { pickFilled } from '../lib/inputs.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'POST',
    `/deals/${seg(input.dealId as string)}/lost`,
    {
      body: pickFilled(input, ['lostReason', 'lostAt']),
      subject: `Deal ${String(input.dealId)}`,
    },
  );
};

export default defineCreate({
  key: 'close_deal_lost',
  noun: 'Deal',
  display: {
    label: 'Close Deal as Lost',
    description:
      'Marks an open deal as lost, with an optional reason and date.',
  },
  operation: {
    perform,
    inputFields: [
      dealField(),
      {
        key: 'lostReason',
        label: 'Lost Reason',
        type: 'text',
        helpText: 'Up to 2,000 characters.',
      },
      {
        key: 'lostAt',
        label: 'Lost Date',
        type: 'datetime',
        helpText: 'Leave empty to use the moment this step runs.',
      },
    ],
    sample: {
      ...dealSample,
      status: 'lost',
      lostAt: '2026-10-23T11:00:00.000Z',
      lostReason: 'Bought elsewhere',
    },
    outputFields: dealOutputFields,
  },
});
