import type { PlainOutputField } from 'zapier-platform-core';

import { defineFondaroHook } from '../lib/hooks.js';
import { leadSample } from '../lib/samples.js';
import { hydrateFromFeed, listFromFeeds } from '../lib/records.js';
import { leadSummaryFields } from '../lib/fields.js';

const noteFields: PlainOutputField[] = [
  { key: 'id', label: 'Note ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'authorId', label: 'Author ID' },
  { key: 'preview', label: 'Preview' },
  { key: 'occurredAt', label: 'Occurred At', type: 'datetime' },
  ...leadSummaryFields,
];

export default defineFondaroHook({
  key: 'new_note',
  noun: 'Note',
  label: 'New Note',
  description: 'Triggers when a note is added to a lead in your Fondaro CRM.',
  event: 'note.created',
  hydrate: (z, bundle, data) =>
    hydrateFromFeed(z, bundle, data, {
      type: 'note',
      key: 'note',
      idField: 'noteId',
    }),
  list: (z, bundle) => listFromFeeds(z, bundle, { type: 'note', key: 'note' }),
  sample: {
    id: '9a3d1f64-5e27-4b88-8c10-d4e6f7a2b358',
    leadId: 48213,
    authorId: 'user_2abc123def456ghi789',
    preview: 'Prefers sea views and a short drive to the golf course.',
    occurredAt: '2026-10-23T10:10:00.000Z',
    lead: leadSample,
  },
  outputFields: noteFields,
});
