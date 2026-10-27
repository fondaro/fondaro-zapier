import { defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import { assigneeChoices } from '../lib/choices.js';
import { userOutputFields } from '../lib/fields.js';
import { userSample } from '../lib/samples.js';
import { filled } from '../lib/inputs.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  const hasId = filled(input.userId);
  const hasEmail = filled(input.email);
  if (hasId === hasEmail) {
    throw new z.errors.Error(
      'Fill in either Team Member or Email.',
      'BadRequest',
      400,
    );
  }
  if (hasId) {
    const member = await fondaro<Record<string, unknown>>(
      z,
      bundle,
      'GET',
      `/users/${seg(input.userId as string)}`,
      { notFound: 'empty' },
    );
    return member ? [member] : [];
  }
  const members = await fondaro<Record<string, unknown>[]>(
    z,
    bundle,
    'GET',
    '/users',
    { params: { email: input.email } },
  );
  const first = members?.[0];
  return first ? [first] : [];
};

export default defineSearch({
  key: 'find_team_member',
  noun: 'Team Member',
  display: {
    label: 'Find Team Member',
    description:
      'Finds one member of your Fondaro team by their ID or email address. Fill in one of the two.',
    // Hidden in 3.0: Zapier's publish checks need a live multi-step Zap per
    // visible search, which the free plan can't publish. Unhide in a later version.
    hidden: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'userId',
        label: 'Team Member',
        type: 'string',
        choices: { perform: assigneeChoices },
        helpText: 'Pick a person, or map an ID from an earlier step.',
      },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        helpText: 'Matches the whole address, ignoring capital letters.',
      },
    ],
    sample: userSample,
    outputFields: userOutputFields,
  },
});
