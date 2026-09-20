import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { isAbsolute, join, relative, sep } from 'node:path';
import { openStages } from './advice.js';
import type { CouncilPack } from './council.js';
import { STAGES, type Stage } from './model.js';
import { parseThesis, type ParseResult } from './parse.js';
import { STAGE_TEMPLATES } from './templates.js';

/** Directory, relative to the project root, where stage documents live. */
export const STRATEGY_DIR = 'strategy';

/**
 * Where council packs are written.
 *
 * Under a dot-directory because a pack is a question, not a record. The answer
 * belongs in the stage document as an edited claim or a new evidence entry; a
 * repository that keeps months of packs invites reading them as findings.
 */
export const COUNCIL_DIR = '.flawline/council';

export interface LoadedDocument {
  readonly source: string;
  readonly content: string;
}

function toPosix(path: string): string {
  return path.split(sep).join('/');
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads every stage document under `strategy/`.
 *
 * Returns an empty list rather than throwing when the directory is absent, so
 * that callers can tell an uninitialised project from a broken one.
 */
export async function loadDocuments(root: string): Promise<LoadedDocument[]> {
  const directory = join(root, STRATEGY_DIR);
  if (!(await exists(directory))) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const documents: LoadedDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const absolute = join(directory, entry.name);
    documents.push({
      source: toPosix(relative(root, absolute)),
      content: await readFile(absolute, 'utf8'),
    });
  }

  return documents.sort((a, b) => stageRank(a.source) - stageRank(b.source));
}

/**
 * Orders documents by pipeline stage rather than alphabetically, so reports
 * read in the order a founder walks the stages. Unrecognised names sort last.
 */
function stageRank(source: string): number {
  const name = source.split('/').pop()?.replace(/\.md$/, '') ?? '';
  const index = (STAGES as readonly string[]).indexOf(name);
  return index === -1 ? STAGES.length : index;
}

export async function loadThesis(root: string): Promise<ParseResult> {
  return parseThesis(await loadDocuments(root));
}

export interface InitResult {
  readonly created: readonly string[];
  readonly skipped: readonly string[];
  /** Stages not opened yet, because the claims under them do not hold. */
  readonly withheld: readonly Stage[];
}

/**
 * Lays out the stage documents. Existing files are never overwritten, so this
 * is safe to run again after a partial setup.
 */
export async function init(root: string): Promise<InitResult> {
  const directory = join(root, STRATEGY_DIR);
  await mkdir(directory, { recursive: true });

  const created: string[] = [];
  const skipped: string[] = [];

  const { thesis } = await loadThesis(root);
  const open = openStages(thesis);
  const withheld = STAGES.filter((stage) => !open.includes(stage));

  for (const stage of open) {
    const name = `${stage}.md`;
    const absolute = join(directory, name);
    const display = `${STRATEGY_DIR}/${name}`;

    if (await exists(absolute)) {
      skipped.push(display);
      continue;
    }

    await writeFile(absolute, templateFor(stage), 'utf8');
    created.push(display);
  }

  return { created, skipped, withheld };
}

export function templateFor(stage: Stage): string {
  return STAGE_TEMPLATES[stage];
}

/** Writes a council pack, returning the path a reader should hand the panel. */
export async function writePack(root: string, pack: CouncilPack): Promise<string> {
  const directory = join(root, COUNCIL_DIR);
  await mkdir(directory, { recursive: true });

  const display = `${COUNCIL_DIR}/${pack.stage}.json`;
  const body = `${JSON.stringify(pack, null, 2)}\n`;
  await writeFile(join(directory, `${pack.stage}.json`), body, 'utf8');

  return display;
}

export async function readVerdict(root: string, file: string): Promise<string> {
  return readFile(isAbsolute(file) ? file : join(root, file), 'utf8');
}
