import type {
  Bundle,
  PlainInputField,
  PlainOutputField,
  Trigger,
  ZObject,
} from 'zapier-platform-core';

import { fondaro, seg } from './api.js';
import { verifyFondaroSignature } from './signature.js';

/** The webhook payload's `data` (id-only, per event). */
export type HookData = Record<string, any>;
/** Values of the trigger's own input fields. */
export type HookInput = Record<string, any>;
/** A hydrated record. `id` is the resource id the Zap sees. */
export type HookRecord = Record<string, any>;

export interface FondaroHookConfig {
  key: string;
  noun: string;
  label: string;
  /** Starts "Triggers when " and ends with "." (check D021). */
  description: string;
  /** The webhook event name, e.g. `lead.tagged`. One subscription per Zap. */
  event: string;
  inputFields?: PlainInputField[];
  /** Pre-hydration filter on the payload `data`; omit to accept every delivery. */
  filter?: (data: HookData, input: HookInput) => boolean;
  /**
   * Turn the id-only payload into the record the Zap receives, with the
   * caller's token. Return `null` when the record is gone (the delivery is
   * dropped). A 404 raised through `fondaro(..., { notFound: 'empty' })` is the
   * usual source of `null`. A delivery that names several records (a CSV
   * import's one `lead.created`) returns a list: one Zap run per record.
   */
  hydrate: (
    z: ZObject,
    bundle: Bundle,
    data: HookData,
  ) => Promise<HookRecord | HookRecord[] | null>;
  /** Post-hydration filter per record, e.g. "only leads from your lead plans". */
  accept?: (record: HookRecord, input: HookInput) => boolean;
  /** Real records for the editor's test step, newest first. At most 3 are used. */
  list: (z: ZObject, bundle: Bundle) => Promise<HookRecord[]>;
  /** Static sample of the hydrated record (must carry the primary key `id`). */
  sample: HookRecord;
  /** Output fields of the hydrated record; the envelope fields are added. */
  outputFields: PlainOutputField[];
}

export const SAMPLE_DELIVERY_ID = '3f8c1e52-7d4a-4b9e-9a61-2c5d8e0f4b17';
export const SAMPLE_OCCURRED_AT = '2026-10-23T10:15:00.000Z';

const ENVELOPE_OUTPUT_FIELDS: PlainOutputField[] = [
  { key: 'id', label: 'ID' },
  { key: 'event', label: 'Event' },
  { key: 'deliveryId', label: 'Delivery ID' },
  { key: 'occurredAt', label: 'Occurred At', type: 'datetime' },
];

const asInput = (bundle: Bundle): HookInput =>
  (bundle.inputData ?? {}) as HookInput;

/**
 * One factory for every instant trigger, so subscribe, verify, filter and
 * hydrate exist once (03-zapier-app.md §4).
 *
 * perform: verify signature → check event → filter → hydrate (null → `[]`,
 * a list → one item each) → accept per record →
 * `[{ id, event, deliveryId, occurredAt, ...record }]`. A record's own
 * `id` replaces the default `id` (the delivery id).
 */
export function defineFondaroHook(config: FondaroHookConfig): Trigger {
  const shape = (
    record: HookRecord,
    envelope: {
      event: string;
      deliveryId: string | null;
      occurredAt: string | null;
    },
  ) => ({
    id: envelope.deliveryId,
    event: envelope.event,
    deliveryId: envelope.deliveryId,
    occurredAt: envelope.occurredAt,
    ...record,
  });

  const perform = async (z: ZObject, bundle: Bundle) => {
    const verdict = verifyFondaroSignature(bundle as never);
    if (!verdict.ok) {
      z.console.log(
        `Fondaro ${config.key}: delivery ignored (${verdict.reason})`,
      );
      return [];
    }

    let delivery: {
      event?: string;
      deliveryId?: string;
      occurredAt?: string;
      data?: HookData;
    };
    try {
      delivery = JSON.parse(bundle.rawRequest?.content ?? '');
    } catch {
      z.console.log(`Fondaro ${config.key}: delivery ignored (invalid JSON)`);
      return [];
    }
    if (!delivery || typeof delivery !== 'object') return [];

    if (delivery.event !== config.event) {
      z.console.log(
        `Fondaro ${config.key}: delivery ignored (event ${String(delivery.event)})`,
      );
      return [];
    }

    const data = delivery.data ?? {};
    const input = asInput(bundle);
    if (config.filter && !config.filter(data, input)) {
      z.console.log(`Fondaro ${config.key}: delivery filtered out by the step's options`);
      return [];
    }

    const hydrated = await config.hydrate(z, bundle, data);
    if (!hydrated) return [];
    const records = Array.isArray(hydrated) ? hydrated : [hydrated];
    return records
      .filter((record) => !config.accept || config.accept(record, input))
      .map((record) =>
        shape(record, {
          event: config.event,
          deliveryId: delivery.deliveryId ?? null,
          occurredAt: delivery.occurredAt ?? null,
        }),
      );
  };

  const performList = async (z: ZObject, bundle: Bundle) => {
    const records = (await config.list(z, bundle)).slice(0, 3);
    return records.map((record) =>
      shape(record, {
        event: config.event,
        deliveryId: null,
        occurredAt:
          record.occurredAt ?? record.updatedAt ?? record.createdAt ?? null,
      }),
    );
  };

  const performSubscribe = async (z: ZObject, bundle: Bundle) => {
    const subscription = await fondaro<{ id: string; secret: string }>(
      z,
      bundle,
      'POST',
      '/subscriptions',
      { body: { eventTypes: [config.event], targetUrl: bundle.targetUrl } },
    );
    return { id: subscription.id, secret: subscription.secret };
  };

  const performUnsubscribe = async (z: ZObject, bundle: Bundle) => {
    const id = (bundle.subscribeData as { id?: string } | undefined)?.id;
    if (!id) return {};
    // Idempotent: a subscription already gone is a successful unsubscribe.
    await fondaro(z, bundle, 'DELETE', `/subscriptions/${seg(id)}`, {
      notFound: 'empty',
    });
    return { id };
  };

  const sample: HookRecord = {
    id: SAMPLE_DELIVERY_ID,
    event: config.event,
    deliveryId: SAMPLE_DELIVERY_ID,
    occurredAt: SAMPLE_OCCURRED_AT,
    ...config.sample,
  };

  const configured = new Set(config.outputFields.map((field) => field.key));
  const outputFields = [
    ...ENVELOPE_OUTPUT_FIELDS.filter((field) => !configured.has(field.key)),
    ...config.outputFields,
  ];

  return {
    key: config.key,
    noun: config.noun,
    display: { label: config.label, description: config.description },
    operation: {
      type: 'hook',
      inputFields: config.inputFields ?? [],
      perform,
      performList,
      performSubscribe,
      performUnsubscribe,
      sample,
      outputFields,
    } as unknown as Trigger['operation'],
  };
}
