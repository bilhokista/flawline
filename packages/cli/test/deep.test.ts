import { describe, expect, test } from 'vitest';
import {
  EDGE_SEATS,
  PERSONA_IMPACTS,
  buildDeepPack,
  deepFindings,
  parseDeepVerdict,
  personaMaterial,
  type DeepVerdict,
} from '../src/deep.js';
import { type Claim, type Stage, type Thesis } from '../src/model.js';

function claim(id: string, overrides: Partial<Claim> = {}): Claim {
  const stage: Stage = overrides.stage ?? 'problem';
  return {
    id,
    statement: `Statement for ${id}.`,
    confidence: 'indicated',
    critical: false,
    stage,
    source: `strategy/${stage}.md`,
    evidence: [{ method: 'interview', source: 'research/notes.md', n: 6 }],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });

/** problem-exists <- segment-is-reachable, plus an undeclared neighbour. */
const base = (): Thesis =>
  thesisOf(
    claim('problem-exists', { critical: true, confidence: 'validated' }),
    claim('segment-is-reachable', {
      stage: 'customer',
      critical: true,
      dependsOn: ['problem-exists'],
    }),
    claim('price-clears-value', { stage: 'model' }),
  );

function verdictOf(thesis: Thesis, overrides: Partial<DeepVerdict> = {}): DeepVerdict {
  return {
    claim: 'problem-exists',
    packId: buildDeepPack(thesis, 'problem-exists').packId,
    edges: [],
    personas: [],
    ...overrides,
  };
}

describe('the deep pack', () => {
  test('strips the confidence, like the council pack', () => {
    const pack = buildDeepPack(base(), 'problem-exists');

    expect(pack.target).not.toHaveProperty('confidence');
    expect(JSON.stringify(pack.candidates)).not.toContain('validated');
  });

  test('names what the graph already knows, so the panel does not re-find it', () => {
    const pack = buildDeepPack(base(), 'problem-exists');

    expect(pack.declared).toEqual(['segment-is-reachable']);
  });

  test('offers the claims that could hold an undeclared edge', () => {
    const pack = buildDeepPack(base(), 'problem-exists');

    expect(pack.candidates.map((c) => c.id)).toEqual(['price-clears-value']);
  });

  test('never offers the target itself as a candidate', () => {
    const pack = buildDeepPack(base(), 'problem-exists');

    expect(pack.candidates.map((c) => c.id)).not.toContain('problem-exists');
  });

  test('is deterministic', () => {
    expect(buildDeepPack(base(), 'problem-exists').packId).toBe(
      buildDeepPack(base(), 'problem-exists').packId,
    );
  });
});

describe('the persona gate', () => {
  test('opens when the customer stage carries real signal', () => {
    const material = personaMaterial(base());

    expect(material.available).toBe(true);
    expect(material.claims.map((c) => c.id)).toContain('segment-is-reachable');
  });

  test('stays shut when the customer claims are still assumed', () => {
    const thesis = thesisOf(
      claim('problem-exists'),
      claim('segment-is-reachable', {
        stage: 'customer',
        critical: true,
        confidence: 'assumed',
        evidence: [],
      }),
    );

    expect(personaMaterial(thesis).available).toBe(false);
  });

  test('stays shut when there is no customer stage at all', () => {
    expect(personaMaterial(thesisOf(claim('problem-exists'))).available).toBe(false);
  });

  test('says why it is shut, so the reader is not left guessing', () => {
    expect(personaMaterial(thesisOf(claim('problem-exists'))).reason).toContain('customer');
  });

  test('a shut gate keeps personas out of the pack entirely', () => {
    const pack = buildDeepPack(thesisOf(claim('problem-exists')), 'problem-exists');

    expect(pack.personas.available).toBe(false);
    expect(pack.personas.claims).toEqual([]);
  });
});

describe('undeclared edges', () => {
  function withEdge(thesis: Thesis, seats: string[]): DeepVerdict {
    return verdictOf(thesis, {
      edges: [{ from: 'price-clears-value', seats, note: 'Price is set from the claimed cost.' }],
    });
  }

  test('one seat out of three is noise', () => {
    expect(deepFindings(base(), withEdge(base(), ['premise-tracer']))).toEqual([]);
  });

  test('two seats agreeing is reported', () => {
    const findings = deepFindings(base(), withEdge(base(), ['premise-tracer', 'number-tracer']));

    expect(findings.map((f) => f.code)).toContain('whatif-undeclared-edge');
  });

  test('names both claims, so the fix is obvious', () => {
    const findings = deepFindings(base(), withEdge(base(), ['premise-tracer', 'number-tracer']));

    expect(findings[0]?.message).toContain('price-clears-value');
    expect(findings[0]?.message).toContain('problem-exists');
  });

  test('says nothing about an edge the graph already declares', () => {
    const verdict = verdictOf(base(), {
      edges: [
        {
          from: 'segment-is-reachable',
          seats: ['premise-tracer', 'number-tracer', 'retraction-tester'],
          note: 'Obviously depends.',
        },
      ],
    });

    expect(deepFindings(base(), verdict)).toEqual([]);
  });

  test('reports an edge from a claim that does not exist rather than dropping it', () => {
    const verdict = verdictOf(base(), {
      edges: [{ from: 'ghost', seats: ['premise-tracer', 'number-tracer'], note: 'x' }],
    });

    expect(deepFindings(base(), verdict).map((f) => f.code)).toContain('whatif-unknown-claim');
  });
});

describe('persona impact', () => {
  const indifferent = (thesis: Thesis): DeepVerdict =>
    verdictOf(thesis, {
      personas: [
        { persona: 'A', source: 'research/a.md', impact: 'changes-nothing', note: 'n' },
        { persona: 'B', source: 'research/b.md', impact: 'changes-nothing', note: 'n' },
      ],
    });

  test('flags a claim no persona would notice losing', () => {
    const findings = deepFindings(base(), indifferent(base()));

    expect(findings.map((f) => f.code)).toContain('whatif-persona-indifferent');
  });

  test('says nothing when a persona would lose something', () => {
    const verdict = verdictOf(base(), {
      personas: [
        { persona: 'A', source: 'research/a.md', impact: 'removes-need', note: 'n' },
        { persona: 'B', source: 'research/b.md', impact: 'changes-nothing', note: 'n' },
      ],
    });

    expect(deepFindings(base(), verdict)).toEqual([]);
  });

  test('a single persona is not a panel, so it reports nothing', () => {
    const verdict = verdictOf(base(), {
      personas: [{ persona: 'A', source: 'research/a.md', impact: 'changes-nothing', note: 'n' }],
    });

    expect(deepFindings(base(), verdict)).toEqual([]);
  });

  test('a persona with no source is refused, because it is then invented', () => {
    const result = parseDeepVerdict(
      JSON.stringify({
        claim: 'problem-exists',
        packId: 'x',
        personas: [{ persona: 'A', impact: 'changes-nothing', note: 'n' }],
      }),
    );

    expect(result.issues.join(' ')).toContain('source');
  });
});

describe('a deep run can never raise a confidence', () => {
  test('every finding is a warning', () => {
    const verdict = verdictOf(base(), {
      edges: [
        { from: 'price-clears-value', seats: ['premise-tracer', 'number-tracer'], note: 'n' },
      ],
      personas: [
        { persona: 'A', source: 'a.md', impact: 'changes-nothing', note: 'n' },
        { persona: 'B', source: 'b.md', impact: 'changes-nothing', note: 'n' },
      ],
    });

    const findings = deepFindings(base(), verdict);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.severity === 'warning')).toBe(true);
  });

  test('a panel that finds nothing produces nothing', () => {
    expect(deepFindings(base(), verdictOf(base()))).toEqual([]);
  });

  test('the thesis is never mutated', () => {
    const thesis = base();
    deepFindings(thesis, verdictOf(thesis));

    expect(thesis.claims.find((c) => c.id === 'problem-exists')?.confidence).toBe('validated');
  });
});

describe('reading a deep verdict', () => {
  test('catches a verdict written against wording that has changed', () => {
    const stale = verdictOf(base(), { packId: 'deadbeef' });

    expect(deepFindings(base(), stale).map((f) => f.code)).toContain('whatif-pack-stale');
  });

  test('refuses an impact that is not one', () => {
    const result = parseDeepVerdict(
      JSON.stringify({
        claim: 'problem-exists',
        packId: 'x',
        personas: [{ persona: 'A', source: 'a.md', impact: 'meh', note: '' }],
      }),
    );

    expect(result.issues.join(' ')).toContain('meh');
  });

  test('refuses a seat nobody sits in', () => {
    const result = parseDeepVerdict(
      JSON.stringify({
        claim: 'problem-exists',
        packId: 'x',
        edges: [{ from: 'a', seats: ['vibes'], note: '' }],
      }),
    );

    expect(result.issues.join(' ')).toContain('vibes');
  });

  test('refuses text that is not JSON', () => {
    expect(parseDeepVerdict('nope').verdict).toBeNull();
  });

  test('the impacts are a closed list', () => {
    expect(PERSONA_IMPACTS).toContain('changes-nothing');
    expect(EDGE_SEATS.map((s) => s.id)).toContain('premise-tracer');
  });
});
