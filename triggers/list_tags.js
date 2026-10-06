module.exports = {
  operation: {
    perform: {
      headers: { Accept: 'application/json' },
      url: 'https://api.fondaro.com/zapier/triggers/tags',
    },
    sample: {
      id: '214dfc98-a98f-446e-9c2b-eef50d874147',
      name: 'Cash buyer',
      color: 'slate',
      archivedAt: null,
    },
    outputFields: [
      { key: 'id' },
      { key: 'name' },
      { key: 'color' },
      { key: 'archivedAt' },
    ],
  },
  display: {
    description: 'Lists available tags',
    hidden: true,
    label: 'List Tags',
  },
  key: 'list_tags',
  noun: 'Tag',
};
