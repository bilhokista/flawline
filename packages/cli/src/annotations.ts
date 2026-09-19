import type { Finding } from './check.js';
import type { Claim } from './model.js';

/**
 * Renders findings as GitHub Actions workflow commands, so a failing check
 * lands on the claim in the pull request diff rather than in a log nobody
 * opens.
 *
 * A claim whose line could not be resolved is annotated at the top of its
 * file. That is still the right file, and a wrong line would be worse than an
 * imprecise one.
 */
export function renderAnnotations(
  findings: readonly Finding[],
  claims: readonly Claim[],
): string {
  const lineById = new Map(
    claims
      .filter((claim) => claim.line !== undefined)
      .map((claim) => [claim.id, claim.line as number]),
  );

  return findings
    .map((finding) => {
      const line = lineById.get(finding.claimId) ?? 1;
      const properties = [
        `file=${escapeProperty(finding.source)}`,
        `line=${line}`,
        `title=${escapeProperty(`flawline: ${finding.code}`)}`,
      ].join(',');

      return `::${finding.severity} ${properties}::${escapeData(
        `${finding.claimId} — ${finding.message}`,
      )}`;
    })
    .join('\n');
}

/** Characters that would otherwise end the command or start a new one. */
function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}
