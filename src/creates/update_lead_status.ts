import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadField, leadOutputFields } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';
import { CRM_STATUS_CHOICES } from '../lib/vocabulary.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'PATCH',
    `/leads/${seg(input.leadId as string | number)}/status`,
    {
      body: { crmStatus: input.crmStatus },
      subject: `Lead ${String(input.leadId)}`,
    },
  );
};

export default defineCreate({
  key: 'update_lead_status',
  noun: 'Lead',
  display: {
    label: 'Update Lead Status',
    description:
      "Sets a lead's CRM status to New, Potential, Bad Timing, Client or Unqualified.",
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      {
        key: 'crmStatus',
        label: 'CRM Status',
        type: 'string',
        required: true,
        choices: CRM_STATUS_CHOICES,
      },
    ],
    sample: { ...leadSample, crmStatus: 'potential' },
    outputFields: leadOutputFields,
  },
});
