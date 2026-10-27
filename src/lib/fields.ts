import type { PlainInputField, PlainOutputField } from 'zapier-platform-core';

import { assigneeChoices, tagChoices } from './choices.js';

// ── Input fields ────────────────────────────────────────────────────────────

/** The Lead picker: pick from Find Lead results or map an id from an earlier step. */
export const leadField = (
  overrides: Partial<PlainInputField> = {},
): PlainInputField => ({
  key: 'leadId',
  label: 'Lead',
  type: 'integer',
  required: true,
  search: 'find_lead.id',
  helpText: 'Search by email, phone number or external ID.',
  ...overrides,
});

/** The Deal picker, linked to Find Deal. */
export const dealField = (
  overrides: Partial<PlainInputField> = {},
): PlainInputField => ({
  key: 'dealId',
  label: 'Deal',
  type: 'string',
  required: true,
  search: 'find_deal.id',
  helpText: 'Pick the deal, or map its ID from an earlier step.',
  ...overrides,
});

/** Tags by id from `/options/tags?value=id`. */
export const tagsField = (
  overrides: Partial<PlainInputField> = {},
): PlainInputField => ({
  key: 'tagIds',
  label: 'Tags',
  type: 'string',
  list: true,
  choices: { perform: tagChoices },
  ...overrides,
});

/** Team members by `user_…` id from `/options/assignees`. */
export const assigneesField = (
  overrides: Partial<PlainInputField> = {},
): PlainInputField => ({
  key: 'assigneeIds',
  label: 'Team Members',
  type: 'string',
  list: true,
  choices: { perform: assigneeChoices },
  ...overrides,
});

// ── Output fields ───────────────────────────────────────────────────────────

/**
 * Prefix a nested object's fields for a hydrated record: `lead__email` reads
 * "Lead Email" in the Zap editor (`nested('lead', 'Lead', leadOutputFields)`).
 */
export const nested = (
  key: string,
  label: string,
  fields: PlainOutputField[],
): PlainOutputField[] =>
  fields.map((field) => {
    const own = field.label ?? field.key;
    return {
      ...field,
      key: `${key}__${field.key}`,
      // "Lead ID" nested under "Lead" reads "Lead ID", not "Lead Lead ID".
      label: own.startsWith(`${label} `) ? own : `${label} ${own}`,
    };
  });

export const tagOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'archivedAt', label: 'Archived At', type: 'datetime' },
];

export const leadOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Lead ID', type: 'integer' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'language', label: 'Language' },
  { key: 'leadType', label: 'Lead Type' },
  { key: 'companyName', label: 'Company' },
  { key: 'crmStatus', label: 'CRM Status' },
  { key: 'source', label: 'Source' },
  { key: 'externalId', label: 'External ID' },
  { key: 'assigneeIds[]', label: 'Team Member IDs' },
  { key: 'leadPlanName', label: 'Lead Plan' },
  { key: 'tags[]id', label: 'Tag IDs' },
  { key: 'tags[]name', label: 'Tag Names' },
  { key: 'totalCalls', label: 'Total Calls', type: 'integer' },
  { key: 'lastCallAt', label: 'Last Call At', type: 'datetime' },
  { key: 'lastCallStatus', label: 'Last Call Status' },
  { key: 'lastCallDirection', label: 'Last Call Direction' },
  { key: 'purchasedAt', label: 'Purchased At', type: 'datetime' },
  { key: 'createdAt', label: 'Created At', type: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
];

export const dealOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Deal ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'stage', label: 'Stage' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'assigneeIds[]', label: 'Team Member IDs' },
  { key: 'propertyListingId', label: 'Property Listing ID' },
  { key: 'expectedCloseAt', label: 'Expected Close At', type: 'datetime' },
  { key: 'wonAt', label: 'Won At', type: 'datetime' },
  { key: 'lostAt', label: 'Lost At', type: 'datetime' },
  { key: 'lostReason', label: 'Lost Reason' },
  { key: 'stageChangedAt', label: 'Stage Changed At', type: 'datetime' },
  { key: 'createdAt', label: 'Created At', type: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
];

export const taskOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Task ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'assigneeIds[]', label: 'Team Member IDs' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'dueDate', label: 'Due Date', type: 'datetime' },
  { key: 'status', label: 'Status' },
  { key: 'completedAt', label: 'Completed At', type: 'datetime' },
  { key: 'createdAt', label: 'Created At', type: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
];

export const noteOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Note ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'authorId', label: 'Author ID' },
  { key: 'content', label: 'Content' },
  { key: 'isPinned', label: 'Pinned', type: 'boolean' },
  { key: 'occurredAt', label: 'Occurred At', type: 'datetime' },
  { key: 'createdAt', label: 'Created At', type: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
];

export const callOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Call ID' },
  { key: 'ownerId', label: 'Owner ID' },
  { key: 'direction', label: 'Direction' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'status', label: 'Status' },
  { key: 'durationSeconds', label: 'Duration (Seconds)', type: 'integer' },
  { key: 'startedAt', label: 'Started At', type: 'datetime' },
  { key: 'endedAt', label: 'Ended At', type: 'datetime' },
  { key: 'hasRecording', label: 'Has Recording', type: 'boolean' },
];

export const viewingOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Viewing ID' },
  { key: 'propertyListingId', label: 'Property Listing ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'collaboratorLeadId', label: 'Collaborator Lead ID', type: 'integer' },
  { key: 'agentUserId', label: 'Team Member ID' },
  { key: 'dealId', label: 'Deal ID' },
  { key: 'viewingAt', label: 'Viewing At', type: 'datetime' },
  { key: 'kind', label: 'Kind' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'otherLeadIds[]', label: 'Other Lead IDs' },
  { key: 'notes', label: 'Notes' },
  { key: 'notesTruncated', label: 'Notes Truncated', type: 'boolean' },
  { key: 'createdAt', label: 'Created At', type: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
];

export const userOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'Team Member ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'imageUrl', label: 'Image URL' },
];

export const matchOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'ID', type: 'integer' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'rank', label: 'Rank', type: 'integer' },
  { key: 'matchCount', label: 'Match Count', type: 'integer' },
  { key: 'sourceCount', label: 'Source Count', type: 'integer' },
  { key: 'bestMatchAt', label: 'Best Match At', type: 'datetime' },
  { key: 'evidence[]sourceType', label: 'Evidence Source Types' },
  { key: 'evidence[]snippet', label: 'Evidence Snippets' },
];

/**
 * Output fields for a result whose array field Zapier shows as line items:
 * `leads[]email` reads "Lead Email". Only scalar fields are listed (a nested
 * array inside a line item has no portable key).
 */
export const lineItemFields = (
  arrayKey: string,
  noun: string,
  fields: PlainOutputField[],
): PlainOutputField[] =>
  fields
    .filter((field) => !field.key.includes('[]'))
    .map((field) => {
      const own = field.label ?? field.key;
      return {
        ...field,
        key: `${arrayKey}[]${field.key}`,
        label: own.startsWith(`${noun} `) ? own : `${noun} ${own}`,
      };
    });

/** The paging fields every paged read returns beside its line items. */
export const pageOutputFields: PlainOutputField[] = [
  { key: 'id', label: 'ID' },
  { key: 'total', label: 'Total', type: 'integer' },
  { key: 'hasMore', label: 'Has More', type: 'boolean' },
  { key: 'nextOffset', label: 'Next Offset', type: 'integer' },
];

/** The lead fields a task, note or call trigger carries beside its own record. */
export const leadSummaryFields: PlainOutputField[] = nested('lead', 'Lead', [
  { key: 'id', label: 'Lead ID', type: 'integer' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'language', label: 'Language' },
  { key: 'leadType', label: 'Lead Type' },
  { key: 'crmStatus', label: 'CRM Status' },
  { key: 'source', label: 'Source' },
  { key: 'leadPlanName', label: 'Lead Plan' },
  { key: 'assigneeIds[]', label: 'Team Member IDs' },
  { key: 'tags[]name', label: 'Tag Names' },
]);

/** A deal plus its lead, the shape every deal trigger hands to the Zap. */
export const dealWithLeadFields: PlainOutputField[] = [
  ...dealOutputFields,
  ...leadSummaryFields,
];

export const taskFeedFields: PlainOutputField[] = [
  { key: 'id', label: 'Task ID' },
  { key: 'leadId', label: 'Lead ID', type: 'integer' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date', type: 'datetime' },
  { key: 'occurredAt', label: 'Occurred At', type: 'datetime' },
  ...leadSummaryFields,
];
