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
      { method: 'search-demand', source: 'research/keywords/2026-09-tukang.md', n: 40 },
    ],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });
const codes = (thesis: Thesis): string[] => check(thesis).map((f) => f.code);

describe('search-demand', () => {
  test('is recognised and stops at indicated', () => {
    expect(METHOD_CEILINGS['search-demand']).toBe('indicated');
  });

  test('outranks the desk methods it used to be filed under', () => {
    expect(METHOD_CEILINGS['scraping']).toBe('assumed');
    expect(METHOD_CEILINGS['desk-research']).toBe('assumed');
  });

  test('carries indicated where the claims are about what people do', () => {
    for (const stage of ['problem', 'customer'] as Stage[]) {
      expect(ceilingForMethod('search-demand', stage)).toBe('indicated');
    }
  });

  test('drops to assumed once the claims are about your own offer', () => {
    for (const stage of ['advantage', 'offer', 'model', 'motion'] as Stage[]) {
      expect(ceilingForMethod('search-demand', stage)).toBe('assumed');
    }
  });

  test('establishes that people are looking for this', () => {
    expect(codes(thesisOf(claim()))).toEqual([]);
  });

  test('establishes that they already do something about it', () => {
    expect(codes(thesisOf(claim({ id: 'they-already-try' })))).toEqual([]);
  });

  test('cannot say what it costs them, which is not in a query', () => {
    const findings = check(thesisOf(claim({ id: 'problem-is-expensive' })));

    expect(findings.map((f) => f.code)).toEqual(['method-beyond-reach']);
    expect(findings[0]?.message).toContain('search-demand');
  });

  test('never reaches validated, whatever the volume', () => {
    const findings = check(
      thesisOf(
        claim({
          confidence: 'validated',
          evidence: [{ method: 'search-demand', source: 'research/keywords.md', n: 90_000 }],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toContain('method-ceiling');
  });

  test('names the claim it cannot reach, declared rather than scattered', () => {
    expect(METHOD_CLAIM_LIMITS['search-demand']).toContain('problem-is-expensive');
    expect(METHOD_CLAIM_LIMITS['search-demand']).not.toContain('they-already-try');
  });
});
