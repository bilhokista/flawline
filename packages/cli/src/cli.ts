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
import { STAGES } from './model.js';
import { init, loadThesis, STRATEGY_DIR } from './workspace.js';

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

Options
  -C, --cwd <dir>     Run against another directory
      --json          Emit report or check as JSON, for another agent to read
  -h, --help          Show this
  -v, --version       Print the version

Exit codes
  0  nothing blocking
  1  a claim outruns its evidence, or a document could not be read
  2  the command line was wrong
`;

interface ParsedArgs {
  readonly command: string | null;
  readonly cwd: string;
  readonly help: boolean;
  readonly json: boolean;
  readonly version: boolean;
  readonly error: string | null;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  let command: string | null = null;
  let cwd = process.cwd();
  let help = false;
  let json = false;
  let version = false;
  let error: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;

    if (argument === '-h' || argument === '--help') {
      help = true;
    } else if (argument === '--json') {
      json = true;
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
    } else {
      error = `Unexpected argument: ${argument}`;
      break;
    }
  }

  return { command, cwd, help, json, version, error };
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

  switch (args.command) {
    case 'init':
      return runInit(args.cwd);
    case 'status':
      return runStatus(args.cwd);
    case 'report':
      return runReport(args.cwd, args.json);
    case 'check':
      return runCheck(args.cwd, args.json);
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

async function runCheck(cwd: string, json = false): Promise<RunOutcome> {
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

  return {
    code: status.blocked ? 1 : 0,
    out: json ? JSON.stringify(findingsPayload(status), null, 2) : renderFindings(status.findings),
  };
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
