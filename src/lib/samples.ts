/**
 * One static sample per record type, matching the `/integrations/v1` response
 * shapes (integration-lead.service.ts, integration-deal.service.ts,
 * integration-options.service.ts, property-viewing.service.ts,
 * rag-lead-rollup.service.ts, calendar-task.ts). Dates are ISO-8601 strings;
 * every sample carries its primary key as `id` (`leadId` for a match, which
 * Zapier sees as `id` through `matchSample`).
 */

export const tagSample = {
  id: 'c1a4e9d2-6b3f-4f0a-8d57-91a2b7e5c310',
  name: 'Cash buyer',
  color: 'slate',
  archivedAt: null,
};

export const leadSample = {
  id: 48213,
  firstName: 'Maria',
  lastName: 'Lopez',
  email: 'maria.lopez@example.com',
  phoneNumber: '+34612345678',
  language: 'es-ES',
  leadType: 'buyer',
  companyName: null,
  crmStatus: 'lead',
  source: 'zapier',
  externalId: null,
  assigneeIds: ['user_2abc123def456ghi789'],
  origin: null,
  tags: [tagSample],
  leadPlanName: 'Costa del Sol Buyers',
  totalCalls: 1,
  lastCallAt: '2026-10-23T09:30:00.000Z',
  lastCallStatus: 'no-answer',
  lastCallDirection: 'outbound',
  purchasedAt: '2026-10-23T08:00:00.000Z',
  createdAt: '2026-10-23T07:45:00.000Z',
  updatedAt: '2026-10-23T09:30:00.000Z',
};

export const dealSample = {
  id: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63',
  leadId: 48213,
  title: 'Villa in Nueva Andalucia',
  status: 'open',
  stage: 'viewing',
  amount: 1250000,
  currency: 'EUR',
  assigneeIds: ['user_2abc123def456ghi789'],
  propertyListingId: null,
  expectedCloseAt: '2026-12-15T00:00:00.000Z',
  wonAt: null,
  lostAt: null,
  lostReason: null,
  stageChangedAt: '2026-10-23T10:00:00.000Z',
  createdAt: '2026-10-20T14:20:00.000Z',
  updatedAt: '2026-10-23T10:00:00.000Z',
};

export const taskSample = {
  id: '2e9b5c71-8a04-4d36-a5f2-6b1c7d8e3f90',
  leadId: 48213,
  assigneeIds: ['user_2abc123def456ghi789'],
  createdBy: 'user_2abc123def456ghi789',
  title: 'Call Maria back about the villa',
  description: 'She asked for a viewing on Saturday.',
  dueDate: '2026-10-24T09:00:00.000Z',
  status: 'pending',
  completedAt: null,
  createdAt: '2026-10-23T10:05:00.000Z',
  updatedAt: '2026-10-23T10:05:00.000Z',
};

export const noteSample = {
  id: '9a3d1f64-5e27-4b88-8c10-d4e6f7a2b358',
  leadId: 48213,
  authorId: 'user_2abc123def456ghi789',
  content: 'Prefers sea views and a short drive to the golf course.',
  isPinned: false,
  occurredAt: '2026-10-23T10:10:00.000Z',
  createdAt: '2026-10-23T10:10:00.000Z',
  updatedAt: '2026-10-23T10:10:00.000Z',
};

export const callSample = {
  id: 'f4c8a2d0-1b6e-4973-a5d9-3e7b0c1f8a24',
  ownerId: 'user_2abc123def456ghi789',
  direction: 'outbound',
  outcome: 'no_answer',
  status: 'no-answer',
  durationSeconds: 0,
  startedAt: '2026-10-23T09:30:00.000Z',
  endedAt: '2026-10-23T09:30:25.000Z',
  hasRecording: false,
};

export const viewingSample = {
  id: 'b6e0d3a9-7c15-4f82-9a4e-2d8f1c5b7e03',
  propertyListingId: '5c9a7e21-4d38-4b60-8f12-a3e6d0b9c847',
  leadId: 48213,
  collaboratorLeadId: null,
  agentUserId: 'user_2abc123def456ghi789',
  dealId: '7d2f6a18-3c4b-4e95-b0a1-5f8e9c2d4a63',
  viewingAt: '2026-10-25T11:00:00.000Z',
  kind: 'in_person',
  status: 'scheduled',
  source: 'user',
  createdBy: 'user_2abc123def456ghi789',
  createdAt: '2026-10-23T10:20:00.000Z',
  updatedAt: '2026-10-23T10:20:00.000Z',
  otherLeadIds: [],
  notes: 'Meet at the gate.',
  notesTruncated: false,
};

export const userSample = {
  id: 'user_2abc123def456ghi789',
  firstName: 'Sofia',
  lastName: 'Marin',
  email: 'sofia@example-agency.com',
  role: 'org:admin',
  imageUrl: null,
};

/** One entry of `matches` from semantic search and listing match. */
export const matchSample = {
  id: 48213,
  leadId: 48213,
  firstName: 'Maria',
  lastName: 'Lopez',
  rank: 1,
  matchCount: 3,
  sourceCount: 2,
  bestMatchAt: '2026-10-22T16:40:00.000Z',
  evidence: [
    {
      sourceType: 'note',
      sourceId: '9a3d1f64-5e27-4b88-8c10-d4e6f7a2b358',
      occurredAt: '2026-10-22T16:40:00.000Z',
      snippet: 'Prefers sea views and a short drive to the golf course.',
    },
  ],
};

/** A task as the task triggers hand it to the Zap. */
export const taskFeedSample: Record<string, any> = {
  id: '2e9b5c71-8a04-4d36-a5f2-6b1c7d8e3f90',
  leadId: 48213,
  title: 'Call Maria back about the villa',
  status: 'pending',
  dueDate: '2026-10-24T09:00:00.000Z',
  occurredAt: '2026-10-23T10:05:00.000Z',
  lead: leadSample,
};

/** A deal plus its lead. */
export const dealWithLeadSample: Record<string, any> = { ...dealSample, lead: leadSample };
