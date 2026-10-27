import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadField, noteOutputFields } from '../lib/fields.js';
import { noteSample } from '../lib/samples.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'POST',
    `/leads/${seg(input.leadId as string | number)}/notes`,
    {
      body: { content: input.content },
      subject: `Lead ${String(input.leadId)}`,
    },
  );
};

export default defineCreate({
  key: 'create_note',
  noun: 'Note',
  display: {
    label: 'Create Note',
    description: "Adds a note to a lead's timeline.",
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      { key: 'content', label: 'Note', type: 'text', required: true },
    ],
    sample: noteSample,
    outputFields: noteOutputFields,
  },
});
