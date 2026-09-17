import { check, hasBlockingFindings, type Finding } from './check.js';
import { STAGES, strengthOf, type Claim, type Confidence, type Stage } from './model.js';
import type { ParseIssue } from './parse.js';
import type { Thesis } from './model.js';

export interface StageSummary {
  readonly stage: Stage;
  readonly counts: Readonly<Record<Confidence, number>>;
  readonly criticalTotal: number;
  readonly criticalSettled: number;
  readonly findings: number;
}

export interface Status {
  readonly stages: readonly StageSummary[];
  /** Furthest stage any claim has been written in, or null for an empty thesis. */
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

export function summarise(thesis: Thesis): Status {
  const findings = check(thesis);

  const stages = STAGES.map((stage): StageSummary => {
    const claims = thesis.claims.filter((claim) => claim.stage === stage);
    const counts = { ...EMPTY_COUNTS };
    for (const claim of claims) counts[claim.confidence] += 1;

    const critical = claims.filter((claim) => claim.critical);

    return {
      stage,
      counts,
      criticalTotal: critical.length,
      criticalSettled: critical.filter(isSettled).length,
      findings: findings.filter((finding) =>
        claims.some((claim) => claim.id === finding.claimId),
      ).length,
    };
  });

  const occupied = STAGES.filter((stage) => thesis.claims.some((claim) => claim.stage === stage));

  return {
    stages,
    reached: occupied.length > 0 ? (occupied[occupied.length - 1] as Stage) : null,
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

  if (status.reached === null) {
    return 'No claims yet. Run `thesis-os init` to lay out the stages, then write your first claim in strategy/problem.md.';
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
