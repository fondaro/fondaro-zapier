import nock from 'nock';
import { describe, expect, it } from 'vitest';

import createLead from '../src/creates/create_lead.js';
import { leadSample } from '../src/lib/samples.js';
import { API, BASE, appTester, bundle, rejection } from './helpers.js';

const op = createLead.operation as any;

const create = (inputData: Record<string, unknown>) =>
  appTester(op.perform, bundle({ inputData }));

describe('create_lead', () => {
  it('is a Create Lead step on the Lead noun', () => {
    expect(createLead.key).toBe('create_lead');
    expect(createLead.noun).toBe('Lead');
    expect(createLead.display.label).toBe('Create Lead');
  });

  it('sends only the filled fields and defaults the language', async () => {
    const scope = nock(BASE)
      .post(`${API}/leads`, {
        firstName: 'Maria',
        email: 'maria@example.com',
        language: 'en-GB',
      })
      .reply(201, leadSample);
    const result = await create({
      firstName: 'Maria',
      email: 'maria@example.com',
      lastName: '',
      phoneNumber: undefined,
      tags: [],
      unassigned: false,
    });
    expect(result).toMatchObject({ id: leadSample.id });
    expect(scope.isDone()).toBe(true);
  });

  it('maps every field to the shared DTO key', async () => {
    const scope = nock(BASE)
      .post(`${API}/leads`, {
        firstName: 'Maria',
        lastName: 'Lopez',
        email: 'maria@example.com',
        phoneNumber: '+34612345678',
        language: 'es-ES',
        leadType: 'buyer',
        companyName: 'Casa SL',
        crmStatus: 'lead',
        source: 'zapier',
        externalId: 'ext-1',
        assigneeIds: ['user_1', 'user_2'],
        tags: ['VIP', 'Hot'],
        unassigned: true,
      })
      .reply(201, leadSample);
    await create({
      firstName: 'Maria',
      lastName: 'Lopez',
      email: 'maria@example.com',
      phoneNumber: '+34612345678',
      language: 'es-ES',
      leadType: 'buyer',
      companyName: 'Casa SL',
      crmStatus: 'lead',
      source: 'zapier',
      externalId: 'ext-1',
      assigneeIds: ['user_1', 'user_2'],
      tags: ['VIP', 'Hot'],
      unassigned: true,
    });
    expect(scope.isDone()).toBe(true);
  });

  it('passes the API 400 message through', async () => {
    nock(BASE)
      .post(`${API}/leads`)
      .reply(400, { message: ['A lead needs an email or a phone number'] });
    const error = await rejection(create({ firstName: 'Maria' }));
    expect(error.message).toContain('A lead needs an email or a phone number');
  });

  it('returns the API lead, which the output fields describe', async () => {
    nock(BASE).post(`${API}/leads`).reply(201, leadSample);
    const result = (await create({
      firstName: 'Maria',
      email: 'maria@example.com',
    })) as Record<string, unknown>;
    const keys = (op.outputFields as { key: string }[])
      .map((field) => field.key.split('[]')[0])
      .filter((key) => !key.includes('__'));
    for (const key of keys) expect(result).toHaveProperty(key);
  });

  it('requires only a first name and uses function dropdowns', () => {
    const fields = op.inputFields as any[];
    expect(fields.filter((f) => f.required).map((f) => f.key)).toEqual([
      'firstName',
    ]);
    expect(fields.find((f) => f.key === 'tags').list).toBe(true);
    expect(fields.find((f) => f.key === 'assigneeIds').list).toBe(true);
    expect(fields.find((f) => f.key === 'source').choices.perform).toBeTypeOf(
      'function',
    );
  });
});
