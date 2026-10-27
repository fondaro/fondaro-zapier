/**
 * Static dropdown vocabularies, kept in one place. Labels follow the API's
 * options service (`integration-options.service.ts`): `lead` reads **New**, as
 * in the dashboard. `test/vocabulary.test.ts` checks these lists against
 * fixtures of `/options/lead-statuses`, `/options/lead-types` and
 * `/options/deal-stages`.
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

export const CRM_STATUS_CHOICES = toChoices(CRM_STATUSES);
export const LEAD_TYPE_CHOICES = toChoices(LEAD_TYPES);
export const DEAL_STAGE_CHOICES = toChoices(DEAL_STAGES);
export const CALL_OUTCOME_CHOICES = toChoices(CALL_OUTCOMES);
