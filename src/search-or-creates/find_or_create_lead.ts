/**
 * Find Lead, else Create Lead. Keys must equal the search and create keys.
 * No `update` keys (the experimental update path is not used).
 */
const findOrCreateLead = {
  key: 'find_lead',
  display: {
    label: 'Find or Create Lead',
    description:
      'Finds a lead by email, phone number or external ID, and creates it when none exists.',
  },
  search: 'find_lead',
  create: 'create_lead',
};

export default findOrCreateLead;
