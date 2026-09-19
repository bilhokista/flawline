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
      { method: 'verified-review', source: 'research/reviews.md', n: 30 },
    ],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });
const codes = (thesis: Thesis): string[] => check(thesis).map((f) => f.code);

describe('verified-review', () => {
  test('is recognised and stops at indicated', () => {
    expect(METHOD_CEILINGS['verified-review']).toBe('indicated');
  });

  test('carries indicated where the claims are about what people do', () => {
    for (const stage of ['problem', 'customer'] as Stage[]) {
      expect(ceilingForMethod('verified-review', stage)).toBe('indicated');
    }
  });

  test('drops to assumed once the claims are about your own offer', () => {
    for (const stage of ['advantage', 'offer', 'model', 'motion'] as Stage[]) {
      expect(ceilingForMethod('verified-review', stage)).toBe('assumed');
    }
  });

  test('establishes that the thing happens to people', () => {
    expect(codes(thesisOf(claim()))).toEqual([]);
  });

  test('establishes that they already buy something for it', () => {
    expect(codes(thesisOf(claim({ id: 'they-already-try' })))).toEqual([]);
  });

  test('cannot say what it costs them, which is not in the review', () => {
    const findings = check(thesisOf(claim({ id: 'problem-is-expensive' })));

    expect(findings.map((f) => f.code)).toEqual(['method-beyond-reach']);
    expect(findings[0]?.message).toContain('verified-review');
  });

  test('never reaches validated, whatever the count', () => {
    const findings = check(
      thesisOf(
        claim({
          confidence: 'validated',
          evidence: [{ method: 'verified-review', source: 'r.md', n: 4000 }],
        }),
      ),
    );

    expect(codes(thesisOf(claim()))).toEqual([]);
    expect(findings.map((f) => f.code)).toContain('method-ceiling');
  });
});

describe('bot-outreach', () => {
  test('is recognised, and buys nothing', () => {
    expect(METHOD_CEILINGS['bot-outreach']).toBe('assumed');
  });

  test('cannot carry a claim at any stage', () => {
    const findings = check(
      thesisOf(
        claim({
          evidence: [{ method: 'bot-outreach', source: 'campaign/sept.md', n: 500 }],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toContain('method-ceiling');
  });
});

describe('incident-record keeps its own limits', () => {
  test('still cannot say what an incident cost', () => {
    const findings = check(
      thesisOf(
        claim({
          id: 'problem-is-expensive',
          evidence: [{ method: 'incident-record', source: 'https://example.org/1' }],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toEqual(['incident-beyond-occurrence']);
  });

  test('and still cannot say what people already do', () => {
    const findings = check(
      thesisOf(
        claim({
          id: 'they-already-try',
          evidence: [{ method: 'incident-record', source: 'https://example.org/1' }],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toEqual(['incident-beyond-occurrence']);
  });
});

describe('the limits are declared, not scattered through the checker', () => {
  test('every limited method names the claims it cannot reach', () => {
    expect(METHOD_CLAIM_LIMITS['incident-record']).toContain('problem-is-expensive');
    expect(METHOD_CLAIM_LIMITS['verified-review']).toContain('problem-is-expensive');
    expect(METHOD_CLAIM_LIMITS['verified-review']).not.toContain('they-already-try');
  });
});
