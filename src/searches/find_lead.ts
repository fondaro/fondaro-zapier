import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { leadOutputFields } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const lead = await fondaro<Record<string, unknown>>(
    z,
    bundle,
    'GET',
    '/leads/find',
    {
      params: {
        email: input.email,
        phone: input.phone,
        externalId: input.externalId,
      },
      notFound: 'empty',
    },
  );
  return lead ? [lead] : [];
};

export default defineSearch({
  key: 'find_lead',
  noun: 'Lead',
  display: {
    label: 'Find Lead',
    description:
      'Finds one lead in your CRM by email, phone number or external ID. Fill in exactly one of the three.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        helpText: 'Fill in only one of Email, Phone Number or External ID.',
      },
      {
        key: 'phone',
        label: 'Phone Number',
        type: 'string',
        helpText: 'Start with the country code, for example +34612345678.',
      },
      { key: 'externalId', label: 'External ID', type: 'string' },
    ],
    sample: leadSample,
    outputFields: leadOutputFields,
  },
});
