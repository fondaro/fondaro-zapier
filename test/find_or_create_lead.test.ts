import { describe, expect, it } from 'vitest';

import createLead from '../src/creates/create_lead.js';
import findLead from '../src/searches/find_lead.js';
import findOrCreateLead from '../src/search-or-creates/find_or_create_lead.js';

describe('find_or_create_lead', () => {
  it('pairs Find Lead with Create Lead under the search key', () => {
    expect(findOrCreateLead.key).toBe(findLead.key);
    expect(findOrCreateLead.search).toBe(findLead.key);
    expect(findOrCreateLead.create).toBe(createLead.key);
    expect(findOrCreateLead.display.label).toBe('Find or Create Lead');
  });

  it('uses no experimental update keys', () => {
    expect(Object.keys(findOrCreateLead).sort()).toEqual(['create', 'display', 'key', 'search']);
  });
});
