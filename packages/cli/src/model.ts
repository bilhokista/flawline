/**
 * The vocabulary of a thesis.
 *
 * A thesis is a graph of claims. Each claim carries the strength of the
 * evidence behind it, and the claims it rests on. The point of the type layer
 * is that an unsupported claim should be impossible to express as a supported
 * one.
 */

/** Stages of the pipeline, in the order a founder walks them. */
export const STAGES = [
  'problem',
  'advantage',
  'customer',
  'offer',
  'model',
  'evidence',
  'narrative',
  'motion',
] as const;

export type Stage = (typeof STAGES)[number];

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

/**
 * How much a claim has earned the right to be relied on.
 *
 * `assumed`   — someone's belief. No contact with reality yet.
 * `indicated` — real signal exists, but below the stage's bar.
 * `validated` — signal meets the bar recorded in the stage gate.
 * `refuted`   — reality said no. Louder than any other state.
 */
export const CONFIDENCE = ['assumed', 'indicated', 'validated', 'refuted'] as const;

export type Confidence = (typeof CONFIDENCE)[number];

export function isConfidence(value: string): value is Confidence {
  return (CONFIDENCE as readonly string[]).includes(value);
}

/**
 * Rank on the ladder of support. `refuted` is deliberately absent: it is not a
 * weaker form of support, it is the absence of a claim. Callers must handle it
 * before comparing strength, and {@link strengthOf} refuses to rank it.
 */
const STRENGTH: Record<Exclude<Confidence, 'refuted'>, number> = {
  assumed: 0,
  indicated: 1,
  validated: 2,
};

export function strengthOf(confidence: Exclude<Confidence, 'refuted'>): number {
  return STRENGTH[confidence];
}

/** A pointer to something that actually happened outside the document. */
export interface Evidence {
  /** How the signal was collected, e.g. `interview`, `landing-page`, `sale`. */
  readonly method: string;
  /** Where a reader can go to check it: a path, URL, or ticket. */
  readonly source: string;
  /** How many independent observations. Absent when the method has no count. */
  readonly n?: number;
  /** ISO date the signal was collected, used to flag staleness. */
  readonly collectedAt?: string;
}

export interface Claim {
  readonly id: string;
  readonly statement: string;
  readonly confidence: Confidence;
  readonly evidence: readonly Evidence[];
  /** Ids of claims this one rests on. */
  readonly dependsOn: readonly string[];
  /** A claim the thesis cannot survive without. Gates block on these. */
  readonly critical: boolean;
  /** Stage the claim was declared in. */
  readonly stage: Stage;
  /** File the claim was read from, for diagnostics. */
  readonly source: string;
}

/**
 * The strongest confidence a given kind of signal can ever buy, however much
 * of it you gather.
 *
 * This exists because volume does not change the kind of thing a signal is. A
 * thousand people saving a post is a thousand observations of interest and
 * zero observations of anyone paying. The ceiling is the honest limit of what
 * the method can tell you.
 *
 * The line at `interview` is the one founders argue with. Interviews, done
 * properly, establish that a problem exists and what it costs. They cannot
 * establish that anyone will part with money, because nothing was at stake
 * when the answer was given. So they stop at `indicated`, permanently, no
 * matter how many you run.
 *
 * A method not listed here counts as an assumption. The tool cannot check what
 * a name means, so an unreadable name buys nothing — inventing one to dodge a
 * ceiling now costs the claim instead of freeing it. Stronger evidence beside
 * it still lifts the claim.
 *
 * Within this list the tool is a mirror, not an adversary: if you rename
 * `engagement` to `payment` it will believe you, and you will know you did it.
 */
export const METHOD_CEILINGS: Readonly<Record<string, Exclude<Confidence, 'refuted'>>> = {
  // Signals that cannot buy any confidence at all. Nothing was at stake.
  engagement: 'assumed',
  likes: 'assumed',
  views: 'assumed',
  saves: 'assumed',
  followers: 'assumed',
  dm: 'assumed',
  chat: 'assumed',
  'verbal-interest': 'assumed',

  // People who already know you. They are answering about the relationship,
  // not the offer, and the signal cannot be separated out afterwards.
  colleague: 'assumed',
  friend: 'assumed',

  // Reading about a market is not sampling it. Nobody in a scraped post or a
  // published report was asked your question, and nobody had anything at
  // stake when they wrote it. Volume changes none of that.
  scraping: 'assumed',
  'desk-research': 'assumed',

  // Real signal, but no money moved, so it stops short of settled.
  interview: 'indicated',
  survey: 'indicated',
  'quote-request': 'indicated',
  proposal: 'indicated',
  'letter-of-intent': 'indicated',
  waitlist: 'indicated',
  'landing-page': 'indicated',
  demo: 'indicated',

  // Sustained first-hand access: you worked inside it and watched it happen,
  // without asking anyone. Stronger than an interview, because nobody was
  // performing for you and nobody was being polite. Still one witness with no
  // artefact a stranger could open, and still nothing at stake, so it stops
  // where interviews stop. Watching from outside without that access is not
  // this — leave it unlisted, where it counts as an assumption.
  'field-observation': 'indicated',

  // You are a reliable narrator of your own history, and an unreliable one
  // about what that history is worth. So it establishes the trait, never its
  // value — and only on the stage that is about you. See SELF_REPORT_STAGE.
  'self-report': 'indicated',

  // Money, or an unprompted approach. These can settle a claim.
  deposit: 'validated',
  payment: 'validated',
  sale: 'validated',
  'repeat-payment': 'validated',
  invoice: 'validated',
  'signed-contract': 'validated',
  'inbound-unprompted': 'validated',
  'competitor-failed-to-copy': 'validated',
  'won-for-this-reason': 'validated',
  'lost-for-this-reason': 'validated',
};

/**
 * Whether a channel's reach belongs to you.
 *
 * Borrowed reach decays without warning and without your involvement, because
 * the thing generating it answers to someone else. Owned reach can still fail,
 * but it fails for reasons you can see.
 */
export const REACH_KINDS = ['owned', 'borrowed'] as const;

export type ReachKind = (typeof REACH_KINDS)[number];

export function isReachKind(value: string): value is ReachKind {
  return (REACH_KINDS as readonly string[]).includes(value);
}

/** The bar a stage sets before downstream stages may rely on it. */
export interface StageGate {
  readonly stage: Stage;
  /** Minimum observations for a claim in this stage to reach `validated`. */
  readonly minObservations: number;
  /**
   * Confidence every critical claim in this stage must reach before the next
   * stage may treat it as settled.
   */
  readonly requires: Exclude<Confidence, 'refuted'>;
  /**
   * How long a `validated` claim in this stage stays validated before its
   * evidence must be refreshed, in days. Absent means it never expires.
   *
   * Stages about the world outside the company need this and stages about the
   * company do not. A channel that converted at four percent six months ago is
   * not a fact about today; the platform changed its algorithm, or the pool of
   * people willing to refer you ran dry. Nothing announces either.
   */
  readonly evidenceHalfLifeDays?: number;
}

export interface Thesis {
  readonly claims: readonly Claim[];
  readonly gates: readonly StageGate[];
}

/**
 * The one stage where the founder is a legitimate primary source, because the
 * claims there are about the founder. Everywhere else a self-report is a
 * statement about other people made by someone who has not asked them, so it
 * buys nothing.
 */
export const SELF_REPORT_STAGE: Stage = 'advantage';

/**
 * The ceiling a method imposes on the stage it was recorded on.
 */
export function ceilingForMethod(
  method: string,
  stage: Stage,
): Exclude<Confidence, 'refuted'> | undefined {
  if (method === 'self-report' && stage !== SELF_REPORT_STAGE) return 'assumed';

  return METHOD_CEILINGS[method];
}
