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
}

export interface Thesis {
  readonly claims: readonly Claim[];
  readonly gates: readonly StageGate[];
}
