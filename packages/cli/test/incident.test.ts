import { describe, expect, test } from 'vitest';
import { check } from '../src/check.js';
import {
  ceilingForMethod,
  INCIDENT_RECORD_STAGE,
  OCCURRENCE_ONLY_CLAIM_IDS,
  METHOD_CEILINGS,
  type Claim,
  type Stage,
  type Thesis,
} from '../src/model.js';

function claim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'problem-exists',
    statement: 'It happens.',
    confidence: 'indicated',
    critical: false,
    stage: 'problem',
    source: 'strategy/problem.md',
    evidence: [
      {
        method: 'incident-record',
        source: 'https://github.com/org/repo/issues/16800',
        n: 3,
      },
    ],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });

describe('incident-record as a method', () => {
  test('is recognised, and stops at indicated', () => {
    expect(METHOD_CEILINGS['incident-record']).toBe('indicated');
  });

  test('carries indicated on the stage that is about what happened', () => {
    expect(ceilingForMethod('incident-record', INCIDENT_RECORD_STAGE)).toBe('indicated');
  });

  test('drops to assumed on every other stage', () => {
    const others: Stage[] = ['advantage', 'customer', 'offer', 'model', 'motion'];

    for (const stage of others) {
      expect(ceilingForMethod('incident-record', stage)).toBe('assumed');
    }
  });

  test('never reaches validated, however many records are cited', () => {
    const findings = check(
      thesisOf(claim({ confidence: 'validated', evidence: [
        { method: 'incident-record', source: 'https://example.org/a', n: 40 },
      ] })),
    );

    expect(findings.map((f) => f.code)).toContain('method-ceiling');
  });
});

describe('an incident says what happened, not what it cost', () => {
  test('raises a claim about the occurrence itself', () => {
    expect(check(thesisOf(claim()))).toEqual([]);
  });

  test('refuses to raise what the occurrence cost', () => {
    const findings = check(thesisOf(claim({ id: 'problem-is-expensive' })));

    expect(findings).toHaveLength(1);
    expect(findings[0]?.code).toBe('incident-beyond-occurrence');
    expect(findings[0]?.message).toContain('what it cost');
  });

  test('refuses to raise what people already do about it', () => {
    const findings = check(thesisOf(claim({ id: 'they-already-try' })));

    expect(findings.map((f) => f.code)).toEqual(['incident-beyond-occurrence']);
  });

  test('names both claims the rule covers', () => {
    expect([...OCCURRENCE_ONLY_CLAIM_IDS]).toEqual(
      expect.arrayContaining(['problem-is-expensive', 'they-already-try']),
    );
  });

  test('leaves those claims alone when the evidence is an interview', () => {
    const findings = check(
      thesisOf(
        claim({
          id: 'problem-is-expensive',
          evidence: [{ method: 'interview', source: 'notes/01-06', n: 6 }],
        }),
      ),
    );

    expect(findings).toEqual([]);
  });

  test('says nothing while the claim is still assumed', () => {
    expect(check(thesisOf(claim({ id: 'problem-is-expensive', confidence: 'assumed' })))).toEqual(
      [],
    );
  });

  test('still reports the finding when other evidence sits beside the record', () => {
    const findings = check(
      thesisOf(
        claim({
          id: 'problem-is-expensive',
          evidence: [
            { method: 'incident-record', source: 'https://example.org/a' },
            { method: 'desk-research', source: 'research/notes.md' },
          ],
        }),
      ),
    );

    expect(findings.map((f) => f.code)).toEqual(['incident-beyond-occurrence']);
  });
});
