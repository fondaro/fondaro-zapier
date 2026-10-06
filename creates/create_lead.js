const perform = async (z, bundle) => {
  const options = {
    url: 'https://api.fondaro.com/zapier/actions/create-lead',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    params: {},
    body: {
      firstName: bundle.inputData.firstName,
      lastName: bundle.inputData.lastName,
      email: bundle.inputData.email,
      phoneNumber: bundle.inputData.phoneNumber,
      language: bundle.inputData.language,
      crmStatus: bundle.inputData.crmStatus,
      ownerId: bundle.inputData.ownerId,
      tags: bundle.inputData.tags,
    },
    removeMissingValuesFrom: {
      body: false,
      params: false,
    },
  };

  return z.request(options).then((response) => {
    const results = response.json;

    // You can do any parsing you need for results here before returning them

    return results;
  });
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'firstName',
        label: 'First Name',
        type: 'string',
        helpText: "The lead's first name",
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'lastName',
        label: 'Last Name',
        type: 'string',
        helpText: "The lead's last name",
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        helpText: "The lead's email address",
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'phoneNumber',
        label: 'Phone Number',
        type: 'string',
        helpText:
          "The lead's phone number (include country code, e.g. +34612345678)",
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'language',
        label: 'Language',
        type: 'string',
        helpText: 'BCP-47 language code (e.g. en-US, es-ES, da-DK)',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'crmStatus',
        label: 'CRM Status',
        type: 'string',
        helpText: 'Initial status in the CRM pipeline',
        choices: ['lead', 'potential', 'bad_timing', 'client', 'unqualified'],
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'ownerId',
        label: 'Owner ID',
        type: 'string',
        helpText:
          'Clerk user ID of the team member to assign this lead to. Leave empty for unassigned.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        dynamic: 'list_tags.id.name',
        required: false,
        list: true,
        altersDynamicFields: false,
      },
    ],
    sample: {
      id: 12345,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phoneNumber: '+34612345678',
      language: 'es-ES',
      crmStatus: 'lead',
      ownerId: null,
      createdAt: '2026-03-26T12:00:00.000Z',
    },
    outputFields: [
      { key: 'id', type: 'integer' },
      { key: 'firstName' },
      { key: 'lastName' },
      { key: 'email' },
      { key: 'phoneNumber' },
      { key: 'language' },
      { key: 'crmStatus' },
      { key: 'ownerId' },
      { key: 'createdAt' },
    ],
  },
  display: {
    description: 'Creates a new lead in your Fondaro CRM.',
    hidden: false,
    label: 'Create Lead',
  },
  key: 'create_lead',
  noun: 'Lead',
};
