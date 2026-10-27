import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { leadField, leadOutputFields } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';
import { LEAD_TYPE_CHOICES } from '../lib/vocabulary.js';
import { pickFilled } from '../lib/inputs.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const body = pickFilled(input, [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'leadType',
    'companyName',
    'language',
  ]);
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'PATCH',
    `/leads/${seg(input.leadId as string | number)}/contact`,
    { body, subject: `Lead ${String(input.leadId)}` },
  );
};

export default defineCreate({
  key: 'update_lead_contact',
  noun: 'Lead',
  display: {
    label: 'Update Lead Contact',
    description:
      "Changes a lead's name, email, phone number, type, company or language. Only the fields you fill in are changed.",
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      { key: 'firstName', label: 'First Name', type: 'string' },
      { key: 'lastName', label: 'Last Name', type: 'string' },
      { key: 'email', label: 'Email', type: 'string' },
      {
        key: 'phoneNumber',
        label: 'Phone Number',
        type: 'string',
        helpText: 'Start with the country code, for example +34612345678.',
      },
      {
        key: 'leadType',
        label: 'Lead Type',
        type: 'string',
        choices: LEAD_TYPE_CHOICES,
      },
      { key: 'companyName', label: 'Company', type: 'string' },
      {
        key: 'language',
        label: 'Language',
        type: 'string',
        helpText: 'A language tag such as en-GB, es-ES or sv-SE.',
      },
    ],
    sample: leadSample,
    outputFields: leadOutputFields,
  },
});
