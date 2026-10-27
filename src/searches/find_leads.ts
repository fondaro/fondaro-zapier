import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { tagChoices, assigneeChoices } from '../lib/choices.js';
import { leadOutputFields, lineItemFields, pageOutputFields } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';
import { CRM_STATUS_CHOICES } from '../lib/vocabulary.js';
import { asNumber, ticked } from '../lib/inputs.js';

export const findLeadsSample = {
  id: 'offset-0',
  leads: [leadSample],
  total: 1,
  hasMore: false,
  nextOffset: 1,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const offset = asNumber(input.offset, 0);
  const result = await fondaro<{
    leads?: unknown[];
    total?: number;
    hasMore?: boolean;
  }>(z, bundle, 'GET', '/leads', {
    params: {
      tags: input.tags,
      crmStatus: input.crmStatus,
      assigneeId: input.assigneeId,
      unassigned: ticked(input.unassigned) ? true : undefined,
      limit: input.limit === undefined ? undefined : asNumber(input.limit, 50),
      offset: input.offset === undefined ? undefined : offset,
    },
  });
  const leads = result?.leads ?? [];
  return [
    {
      id: `offset-${offset}`,
      leads,
      total: result?.total ?? leads.length,
      hasMore: result?.hasMore ?? false,
      nextOffset: offset + leads.length,
    },
  ];
};

export default defineSearch({
  key: 'find_leads',
  noun: 'Lead',
  display: {
    label: 'Find Leads',
    description:
      'Finds a page of leads, newest first, filtered by tags, CRM status or team member. Returns them as line items.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        list: true,
        choices: { perform: tagChoices },
        helpText: 'Leads with any of these tags. Names work as well as IDs.',
      },
      {
        key: 'crmStatus',
        label: 'CRM Status',
        type: 'string',
        choices: CRM_STATUS_CHOICES,
      },
      {
        key: 'assigneeId',
        label: 'Team Member',
        type: 'string',
        choices: { perform: assigneeChoices },
        helpText: 'Leads assigned to this person. Not with Unassigned.',
      },
      {
        key: 'unassigned',
        label: 'Unassigned',
        type: 'boolean',
        helpText: 'Yes returns leads nobody owns. Not with Team Member.',
      },
      {
        key: 'limit',
        label: 'Page Size',
        type: 'integer',
        default: '50',
        helpText: 'From 1 to 100.',
      },
      {
        key: 'offset',
        label: 'Offset',
        type: 'integer',
        default: '0',
        helpText: 'Leads to skip. Use Next Offset from the previous page.',
      },
    ],
    sample: findLeadsSample,
    outputFields: [
      ...pageOutputFields,
      ...lineItemFields('leads', 'Lead', leadOutputFields),
    ],
  },
});
