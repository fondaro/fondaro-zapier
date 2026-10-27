import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import {
  assigneesField,
  leadField,
  leadOutputFields,
} from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';

export const addLeadAssigneesSample = {
  ...leadSample,
  added: ['user_2abc123def456ghi789'],
  removed: [],
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'POST',
    `/leads/${seg(input.leadId as string | number)}/assignees`,
    {
      body: { userIds: input.assigneeIds },
      subject: `Lead ${String(input.leadId)}`,
    },
  );
};

export default defineCreate({
  key: 'add_lead_assignees',
  noun: 'Lead',
  display: {
    label: 'Add Lead Assignees',
    description:
      'Adds team members to a lead without removing the people already assigned.',
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      assigneesField({
        required: true,
        helpText: 'Who to add. Anyone already assigned stays assigned.',
      }),
    ],
    sample: addLeadAssigneesSample,
    outputFields: [
      ...leadOutputFields,
      { key: 'added[]', label: 'Added Team Member IDs' },
      { key: 'removed[]', label: 'Removed Team Member IDs' },
    ],
  },
});
