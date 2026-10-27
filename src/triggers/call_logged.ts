import type { Bundle, PlainOutputField, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadSummaryFields, nested, userOutputFields } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { leadSample, userSample } from '../lib/samples.js';
import { CALL_OUTCOME_CHOICES } from '../lib/vocabulary.js';
import { getLead, WALK_LEADS } from '../lib/records.js';
import { picked } from '../lib/inputs.js';

type Rec = Record<string, any>;

const yes = (value: unknown) => value === true || value === 'true';

const keep = (call: Rec, input: Rec): boolean => {
  const outcomes = picked(input.outcome);
  if (outcomes.length > 0 && !outcomes.includes(String(call.outcome))) return false;
  return !yes(input.missedOnly) || call.missed === true;
};

/** `GET /users/:id`; no owner, or a member who has left, is `null`. */
const getOwner = async (z: ZObject, bundle: Bundle, ownerId: unknown) =>
  ownerId
    ? fondaro<Rec>(z, bundle, 'GET', `/users/${seg(ownerId as string)}`, {
        notFound: 'empty',
        subject: `Team member ${String(ownerId)}`,
      })
    : null;

const callFields: PlainOutputField[] = [
  { key: 'id', label: 'Call ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'ownerId', label: 'Owner ID' },
  { key: 'direction', label: 'Direction' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'status', label: 'Status' },
  { key: 'missed', label: 'Missed', type: 'boolean' },
  { key: 'durationSeconds', label: 'Duration (Seconds)', type: 'integer' },
  { key: 'occurredAt', label: 'Occurred At', type: 'datetime' },
  ...nested('owner', 'Owner', userOutputFields),
  ...leadSummaryFields,
];

export default defineFondaroHook({
  key: 'call_logged',
  noun: 'Call',
  label: 'Call Logged',
  description:
    'Triggers when a call on a lead ends, with its outcome and whether it was missed.',
  event: 'call.logged',
  inputFields: [
    {
      key: 'outcome',
      label: 'Outcome',
      type: 'string',
      list: true,
      choices: CALL_OUTCOME_CHOICES,
      helpText: 'Leave empty to trigger for every outcome.',
    },
    {
      key: 'missedOnly',
      label: 'Missed Calls Only',
      type: 'boolean',
      default: 'false',
      helpText: 'Yes skips calls that were answered.',
    },
  ],
  filter: (data, input) => keep(data, input),
  hydrate: async (z, bundle, data) => {
    const lead = await getLead(z, bundle, data.leadId);
    if (!lead) return null;
    const owner = await getOwner(z, bundle, data.ownerId);
    return {
      id: data.callId,
      leadId: data.leadId,
      ownerId: data.ownerId ?? null,
      direction: data.direction ?? null,
      outcome: data.outcome ?? null,
      status: data.status ?? null,
      missed: data.missed === true,
      durationSeconds: data.durationSeconds ?? null,
      occurredAt: data.occurredAt ?? null,
      owner: owner ?? null,
      lead,
    };
  },
  // The 5 newest leads' call logs (1 + 5 requests). The owner stays an id here:
  // resolving it per call would break the request budget.
  list: async (z, bundle) => {
    const input = (bundle.inputData ?? {}) as Rec;
    const page = await fondaro<{ leads: Rec[] }>(z, bundle, 'GET', '/leads', {
      params: { sort: 'createdAt', limit: WALK_LEADS },
    });
    const found: Rec[] = [];
    for (const lead of (page?.leads ?? []).slice(0, WALK_LEADS)) {
      const calls = await fondaro<{ calls: Rec[] }>(
        z,
        bundle,
        'GET',
        `/leads/${seg(lead.id)}/calls`,
        { params: { limit: 10 }, notFound: 'empty' },
      );
      for (const call of calls?.calls ?? []) {
        const record = {
          id: call.id,
          leadId: lead.id,
          ownerId: call.ownerId ?? null,
          direction: call.direction ?? null,
          outcome: call.outcome ?? null,
          status: call.status ?? null,
          missed: call.outcome !== 'success',
          durationSeconds: call.durationSeconds ?? null,
          occurredAt: call.endedAt ?? call.startedAt ?? null,
          owner: null,
          lead,
        };
        if (keep(record, input)) found.push(record);
      }
    }
    return found.sort((a, b) =>
      String(b.occurredAt).localeCompare(String(a.occurredAt)),
    );
  },
  sample: {
    id: 'f4c8a2d0-1b6e-4973-a5d9-3e7b0c1f8a24',
    leadId: 48213,
    ownerId: 'user_2abc123def456ghi789',
    direction: 'outbound',
    outcome: 'no_answer',
    status: 'no-answer',
    missed: true,
    durationSeconds: 0,
    occurredAt: '2026-10-23T09:30:25.000Z',
    owner: userSample,
    lead: leadSample,
  },
  outputFields: callFields,
});
