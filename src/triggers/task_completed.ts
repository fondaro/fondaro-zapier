import { defineFondaroHook } from '../lib/hooks.js';
import { hydrateFromFeed, listFromFeeds } from '../lib/records.js';
import { taskFeedFields } from '../lib/fields.js';
import { taskFeedSample } from '../lib/samples.js';

export default defineFondaroHook({
  key: 'task_completed',
  noun: 'Task',
  label: 'Task Completed',
  description: 'Triggers when a task on a lead is marked complete.',
  event: 'task.completed',
  hydrate: async (z, bundle, data) => {
    const task = await hydrateFromFeed(z, bundle, data, {
      type: 'task-completed',
      key: 'task',
      idField: 'taskId',
    });
    return task ? { ...task, completedBy: data.changedBy ?? null } : null;
  },
  list: async (z, bundle) => {
    const tasks = await listFromFeeds(z, bundle, {
      type: 'task-completed',
      key: 'task',
    });
    return tasks.map((task) => ({ ...task, completedBy: null }));
  },
  sample: {
    ...taskFeedSample,
    status: 'completed',
    completedBy: 'user_2abc123def456ghi789',
  },
  outputFields: [
    ...taskFeedFields,
    { key: 'completedBy', label: 'Completed By' },
  ],
});
