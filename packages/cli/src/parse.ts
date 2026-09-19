import { parse as parseYaml } from 'yaml';
import {
  isConfidence,
  isStage,
  type Claim,
  type Evidence,
  type Stage,
  type StageGate,
  type Thesis,
} from './model.js';

export interface ParseIssue {
  readonly source: string;
  readonly message: string;
}

export interface ParseResult {
  readonly thesis: Thesis;
  readonly issues: readonly ParseIssue[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/** Pulls the YAML block off the top of a document. Returns null when absent. */
export function extractFrontmatter(document: string): string | null {
  const match = FRONTMATTER.exec(document);
  return match?.[1] ?? null;
}

/**
 * Everything below the frontmatter block: the document as a reader sees it.
 *
 * A document with no frontmatter comes back whole, because the reader still has
 * prose in front of them even when the parser has nothing.
 */
export function proseBelow(document: string): string {
  const match = FRONTMATTER.exec(document);
  return match ? document.slice(match[0].length) : document;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readEvidence(
  raw: unknown,
  source: string,
  claimId: string,
  issues: ParseIssue[],
): Evidence[] {
  if (raw === undefined || raw === null) return [];

  if (!Array.isArray(raw)) {
    issues.push({ source, message: `Claim "${claimId}": "evidence" must be a list.` });
    return [];
  }

  const evidence: Evidence[] = [];

  raw.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) {
      issues.push({ source, message: `Claim "${claimId}": evidence[${index}] must be a mapping.` });
      return;
    }

    const method = record['method'];
    const evidenceSource = record['source'];

    if (typeof method !== 'string' || method.trim() === '') {
      issues.push({ source, message: `Claim "${claimId}": evidence[${index}] needs a "method".` });
      return;
    }
    if (typeof evidenceSource !== 'string' || evidenceSource.trim() === '') {
      issues.push({
        source,
        message: `Claim "${claimId}": evidence[${index}] needs a "source" a reader can check.`,
      });
      return;
    }

    const rawCount = record['n'];
    let n: number | undefined;
    if (rawCount !== undefined && rawCount !== null) {
      if (typeof rawCount !== 'number' || !Number.isInteger(rawCount) || rawCount < 1) {
        issues.push({
          source,
          message: `Claim "${claimId}": evidence[${index}] "n" must be a positive whole number.`,
        });
        return;
      }
      n = rawCount;
    }

    const collectedAt = record['collected_at'] ?? record['collectedAt'];

    evidence.push({
      method,
      source: evidenceSource,
      ...(n !== undefined ? { n } : {}),
      ...(typeof collectedAt === 'string' ? { collectedAt } : {}),
    });
  });

  return evidence;
}

function readDependsOn(
  raw: unknown,
  source: string,
  claimId: string,
  issues: ParseIssue[],
): string[] {
  if (raw === undefined || raw === null) return [];

  if (!Array.isArray(raw)) {
    issues.push({
      source,
      message: `Claim "${claimId}": "depends_on" must be a list of claim ids.`,
    });
    return [];
  }

  return raw.filter((id): id is string => {
    if (typeof id === 'string' && id.trim() !== '') return true;
    issues.push({ source, message: `Claim "${claimId}": "depends_on" entries must be claim ids.` });
    return false;
  });
}

function readGate(
  raw: unknown,
  stage: Stage,
  source: string,
  issues: ParseIssue[],
): StageGate | null {
  const record = asRecord(raw);
  if (!record) return null;

  const minRaw = record['min_observations'] ?? record['minObservations'];
  const requiresRaw = record['requires'];

  let minObservations = 5;
  if (minRaw !== undefined && minRaw !== null) {
    if (typeof minRaw !== 'number' || !Number.isInteger(minRaw) || minRaw < 1) {
      issues.push({
        source,
        message: `Stage "${stage}": gate "min_observations" must be a positive whole number.`,
      });
      return null;
    }
    minObservations = minRaw;
  }

  let requires: 'assumed' | 'indicated' | 'validated' = 'indicated';
  if (requiresRaw !== undefined && requiresRaw !== null) {
    if (typeof requiresRaw !== 'string' || !isConfidence(requiresRaw) || requiresRaw === 'refuted') {
      issues.push({
        source,
        message: `Stage "${stage}": gate "requires" must be one of assumed, indicated, validated.`,
      });
      return null;
    }
    requires = requiresRaw;
  }

  const halfLifeRaw = record['evidence_half_life_days'] ?? record['evidenceHalfLifeDays'];
  let evidenceHalfLifeDays: number | undefined;
  if (halfLifeRaw !== undefined && halfLifeRaw !== null) {
    if (typeof halfLifeRaw !== 'number' || !Number.isInteger(halfLifeRaw) || halfLifeRaw < 1) {
      issues.push({
        source,
        message: `Stage "${stage}": gate "evidence_half_life_days" must be a positive whole number of days, or omitted for no expiry.`,
      });
      return null;
    }
    evidenceHalfLifeDays = halfLifeRaw;
  }

  return {
    stage,
    minObservations,
    requires,
    ...(evidenceHalfLifeDays !== undefined ? { evidenceHalfLifeDays } : {}),
  };
}

/**
 * Locates the line a claim's id is written on, scanning forward so repeated
 * ids map to their own declarations in order.
 *
 * Only a plainly written id is matched. YAML can express the same string a
 * dozen ways, and guessing at a folded or anchored one would put an
 * annotation on the wrong claim, which is worse than putting it on none.
 */
function makeLineFinder(document: string): (id: string) => number | undefined {
  const lines = document.split(/\r?\n/);
  let cursor = 0;

  return (id: string): number | undefined => {
    for (let index = cursor; index < lines.length; index += 1) {
      const text = lines[index] as string;
      const match = /^\s*-?\s*id:\s*(.*?)\s*$/.exec(text);
      if (!match) continue;

      const written = (match[1] as string).replace(/^(['"])([\s\S]*)\1$/, '$2');
      if (written !== id) continue;

      cursor = index + 1;
      return index + 1;
    }

    return undefined;
  };
}

/** Reads one stage document into claims plus its optional gate override. */
export function parseDocument(
  document: string,
  source: string,
): { claims: Claim[]; gate: StageGate | null; issues: ParseIssue[]; prose: string } {
  const issues: ParseIssue[] = [];
  const frontmatter = extractFrontmatter(document);
  const prose = proseBelow(document);

  if (frontmatter === null) {
    issues.push({
      source,
      message: 'No YAML frontmatter found. A stage document must open with a --- block.',
    });
    return { claims: [], gate: null, issues, prose };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatter);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    issues.push({ source, message: `Frontmatter is not valid YAML: ${detail}` });
    return { claims: [], gate: null, issues, prose };
  }

  const record = asRecord(parsed);
  if (!record) {
    issues.push({ source, message: 'Frontmatter must be a mapping.' });
    return { claims: [], gate: null, issues, prose };
  }

  const stageRaw = record['stage'];
  if (typeof stageRaw !== 'string' || !isStage(stageRaw)) {
    issues.push({
      source,
      message: `"stage" must be one of problem, customer, offer, model, evidence, narrative, motion (got ${JSON.stringify(stageRaw)}).`,
    });
    return { claims: [], gate: null, issues, prose };
  }
  const stage: Stage = stageRaw;

  const gate = readGate(record['gate'], stage, source, issues);

  const claimsRaw = record['claims'];
  if (claimsRaw === undefined || claimsRaw === null) {
    return { claims: [], gate, issues, prose };
  }
  if (!Array.isArray(claimsRaw)) {
    issues.push({ source, message: '"claims" must be a list.' });
    return { claims: [], gate, issues, prose };
  }

  const claims: Claim[] = [];
  const lineOf = makeLineFinder(document);

  claimsRaw.forEach((entry, index) => {
    const claimRecord = asRecord(entry);
    if (!claimRecord) {
      issues.push({ source, message: `claims[${index}] must be a mapping.` });
      return;
    }

    const id = claimRecord['id'];
    if (typeof id !== 'string' || id.trim() === '') {
      issues.push({ source, message: `claims[${index}] needs a non-empty "id".` });
      return;
    }

    const statement = claimRecord['statement'];
    if (typeof statement !== 'string' || statement.trim() === '') {
      issues.push({
        source,
        message: `Claim "${id}" needs a "statement" saying what is believed.`,
      });
      return;
    }

    const confidenceRaw = claimRecord['confidence'] ?? 'assumed';
    if (typeof confidenceRaw !== 'string' || !isConfidence(confidenceRaw)) {
      issues.push({
        source,
        message: `Claim "${id}": "confidence" must be one of assumed, indicated, validated, refuted.`,
      });
      return;
    }

    const criticalRaw = claimRecord['critical'] ?? false;
    if (typeof criticalRaw !== 'boolean') {
      issues.push({ source, message: `Claim "${id}": "critical" must be true or false.` });
      return;
    }

    const line = lineOf(id);

    claims.push({
      id,
      statement,
      confidence: confidenceRaw,
      critical: criticalRaw,
      ...(line !== undefined ? { line } : {}),
      stage,
      source,
      evidence: readEvidence(claimRecord['evidence'], source, id, issues),
      dependsOn: readDependsOn(
        claimRecord['depends_on'] ?? claimRecord['dependsOn'],
        source,
        id,
        issues,
      ),
    });
  });

  return { claims, gate, issues, prose };
}

/** Assembles a thesis from every stage document found. */
export function parseThesis(
  documents: readonly { source: string; content: string }[],
): ParseResult {
  const claims: Claim[] = [];
  const gates: StageGate[] = [];
  const issues: ParseIssue[] = [];
  const prose = new Map<string, string>();

  for (const document of documents) {
    const result = parseDocument(document.content, document.source);
    claims.push(...result.claims);
    if (result.gate) gates.push(result.gate);
    issues.push(...result.issues);
    prose.set(document.source, result.prose);
  }

  return { thesis: { claims, gates, prose }, issues };
}
