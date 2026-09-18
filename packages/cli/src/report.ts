import {
  check,
  furthestStage,
  hasBlockingFindings,
  type CheckOptions,
  type Finding,
} from './check.js';
import { STAGES, strengthOf, type Claim, type Confidence, type Stage } from './model.js';
import type { ParseIssue } from './parse.js';
import type { Thesis } from './model.js';
import { adviseOn, riskiestAssumption } from './advice.js';

export interface StageSummary {
  readonly stage: Stage;
  readonly counts: Readonly<Record<Confidence, number>>;
  readonly claimTotal: number;
  readonly criticalTotal: number;
  readonly criticalSettled: number;
  readonly findings: number;
}

export interface Status {
  readonly stages: readonly StageSummary[];
  /** Furthest stage holding a substantiated claim, or null while all are assumed. */
  readonly reached: Stage | null;
  readonly findings: readonly Finding[];
  readonly blocked: boolean;
}

const EMPTY_COUNTS: Record<Confidence, number> = {
  assumed: 0,
  indicated: 0,
  validated: 0,
  refuted: 0,
};

function isSettled(claim: Claim): boolean {
  return claim.confidence !== 'refuted' && strengthOf(claim.confidence) >= strengthOf('indicated');
}

export function summarise(thesis: Thesis, options: CheckOptions = {}): Status {
  const findings = check(thesis, options);

  const stages = STAGES.map((stage): StageSummary => {
    const claims = thesis.claims.filter((claim) => claim.stage === stage);
    const counts = { ...EMPTY_COUNTS };
    for (const claim of claims) counts[claim.confidence] += 1;

    const critical = claims.filter((claim) => claim.critical);

    return {
      stage,
      counts,
      claimTotal: claims.length,
      criticalTotal: critical.length,
      criticalSettled: critical.filter(isSettled).length,
      findings: findings.filter((finding) =>
        claims.some((claim) => claim.id === finding.claimId),
      ).length,
    };
  });

  return {
    stages,
    reached: furthestStage(thesis.claims),
    findings,
    blocked: hasBlockingFindings(findings),
  };
}

const MARK: Record<Confidence, string> = {
  assumed: '?',
  indicated: '~',
  validated: '+',
  refuted: 'x',
};

function bar(summary: StageSummary): string {
  const parts = (['validated', 'indicated', 'assumed', 'refuted'] as const)
    .filter((confidence) => summary.counts[confidence] > 0)
    .map((confidence) => `${MARK[confidence]}${summary.counts[confidence]}`);

  return parts.length > 0 ? parts.join(' ') : '-';
}

export function renderStatus(status: Status): string {
  const lines: string[] = [];

  if (status.stages.every((summary) => summary.claimTotal === 0)) {
    return 'No claims yet. Run `flawline init` to lay out the stages, then write your first claim in strategy/problem.md.';
  }

  lines.push('stage      claims        critical settled');
  lines.push('---------  ------------  ----------------');

  for (const summary of status.stages) {
    const critical =
      summary.criticalTotal === 0
        ? '-'
        : `${summary.criticalSettled}/${summary.criticalTotal}`;
    const here = summary.stage === status.reached ? '  <- furthest' : '';
    lines.push(
      `${summary.stage.padEnd(9)}  ${bar(summary).padEnd(12)}  ${critical.padEnd(16)}${here}`,
    );
  }

  lines.push('');
  lines.push('+ validated   ~ indicated   ? assumed   x refuted');

  return lines.join('\n');
}

export function renderFindings(findings: readonly Finding[]): string {
  if (findings.length === 0) return 'No findings. Every claim is supported by what sits under it.';

  const lines = findings.map(
    (finding) =>
      `${finding.source}: ${finding.severity}: [${finding.code}] ${finding.claimId}\n    ${finding.message}`,
  );

  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.length - errors;

  lines.push('');
  lines.push(`${errors} error(s), ${warnings} warning(s).`);

  return lines.join('\n');
}

export function renderParseIssues(issues: readonly ParseIssue[]): string {
  return issues.map((issue) => `${issue.source}: cannot read: ${issue.message}`).join('\n');
}

/**
 * The report a reader actually wants: where the thesis stands, the riskiest
 * thing being believed, and the one piece of work the evidence licenses next.
 *
 * The refusal list is the load-bearing part. A summary that recommends a
 * channel on top of eight assumptions is the confident slide this project
 * exists to prevent, so a recommendation is held to the same rule as a claim
 * and may not outrun what supports it.
 */
export function renderReport(thesis: Thesis, status: Status): string {
  const lines: string[] = [];

  lines.push('Where this stands');
  lines.push('');

  for (const summary of status.stages) {
    const critical =
      summary.criticalTotal === 0 ? '-' : `${summary.criticalSettled}/${summary.criticalTotal}`;
    lines.push(`  ${summary.stage.padEnd(10)} ${critical.padEnd(6)} critical claims settled`);
  }

  const riskiest = riskiestAssumption(thesis);

  if (riskiest !== null) {
    lines.push('');
    lines.push('The riskiest thing you believe');
    lines.push('');
    lines.push(`  ${riskiest.id}  (${riskiest.stage})`);
    lines.push(`  ${riskiest.statement}`);

    const resting = thesis.claims.filter((claim) => claim.dependsOn.includes(riskiest.id)).length;
    const carried = resting === 1 ? '1 claim rests on it' : `${resting} claims rest on it`;
    lines.push(`  Nothing supports it, and ${carried}.`);
  }

  const advice = adviseOn(thesis);

  lines.push('');
  lines.push('What the evidence lets you do next');
  lines.push('');

  if (advice.next === null) {
    lines.push('  Every critical claim is settled. Go and re-measure the ones that expire.');

    return lines.join('\n');
  }

  lines.push(`  ${advice.next}`);

  if (advice.withheld.length > 0) {
    const [first] = advice.withheld;
    lines.push('');
    lines.push(
      `  Not yet: ${advice.withheld.map((item) => item.stage).join(', ')} — ${first?.because}.`,
    );
    lines.push('  This tool will not advise on those until the claims under them hold.');
  }

  return lines.join('\n');
}
