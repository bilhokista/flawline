import { describe, expect, test } from 'vitest';
import {
  COUNCIL_SEATS,
  JUDGING_SEATS,
  buildPack,
  councilFindings,
  parseVerdict,
  type CouncilVerdict,
} from '../src/council.js';
import { type Claim, type Thesis } from '../src/model.js';

function claim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'problem-exists',
    statement: 'Ops leads re-key invoice data every Monday.',
    confidence: 'validated',
    critical: true,
    stage: 'problem',
    source: 'strategy/problem.md',
    evidence: [{ method: 'interview', source: 'research/acme.md', n: 9 }],
    dependsOn: [],
    ...overrides,
  };
}

const thesisOf = (...claims: Claim[]): Thesis => ({ claims, gates: [] });

/** A verdict where every seat lets every claim stand. */
function unanimousHold(thesis: Thesis): CouncilVerdict {
  return {
    stage: 'problem',
    packId: buildPack(thesis, 'problem').packId,
    seats: JUDGING_SEATS.map((seat) => ({
      seat: seat.id,
      verdicts: thesis.claims.map((c) => ({
        claim: c.id,
        position: 'holds' as const,
        note: 'Cites a source a stranger can open.',
      })),
    })),
  };
}

describe('the pack a seat is handed', () => {
  test('never shows the confidence the founder wrote', () => {
    const pack = buildPack(thesisOf(claim({ confidence: 'validated' })), 'problem');

    // Not a substring check on the whole pack: the method-challenger's question
    // names all three confidences on purpose, because that seat is asked to
    // pick one. What must not leak is the claim's own line.
    expect(pack.claims[0]).not.toHaveProperty('confidence');
    expect(JSON.stringify(pack.claims)).not.toContain('validated');
  });

  test('still shows what a seat needs to judge: statement, evidence, dependencies', () => {
    const pack = buildPack(thesisOf(claim()), 'problem');

    expect(pack.claims[0]?.statement).toContain('re-key invoice data');
    expect(pack.claims[0]?.evidence[0]?.method).toBe('interview');
    expect(pack.claims[0]?.evidence[0]?.n).toBe(9);
  });

  test('carries only the stage asked for', () => {
    const pack = buildPack(
      thesisOf(claim(), claim({ id: 'what-is-mine', stage: 'advantage' })),
      'problem',
    );

    expect(pack.claims.map((c) => c.id)).toEqual(['problem-exists']);
  });

  test('seats every chair, with the chairman last', () => {
    const pack = buildPack(thesisOf(claim()), 'problem');

    expect(pack.seats).toHaveLength(COUNCIL_SEATS.length);
    expect(pack.seats.at(-1)?.id).toBe('chairman');
  });

  test('is deterministic: the same thesis produces the same packId', () => {
    const a = buildPack(thesisOf(claim()), 'problem');
    const b = buildPack(thesisOf(claim()), 'problem');

    expect(a.packId).toBe(b.packId);
  });

  test('changes packId when a statement changes, so a stale verdict is caught', () => {
    const a = buildPack(thesisOf(claim()), 'problem');
    const b = buildPack(thesisOf(claim({ statement: 'Something else entirely.' })), 'problem');

    expect(a.packId).not.toBe(b.packId);
  });
});

describe('a council can never raise a confidence', () => {
  test('unanimous agreement produces no findings at all', () => {
    const thesis = thesisOf(claim());

    expect(councilFindings(thesis, unanimousHold(thesis))).toEqual([]);
  });

  test('every finding it does produce is a warning, so the build stays green', () => {
    const thesis = thesisOf(claim());
    const verdict = unanimousHold(thesis);
    const doubted = {
      ...verdict,
      seats: verdict.seats.map((s) => ({
        ...s,
        verdicts: [{ claim: 'problem-exists', position: 'doubted' as const, note: 'Reasoning.' }],
      })),
    };

    const findings = councilFindings(thesis, doubted);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.severity === 'warning')).toBe(true);
  });
});

describe('dissent', () => {
  function withDoubters(thesis: Thesis, count: number): CouncilVerdict {
    const base = unanimousHold(thesis);
    return {
      ...base,
      seats: base.seats.map((seat, index) => ({
        ...seat,
        verdicts: seat.verdicts.map((v) => ({
          ...v,
          position: index < count ? ('doubted' as const) : ('holds' as const),
        })),
      })),
    };
  }

  test('one seat out of four is noise, not a finding', () => {
    const thesis = thesisOf(claim());

    expect(councilFindings(thesis, withDoubters(thesis, 1))).toEqual([]);
  });

  test('half the seats doubting is reported', () => {
    const thesis = thesisOf(claim());
    const findings = councilFindings(thesis, withDoubters(thesis, 2));

    expect(findings.map((f) => f.code)).toContain('council-dissent');
  });

  test('names the count, so the reader can weigh it', () => {
    const thesis = thesisOf(claim());
    const findings = councilFindings(thesis, withDoubters(thesis, 3));

    expect(findings[0]?.message).toContain(`3 of ${JUDGING_SEATS.length}`);
  });

  test('the chairman does not vote, it synthesises', () => {
    expect(JUDGING_SEATS.map((s) => s.id)).not.toContain('chairman');
    expect(COUNCIL_SEATS.map((s) => s.id)).toContain('chairman');
  });
});

describe('the blind ceiling estimate', () => {
  function withCeiling(
    thesis: Thesis,
    supports: 'assumed' | 'indicated' | 'validated',
  ): CouncilVerdict {
    const base = unanimousHold(thesis);
    return {
      ...base,
      seats: base.seats.map((s) =>
        s.seat === 'method-challenger'
          ? { ...s, verdicts: s.verdicts.map((v) => ({ ...v, supports })) }
          : s,
      ),
    };
  }

  test('flags a claim written stronger than a seat who never saw it would allow', () => {
    const thesis = thesisOf(claim({ confidence: 'validated' }));
    const findings = councilFindings(thesis, withCeiling(thesis, 'indicated'));

    expect(findings.map((f) => f.code)).toContain('council-ceiling-dissent');
    expect(findings.find((f) => f.code === 'council-ceiling-dissent')?.message).toContain(
      'indicated',
    );
  });

  test('says nothing when the blind estimate matches what was written', () => {
    const thesis = thesisOf(claim({ confidence: 'indicated' }));

    expect(councilFindings(thesis, withCeiling(thesis, 'indicated'))).toEqual([]);
  });

  test('a generous estimate never lifts anything', () => {
    const thesis = thesisOf(claim({ confidence: 'assumed' }));

    expect(councilFindings(thesis, withCeiling(thesis, 'validated'))).toEqual([]);
  });
});

describe('reading a verdict file', () => {
  test('rejects a verdict for a pack that has since changed', () => {
    const thesis = thesisOf(claim());
    const stale = { ...unanimousHold(thesis), packId: 'deadbeef' };
    const result = parseVerdict(JSON.stringify(stale));

    expect(result.verdict).not.toBeNull();
    expect(councilFindings(thesis, result.verdict as CouncilVerdict).map((f) => f.code)).toContain(
      'council-pack-stale',
    );
  });

  test('rejects a seat nobody sits in', () => {
    const result = parseVerdict(
      JSON.stringify({ stage: 'problem', packId: 'x', seats: [{ seat: 'vibes', verdicts: [] }] }),
    );

    expect(result.issues.join(' ')).toContain('vibes');
  });

  test('rejects a position that is not a position', () => {
    const result = parseVerdict(
      JSON.stringify({
        stage: 'problem',
        packId: 'x',
        seats: [
          { seat: 'evidence-auditor', verdicts: [{ claim: 'a', position: 'maybe', note: '' }] },
        ],
      }),
    );

    expect(result.issues.join(' ')).toContain('maybe');
  });

  test('rejects text that is not a verdict at all', () => {
    expect(parseVerdict('not json').issues.length).toBeGreaterThan(0);
    expect(parseVerdict('not json').verdict).toBeNull();
  });

  test('a verdict about a claim that does not exist is reported, not silently dropped', () => {
    const thesis = thesisOf(claim());
    const base = unanimousHold(thesis);
    const ghost: CouncilVerdict = {
      ...base,
      seats: base.seats.map((s) => ({
        ...s,
        verdicts: [{ claim: 'ghost-claim', position: 'doubted' as const, note: 'x' }],
      })),
    };

    expect(councilFindings(thesis, ghost).map((f) => f.code)).toContain('council-unknown-claim');
  });
});
