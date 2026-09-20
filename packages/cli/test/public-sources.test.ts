import { describe, expect, test } from 'vitest';
import { check } from '../src/check.js';
import {
  ceilingForMethod,
  METHOD_CEILINGS,
  METHOD_CLAIM_LIMITS,
  type Claim,
  type Stage,
  type Thesis,
} from '../src/model.js';

function claim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'problem-exists',
    statement: 'People hit this.',
    confidence: 'indicated',
    critical: false,
    stage: 'problem',
    source: 'strategy/problem.md',
    evidence: [
      { method: 'forum-question', source: 'https://reddit.com/r/x/1', n: 12 },
    ],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });
const codes = (thesis: Thesis): string[] => check(thesis).map((f) => f.code);

describe('forum-question', () => {
  test('is recognised and stops at indicated', () => {
    expect(METHOD_CEILINGS['forum-question']).toBe('indicated');
  });

  test('outranks the desk methods, for the same reason search-demand does', () => {
    expect(METHOD_CEILINGS['scraping']).toBe('assumed');
    expect(METHOD_CEILINGS['desk-research']).toBe('assumed');
  });

  test('carries indicated where the claims are about what people do', () => {
    for (const stage of ['problem', 'customer'] as Stage[]) {
      expect(ceilingForMethod('forum-question', stage)).toBe('indicated');
    }
  });

  test('drops to assumed once the claims are about your own offer', () => {
    for (const stage of ['advantage', 'offer', 'model', 'motion'] as Stage[]) {
      expect(ceilingForMethod('forum-question', stage)).toBe('assumed');
    }
  });

  test('establishes that people are asking about this', () => {
    expect(codes(thesisOf(claim()))).toEqual([]);
  });

  test('establishes that they already do something about it', () => {
    expect(codes(thesisOf(claim({ id: 'they-already-try' })))).toEqual([]);
  });

  test('cannot say what it costs them, which nobody posts', () => {
    const findings = check(thesisOf(claim({ id: 'problem-is-expensive' })));

    expect(findings.map((f) => f.code)).toEqual(['method-beyond-reach']);
    expect(findings[0]?.message).toContain('forum-question');
  });

  test('never reaches validated, whatever the thread count', () => {
    const findings = check(
      thesisOf(
        claim({
          confidence: 'validated',
          evidence: [{ method: 'forum-question', source: 'https://reddit.com/r/x/1', n: 4000 }],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toContain('method-ceiling');
  });
});

describe('official-statistics', () => {
  function statistical(overrides: Partial<Claim> = {}): Claim {
    return claim({
      evidence: [{ method: 'official-statistics', source: 'https://bps.go.id/table/1', n: 1 }],
      ...overrides,
    });
  }

  test('is recognised, and buys no confidence anywhere', () => {
    expect(METHOD_CEILINGS['official-statistics']).toBe('assumed');
  });

  test('cannot carry a claim at any stage, because it measures populations', () => {
    for (const stage of ['problem', 'customer', 'offer', 'model', 'motion'] as Stage[]) {
      expect(ceilingForMethod('official-statistics', stage)).toBe('assumed');
    }
  });

  test('is reported when someone writes indicated on it', () => {
    expect(codes(thesisOf(statistical()))).toContain('method-ceiling');
  });

  test('still refutes, because a refutation is not a confidence it has to buy', () => {
    const findings = check(
      thesisOf(
        statistical({
          id: 'segment-is-reachable',
          stage: 'customer',
          source: 'strategy/customer.md',
          confidence: 'refuted',
        }),
      ),
    );

    expect(findings.map((f) => f.code)).not.toContain('method-ceiling');
  });

  test('is not silently treated as an unknown method', () => {
    expect(codes(thesisOf(statistical()))).not.toContain('unknown-method');
  });
});

describe('the limits stay declared rather than scattered', () => {
  test('forum-question names the claim it cannot reach', () => {
    expect(METHOD_CLAIM_LIMITS['forum-question']).toContain('problem-is-expensive');
    expect(METHOD_CLAIM_LIMITS['forum-question']).not.toContain('they-already-try');
  });

  test('official-statistics needs no claim limit, because its ceiling is the limit', () => {
    expect(METHOD_CLAIM_LIMITS['official-statistics']).toBeUndefined();
  });
});
