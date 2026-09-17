import { describe, expect, test } from 'vitest';
import { check, hasBlockingFindings, type Finding } from '../src/check.js';
import type { Claim, Confidence, Evidence, Stage, Thesis } from '../src/model.js';

interface ClaimOverrides {
  readonly id?: string;
  readonly statement?: string;
  readonly confidence?: Confidence;
  readonly evidence?: readonly Evidence[];
  readonly dependsOn?: readonly string[];
  readonly critical?: boolean;
  readonly stage?: Stage;
  readonly source?: string;
}

function claim(overrides: ClaimOverrides = {}): Claim {
  return {
    id: overrides.id ?? 'a-claim',
    statement: overrides.statement ?? 'Something is believed to be true',
    confidence: overrides.confidence ?? 'assumed',
    evidence: overrides.evidence ?? [],
    dependsOn: overrides.dependsOn ?? [],
    critical: overrides.critical ?? false,
    stage: overrides.stage ?? 'problem',
    source: overrides.source ?? 'strategy/problem.md',
  };
}

function interviews(n: number): Evidence[] {
  return [{ method: 'interview', source: 'research/interviews.md', n }];
}

function thesis(claims: readonly Claim[], gates: Thesis['gates'] = []): Thesis {
  return { claims, gates };
}

function codes(findings: readonly Finding[]): string[] {
  return findings.map((finding) => finding.code).sort();
}

describe('evidence requirements', () => {
  test('accepts an assumption that admits it is an assumption', () => {
    const findings = check(thesis([claim({ confidence: 'assumed' })]));

    expect(findings).toEqual([]);
  });

  test('rejects a claim marked indicated with nothing behind it', () => {
    const findings = check(thesis([claim({ confidence: 'indicated' })]));

    expect(codes(findings)).toEqual(['unsupported-confidence']);
  });

  test('rejects a claim marked validated with nothing behind it', () => {
    const findings = check(thesis([claim({ confidence: 'validated' })]));

    expect(codes(findings)).toEqual(['unsupported-confidence']);
  });

  test('accepts indicated on a single observation', () => {
    const findings = check(thesis([claim({ confidence: 'indicated', evidence: interviews(1) })]));

    expect(findings).toEqual([]);
  });

  test('rejects validated below the default observation bar', () => {
    const findings = check(thesis([claim({ confidence: 'validated', evidence: interviews(4) })]));

    expect(codes(findings)).toEqual(['insufficient-observations']);
    expect(findings[0]?.message).toContain('requires 5');
  });

  test('accepts validated at the default observation bar', () => {
    const findings = check(thesis([claim({ confidence: 'validated', evidence: interviews(5) })]));

    expect(findings).toEqual([]);
  });

  test('sums observations across evidence entries', () => {
    const findings = check(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [
            { method: 'interview', source: 'a.md', n: 3 },
            { method: 'interview', source: 'b.md', n: 2 },
          ],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('counts an evidence entry without a count as one observation', () => {
    const findings = check(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [{ method: 'sale', source: 'stripe.md' }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['insufficient-observations']);
    expect(findings[0]?.message).toContain('1 observation');
  });

  test('honours a stricter per-stage observation bar', () => {
    const findings = check(
      thesis(
        [claim({ stage: 'customer', confidence: 'validated', evidence: interviews(6) })],
        [{ stage: 'customer', minObservations: 12, requires: 'indicated' }],
      ),
    );

    expect(codes(findings)).toEqual(['insufficient-observations']);
  });

  test('a refuted claim needs no evidence to stand as refuted', () => {
    const findings = check(thesis([claim({ confidence: 'refuted' })]));

    expect(findings).toEqual([]);
  });
});

describe('dependency strength', () => {
  test('flags a claim stronger than the claim holding it up', () => {
    const findings = check(
      thesis([
        claim({ id: 'problem-real', confidence: 'assumed' }),
        claim({
          id: 'they-will-pay',
          stage: 'offer',
          confidence: 'validated',
          evidence: interviews(9),
          dependsOn: ['problem-real'],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['overreach']);
    expect(findings[0]?.claimId).toBe('they-will-pay');
  });

  test('allows a claim no stronger than its weakest support', () => {
    const findings = check(
      thesis([
        claim({ id: 'problem-real', confidence: 'validated', evidence: interviews(7) }),
        claim({
          id: 'they-will-pay',
          stage: 'offer',
          confidence: 'indicated',
          evidence: interviews(2),
          dependsOn: ['problem-real'],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('takes the weakest of several dependencies', () => {
    const findings = check(
      thesis([
        claim({ id: 'strong', confidence: 'validated', evidence: interviews(8) }),
        claim({ id: 'weak', confidence: 'indicated', evidence: interviews(1) }),
        claim({
          id: 'conclusion',
          stage: 'offer',
          confidence: 'validated',
          evidence: interviews(9),
          dependsOn: ['strong', 'weak'],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['overreach']);
    expect(findings[0]?.message).toContain('"weak"');
  });

  test('an assumption may rest on anything, because it promises nothing', () => {
    const findings = check(
      thesis([
        claim({ id: 'shaky', confidence: 'assumed' }),
        claim({ id: 'guess', stage: 'offer', confidence: 'assumed', dependsOn: ['shaky'] }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('flags a dependency that does not exist', () => {
    const findings = check(thesis([claim({ dependsOn: ['nowhere'] })]));

    expect(codes(findings)).toEqual(['unknown-dependency']);
    expect(findings[0]?.message).toContain('nowhere');
  });

  test('blocks anything resting on a refuted claim', () => {
    const findings = check(
      thesis([
        claim({ id: 'dead', confidence: 'refuted' }),
        claim({ id: 'downstream', stage: 'offer', confidence: 'assumed', dependsOn: ['dead'] }),
      ]),
    );

    expect(codes(findings)).toEqual(['rests-on-refuted']);
    expect(findings[0]?.claimId).toBe('downstream');
  });

  test('reports resting-on-refuted once, not also as overreach', () => {
    const findings = check(
      thesis([
        claim({ id: 'dead', confidence: 'refuted' }),
        claim({
          id: 'downstream',
          stage: 'offer',
          confidence: 'validated',
          evidence: interviews(9),
          dependsOn: ['dead'],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['rests-on-refuted']);
  });
});

describe('graph integrity', () => {
  test('detects a two-claim cycle', () => {
    const findings = check(
      thesis([
        claim({ id: 'chicken', dependsOn: ['egg'] }),
        claim({ id: 'egg', dependsOn: ['chicken'] }),
      ]),
    );

    expect(findings.filter((f) => f.code === 'dependency-cycle')).toHaveLength(1);
  });

  test('detects a longer cycle', () => {
    const findings = check(
      thesis([
        claim({ id: 'a', dependsOn: ['b'] }),
        claim({ id: 'b', dependsOn: ['c'] }),
        claim({ id: 'c', dependsOn: ['a'] }),
      ]),
    );

    const cycles = findings.filter((f) => f.code === 'dependency-cycle');
    expect(cycles).toHaveLength(1);
    expect(cycles[0]?.message).toContain('->');
  });

  test('a diamond is not a cycle', () => {
    const findings = check(
      thesis([
        claim({ id: 'root' }),
        claim({ id: 'left', dependsOn: ['root'] }),
        claim({ id: 'right', dependsOn: ['root'] }),
        claim({ id: 'join', dependsOn: ['left', 'right'] }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('flags a duplicate claim id and keeps the first', () => {
    const findings = check(
      thesis([
        claim({ id: 'same', source: 'strategy/problem.md' }),
        claim({ id: 'same', source: 'strategy/offer.md' }),
      ]),
    );

    expect(codes(findings)).toEqual(['duplicate-claim-id']);
    expect(findings[0]?.message).toContain('strategy/problem.md');
  });
});

describe('stage gates', () => {
  test('planning every stage ahead is free while it is all still assumed', () => {
    const findings = check(
      thesis([
        claim({ id: 'p', stage: 'problem', critical: true, confidence: 'assumed' }),
        claim({ id: 'c', stage: 'customer', critical: true, confidence: 'assumed' }),
        claim({ id: 'm', stage: 'motion', critical: true, confidence: 'assumed' }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('a weak critical claim in the furthest stage is not yet a problem', () => {
    const findings = check(
      thesis([claim({ stage: 'problem', critical: true, confidence: 'assumed' })]),
    );

    expect(findings).toEqual([]);
  });

  test('blocks when work moved past a stage whose critical claim is unmet', () => {
    const findings = check(
      thesis([
        claim({ id: 'problem-real', stage: 'problem', critical: true, confidence: 'assumed' }),
        claim({
          id: 'gtm-plan',
          stage: 'motion',
          confidence: 'indicated',
          evidence: interviews(2),
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['gate-not-met']);
    expect(findings[0]?.claimId).toBe('problem-real');
    expect(findings[0]?.message).toContain('motion');
  });

  test('does not block on a non-critical weak claim in an earlier stage', () => {
    const findings = check(
      thesis([
        claim({ id: 'nice-to-know', stage: 'problem', critical: false, confidence: 'assumed' }),
        claim({
          id: 'gtm-plan',
          stage: 'motion',
          confidence: 'indicated',
          evidence: interviews(2),
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('passes once the earlier critical claim meets its gate', () => {
    const findings = check(
      thesis([
        claim({
          id: 'problem-real',
          stage: 'problem',
          critical: true,
          confidence: 'indicated',
          evidence: interviews(3),
        }),
        claim({
          id: 'gtm-plan',
          stage: 'motion',
          confidence: 'indicated',
          evidence: interviews(2),
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('a stricter gate can demand validated, not merely indicated', () => {
    const findings = check(
      thesis(
        [
          claim({
            id: 'problem-real',
            stage: 'problem',
            critical: true,
            confidence: 'indicated',
            evidence: interviews(3),
          }),
          claim({
          id: 'gtm-plan',
          stage: 'motion',
          confidence: 'indicated',
          evidence: interviews(2),
        }),
        ],
        [{ stage: 'problem', minObservations: 5, requires: 'validated' }],
      ),
    );

    expect(codes(findings)).toEqual(['gate-not-met']);
  });

  test('a refuted critical claim behind you blocks the gate', () => {
    const findings = check(
      thesis([
        claim({ id: 'problem-real', stage: 'problem', critical: true, confidence: 'refuted' }),
        claim({
          id: 'gtm-plan',
          stage: 'motion',
          confidence: 'indicated',
          evidence: interviews(2),
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['gate-not-met']);
  });
});

describe('an empty thesis', () => {
  test('reports nothing rather than crashing', () => {
    expect(check(thesis([]))).toEqual([]);
  });
});

describe('hasBlockingFindings', () => {
  test('is false when there is nothing to report', () => {
    expect(hasBlockingFindings([])).toBe(false);
  });

  test('is true when any finding is an error', () => {
    const findings = check(thesis([claim({ confidence: 'validated' })]));

    expect(hasBlockingFindings(findings)).toBe(true);
  });
});
