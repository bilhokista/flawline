import {
  ceilingForMethod,
  OCCURRENCE_ONLY_CLAIM_IDS,
  SELF_REPORT_STAGE,
  STAGES,
  strengthOf,
  type Claim,
  type Confidence,
  type Evidence,
  type Stage,
  type StageGate,
  type Thesis,
} from './model.js';

export type Severity = 'error' | 'warning';

export const FINDING_CODES = [
  'unknown-dependency',
  'dependency-cycle',
  'unsupported-confidence',
  'insufficient-observations',
  'method-ceiling',
  'unknown-method',
  'stale-evidence',
  'undated-evidence',
  'overreach',
  'rests-on-refuted',
  'gate-not-met',
  'duplicate-claim-id',
  'incident-beyond-occurrence',
  'stage-opened-early',
] as const;

export type FindingCode = (typeof FINDING_CODES)[number];

export interface Finding {
  readonly code: FindingCode;
  readonly severity: Severity;
  readonly claimId: string;
  readonly source: string;
  readonly message: string;
}

export interface CheckOptions {
  /**
   * The moment to measure evidence age against. Injected rather than read from
   * the clock so that staleness is testable and a run is reproducible.
   */
  readonly now?: Date;
}

const DEFAULT_GATE: Omit<StageGate, 'stage'> = {
  minObservations: 5,
  requires: 'indicated',
};

const MS_PER_DAY = 86_400_000;

function gateFor(stage: Stage, gates: readonly StageGate[]): StageGate {
  const found = gates.find((gate) => gate.stage === stage);
  return found ?? { stage, ...DEFAULT_GATE };
}

function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

function totalObservations(claim: Claim): number {
  return claim.evidence.reduce((sum, item) => sum + (item.n ?? 1), 0);
}

/**
 * Observations recorded on a method that can actually carry the confidence
 * being claimed.
 *
 * The count gate and the method ceiling are separate rules, and counting every
 * observation regardless of method let one of them defeat the other: four
 * conversations with friends plus a single payment cleared a five-observation
 * bar that only the payment could speak to. A weak method does not become
 * strong in a crowd.
 */
function qualifyingObservations(claim: Claim, target: Exclude<Confidence, 'refuted'>): number {
  return claim.evidence
    .filter((item) => {
      const ceiling = ceilingForMethod(item.method, claim.stage) ?? 'assumed';
      return strengthOf(ceiling) >= strengthOf(target);
    })
    .reduce((sum, item) => sum + (item.n ?? 1), 0);
}

/**
 * How far the thesis has actually come: the last stage holding a claim that
 * has left `assumed`.
 *
 * A stage counts as reached only once something in it has been substantiated,
 * because an assumption written down is a plan rather than a finding.
 *
 * That is about the frontier, not about permission to write. Since 0.3.0 `init`
 * hands over one stage at a time, and `stage-opened-early` enforces the same
 * ordering against anything that writes the files directly.
 *
 * Returns -1 when nothing has been substantiated anywhere.
 */
export function furthestStageIndex(claims: readonly Claim[]): number {
  const substantiated = claims
    .filter((claim) => claim.confidence !== 'assumed')
    .map((claim) => stageIndex(claim.stage));

  return substantiated.length > 0 ? Math.max(...substantiated) : -1;
}

/**
 * The stage the thesis has actually reached, or null when nothing is settled.
 */
export function furthestStage(claims: readonly Claim[]): Stage | null {
  const index = furthestStageIndex(claims);

  return index === -1 ? null : (STAGES[index] as Stage);
}

/**
 * Walks the dependency graph and reports every claim that leans on more
 * support than it has.
 *
 * The rules are deliberately mechanical. None of them judge whether a claim is
 * a good idea; they only check that its stated confidence is bought and paid
 * for by evidence and by the claims underneath it.
 */
export function check(thesis: Thesis, options: CheckOptions = {}): Finding[] {
  const now = options.now ?? new Date();
  const findings: Finding[] = [];
  const byId = new Map<string, Claim>();

  for (const claim of thesis.claims) {
    const existing = byId.get(claim.id);
    if (existing) {
      findings.push({
        code: 'duplicate-claim-id',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Claim id "${claim.id}" is already declared in ${existing.source}. Ids must be unique across the thesis.`,
      });
      continue;
    }
    byId.set(claim.id, claim);
  }

  for (const claim of byId.values()) {
    const gate = gateFor(claim.stage, thesis.gates);
    findings.push(...checkEvidence(claim, gate));
    findings.push(...checkIncidentReach(claim));
    findings.push(...checkMethodCeiling(claim));
    findings.push(...checkFreshness(claim, gate, now));
    findings.push(...checkDependencies(claim, byId));
  }

  findings.push(...checkCycles(byId));
  findings.push(...checkGates(byId, thesis.gates));
  findings.push(...checkStagesOpenedEarly(thesis.claims, byId, thesis.gates));

  return findings;
}

function checkEvidence(claim: Claim, gate: StageGate): Finding[] {
  if (claim.confidence === 'assumed' || claim.confidence === 'refuted') return [];

  if (claim.evidence.length === 0) {
    return [
      {
        code: 'unsupported-confidence',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Marked "${claim.confidence}" with no evidence recorded. Either cite a source or set confidence back to "assumed".`,
      },
    ];
  }

  if (claim.confidence === 'validated') {
    // The ceiling check owns this claim while the evidence is the wrong kind.
    // Reporting a shortfall as well would bury the finding that matters.
    if (strengthOf(claim.confidence) > strengthOf(ceilingOf(claim.evidence, claim.stage))) {
      return [];
    }

    const observed = qualifyingObservations(claim, 'validated');
    if (observed < gate.minObservations) {
      const setAside = totalObservations(claim) - observed;
      const note =
        setAside > 0
          ? ` ${setAside} further observation(s) sit on methods that cap below "validated" and cannot count toward it.`
          : '';

      return [
        {
          code: 'insufficient-observations',
          severity: 'error',
          claimId: claim.id,
          source: claim.source,
          message: `Marked "validated" on ${observed} qualifying observation(s); the ${claim.stage} gate requires ${gate.minObservations}.${note} Downgrade to "indicated" or gather more.`,
        },
      ];
    }
  }

  return [];
}

/**
 * The best evidence on a claim sets its ceiling, so one payment lifts a claim
 * that also cites a dozen interviews.
 *
 * A method this tool does not recognise counts as an assumption. It cannot
 * check what a name means, and a name it cannot read is not a reason to
 * believe anything. Stronger evidence beside it still lifts the claim.
 */
function ceilingOf(
  evidence: readonly Evidence[],
  stage: Stage,
): Exclude<Confidence, 'refuted'> {
  let best: Exclude<Confidence, 'refuted'> = 'assumed';

  for (const entry of evidence) {
    const ceiling = ceilingForMethod(entry.method, stage) ?? 'assumed';
    if (strengthOf(ceiling) > strengthOf(best)) best = ceiling;
  }

  return best;
}

function unknownMethodsIn(evidence: readonly Evidence[], stage: Stage): string[] {
  const names = evidence
    .filter((entry) => ceilingForMethod(entry.method, stage) === undefined)
    .map((entry) => entry.method);

  return [...new Set(names)];
}

/**
 * An incident record proves an event happened. It cannot say what the event
 * cost the person it happened to, or what they already do to avoid it, because
 * neither of those is written in the record — they are answers only that person
 * can give.
 *
 * Without this rule the method would be the easiest evidence in the tool to
 * gather and the easiest to over-read: an evening of reading other people's
 * incident reports would close the two claims that most need a conversation.
 */
function checkIncidentReach(claim: Claim): Finding[] {
  if (claim.confidence === 'assumed' || claim.confidence === 'refuted') return [];
  if (!OCCURRENCE_ONLY_CLAIM_IDS.has(claim.id)) return [];
  if (!claim.evidence.some((entry) => entry.method === 'incident-record')) return [];

  return [
    {
      code: 'incident-beyond-occurrence',
      severity: 'error',
      claimId: claim.id,
      source: claim.source,
      message: `Marked "${claim.confidence}" on an incident record. A record establishes that the thing happened; it does not establish what it cost the person it happened to, or what they already do about it. Ask someone who lived it, or leave this "assumed".`,
    },
  ];
}

/**
 * Some kinds of signal cannot buy the confidence a claim is asserting, and no
 * quantity of them changes that. Gathering more of the wrong kind of evidence
 * is the most comfortable way to avoid finding out.
 */
function checkMethodCeiling(claim: Claim): Finding[] {
  if (claim.confidence === 'assumed' || claim.confidence === 'refuted') return [];
  if (claim.evidence.length === 0) return [];

  const ceiling = ceilingOf(claim.evidence, claim.stage);
  if (strengthOf(claim.confidence) <= strengthOf(ceiling)) return [];

  const unknown = unknownMethodsIn(claim.evidence, claim.stage);
  if (unknown.length > 0) {
    return [
      {
        code: 'unknown-method',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Marked "${claim.confidence}" on evidence this tool does not recognise: ${unknown.join(', ')}. An unrecognised method counts as an assumption, because nothing here says what was at stake. Rename it to a known method, or leave the claim "assumed".`,
      },
    ];
  }

  const selfReportOffStage =
    claim.stage !== SELF_REPORT_STAGE &&
    claim.evidence.some((entry) => entry.method === 'self-report');

  if (selfReportOffStage) {
    return [
      {
        code: 'method-ceiling',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Marked "${claim.confidence}" on self-report evidence, on a stage whose claims are about other people. Your own history is a source about you, and the ${SELF_REPORT_STAGE} stage is where it counts. Here it stops at "assumed", because you have not asked the people this claim describes.`,
      },
    ];
  }

  const methods = [...new Set(claim.evidence.map((entry) => entry.method))].join(', ');

  return [
    {
      code: 'method-ceiling',
      severity: 'error',
      claimId: claim.id,
      source: claim.source,
      message: `Marked "${claim.confidence}" on ${methods} evidence, which cannot carry more than "${ceiling}" however much of it you gather. Nothing was at stake when it was given. Downgrade, or get evidence where something was.`,
    },
  ];
}

/**
 * A settled claim about the outside world has a shelf life. Borrowed channels
 * stop working without telling you, and referral pools run dry, so evidence
 * from six months ago describes a world that may no longer exist.
 */
function checkFreshness(claim: Claim, gate: StageGate, now: Date): Finding[] {
  if (claim.confidence !== 'validated') return [];
  if (gate.evidenceHalfLifeDays === undefined) return [];
  if (claim.evidence.length === 0) return [];

  const dates = claim.evidence
    .map((entry) => entry.collectedAt)
    .filter((date): date is string => date !== undefined)
    .map((date) => Date.parse(date))
    .filter((time) => !Number.isNaN(time));

  if (dates.length === 0) {
    return [
      {
        code: 'undated-evidence',
        severity: 'warning',
        claimId: claim.id,
        source: claim.source,
        message: `Marked "validated" in a stage whose evidence expires after ${gate.evidenceHalfLifeDays} days, but no evidence entry carries a "collected_at" date. Freshness cannot be checked, so this claim is trusted on nothing but its own say-so.`,
      },
    ];
  }

  const ageInDays = Math.floor((now.getTime() - Math.max(...dates)) / MS_PER_DAY);
  if (ageInDays <= gate.evidenceHalfLifeDays) return [];

  return [
    {
      code: 'stale-evidence',
      severity: 'error',
      claimId: claim.id,
      source: claim.source,
      message: `Marked "validated" on evidence that is ${ageInDays} days old, past the ${gate.evidenceHalfLifeDays}-day shelf life for ${claim.stage}. Re-measure it or downgrade it. A channel that worked six months ago is not a fact about today.`,
    },
  ];
}

function checkDependencies(claim: Claim, byId: ReadonlyMap<string, Claim>): Finding[] {
  const findings: Finding[] = [];

  for (const dependencyId of claim.dependsOn) {
    const dependency = byId.get(dependencyId);

    if (!dependency) {
      findings.push({
        code: 'unknown-dependency',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Depends on "${dependencyId}", which is not declared anywhere in the thesis.`,
      });
      continue;
    }

    if (dependency.confidence === 'refuted') {
      findings.push({
        code: 'rests-on-refuted',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Rests on "${dependencyId}", which is refuted. Retire or rewrite this claim before building on it.`,
      });
      continue;
    }

    if (claim.confidence === 'refuted' || claim.confidence === 'assumed') continue;

    if (strengthOf(claim.confidence) > strengthOf(dependency.confidence)) {
      findings.push({
        code: 'overreach',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Claims "${claim.confidence}" while resting on "${dependencyId}", which is only "${dependency.confidence}". A claim cannot be stronger than what holds it up.`,
      });
    }
  }

  return findings;
}

/** Depth-first cycle detection. Reports each cycle once, at its entry claim. */
function checkCycles(byId: ReadonlyMap<string, Claim>): Finding[] {
  const findings: Finding[] = [];
  const settled = new Set<string>();
  const onPath = new Set<string>();

  const walk = (id: string, path: readonly string[]): void => {
    if (settled.has(id)) return;

    if (onPath.has(id)) {
      const cycleStart = path.indexOf(id);
      const cycle = [...path.slice(cycleStart), id].join(' -> ');
      const claim = byId.get(id);
      findings.push({
        code: 'dependency-cycle',
        severity: 'error',
        claimId: id,
        source: claim?.source ?? '(unknown)',
        message: `Circular dependency: ${cycle}. Claims cannot justify each other.`,
      });
      return;
    }

    onPath.add(id);
    for (const dependencyId of byId.get(id)?.dependsOn ?? []) {
      if (byId.has(dependencyId)) walk(dependencyId, [...path, id]);
    }
    onPath.delete(id);
    settled.add(id);
  };

  for (const id of byId.keys()) walk(id, []);

  return findings;
}

/**
 * A stage gate is only interesting once work has moved past it. Weak critical
 * claims in the stage you are standing in are normal; weak critical claims
 * behind you mean later work is built on sand.
 *
 * Progress is measured by claims that have left the `assumed` state, not by
 * which documents exist. Writing down what you intend to believe later is
 * planning, and planning ahead costs nothing. Asserting that reality has
 * confirmed something is the act that must be earned, so only that moves the
 * frontier forward.
 */
function checkGates(byId: ReadonlyMap<string, Claim>, gates: readonly StageGate[]): Finding[] {
  const claims = [...byId.values()];
  const furthest = furthestStageIndex(claims);

  const findings: Finding[] = [];

  for (const claim of claims) {
    if (!claim.critical) continue;
    if (stageIndex(claim.stage) >= furthest) continue;

    const gate = gateFor(claim.stage, gates);
    const met =
      claim.confidence !== 'refuted' &&
      strengthOf(claim.confidence) >= strengthOf(gate.requires);

    if (!met) {
      findings.push({
        code: 'gate-not-met',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Critical ${claim.stage} claim is "${claim.confidence}" but the gate requires "${gate.requires}", and work has already moved on to ${STAGES[furthest]}. Close this before going further.`,
      });
    }
  }

  return findings;
}

/**
 * Whether a stage has bought the right to open the one after it: it declares at
 * least one critical claim, and every one of them meets its gate.
 *
 * A stage with no critical claim is not settled, it is unexamined. Treating it
 * as passed would make "declare nothing important" the cheapest way through the
 * whole pipeline.
 */
function stageHolds(
  stage: Stage,
  claims: readonly Claim[],
  gates: readonly StageGate[],
): { holds: boolean; reason: string } {
  const critical = claims.filter((claim) => claim.stage === stage && claim.critical);

  if (critical.length === 0) {
    return { holds: false, reason: `${stage} declares no critical claim` };
  }

  const gate = gateFor(stage, gates);
  const unmet = critical.filter(
    (claim) =>
      claim.confidence === 'refuted' ||
      strengthOf(claim.confidence) < strengthOf(gate.requires),
  );

  return unmet.length === 0
    ? { holds: true, reason: '' }
    : {
        holds: false,
        reason: `${unmet.length} critical ${stage} claim(s) below "${gate.requires}"`,
      };
}

/**
 * A stage document that exists before the stage before it holds.
 *
 * `init` withholds the later documents for exactly this reason, but withholding
 * is a behaviour of one command and anything that writes files directly walks
 * straight past it — which is what an agent asked to "fill in the strategy"
 * does first. Before this check, eight documents of pure assumption passed
 * clean and exited 0, which is the slop this tool exists to refuse.
 *
 * Reported once per stage, at its first claim, naming the stage that is
 * holding the line rather than the whole chain behind it.
 */
function checkStagesOpenedEarly(
  claims: readonly Claim[],
  byId: ReadonlyMap<string, Claim>,
  gates: readonly StageGate[],
): Finding[] {
  const unique = [...byId.values()];
  const findings: Finding[] = [];

  // Ordering is only meaningful once there is a thesis to order. A set of
  // claims with no problem stage at all is a fragment — a partial workspace, or
  // a single stage being worked on deliberately — and inventing a violation
  // there would punish the person who has not yet written the document this
  // rule protects.
  const started = unique.some((claim) => claim.stage === STAGES[0]);
  if (!started) return findings;

  // Nor is a thesis that names nothing critical. Gates are built out of
  // critical claims, so with none declared there is no line for a stage to
  // cross, and reporting one would be inventing a rule the author never set.
  if (!unique.some((claim) => claim.critical)) return findings;

  for (const [index, stage] of STAGES.entries()) {
    if (index === 0) continue;

    // Report at the claim as written, so the annotation lands on the document
    // rather than on whichever copy survived de-duplication.
    const anchor = claims.find((claim) => claim.stage === stage);
    if (!anchor) continue;

    // Name the earliest stage that does not hold, not merely the one directly
    // behind. When stages are skipped, the stage before is empty and blaming it
    // sends the reader to a document that was never the problem.
    const blocker = STAGES.slice(0, index)
      .map((earlier) => ({ earlier, ...stageHolds(earlier, unique, gates) }))
      .find((result) => !result.holds);

    if (!blocker) continue;

    findings.push({
      code: 'stage-opened-early',
      severity: 'error',
      claimId: anchor.id,
      source: anchor.source,
      message: `The ${stage} stage is written while ${blocker.reason}. Each stage opens when the one before it holds; a document written ahead of its evidence reads as confident and establishes nothing. Close ${blocker.earlier} first, or delete this document until you can.`,
    });
  }

  return findings;
}

export function hasBlockingFindings(findings: readonly Finding[]): boolean {
  return findings.some((finding) => finding.severity === 'error');
}

/** Confidence values that can be compared, for callers narrowing user input. */
export type RankableConfidence = Exclude<Confidence, 'refuted'>;
