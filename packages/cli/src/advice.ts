import { STAGES, strengthOf, type Claim, type Stage, type Thesis } from './model.js';

/**
 * What the next stage of work actually is, in one imperative. These are the
 * only recommendations this tool makes, and each one is the work of a single
 * stage rather than a plan.
 */
const NEXT_WORK: Readonly<Record<Stage, string>> = {
  problem:
    'Talk to five people who live this problem, about the last time it happened rather than about whether they would buy something.',
  advantage:
    'Work out what is authentically yours here — a constraint, a trait that has cost you, a history that does not fit — and what it would cost a competitor to fake it.',
  customer:
    'Name one place this segment already gathers, somewhere you can read their words and ask something back, then go and listen.',
  offer: 'Decide what you sell, aimed at the one obstacle that ranked first.',
  model: 'Work out the price, what it costs to serve and to acquire, and whether a channel exists.',
  evidence:
    'Name the riskiest assumption, design a test cheaper than building, and set the pass mark before you run it.',
  narrative: 'Write the positioning, and say who it is contested against.',
  motion: 'Reach one stranger by hand, then repeat it ten times before spending anything.',
};

/** Why a stage is being withheld, phrased so the reason travels with the refusal. */
const WITHHELD_BECAUSE: Readonly<Record<Stage, string>> = {
  problem: 'the problem is not established',
  advantage: 'nothing is established about what is yours',
  customer: 'nothing is established about who these people are',
  offer: 'there is no offer to build on',
  model: 'price and channel are not established',
  evidence: 'no test has been designed',
  narrative: 'there is no positioning to carry',
  motion: 'no channel has been proven',
};

export interface WithheldStage {
  readonly stage: Stage;
  readonly because: string;
}

export interface Advice {
  /** The stage the work actually sits in, or null when nothing is left unsettled. */
  readonly stage: Stage | null;
  /** The one thing the evidence licenses doing next. */
  readonly next: string | null;
  /** Stages that may not be discussed yet, and why. */
  readonly withheld: readonly WithheldStage[];
}

function isSettled(claim: Claim): boolean {
  return claim.confidence !== 'refuted' && strengthOf(claim.confidence) >= strengthOf('indicated');
}

function criticalIn(thesis: Thesis, stage: Stage): Claim[] {
  return thesis.claims.filter((claim) => claim.stage === stage && claim.critical);
}

/**
 * The first stage whose critical claims are not all settled.
 *
 * The stages are already in dependency order, so the earliest unsettled one is
 * what everything after it is waiting on. A stage with no critical claims
 * recorded counts as unsettled: an empty document is not a finished one.
 */
function firstUnsettledStage(thesis: Thesis): Stage | null {
  for (const stage of STAGES) {
    const critical = criticalIn(thesis, stage);
    if (critical.length === 0 || !critical.every(isSettled)) return stage;
  }

  return null;
}

/**
 * What the evidence licenses. One recommendation, and an explicit list of the
 * things this tool refuses to advise on yet.
 *
 * The refusal is the point. A summary that recommends a funnel on top of eight
 * assumptions is the confident slide this project exists to prevent, and a
 * recommendation is held to the same rule as a claim: it may not outrun what
 * supports it.
 */
export function adviseOn(thesis: Thesis): Advice {
  const stage = firstUnsettledStage(thesis);

  if (stage === null) return { stage: null, next: null, withheld: [] };

  const from = STAGES.indexOf(stage);
  const withheld = STAGES.slice(from + 1).map((later) => ({
    stage: later,
    because: WITHHELD_BECAUSE[stage],
  }));

  return { stage, next: NEXT_WORK[stage], withheld };
}

function dependentCount(thesis: Thesis, id: string): number {
  return thesis.claims.filter((claim) => claim.dependsOn.includes(id)).length;
}

/**
 * The critical claim resting on nothing that the most is riding on: earliest
 * stage first, then whichever carries the most weight within it.
 */
export function riskiestAssumption(thesis: Thesis): Claim | null {
  for (const stage of STAGES) {
    const assumed = criticalIn(thesis, stage).filter((claim) => claim.confidence === 'assumed');
    if (assumed.length === 0) continue;

    return assumed.reduce((worst, candidate) =>
      dependentCount(thesis, candidate.id) > dependentCount(thesis, worst.id) ? candidate : worst,
    );
  }

  return null;
}
