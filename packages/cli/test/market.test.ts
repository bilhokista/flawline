import { describe, expect, test } from 'vitest';
import { check } from '../src/check.js';
import { precautionsHold } from '../src/market.js';
import { type Claim, type Stage, type Thesis } from '../src/model.js';

const NOW = new Date('2026-09-20T00:00:00Z');

function claim(id: string, overrides: Partial<Claim> = {}): Claim {
  const stage: Stage = overrides.stage ?? 'problem';
  return {
    id,
    statement: `Statement for ${id}.`,
    confidence: 'assumed',
    critical: true,
    stage,
    source: `strategy/${stage}.md`,
    evidence: [],
    dependsOn: [],
    createsMarket: false,
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });
const codes = (thesis: Thesis): string[] =>
  check(thesis, { now: NOW }).map((f) => f.code);

/** A market-creation claim with every precaution in place and time left. */
function creator(overrides: Partial<Claim> = {}): Claim {
  return claim('problem-exists', {
    createsMarket: true,
    precautions: {
      turnBack: '2026-12-01',
      costCeiling: 'Rp 40,000,000 and my own time until December.',
      learn: 'Whether anyone will pay for a category that does not exist yet.',
    },
    ...overrides,
  });
}

describe('precautions are the price of proceeding without evidence', () => {
  test('a market-creation claim without precautions is refused', () => {
    const findings = check(thesisOf(creator({ precautions: undefined })), { now: NOW });

    expect(findings.map((f) => f.code)).toContain('precautions-missing');
  });

  test('the refusal names what is missing rather than the whole block', () => {
    const findings = check(
      thesisOf(
        creator({
          precautions: {
            turnBack: '2026-12-01',
            costCeiling: '',
            learn: 'Something.',
          },
        }),
      ),
      { now: NOW },
    );

    expect(findings.find((f) => f.code === 'precautions-missing')?.message).toContain(
      'cost_ceiling',
    );
  });

  test('a turn-back date that is not a date is refused', () => {
    const findings = check(
      thesisOf(creator({ precautions: { turnBack: 'soon', costCeiling: 'x', learn: 'y' } })),
      { now: NOW },
    );

    expect(findings.map((f) => f.code)).toContain('precautions-missing');
  });

  test('a complete set, still in date, holds', () => {
    expect(precautionsHold(creator(), NOW)).toBe(true);
  });

  test('an expired set does not hold, however complete', () => {
    const expired = creator({
      precautions: { turnBack: '2026-01-01', costCeiling: 'x', learn: 'y' },
    });

    expect(precautionsHold(expired, NOW)).toBe(false);
  });

  test('an ordinary claim never holds under precautions it did not declare', () => {
    expect(precautionsHold(claim('problem-exists'), NOW)).toBe(false);
  });
});

describe('the date was set in advance, so it is enforced', () => {
  test('a passed turn-back date on an unsettled claim is an error', () => {
    const findings = check(
      thesisOf(creator({ precautions: { turnBack: '2026-01-01', costCeiling: 'x', learn: 'y' } })),
      { now: NOW },
    );

    expect(findings.map((f) => f.code)).toContain('turn-back-passed');
  });

  test('the error says the date was the author’s own', () => {
    const findings = check(
      thesisOf(creator({ precautions: { turnBack: '2026-01-01', costCeiling: 'x', learn: 'y' } })),
      { now: NOW },
    );

    expect(findings.find((f) => f.code === 'turn-back-passed')?.message).toContain('2026-01-01');
  });

  test('a claim that reached validated before the date is left alone', () => {
    const won = creator({
      confidence: 'validated',
      evidence: [{ method: 'sale', source: 'research/sales.md', n: 6 }],
      precautions: { turnBack: '2026-01-01', costCeiling: 'x', learn: 'y' },
    });

    expect(codes(thesisOf(won))).not.toContain('turn-back-passed');
  });

  test('a claim already written off as refuted is left alone', () => {
    const lost = creator({
      confidence: 'refuted',
      precautions: { turnBack: '2026-01-01', costCeiling: 'x', learn: 'y' },
    });

    expect(codes(thesisOf(lost))).not.toContain('turn-back-passed');
  });
});

describe('proceeding is allowed, and never silent', () => {
  test('a valid creator warns on every run', () => {
    expect(codes(thesisOf(creator()))).toContain('proceeding-without-evidence');
  });

  test('the warning names the date the founder set', () => {
    const findings = check(thesisOf(creator()), { now: NOW });

    expect(findings.find((f) => f.code === 'proceeding-without-evidence')?.message).toContain(
      '2026-12-01',
    );
  });

  test('it is a warning, so a declared bet does not fail a build', () => {
    const findings = check(thesisOf(creator()), { now: NOW });
    const warning = findings.find((f) => f.code === 'proceeding-without-evidence');

    expect(warning?.severity).toBe('warning');
  });
});

describe('it unblocks the pipeline, and only while the precautions hold', () => {
  // A full spine, so the ordering rules have something real to read. Downstream
  // claims stay `assumed`: the precaution buys the right to work on them, not
  // the right to state them more strongly than the bet they rest on.
  const advantage = (): Claim =>
    claim('what-is-authentically-mine', {
      stage: 'advantage',
      confidence: 'indicated',
      evidence: [{ method: 'self-report', source: 'research/me.md', n: 1 }],
    });

  const downstream = (): Claim =>
    claim('segment-is-reachable', {
      stage: 'customer',
      dependsOn: ['problem-exists'],
    });

  test('an assumed creator does not block the stages after it', () => {
    const found = codes(thesisOf(creator(), advantage(), downstream()));

    expect(found).not.toContain('gate-not-met');
    expect(found).not.toContain('stage-opened-early');
  });

  test('an ordinary assumed claim still blocks, so this is not a general loophole', () => {
    const found = codes(thesisOf(claim('problem-exists'), advantage(), downstream()));

    expect(found).toContain('gate-not-met');
  });

  test('once the date passes the pipeline slams shut again', () => {
    const expired = creator({
      precautions: { turnBack: '2026-01-01', costCeiling: 'x', learn: 'y' },
    });
    const found = codes(thesisOf(expired, advantage(), downstream()));

    expect(found).toContain('gate-not-met');
    expect(found).toContain('turn-back-passed');
  });

  test('a creator with no precautions unblocks nothing', () => {
    const found = codes(thesisOf(creator({ precautions: undefined }), advantage(), downstream()));

    expect(found).toContain('gate-not-met');
  });

  test('it buys ordering, never strength: downstream still cannot outrun the bet', () => {
    const strong = claim('segment-is-reachable', {
      stage: 'customer',
      confidence: 'indicated',
      dependsOn: ['problem-exists'],
      evidence: [{ method: 'interview', source: 'research/a.md', n: 6 }],
    });

    expect(codes(thesisOf(creator(), advantage(), strong))).toContain('overreach');
  });
});

describe('creating a market you did not have to create', () => {
  test('is flagged when demand evidence is already cited', () => {
    const contradiction = creator({
      evidence: [{ method: 'search-demand', source: 'research/keywords.md', n: 40 }],
    });

    expect(codes(thesisOf(contradiction))).toContain('market-already-exists');
  });

  test('is not flagged for evidence that is about your own selling', () => {
    const selling = creator({
      evidence: [{ method: 'landing-page', source: 'research/page.md', n: 12 }],
    });

    expect(codes(thesisOf(selling))).not.toContain('market-already-exists');
  });
});

describe('the flag buys no confidence', () => {
  test('a creator is still held to the method ceilings', () => {
    const overreaching = creator({
      confidence: 'validated',
      evidence: [{ method: 'interview', source: 'research/a.md', n: 900 }],
    });

    expect(codes(thesisOf(overreaching))).toContain('method-ceiling');
  });

  test('an ordinary thesis is untouched by any of this', () => {
    const ordinary = claim('problem-exists', {
      confidence: 'indicated',
      evidence: [{ method: 'interview', source: 'research/a.md', n: 6 }],
    });

    const found = codes(thesisOf(ordinary));

    expect(found).not.toContain('proceeding-without-evidence');
    expect(found).not.toContain('precautions-missing');
    expect(found).not.toContain('turn-back-passed');
  });
});
