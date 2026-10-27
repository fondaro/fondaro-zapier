import { defineFondaroHook } from '../lib/hooks.js';
import { dealWithLeadFields } from '../lib/fields.js';
import { dealWithLeadSample } from '../lib/samples.js';
import { hydrateDeal, listDeals } from '../lib/records.js';

export default defineFondaroHook({
  key: 'deal_won',
  noun: 'Deal',
  label: 'Deal Won',
  description: 'Triggers when a deal is closed as won.',
  event: 'deal.won',
  hydrate: async (z, bundle, data) => {
    const deal = await hydrateDeal(z, bundle, data);
    if (!deal) return null;
    return {
      ...deal,
      value: data.value ?? deal.amount ?? null,
      changedBy: data.changedBy ?? null,
    };
  },
  list: async (z, bundle) => {
    const deals = await listDeals(z, bundle, 'wonAt', (deal) =>
      Boolean(deal.wonAt),
    );
    return deals.map((deal) => ({
      ...deal,
      value: deal.amount ?? null,
      changedBy: null,
    }));
  },
  sample: {
    ...dealWithLeadSample,
    status: 'won',
    wonAt: '2026-10-23T10:00:00.000Z',
    value: 1250000,
    changedBy: 'user_2abc123def456ghi789',
  },
  outputFields: [
    ...dealWithLeadFields,
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'changedBy', label: 'Changed By' },
  ],
});
