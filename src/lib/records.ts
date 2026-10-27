import type { Bundle, ZObject } from 'zapier-platform-core';

import { fondaro, seg } from './api.js';

/*
 * Reads the triggers share: the lead behind an event, a lead's activity feed,
 * a deal with its lead, and the test-step walks over the newest leads.
 */

type Rec = Record<string, any>;

/** How many of the newest leads a test-step walk reads (1 + 5 requests, under the 120/min grant limit). */
export const WALK_LEADS = 5;
const FEED_LIMIT = 50;

export const getLead = (z: ZObject, bundle: Bundle, id: unknown) =>
  fondaro<Rec>(z, bundle, 'GET', `/leads/${seg(id as string | number)}`, {
    notFound: 'empty',
    subject: `Lead ${String(id)}`,
  });

/** The activity entries of one type on one lead (newest first, up to 50). */
export const feed = async (
  z: ZObject,
  bundle: Bundle,
  leadId: unknown,
  type: string,
): Promise<Rec[]> => {
  const page = await fondaro<{ entries: Rec[] }>(
    z,
    bundle,
    'GET',
    `/leads/${seg(leadId as string | number)}/activities`,
    { params: { types: type, limit: FEED_LIMIT }, notFound: 'empty' },
  );
  return page?.entries ?? [];
};

/**
 * Hydrate a feed-backed event: find the entry of `type` whose `key` object has
 * the payload's id, add the lead. `null` when the entry is not in the latest 50
 * (or the lead is gone).
 */
export async function hydrateFromFeed(
  z: ZObject,
  bundle: Bundle,
  data: Rec,
  opts: { type: string; key: 'task' | 'note'; idField: string; extra?: Rec },
): Promise<Rec | null> {
  const entries = await feed(z, bundle, data.leadId, opts.type);
  const entry = entries.find((e) => e[opts.key]?.id === data[opts.idField]);
  if (!entry) return null;
  const lead = await getLead(z, bundle, data.leadId);
  if (!lead) return null;
  return {
    ...entry[opts.key],
    leadId: data.leadId,
    occurredAt: entry.occurredAt,
    ...opts.extra,
    lead,
  };
}

/** The test-step walk: the 5 newest leads' feeds, newest entry first (1 + 5 requests). */
export async function listFromFeeds(
  z: ZObject,
  bundle: Bundle,
  opts: { type: string; key: 'task' | 'note' },
): Promise<Rec[]> {
  const page = await fondaro<{ leads: Rec[] }>(z, bundle, 'GET', '/leads', {
    params: { sort: 'createdAt', limit: WALK_LEADS },
  });
  const found: Rec[] = [];
  for (const lead of (page?.leads ?? []).slice(0, WALK_LEADS)) {
    for (const entry of await feed(z, bundle, lead.id, opts.type)) {
      if (!entry[opts.key]) continue;
      found.push({
        ...entry[opts.key],
        leadId: lead.id,
        occurredAt: entry.occurredAt,
        lead,
      });
    }
  }
  return found.sort((a, b) =>
    String(b.occurredAt).localeCompare(String(a.occurredAt)),
  );
}

/** `GET /deals/:id` plus the lead; `null` when either is gone. */
export async function hydrateDeal(
  z: ZObject,
  bundle: Bundle,
  data: Rec,
): Promise<Rec | null> {
  const deal = await fondaro<Rec>(z, bundle, 'GET', `/deals/${seg(data.dealId)}`, {
    notFound: 'empty',
    subject: `Deal ${String(data.dealId)}`,
  });
  if (!deal) return null;
  const lead = await fondaro<Rec>(
    z,
    bundle,
    'GET',
    `/leads/${seg(data.leadId ?? deal.leadId)}`,
    { notFound: 'empty', subject: `Lead ${String(data.leadId ?? deal.leadId)}` },
  );
  if (!lead) return null;
  return { ...deal, lead };
}

/**
 * The test-step walk: the 5 newest leads, each lead's deals, newest first by
 * `sortKey`. `keep` drops deals that do not belong (won/lost only, a stage).
 */
export async function listDeals(
  z: ZObject,
  bundle: Bundle,
  sortKey: string,
  keep: (deal: Rec) => boolean = () => true,
): Promise<Rec[]> {
  const page = await fondaro<{ leads: Rec[] }>(z, bundle, 'GET', '/leads', {
    params: { sort: 'createdAt', limit: WALK_LEADS },
  });
  const found: Rec[] = [];
  for (const lead of (page?.leads ?? []).slice(0, WALK_LEADS)) {
    const deals = await fondaro<Rec[]>(
      z,
      bundle,
      'GET',
      `/leads/${seg(lead.id)}/deals`,
      { notFound: 'empty' },
    );
    for (const deal of deals ?? []) {
      if (keep(deal)) found.push({ ...deal, lead });
    }
  }
  return found.sort((a, b) =>
    String(b[sortKey] ?? '').localeCompare(String(a[sortKey] ?? '')),
  );
}
