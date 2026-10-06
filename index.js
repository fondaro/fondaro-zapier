const authentication = require('./authentication');
const newLeadAssignedTrigger = require('./triggers/new_lead_assigned.js');
const listTagsTrigger = require('./triggers/list_tags.js');
const createLeadCreate = require('./creates/create_lead.js');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  requestTemplate: {
    params: { api_key: '{{bundle.authData.api_key}}' },
    headers: {
      'X-API-KEY': '{{bundle.authData.api_key}}',
      Authorization: 'Bearer {{bundle.authData.access_token}}',
    },
  },
  triggers: {
    [newLeadAssignedTrigger.key]: newLeadAssignedTrigger,
    [listTagsTrigger.key]: listTagsTrigger,
  },
  authentication: authentication,
  creates: { [createLeadCreate.key]: createLeadCreate },
};
