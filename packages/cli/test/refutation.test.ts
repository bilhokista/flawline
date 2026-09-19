import { describe, expect, test } from 'vitest';
import { check } from '../src/check.js';
import { parseThesis } from '../src/parse.js';
import { STAGE_TEMPLATES } from '../src/templates.js';
import { STAGES, type Claim, type Thesis } from '../src/model.js';

const FRONTMATTER = [
  '---',
  'stage: problem',
  'claims:',
  '  - id: problem-exists',
  '    statement: Something hurts.',
  '    confidence: assumed',
  '    critical: true',
  '---',
  '',
].join('\n');

function documentWith(prose: string): Thesis {
  const { thesis } = parseThesis([
    { source: 'strategy/problem.md', content: FRONTMATTER + prose },
  ]);
  return thesis;
}

const codes = (thesis: Thesis): string[] => check(thesis).map((f) => f.code);

const SALES_PITCH = `# Problem

This is a massive, underserved market and the timing has never been better.
Our wedge is unbeatable and the moat widens with every customer.
`;

describe('a document that never says how it could be wrong', () => {
  test('is reported when it carries a critical claim', () => {
    const findings = check(documentWith(SALES_PITCH));

    expect(findings.map((f) => f.code)).toEqual(['no-refutation-recorded']);
    expect(findings[0]?.source).toBe('strategy/problem.md');
    expect(findings[0]?.message).toContain('refute');
  });

  test('is satisfied by a refutation section with something under it', () => {
    const prose = `${SALES_PITCH}
## What would refute this

- Ten owners asked about last month cannot recall a single occurrence.
`;

    expect(codes(documentWith(prose))).toEqual([]);
  });

  test('is not satisfied by the heading alone', () => {
    const prose = `${SALES_PITCH}
## What would refute this
`;

    expect(codes(documentWith(prose))).toEqual(['no-refutation-recorded']);
  });

  test('accepts the other spelling a writer reaches for', () => {
    const prose = `${SALES_PITCH}
## How this could be wrong

- The bleed is somewhere else entirely.
`;

    expect(codes(documentWith(prose))).toEqual([]);
  });

  test('does not care about heading depth or case', () => {
    const prose = `${SALES_PITCH}
#### WHAT WOULD REFUTE THIS

Nobody remembers it happening.
`;

    expect(codes(documentWith(prose))).toEqual([]);
  });

  test('says nothing when the document declares no critical claim', () => {
    const { thesis } = parseThesis([
      {
        source: 'strategy/problem.md',
        content: FRONTMATTER.replace('critical: true', 'critical: false') + SALES_PITCH,
      },
    ]);

    expect(check(thesis).map((f) => f.code)).toEqual([]);
  });

  test('reports a document once, not once per critical claim', () => {
    const content = [
      '---',
      'stage: problem',
      'claims:',
      '  - id: a',
      '    statement: One.',
      '    critical: true',
      '  - id: b',
      '    statement: Two.',
      '    critical: true',
      '---',
      '',
      '# Problem',
      '',
      'Nothing here admits it could be wrong.',
    ].join('\n');

    const { thesis } = parseThesis([{ source: 'strategy/problem.md', content }]);

    expect(check(thesis).filter((f) => f.code === 'no-refutation-recorded')).toHaveLength(1);
  });

  test('stays quiet for callers that never handed over any prose', () => {
    const claim: Claim = {
      id: 'problem-exists',
      statement: 'Something hurts.',
      confidence: 'assumed',
      critical: true,
      stage: 'problem',
      source: 'strategy/problem.md',
      evidence: [],
      dependsOn: [],
    };

    expect(check({ claims: [claim], gates: [] })).toEqual([]);
  });
});

describe('the documents flawline ships', () => {
  test('every stage template says how its claims could be wrong', () => {
    for (const stage of STAGES) {
      const { thesis } = parseThesis([
        { source: `strategy/${stage}.md`, content: STAGE_TEMPLATES[stage] },
      ]);

      expect(check(thesis).map((f) => f.code)).not.toContain('no-refutation-recorded');
    }
  });
});
