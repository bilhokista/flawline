import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { parseArgs, run } from '../src/cli.js';
import { JUDGING_SEATS, type CouncilPack } from '../src/council.js';
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
      Ops leads re-key invoice data between two systems every Monday.
    confidence: validated
    critical: true
    depends_on: []
    evidence:
      - method: interview
        source: research/acme.md
        n: 9
        collected_at: 2026-09-12
---

## What would refute this

Five ops leads who cannot recall doing it.
`;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'flawline-council-'));
  await mkdir(join(root, STRATEGY_DIR), { recursive: true });
  await writeFile(join(root, STRATEGY_DIR, 'problem.md'), PROBLEM, 'utf8');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function readPack(): Promise<CouncilPack> {
  return JSON.parse(
    await readFile(join(root, '.flawline/council/problem.json'), 'utf8'),
  ) as CouncilPack;
}

describe('parseArgs for council', () => {
  test('takes the stage as a positional', () => {
    expect(parseArgs(['council', 'problem'])).toMatchObject({
      command: 'council',
      target: 'problem',
      error: null,
    });
  });

  test('reads --ingest', () => {
    expect(parseArgs(['council', '--ingest', 'v.json']).ingest).toBe('v.json');
  });

  test('refuses --ingest with nothing after it', () => {
    expect(parseArgs(['council', '--ingest']).error).toContain('--ingest');
  });

  test('still refuses a positional on commands that take none', () => {
    expect(parseArgs(['check', 'problem']).error).toContain('Unexpected argument');
  });
});

describe('flawline council <stage>', () => {
  test('writes a pack and says what to do with it', async () => {
    const result = await run(['council', 'problem', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('.flawline/council/problem.json');
    expect(result.out).toContain('--ingest');
  });

  test('the written pack withholds the confidence', async () => {
    await run(['council', 'problem', '-C', root]);
    const pack = await readPack();

    expect(JSON.stringify(pack.claims)).not.toContain('validated');
    expect(pack.claims[0]?.statement).toContain('re-key invoice data');
  });

  test('names the stages when none was given', async () => {
    const result = await run(['council', '-C', root]);

    expect(result.code).toBe(2);
    expect(result.out).toContain('problem');
  });

  test('refuses a stage that is not a stage', async () => {
    const result = await run(['council', 'vibes', '-C', root]);

    expect(result.code).toBe(2);
    expect(result.out).toContain('Unknown stage');
  });

  test('says so when the stage has no claims to put to a panel', async () => {
    const result = await run(['council', 'motion', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('No claims');
  });
});

describe('flawline council --ingest', () => {
  async function ingest(verdict: unknown): Promise<{ code: number; out: string }> {
    const file = join(root, 'verdict.json');
    await writeFile(file, JSON.stringify(verdict), 'utf8');
    return run(['council', '--ingest', file, '-C', root]);
  }

  async function verdictWith(position: 'holds' | 'doubted'): Promise<unknown> {
    await run(['council', 'problem', '-C', root]);
    const pack = await readPack();

    return {
      stage: 'problem',
      packId: pack.packId,
      seats: JUDGING_SEATS.map((seat) => ({
        seat: seat.id,
        verdicts: [{ claim: 'problem-exists', position, note: 'n' }],
      })),
    };
  }

  test('reports nothing when the council agrees, and exits 0', async () => {
    const result = await ingest(await verdictWith('holds'));

    expect(result.code).toBe(0);
    expect(result.out).toContain('nothing');
  });

  test('reports dissent but still exits 0, because a panel cannot fail a build', async () => {
    const result = await ingest(await verdictWith('doubted'));

    expect(result.code).toBe(0);
    expect(result.out).toContain('council-dissent');
  });

  test('flags a verdict written against a pack that has since changed', async () => {
    const verdict = await verdictWith('holds');
    await writeFile(
      join(root, STRATEGY_DIR, 'problem.md'),
      PROBLEM.replace('every Monday', 'every Friday'),
      'utf8',
    );

    expect((await ingest(verdict)).out).toContain('council-pack-stale');
  });

  test('refuses a verdict file that is not JSON', async () => {
    const file = join(root, 'bad.json');
    await writeFile(file, 'not json', 'utf8');
    const result = await run(['council', '--ingest', file, '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('JSON');
  });

  test('says so when the verdict file is not there', async () => {
    const result = await run(['council', '--ingest', join(root, 'missing.json'), '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('Could not read');
  });
});
