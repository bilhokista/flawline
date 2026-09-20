/**
 * What falls over if one claim turns out to be wrong.
 *
 * The dependency graph already knows the answer and nothing ever asked it. A
 * founder can read `depends_on` lines all afternoon and still not see that the
 * campaign numbers on the motion page are sitting on a problem statement nobody
 * checked — the graph is in the documents, but the reader has to hold it in
 * their head to feel it.
 *
 * This is the cheapest thing in the tool: no clock, no network, no model. It
 * builds a copy of the thesis with one confidence changed, runs the ordinary
 * checker over it, and reports what the checker newly complains about. Every
 * rule it applies is a rule that already exists, which is the point — a
 * counterfactual that invented its own rules would answer a different question
 * than `flawline check` does.
 *
 * It never writes. `what-if` is a question, and the answer to it is a
 * conversation, not an edit.
 */
import { check, type Finding } from './check.js';
import {
  isConfidence,
  STAGES,
  type Claim,
  type Confidence,
  type Stage,
  type Thesis,
} from './model.js';

export interface Assignment {
  readonly claimId: string;
  readonly confidence: Confidence;
  readonly error: string | null;
}

/**
 * Reads `claim-id=confidence`.
 *
 * The confidence is optional and defaults to `refuted`, because that is the
 * question people actually arrive with. "What if I am wrong about this" is the
 * useful form; "what if this drops to indicated" is real but rarer, so it costs
 * the extra keystrokes.
 */
export function parseAssignment(argument: string): Assignment {
  const [rawId, rawConfidence] = splitOnce(argument, '=');
  const claimId = rawId.trim();

  if (claimId === '') {
    return {
      claimId: '',
      confidence: 'refuted',
      error: 'Name the claim to knock out, e.g. `flawline what-if problem-exists=refuted`.',
    };
  }

  if (rawConfidence === null) return { claimId, confidence: 'refuted', error: null };

  const confidence = rawConfidence.trim();

  if (!isConfidence(confidence)) {
    return {
      claimId,
      confidence: 'refuted',
      error: `"${confidence}" is not a confidence. Use assumed, indicated, validated or refuted.`,
    };
  }

  return { claimId, confidence, error: null };
}

function splitOnce(value: string, separator: string): [string, string | null] {
  const index = value.indexOf(separator);
  if (index === -1) return [value, null];
  return [value.slice(0, index), value.slice(index + separator.length)];
}

export interface WhatIfResult {
  /** The claim knocked out, or null when the thesis has no such claim. */
  readonly target: Claim | null;
  readonly confidence: Confidence;
  /** Everything that rests on the target, directly or through other claims. */
  readonly dependents: readonly Claim[];
  /** Stages holding the target or any dependent, in pipeline order. */
  readonly stagesAffected: readonly Stage[];
  /** How many of the affected claims were `validated` before the knock-out. */
  readonly validatedCount: number;
  /** How many were marked `critical`. */
  readonly criticalCount: number;
  /** Findings the change introduces, with the ones already there removed. */
  readonly introduced: readonly Finding[];
}

export function whatIf(
  thesis: Thesis,
  claimId: string,
  confidence: Confidence,
): WhatIfResult {
  const target = thesis.claims.find((claim) => claim.id === claimId) ?? null;

  if (target === null) {
    return {
      target: null,
      confidence,
      dependents: [],
      stagesAffected: [],
      validatedCount: 0,
      criticalCount: 0,
      introduced: [],
    };
  }

  const dependents = dependentsOf(thesis, claimId);
  const affected = [target, ...dependents];

  const counterfactual: Thesis = {
    ...thesis,
    claims: thesis.claims.map((claim) =>
      claim.id === claimId ? { ...claim, confidence } : claim,
    ),
  };

  return {
    target,
    confidence,
    dependents,
    stagesAffected: STAGES.filter((stage) => affected.some((claim) => claim.stage === stage)),
    validatedCount: dependents.filter((claim) => claim.confidence === 'validated').length,
    criticalCount: affected.filter((claim) => claim.critical).length,
    introduced: introducedBy(thesis, counterfactual),
  };
}

/**
 * Everything downstream of a claim, breadth-first.
 *
 * Breadth-first so the output reads outward from the knock-out: the claims that
 * touch it directly, then the ones that only learn about it second-hand. A
 * `seen` set rather than a recursion guard, because `check` reports dependency
 * cycles rather than rejecting them, so a cyclic thesis still reaches here.
 */
function dependentsOf(thesis: Thesis, claimId: string): Claim[] {
  const found: Claim[] = [];
  const seen = new Set<string>([claimId]);
  let frontier = [claimId];

  while (frontier.length > 0) {
    const next: string[] = [];

    for (const claim of thesis.claims) {
      if (seen.has(claim.id)) continue;
      if (!claim.dependsOn.some((id) => frontier.includes(id))) continue;

      seen.add(claim.id);
      found.push(claim);
      next.push(claim.id);
    }

    frontier = next;
  }

  return found;
}

/**
 * The findings the change is responsible for.
 *
 * A thesis with existing problems would otherwise report all of them as
 * consequences of the knock-out, which would overstate the damage and teach the
 * reader to discount the number.
 */
function introducedBy(before: Thesis, after: Thesis): Finding[] {
  const existing = new Set(check(before).map(fingerprint));

  return check(after).filter((finding) => !existing.has(fingerprint(finding)));
}

function fingerprint(finding: Finding): string {
  return `${finding.code}\u0000${finding.claimId}\u0000${finding.source}`;
}
