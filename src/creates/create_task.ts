import { defineCreate } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from '../lib/api.js';
import {
  assigneesField,
  leadField,
  taskOutputFields,
} from '../lib/fields.js';
import { taskSample } from '../lib/samples.js';
import { pickFilled } from '../lib/inputs.js';

const perform = async (z: ZObject, bundle: Bundle) => {
  const input = bundle.inputData as Record<string, unknown>;
  return fondaro<Record<string, unknown>>(
    z,
    bundle,
    'POST',
    `/leads/${seg(input.leadId as string | number)}/tasks`,
    {
      body: pickFilled(input, [
        'title',
        'description',
        'dueDate',
        'assigneeIds',
      ]),
      subject: `Lead ${String(input.leadId)}`,
    },
  );
};

export default defineCreate({
  key: 'create_task',
  noun: 'Task',
  display: {
    label: 'Create Task',
    description:
      'Adds a task to a lead, with an optional due date and team members.',
  },
  operation: {
    perform,
    inputFields: [
      leadField(),
      { key: 'title', label: 'Title', type: 'string', required: true },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'dueDate', label: 'Due Date', type: 'datetime' },
      assigneesField({
        helpText: 'Who should do it. Leave empty to leave the task unassigned.',
      }),
    ],
    sample: taskSample,
    outputFields: taskOutputFields,
  },
});
