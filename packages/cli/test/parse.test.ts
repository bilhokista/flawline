import { describe, expect, test } from 'vitest';
import { extractFrontmatter, parseDocument, parseThesis } from '../src/parse.js';

function doc(frontmatter: string, body = '\nProse below the block.\n'): string {
  return `---\n${frontmatter}\n---\n${body}`;
}

describe('extractFrontmatter', () => {
  test('returns the block at the top of a document', () => {
    expect(extractFrontmatter(doc('stage: problem'))).toBe('stage: problem');
  });

  test('returns null when a document has no block', () => {
    expect(extractFrontmatter('# Just a heading\n')).toBeNull();
  });

  test('ignores a rule that is not at the very top', () => {
    expect(extractFrontmatter('# Heading\n\n---\nstage: problem\n---\n')).toBeNull();
  });

  test('reads a block written with carriage returns', () => {
    expect(extractFrontmatter('---\r\nstage: problem\r\n---\r\n')).toBe('stage: problem');
  });

  test('reads a block that ends the document', () => {
    expect(extractFrontmatter('---\nstage: problem\n---')).toBe('stage: problem');
  });
});

describe('stage declaration', () => {
  test('reads a valid stage', () => {
    const result = parseDocument(doc('stage: customer'), 'strategy/customer.md');

    expect(result.issues).toEqual([]);
    expect(result.claims).toEqual([]);
  });

  test('refuses an unrecognised stage and names the valid ones', () => {
    const result = parseDocument(doc('stage: vibes'), 'strategy/vibes.md');

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain('problem, customer, offer');
  });

  test('refuses a document with no frontmatter', () => {
    const result = parseDocument('# Nothing here\n', 'strategy/empty.md');

    expect(result.issues[0]?.message).toContain('No YAML frontmatter');
  });

  test('refuses frontmatter that is not valid YAML', () => {
    const result = parseDocument(doc('stage: [unclosed'), 'strategy/broken.md');

    expect(result.issues[0]?.message).toContain('not valid YAML');
  });

  test('refuses frontmatter that is a list rather than a mapping', () => {
    const result = parseDocument(doc('- one\n- two'), 'strategy/list.md');

    expect(result.issues[0]?.message).toContain('must be a mapping');
  });
});

describe('claims', () => {
  const minimal = `stage: problem
claims:
  - id: problem-real
    statement: Ops leads re-key invoice data by hand every week
`;

  test('reads a minimal claim and defaults it to an assumption', () => {
    const result = parseDocument(doc(minimal), 'strategy/problem.md');

    expect(result.issues).toEqual([]);
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0]).toMatchObject({
      id: 'problem-real',
      confidence: 'assumed',
      critical: false,
      stage: 'problem',
      source: 'strategy/problem.md',
      evidence: [],
      dependsOn: [],
    });
  });

  test('reads confidence, criticality, dependencies and evidence', () => {
    const result = parseDocument(
      doc(`stage: customer
claims:
  - id: jtbd-primary
    statement: They reconcile two systems before the Monday report
    confidence: validated
    critical: true
    depends_on: [problem-real]
    evidence:
      - method: interview
        source: research/interviews/acme.md
        n: 9
        collected_at: 2026-09-12
`),
      'strategy/customer.md',
    );

    expect(result.issues).toEqual([]);
    expect(result.claims[0]).toMatchObject({
      id: 'jtbd-primary',
      confidence: 'validated',
      critical: true,
      dependsOn: ['problem-real'],
    });
    expect(result.claims[0]?.evidence[0]).toEqual({
      method: 'interview',
      source: 'research/interviews/acme.md',
      n: 9,
      collectedAt: '2026-09-12',
    });
  });

  test('accepts camelCase keys as well as snake_case', () => {
    const result = parseDocument(
      doc(`stage: problem
claims:
  - id: a
    statement: Something
    dependsOn: [b]
    evidence:
      - method: survey
        source: s.md
        collectedAt: 2026-01-01
`),
      'strategy/problem.md',
    );

    expect(result.claims[0]?.dependsOn).toEqual(['b']);
    expect(result.claims[0]?.evidence[0]?.collectedAt).toBe('2026-01-01');
  });

  test('omits a count when none was given', () => {
    const result = parseDocument(
      doc(`stage: problem
claims:
  - id: a
    statement: Something
    evidence:
      - method: sale
        source: stripe.md
`),
      'strategy/problem.md',
    );

    expect(result.claims[0]?.evidence[0]).not.toHaveProperty('n');
  });

  test('rejects a claim with no id', () => {
    const result = parseDocument(doc('stage: problem\nclaims:\n  - statement: Orphan\n'), 'p.md');

    expect(result.issues[0]?.message).toContain('needs a non-empty "id"');
    expect(result.claims).toEqual([]);
  });

  test('rejects a claim with no statement', () => {
    const result = parseDocument(doc('stage: problem\nclaims:\n  - id: bare\n'), 'p.md');

    expect(result.issues[0]?.message).toContain('needs a "statement"');
  });

  test('rejects an unrecognised confidence value', () => {
    const result = parseDocument(
      doc('stage: problem\nclaims:\n  - id: a\n    statement: S\n    confidence: pretty-sure\n'),
      'p.md',
    );

    expect(result.issues[0]?.message).toContain('assumed, indicated, validated, refuted');
  });

  test('rejects a non-boolean criticality', () => {
    const result = parseDocument(
      doc('stage: problem\nclaims:\n  - id: a\n    statement: S\n    critical: maybe\n'),
      'p.md',
    );

    expect(result.issues[0]?.message).toContain('must be true or false');
  });

  test('rejects a claims value that is not a list', () => {
    const result = parseDocument(doc('stage: problem\nclaims: lots'), 'p.md');

    expect(result.issues[0]?.message).toContain('"claims" must be a list');
  });

  test('keeps the good claims when one is malformed', () => {
    const result = parseDocument(
      doc(`stage: problem
claims:
  - id: good
    statement: This one is fine
  - statement: This one has no id
  - id: also-good
    statement: So is this one
`),
      'p.md',
    );

    expect(result.claims.map((c) => c.id)).toEqual(['good', 'also-good']);
    expect(result.issues).toHaveLength(1);
  });
});

describe('evidence validation', () => {
  const withEvidence = (evidence: string): string =>
    doc(`stage: problem\nclaims:\n  - id: a\n    statement: S\n    evidence:\n${evidence}`);

  test('rejects evidence with no method', () => {
    const result = parseDocument(withEvidence('      - source: s.md\n'), 'p.md');

    expect(result.issues[0]?.message).toContain('needs a "method"');
  });

  test('rejects evidence with no checkable source', () => {
    const result = parseDocument(withEvidence('      - method: interview\n'), 'p.md');

    expect(result.issues[0]?.message).toContain('needs a "source" a reader can check');
  });

  test('rejects a zero or negative observation count', () => {
    const result = parseDocument(
      withEvidence('      - method: interview\n        source: s.md\n        n: 0\n'),
      'p.md',
    );

    expect(result.issues[0]?.message).toContain('positive whole number');
  });

  test('rejects a fractional observation count', () => {
    const result = parseDocument(
      withEvidence('      - method: interview\n        source: s.md\n        n: 2.5\n'),
      'p.md',
    );

    expect(result.issues[0]?.message).toContain('positive whole number');
  });

  test('rejects an evidence block that is not a list', () => {
    const result = parseDocument(
      doc('stage: problem\nclaims:\n  - id: a\n    statement: S\n    evidence: plenty\n'),
      'p.md',
    );

    expect(result.issues[0]?.message).toContain('"evidence" must be a list');
  });

  test('rejects a dependency list that is not a list', () => {
    const result = parseDocument(
      doc('stage: problem\nclaims:\n  - id: a\n    statement: S\n    depends_on: everything\n'),
      'p.md',
    );

    expect(result.issues[0]?.message).toContain('must be a list of claim ids');
  });
});

describe('gate overrides', () => {
  test('reads a gate declared on a stage', () => {
    const result = parseDocument(
      doc('stage: customer\ngate:\n  min_observations: 12\n  requires: validated\n'),
      'strategy/customer.md',
    );

    expect(result.issues).toEqual([]);
    expect(result.gate).toEqual({ stage: 'customer', minObservations: 12, requires: 'validated' });
  });

  test('fills in defaults for a partially declared gate', () => {
    const result = parseDocument(doc('stage: customer\ngate:\n  requires: validated\n'), 'c.md');

    expect(result.gate).toEqual({ stage: 'customer', minObservations: 5, requires: 'validated' });
  });

  test('returns no gate when none is declared', () => {
    expect(parseDocument(doc('stage: customer'), 'c.md').gate).toBeNull();
  });

  test('refuses refuted as a gate requirement', () => {
    const result = parseDocument(doc('stage: customer\ngate:\n  requires: refuted\n'), 'c.md');

    expect(result.issues[0]?.message).toContain('assumed, indicated, validated');
    expect(result.gate).toBeNull();
  });

  test('refuses a nonsense observation bar', () => {
    const result = parseDocument(doc('stage: customer\ngate:\n  min_observations: -3\n'), 'c.md');

    expect(result.issues[0]?.message).toContain('positive whole number');
  });
});

describe('parseThesis', () => {
  test('gathers claims and gates from every document', () => {
    const result = parseThesis([
      {
        source: 'strategy/problem.md',
        content: doc('stage: problem\nclaims:\n  - id: p\n    statement: S\n'),
      },
      {
        source: 'strategy/customer.md',
        content: doc('stage: customer\ngate:\n  min_observations: 8\nclaims:\n  - id: c\n    statement: S\n'),
      },
    ]);

    expect(result.issues).toEqual([]);
    expect(result.thesis.claims.map((c) => c.id)).toEqual(['p', 'c']);
    expect(result.thesis.gates).toEqual([
      { stage: 'customer', minObservations: 8, requires: 'indicated' },
    ]);
  });

  test('collects issues from every document rather than stopping at the first', () => {
    const result = parseThesis([
      { source: 'a.md', content: '# no frontmatter\n' },
      { source: 'b.md', content: doc('stage: nonsense') },
    ]);

    expect(result.issues.map((issue) => issue.source)).toEqual(['a.md', 'b.md']);
  });

  test('produces an empty thesis from no documents', () => {
    expect(parseThesis([])).toEqual({ thesis: { claims: [], gates: [] }, issues: [] });
  });
});
