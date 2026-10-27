import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { assigneesField, leadOutputFields, userOutputFields } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { leadSample, userSample } from '../lib/samples.js';

type Lead = Record<string, any>;
type User = Record<string, any>;

const wantedIds = (input: Record<string, any>): string[] => {
  const value = input.onlyAssignedTo;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return typeof value === 'string' && value ? [value] : [];
};

const getUser = async (z: ZObject, bundle: Bundle, id: string) => {
  const user = await fondaro<User>(z, bundle, 'GET', `/users/${seg(id)}`, {
    notFound: 'empty',
    subject: `Team member ${id}`,
  });
  // A departed member keeps only their id.
  return user ?? { id };
};

export const leadAssignedSample = {
  ...leadSample,
  addedAssignees: [userSample],
};

export default defineFondaroHook({
  key: 'lead_assigned',
  noun: 'Lead',
  label: 'Lead Assigned',
  description: 'Triggers when a lead is assigned to a team member.',
  event: 'lead.assigned',
  inputFields: [
    assigneesField({
      key: 'onlyAssignedTo',
      label: 'Only When Assigned To',
      helpText: 'Leave empty to trigger for every team member.',
    }),
  ],
  // Removals alone never trigger; with a filter, any added member must match.
  filter: (data, input) => {
    const added: string[] = Array.isArray(data.added) ? data.added : [];
    if (added.length === 0) return false;
    const wanted = wantedIds(input);
    return wanted.length === 0 || added.some((id) => wanted.includes(id));
  },
  hydrate: async (z: ZObject, bundle: Bundle, data) => {
    const lead = await fondaro<Lead>(
      z,
      bundle,
      'GET',
      `/leads/${seg(data.leadId as string | number)}`,
      { notFound: 'empty', subject: `Lead ${String(data.leadId)}` },
    );
    if (!lead) return null;
    const added: string[] = Array.isArray(data.added) ? data.added : [];
    const addedAssignees: User[] = [];
    for (const id of added) addedAssignees.push(await getUser(z, bundle, id));
    return { ...lead, addedAssignees };
  },
  list: async (z: ZObject, bundle: Bundle) => {
    const wanted = wantedIds((bundle.inputData ?? {}) as Record<string, any>);
    const response = await fondaro<{ leads: Lead[] }>(
      z,
      bundle,
      'GET',
      '/leads',
      {
        params: {
          sort: 'createdAt',
          limit: 25,
          assigneeId: wanted.length === 1 ? wanted[0] : undefined,
        },
      },
    );
    const leads = (response?.leads ?? [])
      .filter((lead) => {
        const ids: string[] = lead.assigneeIds ?? [];
        return wanted.length === 0
          ? ids.length > 0
          : ids.some((id) => wanted.includes(id));
      })
      .slice(0, 3);
    const records: Lead[] = [];
    for (const lead of leads) {
      const ids: string[] = lead.assigneeIds ?? [];
      const first = wanted.find((id) => ids.includes(id)) ?? ids[0];
      if (!first) continue;
      records.push({
        ...lead,
        addedAssignees: [await getUser(z, bundle, first)],
      });
    }
    return records;
  },
  sample: leadAssignedSample,
  outputFields: [
    ...leadOutputFields,
    { key: 'addedAssignees[]id', label: 'Added Team Member IDs' },
    ...userOutputFields
      .filter((field) => field.key !== 'id')
      .map((field) => ({
        ...field,
        key: `addedAssignees[]${field.key}`,
        label: `Added ${field.label}`,
      })),
  ],
});
