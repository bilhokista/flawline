/**
 * The half of `what-if` that a graph cannot do.
 *
 * `whatIf` walks `depends_on` and is exactly as good as the edges someone
 * remembered to write. That is its strength — it is deterministic, and the
 * ordering in `evidence.md` can rest on it — and it is also its blind spot. The
 * dependency that costs a founder six months is rarely one they declared. It is
 * the one they never noticed: a price built out of a cost they assumed, a wedge
 * defined as the answer to a problem nobody checked.
 *
 * So this file adds a panel on top, and keeps the two apart on purpose:
 *
 * - The graph answers **what falls, given the edges written down.** Same answer
 *   every run, no model, no network.
 * - The panel answers **which edges are missing, and who would notice.** A
 *   different answer each run, reported separately, never folded into the
 *   deterministic half.
 *
 * Both halves obey the rule from DISCIPLINE.md: a panel can lower a claim and
 * never raise one. Every finding here is a `warning`, nothing writes to
 * `strategy/`, and a panel that agrees with everything produces silence rather
 * than a promotion.
 */
import { createHash } from 'node:crypto';
import type { Finding } from './check.js';
import type { Seat } from './council.js';
import { strengthOf, type Claim, type Stage, type Thesis } from './model.js';

/** The stage personas are built from. They cannot come from anywhere else. */
const PERSONA_STAGE: Stage = 'customer';

/**
 * Seats that hunt for an edge nobody declared.
 *
 * Three, so that two agreeing means something. Each reads the same claims for a
 * different kind of dependency, because "does A depend on B" asked plainly gets
 * a plausible yes about almost any pair in a coherent strategy.
 */
export const EDGE_SEATS: readonly Seat[] = [
  {
    id: 'premise-tracer',
    question:
      'Does this claim’s statement only make sense if the target claim is true? Quote the words that carry the assumption.',
    refuses:
      'Finding a theme in common. Two claims about the same market are not a dependency.',
  },
  {
    id: 'number-tracer',
    question:
      'Is any number, price or threshold in this claim derived from the target claim? Name the number and where it came from.',
    refuses: 'Guessing at arithmetic that is not written down.',
  },
  {
    id: 'retraction-tester',
    question:
      'If the target claim were deleted from the document entirely, would this claim still read as written, or would a sentence in it now be unsupported?',
    refuses:
      'Answering that the claim would be weaker. Weaker is not the question; unsupported as written is.',
  },
];

const EDGE_SEAT_IDS: ReadonlySet<string> = new Set(EDGE_SEATS.map((seat) => seat.id));

/** Two of three. One reader spotting a resemblance is a resemblance. */
const EDGE_THRESHOLD = 2;

/** A panel of one is a person with an opinion. */
const MIN_PERSONAS = 2;

/**
 * What losing a claim does to someone the claim is about.
 *
 * Deliberately not a score. A persona asked to rate severity out of five
 * returns a four, every time, for everything.
 */
export const PERSONA_IMPACTS = ['removes-need', 'changes-something', 'changes-nothing'] as const;

export type PersonaImpact = (typeof PERSONA_IMPACTS)[number];

function isImpact(value: string): value is PersonaImpact {
  return (PERSONA_IMPACTS as readonly string[]).includes(value);
}

export interface DeepClaim {
  readonly id: string;
  readonly stage: Stage;
  readonly statement: string;
  readonly dependsOn: readonly string[];
}

export interface PersonaMaterial {
  readonly available: boolean;
  /** Customer claims with their sources, the only legitimate persona input. */
  readonly claims: readonly { readonly id: string; readonly statement: string; readonly sources: readonly string[] }[];
  readonly reason: string;
}

/**
 * Whether personas may be built at all, and from what.
 *
 * The gate exists because a persona invented by a model is a confident voice
 * with nothing behind it, and it arrives wearing the costume of a customer.
 * Running it against an `assumed` customer stage would produce exactly the
 * failure this project exists to prevent, with better production values.
 *
 * What counts as material is deliberately wide after the search-demand change:
 * interview transcripts and reproducible search-intent clusters both qualify.
 * What matters is that a stranger can open the source, not how it was gathered.
 */
export function personaMaterial(thesis: Thesis): PersonaMaterial {
  const customer = thesis.claims.filter((claim) => claim.stage === PERSONA_STAGE);

  if (customer.length === 0) {
    return {
      available: false,
      claims: [],
      reason:
        'No customer stage yet. Personas are built from what customers were observed doing, so there is nothing to build them from.',
    };
  }

  const grounded = customer.filter(
    (claim) =>
      claim.confidence !== 'refuted' &&
      strengthOf(claim.confidence) >= strengthOf('indicated') &&
      claim.evidence.length > 0,
  );

  if (grounded.length === 0) {
    return {
      available: false,
      claims: [],
      reason:
        'Every customer claim is still "assumed". A persona built on an assumed segment is a character, and it will agree with whatever the document already says.',
    };
  }

  return {
    available: true,
    claims: grounded.map((claim) => ({
      id: claim.id,
      statement: claim.statement,
      sources: claim.evidence.map((entry) => entry.source),
    })),
    reason: '',
  };
}

export interface DeepPack {
  readonly claim: string;
  readonly packId: string;
  readonly target: DeepClaim;
  /** Ids the graph already knows depend on the target. */
  readonly declared: readonly string[];
  /** Everything the panel should scan for an undeclared edge. */
  readonly candidates: readonly DeepClaim[];
  readonly edgeSeats: readonly Seat[];
  readonly personas: PersonaMaterial;
}

export function buildDeepPack(thesis: Thesis, claimId: string): DeepPack {
  const target = thesis.claims.find((claim) => claim.id === claimId);

  if (target === undefined) {
    throw new Error(`No claim called "${claimId}".`);
  }

  const declared = thesis.claims
    .filter((claim) => claim.dependsOn.includes(claimId))
    .map((claim) => claim.id);

  const declaredSet = new Set(declared);

  const candidates = thesis.claims
    .filter((claim) => claim.id !== claimId && !declaredSet.has(claim.id))
    .map(strip);

  return {
    claim: claimId,
    packId: fingerprint(claimId, candidates),
    target: strip(target),
    declared,
    candidates,
    edgeSeats: EDGE_SEATS,
    personas: personaMaterial(thesis),
  };
}

function strip(claim: Claim): DeepClaim {
  return {
    id: claim.id,
    stage: claim.stage,
    statement: claim.statement,
    dependsOn: [...claim.dependsOn],
  };
}

function fingerprint(claimId: string, candidates: readonly DeepClaim[]): string {
  const hash = createHash('sha256');
  hash.update(claimId);
  for (const claim of candidates) {
    hash.update('\u0000');
    hash.update(`${claim.id}:${claim.statement}`);
  }
  return hash.digest('hex').slice(0, 16);
}

export interface EdgeReturn {
  readonly from: string;
  readonly seats: readonly string[];
  readonly note: string;
}

export interface PersonaReturn {
  readonly persona: string;
  /** Where this persona came from. Required: a persona with no source is fiction. */
  readonly source: string;
  readonly impact: PersonaImpact;
  readonly note: string;
}

export interface DeepVerdict {
  readonly claim: string;
  readonly packId: string;
  readonly edges: readonly EdgeReturn[];
  readonly personas: readonly PersonaReturn[];
}

export interface DeepVerdictParse {
  readonly verdict: DeepVerdict | null;
  readonly issues: readonly string[];
}

export function parseDeepVerdict(text: string): DeepVerdictParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { verdict: null, issues: ['Not valid JSON. Expected the verdict a deep run wrote.'] };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { verdict: null, issues: ['Expected a JSON object with claim, packId, edges and personas.'] };
  }

  const record = raw as Record<string, unknown>;
  const issues: string[] = [];

  if (typeof record['claim'] !== 'string') issues.push('Missing "claim".');
  if (typeof record['packId'] !== 'string') issues.push('Missing "packId".');
  if (issues.length > 0) return { verdict: null, issues };

  const edges: EdgeReturn[] = [];

  for (const entry of asArray(record['edges'])) {
    if (typeof entry !== 'object' || entry === null) {
      issues.push('An edge entry was not an object.');
      continue;
    }

    const edge = entry as Record<string, unknown>;
    const from = edge['from'];

    if (typeof from !== 'string' || from === '') {
      issues.push('An edge entry named no claim in "from".');
      continue;
    }

    const seats = asArray(edge['seats']).filter((seat): seat is string => typeof seat === 'string');
    const unknownSeat = seats.find((seat) => !EDGE_SEAT_IDS.has(seat));

    if (unknownSeat !== undefined) {
      issues.push(
        `Unknown seat "${unknownSeat}". The edge seats are ${EDGE_SEATS.map((s) => s.id).join(', ')}.`,
      );
      continue;
    }

    edges.push({
      from,
      seats,
      note: typeof edge['note'] === 'string' ? edge['note'] : '',
    });
  }

  const personas: PersonaReturn[] = [];

  for (const entry of asArray(record['personas'])) {
    if (typeof entry !== 'object' || entry === null) {
      issues.push('A persona entry was not an object.');
      continue;
    }

    const persona = entry as Record<string, unknown>;
    const name = persona['persona'];
    const source = persona['source'];
    const impact = persona['impact'];

    if (typeof name !== 'string' || name === '') {
      issues.push('A persona entry had no name.');
      continue;
    }

    if (typeof source !== 'string' || source === '') {
      issues.push(
        `Persona "${name}" cites no source. A persona with no source was invented, and an invented customer agrees with the document.`,
      );
      continue;
    }

    if (typeof impact !== 'string' || !isImpact(impact)) {
      issues.push(
        `Persona "${name}" reported "${String(impact)}", which is not an impact. Use ${PERSONA_IMPACTS.join(', ')}.`,
      );
      continue;
    }

    personas.push({
      persona: name,
      source,
      impact,
      note: typeof persona['note'] === 'string' ? persona['note'] : '',
    });
  }

  return {
    verdict: {
      claim: record['claim'] as string,
      packId: record['packId'] as string,
      edges,
      personas,
    },
    issues,
  };
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function deepFindings(thesis: Thesis, verdict: DeepVerdict): Finding[] {
  const target = thesis.claims.find((claim) => claim.id === verdict.claim);
  if (target === undefined) return [];

  const findings: Finding[] = [];
  const byId = new Map(thesis.claims.map((claim) => [claim.id, claim]));

  const expected = buildDeepPack(thesis, verdict.claim).packId;

  if (expected !== verdict.packId) {
    findings.push({
      code: 'whatif-pack-stale',
      severity: 'warning',
      claimId: verdict.claim,
      source: target.source,
      message: `This verdict answers pack ${verdict.packId}; the thesis now fingerprints as ${expected}. A claim was edited after the pack went out. Re-run \`flawline what-if ${verdict.claim} --deep\` before trusting anything below.`,
    });
  }

  for (const edge of verdict.edges) {
    const from = byId.get(edge.from);

    if (from === undefined) {
      findings.push({
        code: 'whatif-unknown-claim',
        severity: 'warning',
        claimId: edge.from,
        source: target.source,
        message: `A seat reported an edge from "${edge.from}", which is not a claim in this thesis. The panel was probably given something other than the pack.`,
      });
      continue;
    }

    // Already written down. The graph half reported it; saying it twice would
    // teach the reader that the deep half repeats what they already know.
    if (from.dependsOn.includes(verdict.claim)) continue;
    if (edge.seats.length < EDGE_THRESHOLD) continue;

    findings.push({
      code: 'whatif-undeclared-edge',
      severity: 'warning',
      claimId: from.id,
      source: from.source,
      message: `${edge.seats.length} of ${EDGE_SEATS.length} seats read "${from.id}" as resting on "${verdict.claim}", which it does not declare (${edge.seats.join(', ')}). ${edge.note} If they are right, add it to depends_on — until then the graph cannot tell you this claim is at risk.`,
    });
  }

  findings.push(...personaFindings(target, verdict));

  return findings;
}

/**
 * The one thing a persona panel may report.
 *
 * If nobody the claim is about would notice losing it, the claim is either
 * written about the wrong people or is not load-bearing — and a `critical`
 * claim that no customer would miss is worth a founder's afternoon.
 *
 * The opposite result is silence. Personas saying a claim matters enormously
 * confirms nothing: they are readings of transcripts, not customers, and a tool
 * that turned their agreement into support would be manufacturing evidence out
 * of sympathy.
 */
function personaFindings(target: Claim, verdict: DeepVerdict): Finding[] {
  if (verdict.personas.length < MIN_PERSONAS) return [];
  if (verdict.personas.some((persona) => persona.impact !== 'changes-nothing')) return [];

  return [
    {
      code: 'whatif-persona-indifferent',
      severity: 'warning',
      claimId: target.id,
      source: target.source,
      message: `All ${verdict.personas.length} personas said losing this claim changes nothing for them${target.critical ? ', and it is marked critical' : ''}. Either it is written about people who are not your customers, or it is not carrying the weight the document gives it. The personas are readings of your own research, not customers, so this is a question rather than a verdict.`,
    },
  ];
}
