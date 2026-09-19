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
    id: 'they-already-try',
    statement: 'They guard against it themselves.',
    confidence: 'indicated',
    critical: false,
    stage: 'problem',
    source: 'strategy/problem.md',
    evidence: [
      {
        method: 'shipped-workaround',
        source: 'https://github.com/some-org/some-repo README',
        n: 2,
      },
    ],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });
const codes = (thesis: Thesis): string[] => check(thesis).map((f) => f.code);

describe('shipped-workaround', () => {
  test('is recognised and stops at indicated', () => {
    expect(METHOD_CEILINGS['shipped-workaround']).toBe('indicated');
  });

  test('says what people already do, which is the whole point of it', () => {
    expect(codes(thesisOf(claim()))).toEqual([]);
  });

  test('also says the thing happens', () => {
    expect(codes(thesisOf(claim({ id: 'problem-exists' })))).toEqual([]);
  });

  test('cannot say what it costs them', () => {
    const findings = check(thesisOf(claim({ id: 'problem-is-expensive' })));

    expect(findings.map((f) => f.code)).toEqual(['method-beyond-reach']);
  });

  test('counts where the claims are about what people do', () => {
    for (const stage of ['problem', 'customer'] as Stage[]) {
      expect(ceilingForMethod('shipped-workaround', stage)).toBe('indicated');
    }
  });

  test('drops to assumed once the claims are about your own offer', () => {
    for (const stage of ['offer', 'model', 'motion'] as Stage[]) {
      expect(ceilingForMethod('shipped-workaround', stage)).toBe('assumed');
    }
  });

  test('never reaches validated, however many repositories are cited', () => {
    const findings = check(
      thesisOf(
        claim({
          confidence: 'validated',
          evidence: [{ method: 'shipped-workaround', source: 'r.md', n: 50 }],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toContain('method-ceiling');
  });

  test('is limited only where the artefact is silent', () => {
    expect(METHOD_CLAIM_LIMITS['shipped-workaround']).toEqual(['problem-is-expensive']);
  });
});
