import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { parseArgs, run } from '../src/cli.js';
import { STAGES } from '../src/model.js';
import { STAGE_TEMPLATES } from '../src/templates.js';

const PACKAGE_VERSION = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version as string;
import { check } from '../src/check.js';
import { STAGES } from '../src/model.js';
import { loadThesis, init, STRATEGY_DIR } from '../src/workspace.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'flawline-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function writeStage(name: string, content: string): Promise<void> {
  await mkdir(join(root, STRATEGY_DIR), { recursive: true });
  await writeFile(join(root, STRATEGY_DIR, name), content, 'utf8');
}

describe('parseArgs', () => {
  test('reads a bare command', () => {
    expect(parseArgs(['check'])).toMatchObject({ command: 'check', error: null });
  });

  test('reads the directory option in both spellings', () => {
    expect(parseArgs(['check', '-C', '/tmp/x']).cwd).toBe('/tmp/x');
    expect(parseArgs(['check', '--cwd', '/tmp/y']).cwd).toBe('/tmp/y');
  });

  test('refuses a directory option with no value', () => {
    expect(parseArgs(['check', '-C']).error).toContain('needs a directory');
  });

  test('refuses a directory option followed by another flag', () => {
    expect(parseArgs(['check', '-C', '--help']).error).toContain('needs a directory');
  });

  test('refuses an unknown option', () => {
    expect(parseArgs(['--wat']).error).toContain('Unknown option');
  });

  test('refuses a second positional argument', () => {
    expect(parseArgs(['check', 'twice']).error).toContain('Unexpected argument');
  });

  test('recognises help and version in both spellings', () => {
    expect(parseArgs(['-h']).help).toBe(true);
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-v']).version).toBe(true);
    expect(parseArgs(['--version']).version).toBe(true);
  });
});

describe('run', () => {
  test('prints help and succeeds when given nothing', async () => {
    const result = await run([]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('flawline init');
  });

  test('counts the stage documents it will actually write', async () => {
    const result = await run([]);

    expect(result.out).toContain(`${STAGES.length} stage documents`);
    expect(result.out).not.toContain('seven stage documents');
  });

  test('prints the version', async () => {
    expect(await run(['--version'])).toEqual({ code: 0, out: PACKAGE_VERSION });
  });

  test('the plugin manifests carry the same version as the package', async () => {
    const read = async (path: string) =>
      JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8')) as {
        version?: string;
        metadata?: { version?: string };
        plugins?: { version?: string }[];
      };

    const plugin = await read('../../../.claude-plugin/plugin.json');
    const marketplace = await read('../../../.claude-plugin/marketplace.json');

    expect(plugin.version).toBe(PACKAGE_VERSION);
    expect(marketplace.metadata?.version).toBe(PACKAGE_VERSION);
    expect(marketplace.plugins?.[0]?.version).toBe(PACKAGE_VERSION);
  });

  test('the version it prints is the one it will be published under', async () => {
    const manifest = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { version: string };

    expect((await run(['--version'])).out).toBe(manifest.version);
  });

  test('exits 2 on an unknown command', async () => {
    const result = await run(['sell']);

    expect(result.code).toBe(2);
    expect(result.out).toContain('Unknown command: sell');
  });

  test('exits 2 on a malformed command line', async () => {
    expect((await run(['--nope'])).code).toBe(2);
  });
});

describe('machine readable output', () => {
  test('report --json carries the state, the riskiest claim and the advice', async () => {
    await init(root);

    const result = await run(['report', '--json', '-C', root]);
    const payload = JSON.parse(result.out);

    expect(result.code).toBe(0);
    expect(payload.stages).toHaveLength(STAGES.length);
    expect(payload.riskiest.id).toBe('problem-exists');
    expect(payload.advice.stage).toBe('problem');
    expect(payload.advice.next).toContain('five');
    expect(payload.advice.withheld.map((item: { stage: string }) => item.stage)).toContain('offer');
  });

  test('check --json carries the findings and keeps the exit code', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: S\n    confidence: validated\n---\n',
    );

    const result = await run(['check', '--json', '-C', root]);
    const payload = JSON.parse(result.out);

    expect(result.code).toBe(1);
    expect(payload.blocked).toBe(true);
    expect(payload.findings[0].code).toBe('unsupported-confidence');
  });

  test('a clean check in json says so without any prose', async () => {
    await init(root);

    const result = await run(['check', '--json', '-C', root]);
    const payload = JSON.parse(result.out);

    expect(result.code).toBe(0);
    expect(payload.findings).toEqual([]);
    expect(payload.blocked).toBe(false);
  });

  test('check --format github annotates each finding at its claim', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: S\n    confidence: validated\n---\n',
    );

    const result = await run(['check', '--format', 'github', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('::error file=');
    expect(result.out).toContain('line=4');
    expect(result.out).toContain('title=flawline%3A unsupported-confidence');
  });

  test('a clean check in github format has nothing to annotate', async () => {
    await init(root);

    const result = await run(['check', '--format', 'github', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toBe('');
  });

  test('--format json matches the older --json spelling', async () => {
    await init(root);

    const viaFlag = await run(['check', '--json', '-C', root]);
    const viaFormat = await run(['check', '--format', 'json', '-C', root]);

    expect(viaFormat).toEqual(viaFlag);
  });

  test('says so when --format is given nothing to read', async () => {
    const result = await run(['check', '--format']);

    expect(result.code).toBe(2);
    expect(result.out).toContain('--format needs a format.');
  });

  test('refuses a format it cannot produce', async () => {
    const result = await run(['check', '--format', 'xml']);

    expect(result.code).toBe(2);
    expect(result.out).toContain('--format must be one of text, json, github');
  });

  test('github format is only meaningful for check', async () => {
    const result = await run(['report', '--format', 'github', '-C', root]);

    expect(result.code).toBe(2);
    expect(result.out).toContain('--format github only applies to `flawline check`');
  });
});

describe('report', () => {
  test('a day-one thesis is told to go and talk to people, and nothing else', async () => {
    await init(root);

    const result = await run(['report', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('five');
    expect(result.out).toContain('Not yet');
    expect(result.out).toMatch(/offer/i);
    expect(result.out).not.toMatch(/funnel/i);
  });

  test('names the riskiest thing being believed', async () => {
    await init(root);

    const result = await run(['report', '-C', root]);

    expect(result.out).toContain('riskiest');
    expect(result.out).toContain('problem-exists');
  });

  test('says so plainly when there are no claims at all', async () => {
    const result = await run(['report', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('No claims');
  });
});

async function layDownEveryStage(): Promise<void> {
  await mkdir(join(root, STRATEGY_DIR), { recursive: true });
  for (const stage of STAGES) {
    await writeFile(join(root, STRATEGY_DIR, `${stage}.md`), STAGE_TEMPLATES[stage], 'utf8');
  }
}

describe('init', () => {
  test('opens the first stage only', async () => {
    const result = await run(['init', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain(`created  ${STRATEGY_DIR}/problem.md`);
    expect(result.out).not.toContain(`created  ${STRATEGY_DIR}/offer.md`);
  });

  test('is safe to run twice and never overwrites edits', async () => {
    await run(['init', '-C', root]);
    const path = join(root, STRATEGY_DIR, 'problem.md');
    const edited = await readFile(path, 'utf8');
    await writeFile(path, `${edited}\nMy own notes.\n`, 'utf8');

    const second = await run(['init', '-C', root]);

    expect(second.code).toBe(0);
    expect(second.out).toContain(`kept     ${STRATEGY_DIR}/problem.md`);
    expect(await readFile(path, 'utf8')).toContain('My own notes.');
  });

  test('tells a first-time reader what this is before asking anything of them', async () => {
    const out = (await run(['init', '-C', root])).out;

    expect(out).toContain('What this is');
    expect(out).toContain('assumed');
    expect(out).toContain('in order');
    expect(out).toContain('a conversation');
    expect(out).toContain(`${STRATEGY_DIR}/problem.md`);
  });

  test('does not repeat the introduction once the documents exist', async () => {
    await init(root);

    const out = (await run(['init', '-C', root])).out;

    expect(out).not.toContain('What this is');
    expect(out).toContain('already in place');
  });

  test('reports when there was nothing left to create', async () => {
    await init(root);

    expect((await run(['init', '-C', root])).out).toContain('already in place');
  });
});

describe('the scaffolded thesis', () => {
  test('parses with no issues', async () => {
    await init(root);

    const { issues } = await loadThesis(root);

    expect(issues).toEqual([]);
  });

  test('passes check, because every starter claim admits it is an assumption', async () => {
    await layDownEveryStage();

    const { thesis } = await loadThesis(root);

    expect(check(thesis)).toEqual([]);
  });

  test('declares claims in every stage', async () => {
    await layDownEveryStage();

    const { thesis } = await loadThesis(root);
    const stagesWithClaims = new Set(thesis.claims.map((claim) => claim.stage));

    expect([...stagesWithClaims].sort()).toEqual([...STAGES].sort());
  });

  test('wires every dependency to a claim that exists', async () => {
    await init(root);

    const { thesis } = await loadThesis(root);
    const ids = new Set(thesis.claims.map((claim) => claim.id));
    const dangling = thesis.claims.flatMap((claim) =>
      claim.dependsOn.filter((id) => !ids.has(id)).map((id) => `${claim.id} -> ${id}`),
    );

    expect(dangling).toEqual([]);
  });

  test('every stage carries at least one critical claim', async () => {
    await layDownEveryStage();

    const { thesis } = await loadThesis(root);

    for (const stage of STAGES) {
      const critical = thesis.claims.filter((c) => c.stage === stage && c.critical);
      expect(critical.length, `${stage} has no critical claim`).toBeGreaterThan(0);
    }
  });
});

describe('check', () => {
  test('tells an uninitialised project what to do', async () => {
    const result = await run(['check', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('flawline init');
  });

  test('exits 1 and names the file when a document cannot be read', async () => {
    await writeStage('problem.md', '# no frontmatter here\n');

    const result = await run(['check', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('strategy/problem.md: cannot read:');
  });

  test('exits 0 when claims are honest about being assumptions', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: Something hurts\n---\n',
    );

    const result = await run(['check', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('No findings');
  });

  test('exits 1 when a claim outruns its evidence', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: Something hurts\n    confidence: validated\n---\n',
    );

    const result = await run(['check', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('unsupported-confidence');
    expect(result.out).toContain('1 error(s)');
  });

  test('exits 1 when a later stage claims evidence over an unsettled earlier one', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: Something hurts\n    critical: true\n---\n',
    );
    await writeStage(
      'motion.md',
      '---\nstage: motion\nclaims:\n  - id: m\n    statement: Ads reach them\n    confidence: indicated\n    evidence:\n      - method: pilot\n        source: ads.md\n        n: 2\n---\n',
    );

    const result = await run(['check', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('gate-not-met');
  });

  test('exits 0 when later stages are only sketched, because planning is free', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: Something hurts\n    critical: true\n---\n',
    );
    await writeStage(
      'motion.md',
      '---\nstage: motion\nclaims:\n  - id: m\n    statement: Ads might reach them\n---\n',
    );

    const result = await run(['check', '-C', root]);

    expect(result.code).toBe(0);
  });
});

describe('status', () => {
  test('nudges an empty project toward init', async () => {
    const result = await run(['status', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('No claims yet');
  });

  test('shows the stage table and marks the furthest stage', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: S\n    critical: true\n    confidence: indicated\n    evidence:\n      - method: interview\n        source: r.md\n        n: 6\n---\n',
    );
    await writeStage(
      'customer.md',
      '---\nstage: customer\nclaims:\n  - id: c\n    statement: S\n---\n',
    );

    const result = await run(['status', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).toContain('problem');
    expect(result.out).toContain('1/1');
    expect(result.out).toContain('<- furthest');
  });

  test('a freshly laid out thesis shows the table, and marks no stage as furthest', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: S\n---\n',
    );

    const result = await run(['status', '-C', root]);

    expect(result.code).toBe(0);
    expect(result.out).not.toContain('No claims yet');
    expect(result.out).toContain('problem');
    expect(result.out).not.toContain('<- furthest');
  });

  test('the furthest stage is the last one that settled something, not the last one written', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: S\n    confidence: indicated\n    evidence:\n      - method: interview\n        source: r.md\n        n: 6\n---\n',
    );
    await writeStage(
      'motion.md',
      '---\nstage: motion\nclaims:\n  - id: m\n    statement: S\n---\n',
    );

    const result = await run(['status', '-C', root]);

    expect(result.out).toMatch(/problem.*<- furthest/);
    expect(result.out).not.toMatch(/motion.*<- furthest/);
  });

  test('points at check when there are findings', async () => {
    await writeStage(
      'problem.md',
      '---\nstage: problem\nclaims:\n  - id: p\n    statement: S\n    confidence: validated\n---\n',
    );

    const result = await run(['status', '-C', root]);

    expect(result.out).toContain('flawline check');
  });

  test('exits 1 and reports unreadable documents rather than a table', async () => {
    await writeStage('problem.md', 'garbage\n');

    const result = await run(['status', '-C', root]);

    expect(result.code).toBe(1);
    expect(result.out).toContain('cannot read');
  });
});

describe('document discovery', () => {
  test('ignores files that are not markdown', async () => {
    await init(root);
    await writeFile(join(root, STRATEGY_DIR, 'notes.txt'), 'not a stage', 'utf8');

    const { issues } = await loadThesis(root);

    expect(issues).toEqual([]);
  });

  test('reads documents in pipeline order, not alphabetical order', async () => {
    await layDownEveryStage();

    const { thesis } = await loadThesis(root);
    const order = [...new Set(thesis.claims.map((claim) => claim.stage))];

    expect(order).toEqual([...STAGES]);
  });
});
