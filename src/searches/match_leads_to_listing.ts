import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { lineItemFields, matchOutputFields } from '../lib/fields.js';
import { matchSample } from '../lib/samples.js';
import { asNumber, filled } from '../lib/inputs.js';

export const matchLeadsSample = {
  id: '5c9a7e21-4d38-4b60-8f12-a3e6d0b9c847',
  listingQuery: 'Villa with sea views, 4 bedrooms, Nueva Andalucia',
  matches: [matchSample],
  tookMs: 530,
  reranked: true,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const own = filled(input.propertyListingId);
  const ref = [input.listingSource, input.listingId, input.listingCountry].some(
    filled,
  );
  if (own === ref) {
    throw new z.errors.Error(
      own
        ? 'Fill in either Fondaro Listing ID or the listing source and ID, not both.'
        : 'Fill in either Fondaro Listing ID or the listing source and ID.',
      'BadRequest',
      400,
    );
  }
  const body: Record<string, unknown> = {};
  if (own) {
    body.propertyListingId = input.propertyListingId;
  } else {
    if (!filled(input.listingSource) || !filled(input.listingId)) {
      throw new z.errors.Error(
        'A listing from another source needs both its source and its ID.',
        'BadRequest',
        400,
      );
    }
    body.listingRef = {
      source: input.listingSource,
      id: String(input.listingId),
      ...(filled(input.listingCountry) ? { country: input.listingCountry } : {}),
    };
  }
  if (input.maxResults) body.maxResults = asNumber(input.maxResults, 10);

  const result = await fondaro<Record<string, unknown>>(
    z,
    bundle,
    'POST',
    '/leads/listing-match',
    { body },
  );
  const id = own ? input.propertyListingId : `${input.listingSource}:${input.listingId}`;
  return [{ id, ...(result ?? { matches: [] }) }];
};

export default defineSearch({
  key: 'match_leads_to_listing',
  noun: 'Lead Match',
  display: {
    label: 'Find Leads for a Listing',
    description:
      "Finds leads whose past conversations fit a property listing, best match first. Give your Fondaro listing ID or another source's listing reference, not both.",
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'propertyListingId',
        label: 'Fondaro Listing ID',
        type: 'string',
        helpText: 'The ID of one of your own listings.',
      },
      {
        key: 'listingSource',
        label: 'Listing Source',
        type: 'string',
        helpText: 'For a listing from another source, with its ID.',
      },
      { key: 'listingId', label: 'Listing Reference', type: 'string' },
      {
        key: 'listingCountry',
        label: 'Listing Country',
        type: 'string',
        helpText: 'Optional, for sources that need it.',
      },
      {
        key: 'maxResults',
        label: 'Maximum Results',
        type: 'integer',
        helpText: 'From 1 to 30.',
      },
    ],
    sample: matchLeadsSample,
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'listingQuery', label: 'Listing Query' },
      { key: 'tookMs', label: 'Took (Ms)', type: 'integer' },
      { key: 'reranked', label: 'Reranked', type: 'boolean' },
      ...lineItemFields('matches', 'Match', matchOutputFields),
    ],
  },
});
