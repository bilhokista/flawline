import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { parseArgs, run } from '../src/cli.js';

let root: string;

const LANDING = `# Acme

Finance teams lose 10 hours a week to manual reporting.

Customers cut close time by 40% ([case study](https://acme.example/case)).
`;

const VERDICT = JSON.stringify({
  claims: [
    { quote: 'Finance teams lose 10 hours a week', stage: 'problem' },
    { quote: 'Customers cut close time by 40%', stage: 'offer', cites: 'https://acme.example/case' },
    { quote: 'Finance teams love Acme', stage: 'customer' },
  ],
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'flawline-xray-'));
  await writeFile(join(root, 'landing.md'), LANDING);
  await writeFile(join(root, 'verdict.json'), VERDICT);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('flawline xray', () => {
  test('takes the source document as its positional', () => {
    expect(parseArgs(['xray', 'landing.md']).target).toBe('landing.md');
  });

  test('needs a document to read', async () => {
    const outcome = await run(['xray', '-C', root]);
    expect(outcome.code).toBe(2);
    expect(outcome.out).toContain('flawline xray needs a document');
  });

  test('without a verdict, tells the agent exactly what to return', async () => {
    const outcome = await run(['xray', 'landing.md', '-C', root]);

    expect(outcome.code).toBe(0);
    expect(outcome.out).toContain('word for word');
    expect(outcome.out).toContain('flawline xray landing.md --ingest <verdict.json>');
  });

  test('fails when the document cannot be read', async () => {
    const outcome = await run(['xray', 'missing.md', '-C', root]);
    expect(outcome.code).toBe(1);
    expect(outcome.out).toContain('Could not read missing.md');
  });

  test('reports the claims it could verify and the ones it rejected', async () => {
    const outcome = await run(['xray', 'landing.md', '--ingest', 'verdict.json', '-C', root]);

    expect(outcome.code).toBe(0);
    expect(outcome.out).toContain('2 claims in landing.md. 1 point nowhere');
    expect(outcome.out).toContain('1 quote rejected');
    expect(outcome.out).toContain('"Finance teams love Acme"');
  });

  test('emits the result as JSON for another agent', async () => {
    const outcome = await run(['xray', 'landing.md', '--ingest', 'verdict.json', '--json', '-C', root]);
    const payload = JSON.parse(outcome.out) as { claims: unknown[]; rejected: unknown[] };

    expect(outcome.code).toBe(0);
    expect(payload.claims).toHaveLength(2);
    expect(payload.rejected).toHaveLength(1);
  });

  test('fails on a verdict it cannot parse', async () => {
    await writeFile(join(root, 'verdict.json'), '{"claims": [{"quote": "x", "stage": "hype"}]}');
    const outcome = await run(['xray', 'landing.md', '--ingest', 'verdict.json', '-C', root]);

    expect(outcome.code).toBe(1);
    expect(outcome.out).toContain('hype');
  });
});
