/**
 * A panel that argues with a stage before its claims harden.
 *
 * The council exists because the stage documents are written by one person who
 * already believes them. Every other check in this tool reads what is on the
 * page; this one asks readers who were never told what the founder concluded.
 *
 * Two rules shape the whole file, and neither is negotiable:
 *
 * 1. **A seat never sees a `confidence:`.** The pack strips it. A reader shown
 *    "validated" is being asked whether they agree with a verdict; a reader
 *    shown only the statement and its evidence is being asked to reach one. The
 *    second is worth having and the first is a rubber stamp.
 *
 * 2. **A council can lower a claim and never raise one.** Every finding here is
 *    a `warning`, so `flawline council` cannot fail a build, and nothing in
 *    this file writes to a document. A panel that could promote a claim would
 *    be a way to manufacture evidence by asking politely, which is the exact
 *    failure the rest of the tool exists to prevent.
 *
 * The LLM lives outside this file. The pack goes out as JSON and the verdict
 * comes back as JSON, so the checker stays offline, dependency-free and
 * reproducible, and the panel can be five models, five subagents or five people
 * in a room.
 */
import { createHash } from 'node:crypto';
import type { Finding } from './check.js';
import {
  isConfidence,
  strengthOf,
  type Confidence,
  type Stage,
  type Thesis,
} from './model.js';

/** What a seat may say about a claim. Two positions, so a seat must commit. */
export const POSITIONS = ['holds', 'doubted'] as const;

export type Position = (typeof POSITIONS)[number];

export function isPosition(value: string): value is Position {
  return (POSITIONS as readonly string[]).includes(value);
}

export interface Seat {
  readonly id: string;
  /** The one question this seat answers. Kept narrow on purpose. */
  readonly question: string;
  /** What the seat must not do, stated because panels drift into agreeing. */
  readonly refuses: string;
}

/**
 * The seats, fixed for every stage.
 *
 * Fixed rather than generated because a panel whose membership changes per run
 * produces findings that cannot be compared across runs. The same four readers
 * asking the same four questions makes a diff meaningful: a claim that survived
 * the evidence auditor in March and does not in June has changed.
 *
 * Each seat owns one question. A seat asked to judge a claim generally will
 * produce a paragraph of balanced consideration, which reads well and decides
 * nothing.
 */
export const COUNCIL_SEATS: readonly Seat[] = [
  {
    id: 'evidence-auditor',
    question:
      'Is this statement an observation of something that happened, or a conclusion the author reasoned their way to? Quote the part of the evidence that settles it.',
    refuses:
      'Judging whether the claim is true. Only whether anything outside the author’s head is cited.',
  },
  {
    id: 'method-challenger',
    question:
      'Given only the methods and counts listed, what is the strongest a careful reader could state this claim? Answer with assumed, indicated or validated.',
    refuses:
      'Guessing what the author claimed. You have not been shown it, and the estimate is worthless once you have.',
  },
  {
    id: 'dependency-breaker',
    question:
      'If the claims this one rests on turned out to be wrong tomorrow, does this claim survive on its own evidence? Name what would be left.',
    refuses: 'Arguing that the claims underneath are wrong. Assume they fall and follow it.',
  },
  {
    id: 'absent-party',
    question:
      'Who is described in this claim but was never asked? Name the role, and say what they would have to have said for this to hold.',
    refuses:
      'Inventing what that person would say. Name the gap; do not fill it, because a filled gap becomes evidence.',
  },
  {
    id: 'chairman',
    question:
      'Read the four seats. Report only the claims where a seat found something the document does not already admit, and drop anything a seat asserted without pointing at the text.',
    refuses:
      'Adding an opinion of your own, or softening a seat into a suggestion. You are counting, not deciding.',
  },
];

/** The seats that vote. The chairman reads them and does not add a vote. */
export const JUDGING_SEATS: readonly Seat[] = COUNCIL_SEATS.filter(
  (seat) => seat.id !== 'chairman',
);

const SEAT_IDS: ReadonlySet<string> = new Set(COUNCIL_SEATS.map((seat) => seat.id));

/**
 * How many judging seats must doubt a claim before it is worth the founder's
 * attention.
 *
 * Half, rounded up. One reader in four disliking a sentence is the ordinary
 * variance of asking four readers, and reporting it trains the founder to skim
 * past council output. The threshold exists to keep the signal expensive.
 */
const DISSENT_THRESHOLD = Math.ceil(JUDGING_SEATS.length / 2);

/** A claim as a seat sees it: everything except what the founder concluded. */
export interface PackedClaim {
  readonly id: string;
  readonly statement: string;
  readonly critical: boolean;
  readonly dependsOn: readonly string[];
  readonly evidence: readonly {
    readonly method: string;
    readonly source: string;
    readonly n?: number;
    readonly collectedAt?: string;
  }[];
}

export interface CouncilPack {
  readonly stage: Stage;
  /**
   * A fingerprint of the claims as they were when the pack was built. A verdict
   * carries it back, so a panel's answers about last week's wording cannot be
   * read as answers about this week's.
   */
  readonly packId: string;
  readonly seats: readonly Seat[];
  readonly claims: readonly PackedClaim[];
}

/**
 * Builds the pack for one stage.
 *
 * Deterministic by construction: no clock, no randomness, no network. The same
 * documents produce byte-identical output, which is what makes `packId` usable
 * as a staleness check.
 */
export function buildPack(thesis: Thesis, stage: Stage): CouncilPack {
  const claims: PackedClaim[] = thesis.claims
    .filter((claim) => claim.stage === stage)
    .map((claim) => ({
      id: claim.id,
      statement: claim.statement,
      critical: claim.critical,
      dependsOn: [...claim.dependsOn],
      evidence: claim.evidence.map((entry) => ({
        method: entry.method,
        source: entry.source,
        ...(entry.n === undefined ? {} : { n: entry.n }),
        ...(entry.collectedAt === undefined ? {} : { collectedAt: entry.collectedAt }),
      })),
    }));

  return { stage, packId: fingerprint(stage, claims), seats: COUNCIL_SEATS, claims };
}

function fingerprint(stage: Stage, claims: readonly PackedClaim[]): string {
  const hash = createHash('sha256');
  hash.update(stage);
  for (const claim of claims) {
    hash.update('\u0000');
    hash.update(claim.id);
    hash.update('\u0000');
    hash.update(claim.statement);
    for (const entry of claim.evidence) {
      hash.update('\u0000');
      hash.update(`${entry.method}:${entry.source}:${entry.n ?? ''}`);
    }
  }
  return hash.digest('hex').slice(0, 16);
}

export interface SeatVerdict {
  readonly claim: string;
  readonly position: Position;
  readonly note: string;
  /**
   * The blind ceiling, from `method-challenger` only: the strongest confidence
   * a reader who never saw the written one thinks the evidence could carry.
   */
  readonly supports?: Exclude<Confidence, 'refuted'>;
}

export interface SeatReturn {
  readonly seat: string;
  readonly verdicts: readonly SeatVerdict[];
}

export interface CouncilVerdict {
  readonly stage: string;
  readonly packId: string;
  readonly seats: readonly SeatReturn[];
}

export interface VerdictParse {
  readonly verdict: CouncilVerdict | null;
  readonly issues: readonly string[];
}

/**
 * Reads a verdict file.
 *
 * Strict about shape, because this is the one place a value from outside the
 * repository enters the tool. A malformed verdict is reported rather than
 * coerced: a seat name that is not a seat usually means the panel was given
 * different instructions than the pack carried, and quietly dropping it would
 * hide that.
 */
export function parseVerdict(text: string): VerdictParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { verdict: null, issues: ['Not valid JSON. Expected the verdict a council wrote.'] };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { verdict: null, issues: ['Expected a JSON object with stage, packId and seats.'] };
  }

  const record = raw as Record<string, unknown>;
  const issues: string[] = [];

  if (typeof record['stage'] !== 'string') issues.push('Missing "stage".');
  if (typeof record['packId'] !== 'string') issues.push('Missing "packId".');
  if (!Array.isArray(record['seats'])) issues.push('Missing "seats".');

  if (issues.length > 0) return { verdict: null, issues };

  const seats: SeatReturn[] = [];

  for (const entry of record['seats'] as unknown[]) {
    if (typeof entry !== 'object' || entry === null) {
      issues.push('A seat entry was not an object.');
      continue;
    }

    const seatRecord = entry as Record<string, unknown>;
    const seat = seatRecord['seat'];

    if (typeof seat !== 'string' || !SEAT_IDS.has(seat)) {
      issues.push(
        `Unknown seat "${String(seat)}". The council seats are ${COUNCIL_SEATS.map((s) => s.id).join(', ')}.`,
      );
      continue;
    }

    if (!Array.isArray(seatRecord['verdicts'])) {
      issues.push(`Seat "${seat}" has no verdicts.`);
      continue;
    }

    const verdicts: SeatVerdict[] = [];

    for (const item of seatRecord['verdicts'] as unknown[]) {
      if (typeof item !== 'object' || item === null) {
        issues.push(`Seat "${seat}" returned a verdict that was not an object.`);
        continue;
      }

      const verdictRecord = item as Record<string, unknown>;
      const claim = verdictRecord['claim'];
      const position = verdictRecord['position'];
      const supports = verdictRecord['supports'];

      if (typeof claim !== 'string') {
        issues.push(`Seat "${seat}" returned a verdict with no claim id.`);
        continue;
      }

      if (typeof position !== 'string' || !isPosition(position)) {
        issues.push(
          `Seat "${seat}" said "${String(position)}" about ${claim}. A position is ${POSITIONS.join(' or ')}.`,
        );
        continue;
      }

      if (supports !== undefined && (typeof supports !== 'string' || !isConfidence(supports))) {
        issues.push(`Seat "${seat}" estimated "${String(supports)}", which is not a confidence.`);
        continue;
      }

      verdicts.push({
        claim,
        position,
        note: typeof verdictRecord['note'] === 'string' ? verdictRecord['note'] : '',
        ...(typeof supports === 'string' && supports !== 'refuted'
          ? { supports: supports as Exclude<Confidence, 'refuted'> }
          : {}),
      });
    }

    seats.push({ seat, verdicts });
  }

  return {
    verdict: {
      stage: record['stage'] as string,
      packId: record['packId'] as string,
      seats,
    },
    issues,
  };
}

/**
 * Turns a verdict into findings against the thesis it was written about.
 *
 * Everything returned is a warning. The council reports; the founder decides
 * whether to go and get evidence, and only evidence moves a `confidence:`.
 */
export function councilFindings(thesis: Thesis, verdict: CouncilVerdict): Finding[] {
  const byId = new Map(thesis.claims.map((claim) => [claim.id, claim]));
  const stale = isStale(thesis, verdict);
  const findings: Finding[] = [];

  if (stale !== null) findings.push(stale);

  const doubters = new Map<string, string[]>();
  const unknown = new Set<string>();

  for (const seat of verdict.seats) {
    if (seat.seat === 'chairman') continue;

    for (const item of seat.verdicts) {
      if (!byId.has(item.claim)) {
        unknown.add(item.claim);
        continue;
      }
      if (item.position !== 'doubted') continue;

      const list = doubters.get(item.claim) ?? [];
      list.push(seat.seat);
      doubters.set(item.claim, list);
    }
  }

  for (const claim of thesis.claims) {
    const seats = doubters.get(claim.id) ?? [];
    if (seats.length < DISSENT_THRESHOLD) continue;

    findings.push({
      code: 'council-dissent',
      severity: 'warning',
      claimId: claim.id,
      source: claim.source,
      message: `${seats.length} of ${JUDGING_SEATS.length} seats doubted this claim without being shown how strongly it was written (${seats.join(', ')}). That is not evidence against it, and it does not lower the confidence on its own. Read their notes, then either cite what they missed or go and get it.`,
    });
  }

  findings.push(...ceilingFindings(thesis, verdict));

  for (const id of [...unknown].sort()) {
    findings.push({
      code: 'council-unknown-claim',
      severity: 'warning',
      claimId: id,
      source: `council verdict for ${verdict.stage}`,
      message: `A seat returned a verdict about "${id}", which is not a claim in this stage. The panel was probably given something other than the pack, so read the rest of this verdict with that in mind.`,
    });
  }

  return findings;
}

function isStale(thesis: Thesis, verdict: CouncilVerdict): Finding | null {
  const stage = verdict.stage;
  if (!isStageOf(thesis, stage)) return null;

  const expected = buildPack(thesis, stage).packId;
  if (expected === verdict.packId) return null;

  return {
    code: 'council-pack-stale',
    severity: 'warning',
    claimId: stage,
    source: `strategy/${stage}.md`,
    message: `This verdict answers pack ${verdict.packId}; the stage now fingerprints as ${expected}. A claim was edited after the pack went out, so these seats read wording that no longer exists. Re-run \`flawline council ${stage}\` before trusting anything below.`,
  };
}

function isStageOf(thesis: Thesis, stage: string): stage is Stage {
  return thesis.claims.some((claim) => claim.stage === stage);
}

/**
 * The sharpest thing the panel produces: a reader who was never told how
 * strongly a claim was written says how strongly it could be written, and the
 * two are compared afterwards.
 *
 * Only the gap in one direction is reported. An estimate above what the founder
 * wrote is left in silence — a seat cannot hand out confidence it did not
 * observe, and a tool that whispered "the panel thinks you are being modest"
 * would be a promotion path built out of opinion.
 */
function ceilingFindings(thesis: Thesis, verdict: CouncilVerdict): Finding[] {
  const challenger = verdict.seats.find((seat) => seat.seat === 'method-challenger');
  if (!challenger) return [];

  const byId = new Map(thesis.claims.map((claim) => [claim.id, claim]));
  const findings: Finding[] = [];

  for (const item of challenger.verdicts) {
    const claim = byId.get(item.claim);
    if (!claim || item.supports === undefined) continue;
    if (claim.confidence === 'refuted') continue;
    if (strengthOf(item.supports) >= strengthOf(claim.confidence)) continue;

    findings.push({
      code: 'council-ceiling-dissent',
      severity: 'warning',
      claimId: claim.id,
      source: claim.source,
      message: `Written "${claim.confidence}". A seat shown the evidence but not the confidence put it at "${item.supports}". They were reading the same sources you were, without knowing what you had concluded from them. Either the evidence block is missing something you know, or the line is.`,
    });
  }

  return findings;
}
