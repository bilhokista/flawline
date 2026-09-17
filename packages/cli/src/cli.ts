#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { renderFindings, renderParseIssues, renderStatus, summarise } from './report.js';
import { init, loadThesis, STRATEGY_DIR } from './workspace.js';

const VERSION = '0.1.0';

const HELP = `thesis-os ${VERSION}

Decide what to build, for whom, and whether anyone will pay — on evidence
rather than on confidence. Strategy lives in ${STRATEGY_DIR}/*.md, in git,
next to the code.

Usage
  thesis-os init      Lay out the seven stage documents (never overwrites)
  thesis-os status    Show how far the thesis has come and what is settled
  thesis-os check     Fail if any claim leans on more support than it has

Options
  -C, --cwd <dir>     Run against another directory
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
  readonly version: boolean;
  readonly error: string | null;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  let command: string | null = null;
  let cwd = process.cwd();
  let help = false;
  let version = false;
  let error: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;

    if (argument === '-h' || argument === '--help') {
      help = true;
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

  return { command, cwd, help, version, error };
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
    case 'check':
      return runCheck(args.cwd);
    default:
      return { code: 2, out: `Unknown command: ${args.command}\n\n${HELP}` };
  }
}

async function runInit(cwd: string): Promise<RunOutcome> {
  const result = await init(cwd);
  const lines: string[] = [];

  for (const file of result.created) lines.push(`created  ${file}`);
  for (const file of result.skipped) lines.push(`kept     ${file}`);

  lines.push('');
  lines.push(
    result.created.length > 0
      ? `Start in ${STRATEGY_DIR}/problem.md. Replace the placeholder statements with what you actually believe, then run \`thesis-os check\`.`
      : 'Everything was already in place. Nothing was overwritten.',
  );

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
    lines.push(`${status.findings.length} finding(s). Run \`thesis-os check\` for detail.`);
  }

  return { code: 0, out: lines.join('\n') };
}

async function runCheck(cwd: string): Promise<RunOutcome> {
  const { thesis, issues } = await loadThesis(cwd);

  if (issues.length > 0) {
    return { code: 1, out: renderParseIssues(issues) };
  }

  if (thesis.claims.length === 0) {
    return {
      code: 1,
      out: `No claims found in ${STRATEGY_DIR}/. Run \`thesis-os init\` first.`,
    };
  }

  const status = summarise(thesis);

  return {
    code: status.blocked ? 1 : 0,
    out: renderFindings(status.findings),
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
      process.stderr.write(`thesis-os failed: ${detail}\n`);
      process.exitCode = 1;
    });
}
/* c8 ignore stop */
