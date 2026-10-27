import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from './api.js';
import { type Option } from './vocabulary.js';

/**
 * What a function dropdown's `perform` returns: an object with `results` and a
 * `paging_token`, never a bare array (a bare array renders "No options are
 * available" in the Zap editor). https://docs.zapier.com/integrations/build-cli/dynamic-dropdowns.md
 */
export interface DropdownPage {
  results: { id: string; label: string }[];
  paging_token: string | null;
}

const toPage = (rows: Option[] | null): DropdownPage => ({
  results: (rows ?? [])
    .filter((row) => row && typeof row.value === 'string' && row.value)
    .map((row) => ({ id: row.value, label: row.name || row.value })),
  // The /options routes answer one complete list.
  paging_token: null,
});

/**
 * Build a function-dropdown `perform` over an `/integrations/v1/options/*`
 * route (`{ name, value }` rows → one dropdown page). Use it as
 * `choices: { perform: tagChoices }` on an input field.
 */
export const choicesFrom =
  (path: string, params?: Record<string, unknown>) =>
  async (z: ZObject, bundle: Bundle): Promise<DropdownPage> =>
    toPage(
      await fondaro<Option[]>(z, bundle, 'GET', path, {
        params,
      }),
    );

/** Tags, bound by id (rename- and merge-safe); archived tags are excluded by the API. */
export const tagChoices = choicesFrom('/options/tags', { value: 'id' });

/** Team members, bound by their `user_…` id. */
export const assigneeChoices = choicesFrom('/options/assignees');

/** Lead sources a customer may claim. */
export const leadSourceChoices = choicesFrom('/options/lead-sources');
