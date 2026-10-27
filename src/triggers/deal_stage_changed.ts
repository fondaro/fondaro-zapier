import { defineFondaroHook } from '../lib/hooks.js';
import { DEAL_STAGE_CHOICES } from '../lib/vocabulary.js';
import { dealWithLeadFields } from '../lib/fields.js';
import { dealWithLeadSample } from '../lib/samples.js';
import { hydrateDeal, listDeals } from '../lib/records.js';
import { picked } from '../lib/inputs.js';

export default defineFondaroHook({
  key: 'deal_stage_changed',
  noun: 'Deal',
  label: 'Deal Stage Changed',
  description: 'Triggers when a deal moves to a different stage.',
  event: 'deal.stageChanged',
  inputFields: [
    {
      key: 'toStage',
      label: 'To Stage',
      type: 'string',
      list: true,
      choices: DEAL_STAGE_CHOICES,
      helpText: 'Leave empty to trigger for every stage change.',
    },
  ],
  filter: (data, input) => {
    const stages = picked(input.toStage);
    return stages.length === 0 || stages.includes(String(data.toStage));
  },
  hydrate: async (z, bundle, data) => {
    const deal = await hydrateDeal(z, bundle, data);
    if (!deal) return null;
    return {
      ...deal,
      fromStage: data.fromStage ?? null,
      toStage: data.toStage ?? deal.stage,
      changedBy: data.changedBy ?? null,
    };
  },
  list: async (z, bundle) => {
    const stages = picked(bundle.inputData?.toStage);
    const deals = await listDeals(
      z,
      bundle,
      'stageChangedAt',
      (deal) => stages.length === 0 || stages.includes(String(deal.stage)),
    );
    return deals.map((deal) => ({
      ...deal,
      fromStage: null,
      toStage: deal.stage,
      changedBy: null,
    }));
  },
  sample: {
    ...dealWithLeadSample,
    fromStage: 'qualified',
    toStage: 'viewing',
    changedBy: 'user_2abc123def456ghi789',
  },
  outputFields: [
    ...dealWithLeadFields,
    { key: 'fromStage', label: 'From Stage' },
    { key: 'toStage', label: 'To Stage' },
    { key: 'changedBy', label: 'Changed By' },
  ],
});
