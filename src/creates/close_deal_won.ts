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
    `/deals/${seg(input.dealId as string)}/won`,
    {
      body: pickFilled(input, ['wonAt']),
      subject: `Deal ${String(input.dealId)}`,
    },
  );
};

export default defineCreate({
  key: 'close_deal_won',
  noun: 'Deal',
  display: {
    label: 'Close Deal as Won',
    description: 'Marks an open deal as won, today or on the date you give.',
  },
  operation: {
    perform,
    inputFields: [
      dealField(),
      {
        key: 'wonAt',
        label: 'Won Date',
        type: 'datetime',
        helpText: 'Leave empty to use the moment this step runs.',
      },
    ],
    sample: {
      ...dealSample,
      status: 'won',
      wonAt: '2026-10-23T11:00:00.000Z',
    },
    outputFields: dealOutputFields,
  },
});
