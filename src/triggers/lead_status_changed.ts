import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadOutputFields } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { leadSample } from '../lib/samples.js';
import { CRM_STATUS_CHOICES } from '../lib/vocabulary.js';

type Lead = Record<string, any>;

const toStatuses = (input: Record<string, any>): string[] => {
  const value = input.toStatuses;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return typeof value === 'string' && value ? [value] : [];
};

const wanted = (input: Record<string, any>, status: unknown): boolean => {
  const statuses = toStatuses(input);
  return statuses.length === 0 || statuses.includes(String(status));
};

export const leadStatusChangedSample = {
  ...leadSample,
  crmStatus: 'potential',
  fromStatus: 'lead',
  toStatus: 'potential',
  changedBy: 'user_2abc123def456ghi789',
};

export default defineFondaroHook({
  key: 'lead_status_changed',
  noun: 'Lead',
  label: 'Lead Status Changed',
  description:
    'Triggers when the status of a lead changes in your Fondaro CRM.',
  event: 'lead.statusChanged',
  inputFields: [
    {
      key: 'toStatuses',
      label: 'Only When Changed To',
      type: 'string',
      list: true,
      choices: CRM_STATUS_CHOICES,
      helpText: 'Leave empty to trigger on every status change.',
    },
  ],
  // A bulk status change arrives as one event per lead, so each delivery names
  // exactly one lead.
  filter: (data, input) => wanted(input, data.toStatus),
  hydrate: async (z: ZObject, bundle: Bundle, data) => {
    const lead = await fondaro<Lead>(
      z,
      bundle,
      'GET',
      `/leads/${seg(data.leadId as string | number)}`,
      { notFound: 'empty', subject: `Lead ${String(data.leadId)}` },
    );
    if (!lead) return null;
    return {
      ...lead,
      fromStatus: data.fromStatus ?? null,
      toStatus: data.toStatus ?? null,
      changedBy: data.changedBy ?? null,
    };
  },
  list: async (z: ZObject, bundle: Bundle) => {
    const input = (bundle.inputData ?? {}) as Record<string, any>;
    const statuses = toStatuses(input);
    const response = await fondaro<{ leads: Lead[] }>(
      z,
      bundle,
      'GET',
      '/leads',
      {
        params: {
          sort: 'createdAt',
          limit: statuses.length > 0 ? 25 : 3,
          crmStatus: statuses.length === 1 ? statuses[0] : undefined,
        },
      },
    );
    return (response?.leads ?? [])
      .filter((lead) => wanted(input, lead.crmStatus))
      .slice(0, 3)
      .map((lead) => ({
        ...lead,
        fromStatus: null,
        toStatus: lead.crmStatus ?? null,
        changedBy: null,
      }));
  },
  sample: leadStatusChangedSample,
  outputFields: [
    ...leadOutputFields,
    { key: 'fromStatus', label: 'From Status' },
    { key: 'toStatus', label: 'To Status' },
    { key: 'changedBy', label: 'Changed By' },
  ],
});
