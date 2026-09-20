import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { parseArgs, run } from '../src/cli.js';
import { STRATEGY_DIR } from '../src/workspace.js';

let root: string;

const PROBLEM = `---
stage: problem
gate:
  requires: indicated
  min_observations: 5
claims:
  - id: problem-exists
    statement: >-
      Homeowners cannot find a tukang they trust.
    confidence: indicated
    critical: true
    depends_on: []
    evidence:
      - method: interview
        source: research/acme.md
        n: 9
        collected_at: 2026-09-12
---

## What would refute this

Five homeowners who name a tukang they would rehire.
`;

const MOTION = `---
stage: motion
gate:
  requires: indicated
  min_observations: 5
claims:
  - id: first-channel-proven
    statement: >-
      Instagram referrals convert at four percent.
    confidence: validated
    critical: true
    depends_on: [problem-exists]
    evidence:
      - method: sale
        source: research/sales.md
        n: 20
        collected_at: 2026-09-14
---

## What would refute this

Three months of spend with no sale.
`;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'flawline-whatif-'));
  await mkdir(join(root, STRATEGY_DIR), { recursive: true });
  await writeFile(join(root, STRATEGY_DIR, 'problem.md'), PROBLEM, 'utf8');
  await writeFile(join(root, STRATEGY_DIR, 'motion.md'), MOTION, 'utf8');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('parseArgs for what-if', () => {
  test('takes the assignment as a positional', () => {
    expect(parseArgs(['what-if', 'problem-exists=refuted'])).toMatchObject({
      command: 'what-if',
      target: 'problem-exists=refuted',
      error: null,
    });
  });

  test('council still takes its own positional', () => {
    expect(parseArgs(['council', 'problem']).target).toBe('problem');
  });

  test('commands that take no positional still refuse one', () => {
    expect(parseArgs(['status', 'problem']).error).toContain('Unexpected argument');
  });
});

describe('flawline what-if', () => {
  test('names what was resting on the claim, and exits 0', async () => {
    const result = await run(['what-if', 'problem-exists=refuted', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('first-channel-proven');
    expect(result.out).toContain('motion');
  });

  test('says how much settled work is orphaned', async () => {
    const result = await run(['what-if', 'problem-exists=refuted', '-C', root]);

    expect(result.out).toContain('1 of them is currently "validated"');
  });

  test('reports what check would newly say', async () => {
    const result = await run(['what-if', 'problem-exists=refuted', '-C', root]);

    expect(result.out).toContain('rests-on-refuted');
  });

  test('says plainly that nothing happened', async () => {
    const result = await run(['what-if', 'problem-exists=refuted', '-C', root]);

    expect(result.out).toContain('Nothing was changed');
  });

  test('leaves the document exactly as it found it', async () => {
    const before = await readFile(join(root, STRATEGY_DIR, 'problem.md'), 'utf8');
    await run(['what-if', 'problem-exists=refuted', '-C', root]);
    const after = await readFile(join(root, STRATEGY_DIR, 'problem.md'), 'utf8');

    expect(after).toBe(before);
  });

  test('a leaf claim is reported as costing only itself', async () => {
    const result = await run(['what-if', 'first-channel-proven=refuted', '-C', root]);

    expect(result.out).toContain('Nothing rests on it');
  });

  test('defaults to refuted when no confidence is given', async () => {
    const result = await run(['what-if', 'problem-exists', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('were refuted');
  });

  test('emits the same content as json', async () => {
    const result = await run(['what-if', 'problem-exists=refuted', '--json', '-C', root]);
    const payload = JSON.parse(result.out) as {
      claim: string;
      validatedCount: number;
      dependents: { id: string }[];
    };

    expect(payload.claim).toBe('problem-exists');
    expect(payload.validatedCount).toBe(1);
    expect(payload.dependents.map((d) => d.id)).toEqual(['first-channel-proven']);
  });

  test('refuses a claim that is not in the thesis', async () => {
    const result = await run(['what-if', 'no-such-claim=refuted', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('No claim called');
  });

  test('refuses a confidence that is not one', async () => {
    const result = await run(['what-if', 'problem-exists=vibes', '-C', root]);

    expect(result.code).toBe(2);
    expect(result.out).toContain('vibes');
  });

  test('asks for a claim when given none', async () => {
    const result = await run(['what-if', '-C', root]);

    expect(result.code).toBe(2);
    expect(result.out).toContain('needs a claim');
  });
});
