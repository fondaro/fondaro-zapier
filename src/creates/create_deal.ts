import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import {
  assigneesField,
  dealOutputFields,
  leadField,
} from '../lib/fields.js';
import { dealSample } from '../lib/samples.js';
import { DEAL_STAGE_CHOICES } from '../lib/vocabulary.js';
import { pickFilled } from '../lib/inputs.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const body = {
    leadId: Number(input.leadId),
    ...pickFilled(input, [
      'title',
      'stage',
      'amount',
      'expectedCloseAt',
      'assigneeIds',
    ]),
  };
  // The currency is the organization's billing currency; the API answers 400
  // with an explanation when none is set, and that message reaches the Zap.
  return fondaro<Record<string, unknown>>(z, bundle, 'POST', '/deals', {
    body,
    subject: `Lead ${String(input.leadId)}`,
  });
};

export default defineCreate({
  key: 'create_deal',
  noun: 'Deal',
  display: {
    label: 'Create Deal',
    description:
      "Opens a deal on a lead in your organization's billing currency. Needs a title.",
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      { key: 'title', label: 'Title', type: 'string', required: true },
      {
        key: 'stage',
        label: 'Stage',
        type: 'string',
        choices: DEAL_STAGE_CHOICES,
        helpText: 'Leave empty to start at the first stage.',
      },
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        helpText: 'Up to two decimals. The currency is set by your organization.',
      },
      {
        key: 'expectedCloseAt',
        label: 'Expected Close Date',
        type: 'datetime',
      },
      assigneesField({ helpText: 'Who owns the deal.' }),
    ],
    sample: dealSample,
    outputFields: dealOutputFields,
  },
});
