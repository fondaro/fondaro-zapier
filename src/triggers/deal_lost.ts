import { defineFondaroHook } from '../lib/hooks.js';
import { dealWithLeadFields } from '../lib/fields.js';
import { dealWithLeadSample } from '../lib/samples.js';
import { hydrateDeal, listDeals } from '../lib/records.js';

export default defineFondaroHook({
  key: 'deal_lost',
  noun: 'Deal',
  label: 'Deal Lost',
  description: 'Triggers when a deal is closed as lost.',
  event: 'deal.lost',
  hydrate: async (z, bundle, data) => {
    const deal = await hydrateDeal(z, bundle, data);
    if (!deal) return null;
    return {
      ...deal,
      lostReason: data.lostReason ?? deal.lostReason ?? null,
      changedBy: data.changedBy ?? null,
    };
  },
  list: async (z, bundle) => {
    const deals = await listDeals(z, bundle, 'lostAt', (deal) =>
      Boolean(deal.lostAt),
    );
    return deals.map((deal) => ({ ...deal, changedBy: null }));
  },
  sample: {
    ...dealWithLeadSample,
    status: 'lost',
    lostAt: '2026-10-23T10:00:00.000Z',
    lostReason: 'Bought another property',
    changedBy: 'user_2abc123def456ghi789',
  },
  outputFields: [
    ...dealWithLeadFields,
    { key: 'changedBy', label: 'Changed By' },
  ],
});
