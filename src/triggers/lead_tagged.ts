import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadOutputFields, nested, tagOutputFields, tagsField } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { tagMatches, tagMayMatch, wantedTags } from '../lib/inputs.js';
import { leadSample, tagSample } from '../lib/samples.js';

type Lead = Record<string, any>;
type Tag = Record<string, any>;

// One id per tag event: a lead tagged twice in one Zap must not collide.
const eventId = (leadId: unknown, tagId: unknown) => `${String(leadId)}:${String(tagId)}`;

export const lead_taggedSample = {
  ...leadSample,
  id: `${leadSample.id}:${tagSample.id}`,
  leadId: leadSample.id,
  tag: tagSample,
  changedBy: 'user_2abc123def456ghi789',
};

export default defineFondaroHook({
  key: 'lead_tagged',
  noun: 'Lead',
  label: 'Lead Tagged',
  description: 'Triggers when a tag is added to a lead.',
  event: 'lead.tagged',
  inputFields: [
    tagsField({
      label: 'Only For Tags',
      helpText: 'Leave empty to trigger for every tag.',
    }),
  ],
  filter: (data, input) => tagMayMatch(data.tagId, wantedTags(input)),
  accept: (record, input) => tagMatches(record.tag as Tag, wantedTags(input)),
  hydrate: async (z: ZObject, bundle: Bundle, data) => {
    const lead = await fondaro<Lead>(
      z,
      bundle,
      'GET',
      `/leads/${seg(data.leadId as string | number)}`,
      { notFound: 'empty', subject: `Lead ${String(data.leadId)}` },
    );
    if (!lead) return null;
    // Resolves archived tags and tags no longer on the lead.
    const tag = await fondaro<Tag>(z, bundle, 'GET', `/tags/${seg(data.tagId as string)}`, {
      notFound: 'empty',
      subject: `Tag ${String(data.tagId)}`,
    });
    if (!tag) return null;
    return {
      ...lead,
      id: eventId(lead.id, data.tagId),
      leadId: lead.id,
      tag,
      changedBy: data.changedBy ?? null,
    };
  },
  list: async (z: ZObject, bundle: Bundle) => {
    const wanted = wantedTags((bundle.inputData ?? {}) as Record<string, unknown>);
    const response = await fondaro<{ leads: Lead[] }>(z, bundle, 'GET', '/leads', {
      params: { sort: 'createdAt', limit: 25 },
    });
    const records: Lead[] = [];
    for (const lead of response?.leads ?? []) {
      const tags: Tag[] = lead.tags ?? [];
      const tag = tags.find((t) => tagMatches(t, wanted));
      if (!tag) continue;
      records.push({
        ...lead,
        id: eventId(lead.id, tag.id),
        leadId: lead.id,
        tag,
        changedBy: null,
      });
    }
    return records.slice(0, 3);
  },
  sample: lead_taggedSample,
  outputFields: [
    { key: 'id', label: 'ID' },
    { key: 'leadId', label: 'Lead ID', type: 'integer' },
    ...leadOutputFields.filter((field) => field.key !== 'id'),
    ...nested('tag', 'Tag', tagOutputFields),
    { key: 'changedBy', label: 'Changed By' },
  ],
});
