import { fondaro } from '../lib/api.js';
import { leadOutputFields } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { leadSample } from '../lib/samples.js';
import { getLead } from '../lib/records.js';

const MAX_BATCH = 100;

type Lead = Record<string, any>;

const onlyPlanLeads = (input: Record<string, any>): boolean =>
  input.onlyPlanLeads === true || input.onlyPlanLeads === 'true';

const hasPlan = (lead: Lead): boolean =>
  lead.leadPlanName !== null && lead.leadPlanName !== undefined;


export default defineFondaroHook({
  key: 'new_lead',
  noun: 'Lead',
  label: 'New Lead',
  description: 'Triggers when a lead is added to your Fondaro CRM.',
  event: 'lead.created',
  inputFields: [
    {
      key: 'onlyPlanLeads',
      label: 'Only Leads From Your Lead Plans',
      type: 'boolean',
      default: 'false',
      helpText:
        'Yes skips leads you add yourself, by import, form or integration.',
    },
  ],
  // One signal per CSV import carries `leadIds` + `batch: true`: hydrate each
  // (at most 100, sequentially), one Zap run per lead.
  hydrate: async (z, bundle, data) => {
    if (data.batch === true && Array.isArray(data.leadIds)) {
      const leads: Lead[] = [];
      for (const id of data.leadIds.slice(0, MAX_BATCH)) {
        const lead = await getLead(z, bundle, id);
        if (lead) leads.push(lead);
      }
      return leads;
    }
    return getLead(z, bundle, data.leadId);
  },
  accept: (record, input) => !onlyPlanLeads(input) || hasPlan(record),
  list: async (z, bundle) => {
    const plan = onlyPlanLeads((bundle.inputData ?? {}) as Record<string, any>);
    const response = await fondaro<{ leads: Lead[] }>(
      z,
      bundle,
      'GET',
      '/leads',
      {
        params: plan
          ? { sort: 'purchasedAt', limit: 25 }
          : { sort: 'createdAt', limit: 3 },
      },
    );
    const leads = response?.leads ?? [];
    return plan ? leads.filter(hasPlan).slice(0, 3) : leads;
  },
  sample: leadSample,
  outputFields: leadOutputFields,
});

