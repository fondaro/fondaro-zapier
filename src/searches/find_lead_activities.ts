import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadField, pageOutputFields } from '../lib/fields.js';
import { toChoices } from '../lib/vocabulary.js';
import { callSample } from '../lib/samples.js';
import { asNumber } from '../lib/inputs.js';

/** The activity `type` values the API accepts in `types`. */
const ACTIVITY_TYPE_CHOICES = toChoices([
  { name: 'Call', value: 'call' },
  { name: 'Note', value: 'note' },
  { name: 'Task Created', value: 'task-created' },
  { name: 'Task Completed', value: 'task-completed' },
  { name: 'Email', value: 'email' },
  { name: 'Status Change', value: 'status-change' },
  { name: 'Deal Stage Change', value: 'deal-stage-change' },
  { name: 'Deal Won', value: 'deal-won' },
  { name: 'Deal Lost', value: 'deal-lost' },
  { name: 'Assignee Change', value: 'assignee-change' },
  { name: 'Viewing', value: 'viewing' },
  { name: 'Document Attached', value: 'document-attached' },
  { name: 'Lead Created', value: 'lead-created' },
]);

export const findLeadActivitiesSample = {
  id: 48213,
  leadId: 48213,
  entries: [
    {
      type: 'call',
      occurredAt: '2026-10-23T09:30:00.000Z',
      call: callSample,
    },
  ],
  total: 1,
  hasMore: false,
  totalIsExact: true,
  nextOffset: 1,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const leadId = input.leadId as string | number;
  const result = await fondaro<Record<string, any>>(
    z,
    bundle,
    'GET',
    `/leads/${seg(leadId)}/activities`,
    {
      params: {
        types: input.types,
        limit: input.limit === undefined ? undefined : asNumber(input.limit, 20),
        offset:
          input.offset === undefined ? undefined : asNumber(input.offset, 0),
      },
      notFound: 'empty',
    },
  );
  if (!result) return [];
  return [{ ...result, id: leadId, leadId }];
};

export default defineSearch({
  key: 'find_lead_activities',
  noun: 'Lead Activity',
  display: {
    label: 'Find Lead Activities',
    description:
      "Finds a page of a lead's timeline, newest first: calls, notes, tasks, emails, status and deal changes. Returns them as line items.",
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      {
        key: 'types',
        label: 'Activity Types',
        type: 'string',
        list: true,
        choices: ACTIVITY_TYPE_CHOICES,
        helpText: 'Leave empty for every type.',
      },
      {
        key: 'limit',
        label: 'Page Size',
        type: 'integer',
        default: '20',
        helpText: 'From 1 to 100.',
      },
      {
        key: 'offset',
        label: 'Offset',
        type: 'integer',
        default: '0',
        helpText: 'Entries to skip. Use Next Offset from the previous page.',
      },
    ],
    sample: findLeadActivitiesSample,
    outputFields: [
      // The result's id is the lead's (an integer).
      { key: 'id', label: 'ID', type: 'integer' },
      ...pageOutputFields.filter((field) => field.key !== 'id'),
      { key: 'leadId', label: 'Lead ID', type: 'integer' },
      { key: 'totalIsExact', label: 'Total Is Exact', type: 'boolean' },
      { key: 'entries[]type', label: 'Activity Type' },
      { key: 'entries[]occurredAt', label: 'Activity Occurred At', type: 'datetime' },
      { key: 'entries[]call__id', label: 'Activity Call ID' },
      { key: 'entries[]call__outcome', label: 'Activity Call Outcome' },
      { key: 'entries[]call__direction', label: 'Activity Call Direction' },
      { key: 'entries[]note__preview', label: 'Activity Note Preview' },
      { key: 'entries[]task__title', label: 'Activity Task Title' },
    ],
  },
});
