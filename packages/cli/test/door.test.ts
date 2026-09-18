import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { run } from '../src/cli.js';
import { STRATEGY_DIR } from '../src/workspace.js';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'flawline-door-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function exists(stage: string): Promise<boolean> {
  return readFile(join(root, STRATEGY_DIR, `${stage}.md`), 'utf8').then(
    () => true,
    () => false,
  );
}

async function settleProblem(): Promise<void> {
  await writeFile(
    join(root, STRATEGY_DIR, 'problem.md'),
    [
      '---',
      'stage: problem',
      'claims:',
      '  - id: problem-exists',
      '    statement: Something goes badly',
      '    critical: true',
      '    confidence: indicated',
      '    evidence:',
      '      - method: interview',
      '        source: research.md',
      '        n: 6',
      '---',
      '',
    ].join('\n'),
    'utf8',
  );
}

describe('the door', () => {
  test('opens the first stage and holds the rest back', async () => {
    const result = await run(['init', '-C', root]);

    expect(result.code).toBe(0);
    expect(await exists('problem')).toBe(true);
    expect(await exists('advantage')).toBe(false);
    expect(await exists('offer')).toBe(false);
  });

  test('says which stages are held back, and why', async () => {
    const result = await run(['init', '-C', root]);

    expect(result.out).toContain('Not yet');
    expect(result.out).toContain('advantage');
  });

  test('points the reader at a conversation rather than at the placeholders', async () => {
    const result = await run(['init', '-C', root]);

    expect(result.out).toMatch(/interview|conversation/i);
  });

  test('opens the next stage once the one before it holds', async () => {
    await run(['init', '-C', root]);
    await settleProblem();

    const second = await run(['init', '-C', root]);

    expect(await exists('advantage')).toBe(true);
    expect(await exists('customer')).toBe(false);
    expect(second.out).toContain(`created  ${STRATEGY_DIR}/advantage.md`);
  });

  test('never overwrites a document that is already open', async () => {
    await run(['init', '-C', root]);
    const path = join(root, STRATEGY_DIR, 'problem.md');
    await writeFile(path, `${await readFile(path, 'utf8')}\nMy own notes.\n`, 'utf8');

    await run(['init', '-C', root]);

    expect(await readFile(path, 'utf8')).toContain('My own notes.');
  });
});
