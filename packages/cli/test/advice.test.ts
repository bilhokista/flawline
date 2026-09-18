import { describe, expect, test } from 'vitest';
import { adviseOn, riskiestAssumption } from '../src/advice.js';
import type { Claim, Confidence, Evidence, Stage, Thesis } from '../src/model.js';

function claim(
  id: string,
  stage: Stage,
  confidence: Confidence = 'assumed',
  dependsOn: readonly string[] = [],
): Claim {
  const evidence: Evidence[] =
    confidence === 'assumed' || confidence === 'refuted'
      ? []
      : [{ method: 'interview', source: 'research.md', n: 6 }];

  return {
    id,
    statement: `Something about ${id}`,
    confidence,
    evidence,
    dependsOn,
    critical: true,
    stage,
    source: `strategy/${stage}.md`,
  };
}

function thesis(claims: readonly Claim[]): Thesis {
  return { claims, gates: [] };
}

describe('what the evidence licenses', () => {
  test('a thesis where nothing is established licenses one thing only', () => {
    const advice = adviseOn(thesis([claim('problem-exists', 'problem')]));

    expect(advice.stage).toBe('problem');
    expect(advice.next).toContain('five');
    expect(advice.withheld.map((item) => item.stage)).toContain('offer');
    expect(advice.withheld.map((item) => item.stage)).toContain('motion');
  });

  test('settling the problem moves the work on rather than unlocking everything', () => {
    const advice = adviseOn(
      thesis([claim('problem-exists', 'problem', 'indicated'), claim('mine', 'advantage')]),
    );

    expect(advice.stage).toBe('advantage');
    expect(advice.withheld.map((item) => item.stage)).toContain('offer');
  });

  test('the offer stays withheld until the customer stage is settled', () => {
    const advice = adviseOn(
      thesis([
        claim('problem-exists', 'problem', 'indicated'),
        claim('mine', 'advantage', 'indicated'),
        claim('segment-is-reachable', 'customer'),
        claim('what-we-sell', 'offer'),
      ]),
    );

    expect(advice.stage).toBe('customer');
    expect(advice.withheld.map((item) => item.stage)).toContain('offer');
  });

  test('a settled customer stage lets the offer be discussed and still withholds the channel', () => {
    const advice = adviseOn(
      thesis([
        claim('problem-exists', 'problem', 'indicated'),
        claim('mine', 'advantage', 'indicated'),
        claim('segment-is-reachable', 'customer', 'indicated'),
        claim('what-we-sell', 'offer'),
        claim('first-channel-proven', 'motion'),
      ]),
    );

    expect(advice.stage).toBe('offer');
    expect(advice.withheld.map((item) => item.stage)).toContain('motion');
    expect(advice.withheld.map((item) => item.stage)).not.toContain('offer');
  });

  test('a refuted critical claim does not count as settled', () => {
    const advice = adviseOn(
      thesis([claim('problem-exists', 'problem', 'refuted'), claim('mine', 'advantage')]),
    );

    expect(advice.stage).toBe('problem');
  });

  test('a thesis with nothing left to settle withholds nothing', () => {
    const advice = adviseOn(
      thesis(STAGE_LIST.map((stage) => claim(`${stage}-claim`, stage, 'indicated'))),
    );

    expect(advice.stage).toBeNull();
    expect(advice.withheld).toEqual([]);
  });
});

describe('the riskiest assumption', () => {
  test('is the earliest critical claim still resting on nothing', () => {
    const riskiest = riskiestAssumption(
      thesis([
        claim('problem-exists', 'problem', 'indicated'),
        claim('mine', 'advantage'),
        claim('segment-is-reachable', 'customer'),
      ]),
    );

    expect(riskiest?.id).toBe('mine');
  });

  test('prefers the claim carrying the most weight when two sit in the same stage', () => {
    const riskiest = riskiestAssumption(
      thesis([
        claim('lonely', 'problem'),
        claim('load-bearing', 'problem'),
        claim('a', 'customer', 'assumed', ['load-bearing']),
        claim('b', 'customer', 'assumed', ['load-bearing']),
      ]),
    );

    expect(riskiest?.id).toBe('load-bearing');
  });

  test('is absent when nothing critical is assumed', () => {
    expect(riskiestAssumption(thesis([claim('problem-exists', 'problem', 'indicated')]))).toBeNull();
  });
});

const STAGE_LIST: readonly Stage[] = [
  'problem',
  'advantage',
  'customer',
  'offer',
  'model',
  'evidence',
  'narrative',
  'motion',
];
