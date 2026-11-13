/**
 * Static dropdown vocabularies, kept in one place. Labels follow the API's
 * options service (`integration-options.service.ts`): `lead` reads **New**, as
 * in the dashboard. `test/vocabulary.test.ts` checks every list here against
 * a fixture of its `/options/*` route, so a change in the API breaks the tests.
 */

/** The shape of every `/options/*` row. */
export interface Option {
  name: string;
  value: string;
}

/** Zapier's labelled static choice (`value`, `sample` and `label` are all required). */
export interface Choice {
  value: string;
  sample: string;
  label: string;
}

export const toChoices = (options: readonly Option[]): Choice[] =>
  options.map(({ name, value }) => ({ value, sample: value, label: name }));

export const CRM_STATUSES: readonly Option[] = [
  { name: 'New', value: 'lead' },
  { name: 'Potential', value: 'potential' },
  { name: 'Bad Timing', value: 'bad_timing' },
  { name: 'Client', value: 'client' },
  { name: 'Unqualified', value: 'unqualified' },
];

export const LEAD_TYPES: readonly Option[] = [
  { name: 'Buyer', value: 'buyer' },
  { name: 'Seller', value: 'seller' },
  { name: 'Collaborator', value: 'collaborator' },
  { name: 'Tenant', value: 'tenant' },
];

export const DEAL_STAGES: readonly Option[] = [
  { name: 'Interested', value: 'qualified' },
  { name: 'Viewing', value: 'viewing' },
  { name: 'Offer', value: 'offer' },
  { name: 'Reserved', value: 'reserved' },
  { name: 'Under Contract', value: 'under_contract' },
];

/**
 * The `outcome` carried by `call.logged` and the activity feed (the Fondaro
 * outcome vocabulary, not the raw carrier status on a lead's `lastCallStatus`).
 */
export const CALL_OUTCOMES: readonly Option[] = [
  { name: 'Answered', value: 'success' },
  { name: 'No Answer', value: 'no_answer' },
  { name: 'Busy', value: 'busy' },
  { name: 'Failed', value: 'failed' },
  { name: 'Invalid Number', value: 'invalid_number' },
  { name: 'Canceled', value: 'canceled' },
];

/** Outcomes that mean nobody picked up (the "Missed calls only" filter). */
export const MISSED_CALL_OUTCOMES: readonly string[] = [
  'no_answer',
  'busy',
  'failed',
  'invalid_number',
  'canceled',
];

export const ACTIVITY_TYPES: readonly Option[] = [
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
];

export const VIEWING_KINDS: readonly Option[] = [
  { name: 'In Person', value: 'in_person' },
  { name: 'Virtual', value: 'virtual' },
];

export const VIEWING_STATUSES: readonly Option[] = [
  { name: 'Scheduled', value: 'scheduled' },
  { name: 'Completed', value: 'completed' },
  { name: 'Cancelled', value: 'cancelled' },
  { name: 'No Show', value: 'no_show' },
];

/** The `source` a listing carries: where Match Leads to Listing looks it up. */
export const LISTING_SOURCES: readonly Option[] = [
  { name: 'Fondaro MLS', value: 'internal' },
  { name: 'Resales Online', value: 'resales_online' },
  { name: 'Zoddak', value: 'zoddak' },
  { name: 'Inmobalia', value: 'inmobalia' },
  { name: 'Idealista', value: 'idealista' },
  { name: 'Rightmove', value: 'rightmove' },
  { name: 'Immobiliare.it', value: 'immobiliare' },
  { name: 'ImmoScout24', value: 'immoscout' },
  { name: 'Funda', value: 'funda' },
  { name: 'Zoopla', value: 'zoopla' },
  { name: 'SeLoger', value: 'seloger' },
  { name: 'Otodom', value: 'otodom' },
  { name: 'Immowelt', value: 'immowelt' },
  { name: 'Realtor.com', value: 'realtor' },
  { name: 'Homes.com', value: 'homes' },
  { name: 'Trulia', value: 'trulia' },
  { name: 'Property Finder', value: 'propertyfinder' },
  { name: 'Dubizzle', value: 'dubizzle' },
  { name: 'Centris.ca', value: 'centris' },
  { name: 'LoopNet', value: 'loopnet' },
  { name: 'Zillow', value: 'zillow' },
  { name: 'Redfin', value: 'redfin' },
  { name: 'Bayut', value: 'bayut' },
];

export const CRM_STATUS_CHOICES = toChoices(CRM_STATUSES);
export const LEAD_TYPE_CHOICES = toChoices(LEAD_TYPES);
export const DEAL_STAGE_CHOICES = toChoices(DEAL_STAGES);
export const CALL_OUTCOME_CHOICES = toChoices(CALL_OUTCOMES);
export const ACTIVITY_TYPE_CHOICES = toChoices(ACTIVITY_TYPES);
export const VIEWING_KIND_CHOICES = toChoices(VIEWING_KINDS);
export const VIEWING_STATUS_CHOICES = toChoices(VIEWING_STATUSES);
export const LISTING_SOURCE_CHOICES = toChoices(LISTING_SOURCES);
