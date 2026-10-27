import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro } from '../lib/api.js';
import { choicesFrom, leadSourceChoices } from '../lib/choices.js';
import { assigneesField, leadOutputFields, tagsField } from '../lib/fields.js';
import { leadSample } from '../lib/samples.js';
import { CRM_STATUS_CHOICES, LEAD_TYPE_CHOICES } from '../lib/vocabulary.js';
import { filled } from '../lib/inputs.js';

/** Tag NAMES (the create route takes names and creates unknown ones). */
const tagNameChoices = choicesFrom('/options/tags');


const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const body: Record<string, unknown> = {};
  for (const key of [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'language',
    'leadType',
    'companyName',
    'crmStatus',
    'source',
    'externalId',
    'assigneeIds',
    'tags',
  ]) {
    if (filled(input[key])) body[key] = input[key];
  }
  // Only an explicit yes is sent; an unticked box is "not set", not "false".
  if (input.unassigned === true) body.unassigned = true;
  if (!filled(body.language)) body.language = 'en-GB';

  return fondaro<Record<string, unknown>>(z, bundle, 'POST', '/leads', {
    body,
  });
};

export default defineCreate({
  key: 'create_lead',
  noun: 'Lead',
  display: {
    label: 'Create Lead',
    description:
      'Adds a lead to your Fondaro CRM. Needs a first name and an email or phone number.',
  },
  operation: {
    perform,
    inputFields: [
      { key: 'firstName', label: 'First Name', type: 'string', required: true },
      { key: 'lastName', label: 'Last Name', type: 'string' },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        helpText: 'Add an email or a phone number so the lead can be reached.',
      },
      {
        key: 'phoneNumber',
        label: 'Phone Number',
        type: 'string',
        helpText: 'Start with the country code, for example +34612345678.',
      },
      {
        key: 'language',
        label: 'Language',
        type: 'string',
        default: 'en-GB',
        helpText:
          'A language tag such as en-GB, es-ES or sv-SE. Used for routing and reports.',
      },
      {
        key: 'leadType',
        label: 'Lead Type',
        type: 'string',
        choices: LEAD_TYPE_CHOICES,
      },
      { key: 'companyName', label: 'Company', type: 'string' },
      {
        key: 'crmStatus',
        label: 'CRM Status',
        type: 'string',
        choices: CRM_STATUS_CHOICES,
        helpText: 'Leave empty to start the lead as New.',
      },
      {
        key: 'source',
        label: 'Source',
        type: 'string',
        choices: { perform: leadSourceChoices },
        helpText: 'Where the lead came from. Leave empty to use Zapier.',
      },
      {
        key: 'externalId',
        label: 'External ID',
        type: 'string',
        helpText: 'Your own ID for this lead. Find Lead can look it up later.',
      },
      assigneesField({
        helpText:
          'Who owns the lead. Leave empty to let your lead routing decide.',
      }),
      {
        key: 'unassigned',
        label: 'Unassigned',
        type: 'boolean',
        helpText: 'Yes puts the lead in the unassigned queue and skips routing.',
      },
      tagsField({
        key: 'tags',
        helpText: 'Pick tags or type names. New names are created.',
        choices: { perform: tagNameChoices },
      }),
    ],
    sample: leadSample,
    outputFields: leadOutputFields,
  },
});
