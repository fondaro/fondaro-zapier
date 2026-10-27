import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { tagsField, leadField, tagOutputFields } from '../lib/fields.js';
import { tagSample } from '../lib/samples.js';

export const addLeadTagsSample = {
  id: 48213,
  leadId: 48213,
  tags: [tagSample],
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const leadId = input.leadId as string | number;
  const result = await fondaro<{ tags: unknown[] }>(
    z,
    bundle,
    'POST',
    `/leads/${seg(leadId)}/tags`,
    {
      body: { tags: input.tags },
      // An unknown tag id is also a 404, so the message names both.
      subject: `Lead ${String(leadId)} or one of the tags`,
    },
  );
  return { id: leadId, leadId, tags: result?.tags ?? [] };
};

export default defineCreate({
  key: 'add_lead_tags',
  noun: 'Lead',
  display: {
    label: 'Add Tags to Lead',
    description:
      "Adds tags to a lead by name or ID and keeps the lead's existing tags. Names that don't exist yet are created.",
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      tagsField({
        key: 'tags',
        required: true,
        helpText: 'Pick tags or type names. An ID that matches no tag fails.',
      }),
    ],
    sample: addLeadTagsSample,
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'leadId', label: 'Lead ID', type: 'integer' },
      ...tagOutputFields.map((field) => ({
        ...field,
        key: `tags[]${field.key}`,
        label: `Tag ${field.label}`,
      })),
    ],
  },
});
