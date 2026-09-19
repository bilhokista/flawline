import { describe, expect, test } from 'vitest';
import { renderAnnotations } from '../src/annotations.js';
import { parseDocument } from '../src/parse.js';
import type { Finding } from '../src/check.js';

const DOCUMENT = `---
stage: problem
claims:
  - id: heat
    statement: Rooms overheat by afternoon.
    confidence: validated
  - id: cost
    statement: Owners cannot price a fix.
    confidence: assumed
---

Prose below the block.
`;

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    code: 'unsupported-confidence',
    severity: 'error',
    claimId: 'heat',
    source: 'strategy/problem.md',
    message: 'Marked "validated" with no evidence recorded.',
    ...overrides,
  };
}

describe('claim line numbers', () => {
  test('records the line each claim was declared on', () => {
    const { claims } = parseDocument(DOCUMENT, 'strategy/problem.md');

    expect(claims.map((claim) => [claim.id, claim.line])).toEqual([
      ['heat', 4],
      ['cost', 7],
    ]);
  });

  test('leaves the line unset when the id cannot be located verbatim', () => {
    const folded = `---\nstage: problem\nclaims:\n  - id: >-\n      heat\n    statement: Rooms overheat.\n---\n`;
    const { claims } = parseDocument(folded, 'strategy/problem.md');

    expect(claims[0]?.id).toBe('heat');
    expect(claims[0]?.line).toBeUndefined();
  });
});

describe('renderAnnotations', () => {
  const { claims } = parseDocument(DOCUMENT, 'strategy/problem.md');

  test('points an annotation at the line the claim sits on', () => {
    const out = renderAnnotations([finding()], claims);

    expect(out).toBe(
      '::error file=strategy/problem.md,line=4,title=flawline%3A unsupported-confidence::' +
        'heat — Marked "validated" with no evidence recorded.',
    );
  });

  test('falls back to the top of the file when no line is known', () => {
    const out = renderAnnotations([finding({ claimId: 'absent' })], claims);

    expect(out).toContain('line=1');
  });

  test('maps a warning onto a warning annotation', () => {
    const out = renderAnnotations([finding({ severity: 'warning' })], claims);

    expect(out.startsWith('::warning ')).toBe(true);
  });

  test('escapes the characters that would end the command early', () => {
    const out = renderAnnotations(
      [finding({ message: 'Line one\nLine two, 50% of it: gone' })],
      claims,
    );

    expect(out).toContain('%0ALine two, 50%25 of it: gone');
    expect(out).not.toContain('\n');
  });

  test('says nothing when there is nothing to report', () => {
    expect(renderAnnotations([], claims)).toBe('');
  });
});
