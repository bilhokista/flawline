import {
  STAGES,
  strengthOf,
  type Claim,
  type Confidence,
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
  'overreach',
  'rests-on-refuted',
  'gate-not-met',
  'duplicate-claim-id',
] as const;

export type FindingCode = (typeof FINDING_CODES)[number];

export interface Finding {
  readonly code: FindingCode;
  readonly severity: Severity;
  readonly claimId: string;
  readonly source: string;
  readonly message: string;
}

const DEFAULT_GATE: Omit<StageGate, 'stage'> = {
  minObservations: 5,
  requires: 'indicated',
};

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
 * Walks the dependency graph and reports every claim that leans on more
 * support than it has.
 *
 * The rules are deliberately mechanical. None of them judge whether a claim is
 * a good idea; they only check that its stated confidence is bought and paid
 * for by evidence and by the claims underneath it.
 */
export function check(thesis: Thesis): Finding[] {
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
    findings.push(...checkEvidence(claim, gateFor(claim.stage, thesis.gates)));
    findings.push(...checkDependencies(claim, byId));
  }

  findings.push(...checkCycles(byId));
  findings.push(...checkGates(byId, thesis.gates));

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
    const observed = totalObservations(claim);
    if (observed < gate.minObservations) {
      return [
        {
          code: 'insufficient-observations',
          severity: 'error',
          claimId: claim.id,
          source: claim.source,
          message: `Marked "validated" on ${observed} observation(s); the ${claim.stage} gate requires ${gate.minObservations}. Downgrade to "indicated" or gather more.`,
        },
      ];
    }
  }

  return [];
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
  const substantiated = claims
    .filter((claim) => claim.confidence !== 'assumed')
    .map((claim) => stageIndex(claim.stage));
  const furthest = substantiated.length > 0 ? Math.max(...substantiated) : -1;

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

export function hasBlockingFindings(findings: readonly Finding[]): boolean {
  return findings.some((finding) => finding.severity === 'error');
}

/** Confidence values that can be compared, for callers narrowing user input. */
export type RankableConfidence = Exclude<Confidence, 'refuted'>;
