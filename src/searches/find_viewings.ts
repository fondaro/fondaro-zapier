import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { assigneeChoices } from '../lib/choices.js';
import { lineItemFields, pageOutputFields, viewingOutputFields } from '../lib/fields.js';
import { viewingSample } from '../lib/samples.js';
import { asNumber } from '../lib/inputs.js';

const choice = (value: string, label: string) => ({ value, sample: value, label });

export const findViewingsSample = {
  id: 'offset-0',
  viewings: [viewingSample],
  total: 1,
  hasMore: false,
  nextOffset: 1,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const offset = asNumber(input.offset, 0);
  const result = await fondaro<{
    viewings?: unknown[];
    total?: number;
    hasMore?: boolean;
    nextOffset?: number;
  }>(z, bundle, 'GET', '/viewings', {
    params: {
      propertyListingId: input.propertyListingId,
      leadId: input.leadId,
      collaboratorLeadId: input.collaboratorLeadId,
      agentUserId: input.agentUserId,
      dealId: input.dealId,
      status: input.status,
      kind: input.kind,
      from: input.from,
      to: input.to,
      limit: input.limit === undefined ? undefined : asNumber(input.limit, 20),
      offset: input.offset === undefined ? undefined : offset,
    },
  });
  const viewings = result?.viewings ?? [];
  return [
    {
      id: `offset-${offset}`,
      viewings,
      total: result?.total ?? viewings.length,
      hasMore: result?.hasMore ?? false,
      nextOffset: result?.nextOffset ?? offset + viewings.length,
    },
  ];
};

export default defineSearch({
  key: 'find_viewings',
  noun: 'Viewing',
  display: {
    label: 'Find Viewings',
    description:
      'Finds a page of registered viewings of your own listings, latest first, filtered by listing, lead, team member, status or dates. Returns them as line items.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'propertyListingId',
        label: 'Listing ID',
        type: 'string',
        helpText: 'Only viewings of this listing.',
      },
      {
        key: 'leadId',
        label: 'Lead',
        type: 'integer',
        search: 'find_lead.id',
        helpText: 'Includes viewings the lead attended as a guest.',
      },
      {
        key: 'collaboratorLeadId',
        label: 'Collaborator Lead',
        type: 'integer',
        search: 'find_lead.id',
      },
      {
        key: 'agentUserId',
        label: 'Team Member',
        type: 'string',
        choices: { perform: assigneeChoices },
      },
      {
        key: 'dealId',
        label: 'Deal',
        type: 'string',
        search: 'find_deal.id',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        choices: [
          choice('scheduled', 'Scheduled'),
          choice('completed', 'Completed'),
          choice('cancelled', 'Cancelled'),
          choice('no_show', 'No Show'),
        ],
      },
      {
        key: 'kind',
        label: 'Kind',
        type: 'string',
        choices: [choice('in_person', 'In Person'), choice('virtual', 'Virtual')],
      },
      {
        key: 'from',
        label: 'From Date',
        type: 'datetime',
        helpText: 'Viewings at or after this time.',
      },
      {
        key: 'to',
        label: 'To Date',
        type: 'datetime',
        helpText: 'Viewings before this time. Must be after From Date.',
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
        helpText: 'Viewings to skip. Use Next Offset from the previous page.',
      },
    ],
    sample: findViewingsSample,
    outputFields: [
      ...pageOutputFields,
      ...lineItemFields('viewings', 'Viewing', viewingOutputFields),
    ],
  },
});
