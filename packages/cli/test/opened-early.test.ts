import { describe, expect, test } from 'vitest';
import { check } from '../src/check.js';
import type { Claim, Confidence, Stage, Thesis } from '../src/model.js';

function claim(
  stage: Stage,
  id: string,
  confidence: Confidence = 'assumed',
  critical = true,
): Claim {
  return {
    id,
    statement: 'Something is believed here.',
    confidence,
    critical,
    stage,
    source: `strategy/${stage}.md`,
    evidence:
      confidence === 'assumed' || confidence === 'refuted'
        ? []
        : [{ method: 'interview', source: 'notes/01-06', n: 6 }],
    dependsOn: [],
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });

const codes = (thesis: Thesis): string[] => check(thesis).map((f) => f.code);

describe('a stage document that should not exist yet', () => {
  test('the eight-document thesis with nothing established does not pass', () => {
    const stages: Stage[] = [
      'problem',
      'advantage',
      'customer',
      'offer',
      'model',
      'evidence',
      'narrative',
      'motion',
    ];

    const findings = check(thesisOf(...stages.map((s) => claim(s, `${s}-c1`))));

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.map((f) => f.code)).toContain('stage-opened-early');
  });

  test('names the stage that is holding the line', () => {
    const findings = check(
      thesisOf(claim('problem', 'problem-exists'), claim('offer', 'what-we-sell')),
    );

    const early = findings.find((f) => f.code === 'stage-opened-early');

    expect(early?.claimId).toBe('what-we-sell');
    expect(early?.source).toBe('strategy/offer.md');
    expect(early?.message).toContain('problem');
  });

  test('reports each premature stage once, not once per claim', () => {
    const findings = check(
      thesisOf(
        claim('problem', 'problem-exists'),
        claim('offer', 'what-we-sell'),
        claim('offer', 'they-will-switch'),
        claim('offer', 'offer-relieves-the-blocker'),
      ),
    );

    expect(findings.filter((f) => f.code === 'stage-opened-early')).toHaveLength(1);
  });

  test('says nothing about the problem stage, which opens on day one', () => {
    expect(codes(thesisOf(claim('problem', 'problem-exists')))).toEqual([]);
  });

  test('lets the next stage open once the one before it holds', () => {
    const findings = check(
      thesisOf(
        claim('problem', 'problem-exists', 'indicated'),
        claim('advantage', 'what-is-authentically-mine'),
      ),
    );

    expect(codes(thesisOf(...findings.map(() => claim('problem', 'x'))))).toEqual([]);
    expect(findings.map((f) => f.code)).not.toContain('stage-opened-early');
  });

  test('a skipped stage still blocks the ones after it', () => {
    const findings = check(
      thesisOf(
        claim('problem', 'problem-exists', 'indicated'),
        claim('offer', 'what-we-sell'),
      ),
    );

    const early = findings.find((f) => f.code === 'stage-opened-early');

    expect(early?.claimId).toBe('what-we-sell');
    expect(early?.message).toContain('advantage');
  });

  test('a stage carrying no critical claim cannot open the next one', () => {
    const findings = check(
      thesisOf(
        claim('problem', 'problem-exists', 'indicated', false),
        claim('advantage', 'what-is-authentically-mine'),
      ),
    );

    const early = findings.find((f) => f.code === 'stage-opened-early');

    expect(early?.message).toContain('no critical claim');
  });

  test('a refuted critical claim does not open the stage after it', () => {
    const findings = check(
      thesisOf(
        claim('problem', 'problem-exists', 'refuted'),
        claim('advantage', 'what-is-authentically-mine'),
      ),
    );

    expect(findings.map((f) => f.code)).toContain('stage-opened-early');
  });
});
