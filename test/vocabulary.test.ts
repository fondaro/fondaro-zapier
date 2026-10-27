import { describe, expect, it } from 'vitest';

import {
  CALL_OUTCOMES,
  CALL_OUTCOME_CHOICES,
  CRM_STATUSES,
  DEAL_STAGES,
  LEAD_TYPES,
  MISSED_CALL_OUTCOMES,
  toChoices,
} from '../src/lib/vocabulary.js';
import { nested, leadOutputFields } from '../src/lib/fields.js';
import dealStages from './fixtures/options-deal-stages.json' with { type: 'json' };
import leadStatuses from './fixtures/options-lead-statuses.json' with { type: 'json' };
import leadTypes from './fixtures/options-lead-types.json' with { type: 'json' };

// The fixtures are derived from integration-options.service.ts and the shared
// enums, not recorded from dev; the orchestrator re-records them.
describe('vocabulary equals the API options', () => {
  it('CRM statuses', () => expect(CRM_STATUSES).toEqual(leadStatuses));
  it('lead types', () => expect(LEAD_TYPES).toEqual(leadTypes));
  it('deal stages', () => expect(DEAL_STAGES).toEqual(dealStages));
});

describe('customer words', () => {
  it('labels the lead status New', () => {
    expect(CRM_STATUSES.find((s) => s.value === 'lead')?.name).toBe('New');
  });

  it('never says qualified, except the Unqualified status', () => {
    for (const status of CRM_STATUSES) {
      if (status.value === 'unqualified') {
        expect(status.name).toBe('Unqualified');
      } else {
        expect(status.name).not.toMatch(/qualified/i);
      }
    }
  });
});

describe('call outcomes', () => {
  it('are the six Fondaro outcome values', () => {
    expect(CALL_OUTCOMES.map((o) => o.value)).toEqual([
      'success',
      'no_answer',
      'busy',
      'failed',
      'invalid_number',
      'canceled',
    ]);
  });

  it('missed outcomes are the ones where nobody picked up', () => {
    expect(MISSED_CALL_OUTCOMES).not.toContain('success');
    for (const outcome of MISSED_CALL_OUTCOMES) {
      expect(CALL_OUTCOMES.map((o) => o.value)).toContain(outcome);
    }
  });
});

describe('choices', () => {
  it('carry value, sample and label, with sample equal to value', () => {
    for (const choice of [...toChoices(CRM_STATUSES), ...CALL_OUTCOME_CHOICES]) {
      expect(choice.value).toBeTruthy();
      expect(choice.label).toBeTruthy();
      expect(choice.sample).toBe(choice.value);
    }
  });
});

describe('nested output field labels', () => {
  it('reads like the dashboard', () => {
    const fields = nested('lead', 'Lead', leadOutputFields);
    const label = (key: string) => fields.find((f) => f.key === key)?.label;
    expect(label('lead__email')).toBe('Lead Email');
    expect(label('lead__leadPlanName')).toBe('Lead Plan');
    expect(label('lead__id')).toBe('Lead ID');
  });
});
