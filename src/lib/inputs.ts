/** Reading what a customer filled in (input values arrive raw: cleanInputData is off). */

export const filled = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  !(Array.isArray(value) && value.length === 0);

/** Only the keys a customer filled, copied from `input` in the given order. */
export const pickFilled = (
  input: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (filled(input[key])) out[key] = input[key];
  return out;
};

export const asNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Whether a checkbox is ticked (Zapier sends true/false or 'true'/'false'). */
export const ticked = (value: unknown): boolean =>
  value === true || value === 'true';

/** Values chosen in a multiple-choice input (a list, or one string). */
export const picked = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "Only For Tags" values: tag ids from the dropdown, or tag names a customer
 * typed or mapped in (a tag created after the dropdown loaded has no choice yet).
 */
export const wantedTags = (input: Record<string, unknown>): string[] =>
  picked(input.tagIds)
    .map((value) => value.trim())
    .filter(Boolean);

/** Before hydration only the tag id is known: a wanted name waits for the tag. */
export const tagMayMatch = (tagId: unknown, wanted: string[]): boolean =>
  wanted.length === 0 ||
  wanted.includes(String(tagId)) ||
  wanted.some((value) => !UUID.test(value));

/** A tag matches a wanted id exactly, or a wanted name ignoring case. */
export const tagMatches = (
  tag: { id?: unknown; name?: unknown } | null | undefined,
  wanted: string[],
): boolean => {
  if (wanted.length === 0) return true;
  if (!tag) return false;
  const name = String(tag.name ?? '').trim().toLowerCase();
  return wanted.some(
    (value) => value === String(tag.id) || (name !== '' && value.toLowerCase() === name),
  );
};
