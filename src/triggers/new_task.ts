import { taskFeedFields } from '../lib/fields.js';
import { defineFondaroHook } from '../lib/hooks.js';
import { hydrateFromFeed, listFromFeeds } from '../lib/records.js';
import { taskFeedSample } from '../lib/samples.js';

export default defineFondaroHook({
  key: 'new_task',
  noun: 'Task',
  label: 'New Task',
  description: 'Triggers when a task is created on a lead in your Fondaro CRM.',
  event: 'task.created',
  hydrate: async (z, bundle, data) => {
    const task = await hydrateFromFeed(z, bundle, data, {
      type: 'task-created',
      key: 'task',
      idField: 'taskId',
    });
    return task ? { ...task, createdBy: data.createdBy ?? null } : null;
  },
  list: async (z, bundle) => {
    const tasks = await listFromFeeds(z, bundle, {
      type: 'task-created',
      key: 'task',
    });
    return tasks.map((task) => ({ ...task, createdBy: null }));
  },
  sample: { ...taskFeedSample, createdBy: 'user_2abc123def456ghi789' },
  outputFields: [...taskFeedFields, { key: 'createdBy', label: 'Created By' }],
});
