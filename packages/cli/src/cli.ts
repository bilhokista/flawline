#!/usr/bin/env node
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
  renderFindings,
  renderParseIssues,
  findingsPayload,
  renderReport,
  renderStatus,
  reportPayload,
  summarise,
} from './report.js';
import { renderAnnotations } from './annotations.js';
import { isStage, STAGES } from './model.js';
import { buildPack, councilFindings, parseVerdict } from './council.js';
import { parseAssignment, whatIf, type WhatIfResult } from './whatif.js';
import { buildDeepPack, deepFindings, parseDeepVerdict, type DeepPack } from './deep.js';
import {
  init,
  loadThesis,
  readVerdict,
  writeDeepPack,
  writePack,
  STRATEGY_DIR,
} from './workspace.js';

/**
 * Read from the manifest rather than typed here, so the version the tool
 * reports cannot drift from the version it is published under. The help text
 * already drifted once by naming a number instead of counting.
 */
const VERSION = (
  createRequire(import.meta.url)('../package.json') as { version: string }
).version;

const HELP = `flawline ${VERSION}

Decide what to build, for whom, and whether anyone will pay — on evidence
rather than on confidence. Strategy lives in ${STRATEGY_DIR}/*.md, in git,
next to the code.

Usage
  flawline init      Lay out the ${STAGES.length} stage documents (never overwrites)
  flawline status    Show how far the thesis has come and what is settled
  flawline report    Say where this stands and what the evidence lets you do
  flawline check     Fail if any claim leans on more support than it has
  flawline council   Put a stage to a panel that is not shown your conclusions
  flawline what-if   Knock out a claim and see what was resting on it
                     (--deep also asks a panel which edges you never declared)

Options
  -C, --cwd <dir>     Run against another directory
      --format <fmt>  text (default), json for another agent, or github to
                      annotate the claims in a pull request
      --json          Shorthand for --format json
      --ingest <file> Read a panel's verdict back in (council and what-if)
      --deep          Ask a panel for the edges the graph cannot see
  -h, --help          Show this
  -v, --version       Print the version

Exit codes
  0  nothing blocking
  1  a claim outruns its evidence, or a document could not be read
  2  the command line was wrong
`;

export const FORMATS = ['text', 'json', 'github'] as const;

export type Format = (typeof FORMATS)[number];

/**
 * Commands that take a positional argument: the stage `council` convenes on,
 * and the claim `what-if` knocks out.
 */
const COMMANDS_WITH_TARGET: ReadonlySet<string> = new Set(['council', 'what-if']);

function isFormat(value: string): value is Format {
  return (FORMATS as readonly string[]).includes(value);
}

interface ParsedArgs {
  readonly command: string | null;
  /** A positional after the command, e.g. the stage `council` runs against. */
  readonly target: string | null;
  readonly ingest: string | null;
  readonly deep: boolean;
  readonly cwd: string;
  readonly help: boolean;
  readonly format: Format;
  readonly version: boolean;
  readonly error: string | null;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  let command: string | null = null;
  let target: string | null = null;
  let ingest: string | null = null;
  let deep = false;
  let cwd = process.cwd();
  let help = false;
  let format: Format = 'text';
  let version = false;
  let error: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;

    if (argument === '-h' || argument === '--help') {
      help = true;
    } else if (argument === '--json') {
      format = 'json';
    } else if (argument === '--format') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) {
        error = '--format needs a format.';
        break;
      }
      if (!isFormat(value)) {
        error = `--format must be one of ${FORMATS.join(', ')} (got ${value}).`;
        break;
      }
      format = value;
      index += 1;
    } else if (argument === '--deep') {
      deep = true;
    } else if (argument === '--ingest') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) {
        error = '--ingest needs a verdict file.';
        break;
      }
      ingest = value;
      index += 1;
    } else if (argument === '-v' || argument === '--version') {
      version = true;
    } else if (argument === '-C' || argument === '--cwd') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) {
        error = `${argument} needs a directory.`;
        break;
      }
      cwd = value;
      index += 1;
    } else if (argument.startsWith('-')) {
      error = `Unknown option: ${argument}`;
      break;
    } else if (command === null) {
      command = argument;
    } else if (COMMANDS_WITH_TARGET.has(command) && target === null) {
      // Only `council` takes a positional. Every other command rejecting one is
      // load-bearing: `flawline check strategy/problem.md` looks like it would
      // check that file, and silently ignoring the path would check everything
      // while appearing to narrow.
      target = argument;
    } else {
      error = `Unexpected argument: ${argument}`;
      break;
    }
  }

  return { command, target, ingest, deep, cwd, help, format, version, error };
}

export interface RunOutcome {
  readonly code: number;
  readonly out: string;
}

export async function run(argv: readonly string[]): Promise<RunOutcome> {
  const args = parseArgs(argv);

  if (args.error) return { code: 2, out: `${args.error}\n\n${HELP}` };
  if (args.version) return { code: 0, out: VERSION };
  if (args.help || args.command === null) return { code: 0, out: HELP };

  if (args.format === 'github' && args.command !== 'check') {
    return {
      code: 2,
      out: '--format github only applies to `flawline check`, which is the command a build can fail on.',
    };
  }

  switch (args.command) {
    case 'init':
      return runInit(args.cwd);
    case 'status':
      return runStatus(args.cwd);
    case 'report':
      return runReport(args.cwd, args.format === 'json');
    case 'check':
      return runCheck(args.cwd, args.format);
    case 'council':
      return runCouncil(args.cwd, args.target, args.ingest, args.format === 'json');
    case 'what-if':
      return runWhatIf(args.cwd, args.target, args.deep, args.ingest, args.format === 'json');
    default:
      return { code: 2, out: `Unknown command: ${args.command}\n\n${HELP}` };
  }
}

/**
 * Printed once, on the run that creates the documents. A reader who has just
 * installed this has been handed eight files of placeholders and told nothing,
 * which is how the first real session went wrong: it opened by making demands
 * of someone who did not yet know what they had downloaded.
 *
 * Short enough to read standing up. It says what the thing is, what the
 * confidences mean, that `assumed` is the normal state rather than a grade,
 * and what happens next.
 */
const INTRODUCTION = `What this is

  Your strategy, as a list of claims, in git next to the code. Every claim
  records what holds it up, and \`flawline check\` fails when one is stated
  more strongly than its evidence allows.

  Three confidences do the work. \`assumed\` is a belief. \`indicated\` means
  real signal exists from outside your own head. \`validated\` means it is
  settled, and almost nothing is, for a long time.

  On day one every claim is \`assumed\`. That is not a grade and not a
  failure — it is an accurate description of day one. What the documents buy
  you is that later, when something stops being assumed, you will know exactly
  what moved it.

  The ${STAGES.length} stages run in order because the claims depend on each other, and
  each one opens only when the stage before it holds. An offer written before
  the problem is understood is a confident answer to a question nobody asked,
  so this tool will not hand you the document to write it in yet.

  This works as a conversation, not a form. Filling in the placeholders alone
  produces documents that pass the checker and tell you nothing. Bring an agent
  that will argue with you, or argue with yourself on paper.`;

async function runInit(cwd: string): Promise<RunOutcome> {
  const result = await init(cwd);
  const lines: string[] = [];

  for (const file of result.created) lines.push(`created  ${file}`);
  for (const file of result.skipped) lines.push(`kept     ${file}`);

  lines.push('');

  if (result.withheld.length > 0) {
    lines.push(
      `Not yet: ${result.withheld.join(', ')}. Each opens when the stage before it holds.`,
    );
    lines.push('');
  }

  if (result.created.length > 0) {
    lines.push(INTRODUCTION);
    lines.push('');
    lines.push(
      `Start in ${STRATEGY_DIR}/problem.md. Then \`flawline status\` for where you are,
and \`flawline check\` for what is overstated.`,
    );
  } else {
    lines.push('Everything was already in place. Nothing was overwritten.');
  }

  return { code: 0, out: lines.join('\n') };
}

async function runStatus(cwd: string): Promise<RunOutcome> {
  const { thesis, issues } = await loadThesis(cwd);

  if (issues.length > 0) {
    return { code: 1, out: renderParseIssues(issues) };
  }

  const status = summarise(thesis);
  const lines = [renderStatus(status)];

  if (status.findings.length > 0) {
    lines.push('');
    lines.push(`${status.findings.length} finding(s). Run \`flawline check\` for detail.`);
  }

  return { code: 0, out: lines.join('\n') };
}

async function runReport(cwd: string, json = false): Promise<RunOutcome> {
  const { thesis, issues } = await loadThesis(cwd);

  if (issues.length > 0) {
    return { code: 1, out: renderParseIssues(issues) };
  }

  if (thesis.claims.length === 0) {
    return {
      code: 1,
      out: `No claims found in ${STRATEGY_DIR}/. Run \`flawline init\` first.`,
    };
  }

  const status = summarise(thesis);

  return json
    ? { code: 0, out: JSON.stringify(reportPayload(thesis, status), null, 2) }
    : { code: 0, out: renderReport(thesis, status) };
}

async function runCheck(cwd: string, format: Format = 'text'): Promise<RunOutcome> {
  const { thesis, issues } = await loadThesis(cwd);

  if (issues.length > 0) {
    return { code: 1, out: renderParseIssues(issues) };
  }

  if (thesis.claims.length === 0) {
    return {
      code: 1,
      out: `No claims found in ${STRATEGY_DIR}/. Run \`flawline init\` first.`,
    };
  }

  const status = summarise(thesis);

  const out =
    format === 'json'
      ? JSON.stringify(findingsPayload(status), null, 2)
      : format === 'github'
        ? renderAnnotations(status.findings, thesis.claims)
        : renderFindings(status.findings);

  return { code: status.blocked ? 1 : 0, out };
}

/**
 * Two halves of one conversation, kept deliberately apart.
 *
 * Without `--ingest` this writes a pack and stops. With it, it reads a verdict
 * and reports. Nothing in between talks to a model, because the moment this
 * command could call one, `flawline` would need a key, a network and a budget
 * to tell a founder their claim is thin — and the answer would stop being the
 * same twice.
 */
async function runCouncil(
  cwd: string,
  target: string | null,
  ingest: string | null,
  json = false,
): Promise<RunOutcome> {
  const { thesis, issues } = await loadThesis(cwd);

  if (issues.length > 0) return { code: 1, out: renderParseIssues(issues) };

  if (thesis.claims.length === 0) {
    return { code: 1, out: `No claims found in ${STRATEGY_DIR}/. Run \`flawline init\` first.` };
  }

  if (ingest !== null) return ingestVerdict(cwd, thesis, ingest, json);

  if (target === null) {
    return {
      code: 2,
      out: `flawline council needs a stage: ${STAGES.join(', ')}.`,
    };
  }

  if (!isStage(target)) {
    return { code: 2, out: `Unknown stage: ${target}. Expected one of ${STAGES.join(', ')}.` };
  }

  const pack = buildPack(thesis, target);

  if (pack.claims.length === 0) {
    return { code: 1, out: `No claims in ${STRATEGY_DIR}/${target}.md to put to a council.` };
  }

  const path = await writePack(cwd, pack);

  if (json) return { code: 0, out: JSON.stringify(pack, null, 2) };

  return {
    code: 0,
    out: [
      `wrote  ${path}`,
      '',
      `${pack.claims.length} claim(s), ${pack.seats.length} seats. The confidences are not in the`,
      'pack: a reader shown your conclusion grades it instead of reaching one.',
      '',
      'Give the pack to a panel — models, subagents or people — then:',
      `  flawline council --ingest <verdict.json>`,
      '',
      'Nothing a council says can raise a confidence. Only evidence does that.',
    ].join('\n'),
  };
}

async function ingestVerdict(
  cwd: string,
  thesis: Awaited<ReturnType<typeof loadThesis>>['thesis'],
  file: string,
  json: boolean,
): Promise<RunOutcome> {
  let text: string;
  try {
    text = await readVerdict(cwd, file);
  } catch {
    return { code: 1, out: `Could not read the verdict at ${file}.` };
  }

  const { verdict, issues: verdictIssues } = parseVerdict(text);

  if (verdict === null) {
    return { code: 1, out: verdictIssues.map((issue) => `error: ${issue}`).join('\n') };
  }

  const findings = councilFindings(thesis, verdict);

  if (json) {
    return { code: 0, out: JSON.stringify({ findings, issues: verdictIssues }, null, 2) };
  }

  const lines: string[] = [];

  for (const issue of verdictIssues) lines.push(`note: ${issue}`);
  if (verdictIssues.length > 0) lines.push('');

  lines.push(findings.length === 0 ? 'The council found nothing the document does not already admit.' : renderFindings(findings));

  return { code: 0, out: lines.join('\n') };
}

/**
 * Answers the question without acting on it.
 *
 * Exits 0 whatever it finds. A counterfactual is not a failure: nothing here
 * happened, and a command that failed a build over something imagined would be
 * reporting damage the repository has not taken.
 */
async function runWhatIf(
  cwd: string,
  target: string | null,
  deep = false,
  ingest: string | null = null,
  json = false,
): Promise<RunOutcome> {
  if (ingest !== null) return ingestDeep(cwd, ingest, json);

  if (target === null) {
    return {
      code: 2,
      out: 'flawline what-if needs a claim, e.g. `flawline what-if problem-exists=refuted`.',
    };
  }

  const assignment = parseAssignment(target);
  if (assignment.error !== null) return { code: 2, out: assignment.error };

  const { thesis, issues } = await loadThesis(cwd);
  if (issues.length > 0) return { code: 1, out: renderParseIssues(issues) };

  if (thesis.claims.length === 0) {
    return { code: 1, out: `No claims found in ${STRATEGY_DIR}/. Run \`flawline init\` first.` };
  }

  const result = whatIf(thesis, assignment.claimId, assignment.confidence);

  if (result.target === null) {
    return {
      code: 1,
      out: `No claim called "${assignment.claimId}". Run \`flawline status\` to see the ids.`,
    };
  }

  if (deep) {
    const pack = buildDeepPack(thesis, assignment.claimId);
    const path = await writeDeepPack(cwd, pack);

    if (json) return { code: 0, out: JSON.stringify(pack, null, 2) };

    return { code: 0, out: `${renderWhatIf(result)}

${renderDeepHandoff(pack, path)}` };
  }

  return json
    ? { code: 0, out: JSON.stringify(whatIfPayload(result), null, 2) }
    : { code: 0, out: renderWhatIf(result) };
}

function whatIfPayload(result: WhatIfResult) {
  return {
    claim: result.target?.id ?? null,
    confidence: result.confidence,
    dependents: result.dependents.map((claim) => ({
      id: claim.id,
      stage: claim.stage,
      confidence: claim.confidence,
      critical: claim.critical,
    })),
    stagesAffected: result.stagesAffected,
    validatedCount: result.validatedCount,
    criticalCount: result.criticalCount,
    introduced: result.introduced,
  };
}

function renderWhatIf(result: WhatIfResult): string {
  const target = result.target as NonNullable<WhatIfResult['target']>;
  const lines: string[] = [
    `If ${target.id} were ${result.confidence} (it is ${target.confidence} today):`,
    '',
  ];

  if (result.dependents.length === 0) {
    lines.push('  Nothing rests on it. This claim is a leaf, so being wrong about');
    lines.push('  it costs you this claim and no other.');
    return lines.join('\n');
  }

  for (const claim of result.dependents) {
    const marks = [claim.confidence, claim.critical ? 'critical' : null]
      .filter((mark) => mark !== null)
      .join(', ');
    lines.push(`  ${claim.id.padEnd(28)} ${claim.stage.padEnd(10)} (${marks})`);
  }

  lines.push('');
  lines.push(
    `${result.dependents.length} claim(s) across ${result.stagesAffected.length} stage(s) would be resting on a refuted premise.`,
  );

  if (result.validatedCount > 0) {
    const one = result.validatedCount === 1;
    lines.push(
      `${result.validatedCount} of them ${one ? 'is' : 'are'} currently "validated" — settled on ${one ? 'its' : 'their'} own evidence, and orphaned by this.`,
    );
  }

  if (result.introduced.length > 0) {
    lines.push('');
    lines.push(`\`flawline check\` would newly report ${result.introduced.length} finding(s):`);
    lines.push('');
    lines.push(renderFindings(result.introduced));
  }

  lines.push('');
  lines.push('Nothing was changed. This is the graph answering a question.');

  return lines.join('\n');
}

/**
 * What the graph has just said, and what it cannot say.
 *
 * Printed under the deterministic answer rather than instead of it, because the
 * two are different kinds of claim and folding them together would make the
 * reliable half look as provisional as the panel half.
 */
function renderDeepHandoff(pack: DeepPack, path: string): string {
  const lines: string[] = [
    'The answer above is only as good as the edges someone wrote down.',
    '',
    `wrote  ${path}`,
    '',
    `${pack.candidates.length} claim(s) for a panel of ${pack.edgeSeats.length} to scan for a dependency you never declared.`,
  ];

  if (pack.personas.available) {
    lines.push(
      `Personas may be built from ${pack.personas.claims.length} grounded customer claim(s); each one must cite the source it came from.`,
    );
  } else {
    lines.push(`No personas: ${pack.personas.reason}`);
  }

  lines.push('');
  lines.push('Run the panel, then:');
  lines.push('  flawline what-if --ingest <verdict.json>');

  return lines.join('\n');
}

async function ingestDeep(cwd: string, file: string, json: boolean): Promise<RunOutcome> {
  const { thesis, issues } = await loadThesis(cwd);
  if (issues.length > 0) return { code: 1, out: renderParseIssues(issues) };

  let text: string;
  try {
    text = await readVerdict(cwd, file);
  } catch {
    return { code: 1, out: `Could not read the verdict at ${file}.` };
  }

  const { verdict, issues: verdictIssues } = parseDeepVerdict(text);

  if (verdict === null) {
    return { code: 1, out: verdictIssues.map((issue) => `error: ${issue}`).join('\n') };
  }

  if (!thesis.claims.some((claim) => claim.id === verdict.claim)) {
    return {
      code: 1,
      out: `This verdict is about "${verdict.claim}", which is not a claim in this thesis.`,
    };
  }

  const findings = deepFindings(thesis, verdict);

  if (json) {
    return { code: 0, out: JSON.stringify({ findings, issues: verdictIssues }, null, 2) };
  }

  const lines: string[] = [];

  for (const issue of verdictIssues) lines.push(`note: ${issue}`);
  if (verdictIssues.length > 0) lines.push('');

  lines.push(
    findings.length === 0
      ? 'The panel found no edge the document does not already declare.'
      : renderFindings(findings),
  );

  return { code: 0, out: lines.join('\n') };
}

/* c8 ignore start -- process wiring, exercised by the binary rather than tests */
const entry = process.argv[1];
const isDirectInvocation = entry !== undefined && import.meta.url === pathToFileURL(entry).href;

if (isDirectInvocation) {
  run(process.argv.slice(2))
    .then(({ code, out }) => {
      process.stdout.write(`${out}\n`);
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : String(error);
      process.stderr.write(`flawline failed: ${detail}\n`);
      process.exitCode = 1;
    });
}
/* c8 ignore stop */
