import type { PlainOutputField } from 'zapier-platform-core';

import { defineFondaroHook } from '../lib/hooks.js';
import { leadSample } from '../lib/samples.js';
import { getLead } from '../lib/records.js';
import { leadSummaryFields } from '../lib/fields.js';

const outputFields: PlainOutputField[] = [
  { key: 'id', label: 'Call ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'ownerId', label: 'Owner ID' },
  { key: 'direction', label: 'Direction' },
  { key: 'occurredAt', label: 'Occurred At', type: 'datetime' },
  { key: 'analysis__summary', label: 'Analysis Summary' },
  { key: 'analysis__sentiment', label: 'Analysis Sentiment' },
  { key: 'analysis__leadInterest', label: 'Analysis Lead Interest' },
  { key: 'analysis__objections[]', label: 'Analysis Objections' },
  { key: 'analysis__nextSteps[]', label: 'Analysis Next Steps' },
  { key: 'analysis__coachingTips[]', label: 'Analysis Coaching Tips' },
  { key: 'analysis__keyTopics[]', label: 'Analysis Key Topics' },
  ...leadSummaryFields,
];

export default defineFondaroHook({
  key: 'call_analyzed',
  noun: 'Call',
  label: 'Call Analyzed',
  description:
    "Triggers when Ask Fondaro's review of a call is ready, with its summary and next steps.",
  event: 'call.analyzed',
  hydrate: async (z, bundle, data) => {
    const lead = await getLead(z, bundle, data.leadId);
    if (!lead) return null;
    const analysis = data.analysis ?? {};
    return {
      id: data.callId,
      leadId: data.leadId,
      ownerId: data.ownerId ?? null,
      direction: data.direction ?? null,
      occurredAt: data.occurredAt ?? null,
      analysis: {
        ...analysis,
        leadInterest: analysis.leadInterest ?? analysis.leadInterestLevel ?? null,
      },
      lead,
    };
  },
  // No read route lists an analysis: the test step uses the static sample.
  list: async () => [],
  sample: {
    id: 'f4c8a2d0-1b6e-4973-a5d9-3e7b0c1f8a24',
    leadId: 48213,
    ownerId: 'user_2abc123def456ghi789',
    direction: 'outbound',
    occurredAt: '2026-10-23T09:35:00.000Z',
    analysis: {
      summary: 'Maria wants a sea-view villa near a golf course and asked for a viewing on Saturday.',
      sentiment: 'positive',
      leadInterest: 'high',
      objections: ['Budget is tight above 1.3M'],
      nextSteps: ['Book a viewing for Saturday', 'Send three golf-front listings'],
      coachingTips: ['Ask about her financing earlier'],
      keyTopics: ['sea views', 'golf', 'viewing'],
    },
    lead: leadSample,
  },
  outputFields,
});
