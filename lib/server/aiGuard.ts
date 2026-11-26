// Server-side guards for /api/molecule-ai: input limits, rate limits and the daily quota.
// Plain TypeScript with no Next.js imports, so it can be tested on its own.

export const DAILY_LIMIT = 25;
export const MAX_BODY_BYTES = 16 * 1024;

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'pt-BR';

export interface LookupInput {
  action: 'lookup';
  locale: Locale;
  query: string;
}

export interface PairFrequencyInput {
  pair: string;
  order: number;
  count: number;
  avgLength: number;
}

export interface AnalyzeInput {
  action: 'analyze';
  locale: Locale;
  molecule: {
    name: string;
    formulaString: string;
    molecularWeight: number;
    atomCount: number;
    bondCount: number;
    single: number;
    double: number;
    triple: number;
    aromatic: number;
    avgBondLength: number;
    pairFrequencies: PairFrequencyInput[];
  };
}

export type AiInput = LookupInput | AnalyzeInput;

export class InputError extends Error {}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function text(value: unknown, max: number, field: string): string {
  if (typeof value !== 'string') throw new InputError(`${field} must be text.`);
  const cleaned = value.replace(CONTROL_CHARS, ' ').trim();
  if (!cleaned || cleaned.length > max) {
    throw new InputError(`${field} must be 1-${max} characters.`);
  }
  return cleaned;
}

function num(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new InputError(`${field} must be a number from ${min} to ${max}.`);
  }
  return n;
}

const BOND_ORDERS = new Set([1, 1.5, 2, 3]);
// Two element symbols joined by one bond sign, as builder.ts writes them ("C–H", "C=O", "N≈C").
const PAIR_LABEL = /^[A-Z][a-z]?[–=≡≈-][A-Z][a-z]?$/;

export function parseAiInput(body: unknown): AiInput {
  if (typeof body !== 'object' || body === null) throw new InputError('Invalid request body.');
  const b = body as Record<string, unknown>;
  const locale: Locale = b.locale === 'pt-BR' ? 'pt-BR' : 'en';

  if (b.action === 'lookup') {
    return { action: 'lookup', locale, query: text(b.query, 160, 'query') };
  }

  if (b.action === 'analyze') {
    const m = b.molecule;
    if (typeof m !== 'object' || m === null) throw new InputError('Missing molecule summary payload.');
    const mol = m as Record<string, unknown>;
    const summary = (typeof mol.bondSummary === 'object' && mol.bondSummary !== null
      ? mol.bondSummary
      : {}) as Record<string, unknown>;

    const formula = text(mol.formulaString, 64, 'formulaString');
    if (!/^[A-Za-z0-9]+$/.test(formula)) throw new InputError('formulaString must be a chemical formula.');

    const rawPairs = summary.pairFrequencies ?? [];
    if (!Array.isArray(rawPairs)) throw new InputError('pairFrequencies must be a list.');
    const pairFrequencies = rawPairs.slice(0, 8).map((p, i) => {
      const pair = (typeof p === 'object' && p !== null ? p : {}) as Record<string, unknown>;
      const label = text(pair.pair, 8, `pairFrequencies[${i}].pair`);
      if (!PAIR_LABEL.test(label)) throw new InputError(`pairFrequencies[${i}].pair is not a bond label.`);
      const order = num(pair.order, `pairFrequencies[${i}].order`, 1, 3);
      if (!BOND_ORDERS.has(order)) throw new InputError(`pairFrequencies[${i}].order is not a bond order.`);
      return {
        pair: label,
        order,
        count: num(pair.count, `pairFrequencies[${i}].count`, 0, 1e6),
        avgLength: num(pair.avgLength, `pairFrequencies[${i}].avgLength`, 0, 100),
      };
    });

    return {
      action: 'analyze',
      locale,
      molecule: {
        name: text(mol.name, 160, 'name'),
        formulaString: formula,
        molecularWeight: num(mol.molecularWeight, 'molecularWeight', 0, 1e7),
        atomCount: num(mol.atomCount, 'atomCount', 0, 1e6),
        bondCount: num(mol.bondCount, 'bondCount', 0, 1e7),
        single: num(summary.single ?? 0, 'single', 0, 1e7),
        double: num(summary.double ?? 0, 'double', 0, 1e7),
        triple: num(summary.triple ?? 0, 'triple', 0, 1e7),
        aromatic: num(summary.aromatic ?? 0, 'aromatic', 0, 1e7),
        avgBondLength: num(summary.avgBondLength ?? 0, 'avgBondLength', 0, 100),
        pairFrequencies,
      },
    };
  }

  throw new InputError('Unsupported action.');
}

// ---------------------------------------------------------------------------
// Rate limits (per server instance, best effort: Cloud Run can run several)
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000;
const MAX_PER_IP_PER_WINDOW = 20;
const ipHits = new Map<string, number[]>();
const inFlightUsers = new Set<string>();

export function allowIp(ip: string, now = Date.now()): boolean {
  const recent = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_IP_PER_WINDOW) {
    ipHits.set(ip, recent);
    return false;
  }
  recent.push(now);
  ipHits.set(ip, recent);
  if (ipHits.size > 10_000) {
    for (const [key, hits] of ipHits) {
      if (hits.every((t) => now - t >= WINDOW_MS)) ipHits.delete(key);
    }
  }
  return true;
}

/** One AI request at a time per user, so parallel calls cannot all pass the quota check. */
export function tryLockUser(uid: string): boolean {
  if (inFlightUsers.has(uid)) return false;
  inFlightUsers.add(uid);
  return true;
}

export function unlockUser(uid: string): void {
  inFlightUsers.delete(uid);
}

// ---------------------------------------------------------------------------
// Daily quota through the Firestore REST API, authenticated as the user.
// Firestore verifies the ID token and firestore.rules enforce owner, verified
// email, +1 increments and the 25 cap, so the server cannot be tricked into
// writing more than the rules allow, and needs no service-account key.
// ---------------------------------------------------------------------------

export class AuthError extends Error {}
export class QuotaError extends Error {}

export interface QuotaContext {
  projectId: string;
  databaseId: string;
  fetchImpl?: typeof fetch;
}

export interface QuotaSnapshot {
  uid: string;
  exists: boolean;
  dateKey: string | null;
  actionCount: number;
  updateTime: string | null;
}

export function utcDateKey(date = new Date()): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${m}-${d}`;
}

/** Reads the uid claim without trusting it: Firestore checks the token on every call. */
export function uidFromIdToken(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Malformed ID token.');
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new AuthError('Malformed ID token.');
  }
  const uid = payload.user_id ?? payload.sub;
  if (typeof uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
    throw new AuthError('ID token has no valid user id.');
  }
  return uid;
}

function docUrl(ctx: QuotaContext, uid: string): string {
  return `https://firestore.googleapis.com/v1/projects/${ctx.projectId}/databases/${ctx.databaseId}/documents/userQuotas/${uid}`;
}

function commitUrl(ctx: QuotaContext): string {
  return `https://firestore.googleapis.com/v1/projects/${ctx.projectId}/databases/${ctx.databaseId}/documents:commit`;
}

/** Fails with AuthError unless the token is valid for this project and owns the quota doc. */
export async function readQuota(ctx: QuotaContext, idToken: string): Promise<QuotaSnapshot> {
  const uid = uidFromIdToken(idToken);
  const f = ctx.fetchImpl ?? fetch;
  const res = await f(docUrl(ctx, uid), { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 404) {
    return { uid, exists: false, dateKey: null, actionCount: 0, updateTime: null };
  }
  if (res.status === 401 || res.status === 403) {
    throw new AuthError('Sign-in is not valid. Sign in again with a verified Google account.');
  }
  if (!res.ok) throw new Error(`Quota read failed (${res.status}).`);
  const doc = (await res.json()) as {
    fields?: Record<string, { stringValue?: string; integerValue?: string }>;
    updateTime?: string;
  };
  const dateKey = doc.fields?.dateKey?.stringValue ?? null;
  const actionCount = parseInt(doc.fields?.actionCount?.integerValue ?? '0', 10) || 0;
  return { uid, exists: true, dateKey, actionCount, updateTime: doc.updateTime ?? null };
}

export function remainingToday(snap: QuotaSnapshot, today = utcDateKey()): number {
  const used = snap.exists && snap.dateKey === today ? snap.actionCount : 0;
  return Math.max(0, DAILY_LIMIT - used);
}

/**
 * Charges one action. The write is conditional on the document not having changed
 * since readQuota, so two requests cannot both spend the same last action.
 */
export async function chargeAction(
  ctx: QuotaContext,
  idToken: string,
  snap: QuotaSnapshot,
  actionType: 'lookup' | 'analyze',
  today = utcDateKey(),
): Promise<void> {
  const f = ctx.fetchImpl ?? fetch;
  const name = docUrl(ctx, snap.uid).replace('https://firestore.googleapis.com/v1/', '');
  const sameDay = snap.exists && snap.dateKey === today;
  const nextCount = sameDay ? snap.actionCount + 1 : 1;
  if (nextCount > DAILY_LIMIT) throw new QuotaError('Daily limit reached.');

  const fields: Record<string, unknown> = {
    dateKey: { stringValue: today },
    actionCount: { integerValue: String(nextCount) },
    lastActionType: { stringValue: actionType },
  };
  const transforms = [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }];
  let write: Record<string, unknown>;
  if (snap.exists) {
    write = {
      update: { name, fields },
      updateMask: { fieldPaths: ['dateKey', 'actionCount', 'lastActionType'] },
      updateTransforms: transforms,
      currentDocument: { updateTime: snap.updateTime },
    };
  } else {
    write = {
      update: { name, fields: { ...fields, ownerId: { stringValue: snap.uid } } },
      updateTransforms: [...transforms, { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false },
    };
  }

  const res = await f(commitUrl(ctx), {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: [write] }),
  });
  if (res.ok) return;
  if (res.status === 401) throw new AuthError('Sign-in is not valid. Sign in again.');
  // 403 = rules refused (limit hit), 400/409 = the precondition failed (raced with another write)
  throw new QuotaError('Daily limit reached.');
}
