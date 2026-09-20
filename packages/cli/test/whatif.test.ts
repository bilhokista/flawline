import { describe, expect, test } from 'vitest';
import { parseAssignment, whatIf } from '../src/whatif.js';
import { type Claim, type Stage, type Thesis } from '../src/model.js';

function claim(id: string, overrides: Partial<Claim> = {}): Claim {
  const stage: Stage = overrides.stage ?? 'problem';
  return {
    id,
    statement: `Statement for ${id}.`,
    confidence: 'validated',
    critical: false,
    stage,
    source: `strategy/${stage}.md`,
    evidence: [{ method: 'sale', source: 'research/sales.md', n: 6 }],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });

/** problem-exists <- they-will-switch <- channel-works */
const chain = (): Thesis =>
  thesisOf(
    claim('problem-exists', { critical: true }),
    claim('they-will-switch', { stage: 'offer', dependsOn: ['problem-exists'] }),
    claim('channel-works', { stage: 'motion', dependsOn: ['they-will-switch'] }),
    claim('unrelated', { stage: 'advantage' }),
  );

describe('reading the assignment', () => {
  test('reads claim=confidence', () => {
    expect(parseAssignment('problem-exists=refuted')).toEqual({
      claimId: 'problem-exists',
      confidence: 'refuted',
      error: null,
    });
  });

  test('defaults to refuted, which is the question people are asking', () => {
    expect(parseAssignment('problem-exists')).toMatchObject({
      claimId: 'problem-exists',
      confidence: 'refuted',
    });
  });

  test('refuses a confidence that is not one', () => {
    expect(parseAssignment('problem-exists=vibes').error).toContain('vibes');
  });

  test('refuses an empty claim id', () => {
    expect(parseAssignment('=refuted').error).not.toBeNull();
  });
});

describe('the blast radius', () => {
  test('reports the claim itself as the one that fell', () => {
    const result = whatIf(chain(), 'problem-exists', 'refuted');

    expect(result.target.id).toBe('problem-exists');
  });

  test('follows dependents transitively, not just the direct ones', () => {
    const result = whatIf(chain(), 'problem-exists', 'refuted');

    expect(result.dependents.map((c) => c.id)).toEqual(['they-will-switch', 'channel-works']);
  });

  test('leaves alone what does not rest on it', () => {
    const result = whatIf(chain(), 'problem-exists', 'refuted');

    expect(result.dependents.map((c) => c.id)).not.toContain('unrelated');
  });

  test('a leaf claim takes nothing down with it', () => {
    const result = whatIf(chain(), 'channel-works', 'refuted');

    expect(result.dependents).toEqual([]);
  });

  test('names the stages that would have to reopen', () => {
    const result = whatIf(chain(), 'problem-exists', 'refuted');

    expect(result.stagesAffected).toEqual(['problem', 'offer', 'motion']);
  });

  test('counts what was settled and is now resting on nothing', () => {
    const result = whatIf(chain(), 'problem-exists', 'refuted');

    expect(result.validatedCount).toBe(2);
  });
});

describe('findings the counterfactual introduces', () => {
  test('reports what check would newly say, not what it already says', () => {
    const result = whatIf(chain(), 'problem-exists', 'refuted');

    expect(result.introduced.some((f) => f.code === 'rests-on-refuted')).toBe(true);
  });

  test('does not repeat a finding the thesis already has', () => {
    const broken = thesisOf(
      claim('problem-exists', { confidence: 'refuted' }),
      claim('they-will-switch', { stage: 'offer', dependsOn: ['problem-exists'] }),
    );

    // `they-will-switch` already rests on a refuted claim, so refuting
    // something else must not re-report it as newly broken.
    const result = whatIf(broken, 'they-will-switch', 'refuted');

    expect(result.introduced.some((f) => f.claimId === 'they-will-switch')).toBe(false);
  });
});

describe('it is a question, not an edit', () => {
  test('the thesis handed in is not mutated', () => {
    const thesis = chain();
    whatIf(thesis, 'problem-exists', 'refuted');

    expect(thesis.claims.find((c) => c.id === 'problem-exists')?.confidence).toBe('validated');
  });

  test('asking twice gives the same answer', () => {
    const a = whatIf(chain(), 'problem-exists', 'refuted');
    const b = whatIf(chain(), 'problem-exists', 'refuted');

    expect(a.introduced).toEqual(b.introduced);
    expect(a.dependents.map((c) => c.id)).toEqual(b.dependents.map((c) => c.id));
  });
});

describe('unknown claims', () => {
  test('returns the claim as missing rather than guessing', () => {
    expect(whatIf(chain(), 'no-such-claim', 'refuted').target).toBeNull();
  });
});

describe('a cycle cannot hang the walk', () => {
  test('terminates when two claims depend on each other', () => {
    const cyclic = thesisOf(
      claim('a', { dependsOn: ['b'] }),
      claim('b', { dependsOn: ['a'] }),
    );

    expect(whatIf(cyclic, 'a', 'refuted').dependents.map((c) => c.id)).toEqual(['b']);
  });
});
