import { dealWithLeadFields } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { picked } from '../lib/inputs.js';
import { hydrateDeal, listDeals } from '../lib/records.js';
import { dealWithLeadSample } from '../lib/samples.js';
import { DEAL_STAGE_CHOICES } from '../lib/vocabulary.js';

export default defineFondaroHook({
  key: 'new_deal',
  noun: 'Deal',
  label: 'New Deal',
  description: 'Triggers when a deal is created on a lead in your Fondaro CRM.',
  event: 'deal.created',
  inputFields: [
    {
      key: 'stage',
      label: 'Stage',
      type: 'string',
      list: true,
      choices: DEAL_STAGE_CHOICES,
      helpText: 'Leave empty to trigger for deals in any stage.',
    },
  ],
  filter: (data, input) => {
    const stages = picked(input.stage);
    return stages.length === 0 || stages.includes(String(data.stage));
  },
  hydrate: hydrateDeal,
  list: async (z, bundle) => {
    const stages = picked(bundle.inputData?.stage);
    return listDeals(
      z,
      bundle,
      'createdAt',
      (deal) => stages.length === 0 || stages.includes(String(deal.stage)),
    );
  },
  sample: dealWithLeadSample,
  outputFields: dealWithLeadFields,
});
