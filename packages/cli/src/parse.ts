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

/** Reads one stage document into claims plus its optional gate override. */
export function parseDocument(
  document: string,
  source: string,
): { claims: Claim[]; gate: StageGate | null; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const frontmatter = extractFrontmatter(document);

  if (frontmatter === null) {
    issues.push({
      source,
      message: 'No YAML frontmatter found. A stage document must open with a --- block.',
    });
    return { claims: [], gate: null, issues };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatter);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    issues.push({ source, message: `Frontmatter is not valid YAML: ${detail}` });
    return { claims: [], gate: null, issues };
  }

  const record = asRecord(parsed);
  if (!record) {
    issues.push({ source, message: 'Frontmatter must be a mapping.' });
    return { claims: [], gate: null, issues };
  }

  const stageRaw = record['stage'];
  if (typeof stageRaw !== 'string' || !isStage(stageRaw)) {
    issues.push({
      source,
      message: `"stage" must be one of problem, customer, offer, model, evidence, narrative, motion (got ${JSON.stringify(stageRaw)}).`,
    });
    return { claims: [], gate: null, issues };
  }
  const stage: Stage = stageRaw;

  const gate = readGate(record['gate'], stage, source, issues);

  const claimsRaw = record['claims'];
  if (claimsRaw === undefined || claimsRaw === null) {
    return { claims: [], gate, issues };
  }
  if (!Array.isArray(claimsRaw)) {
    issues.push({ source, message: '"claims" must be a list.' });
    return { claims: [], gate, issues };
  }

  const claims: Claim[] = [];

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

    claims.push({
      id,
      statement,
      confidence: confidenceRaw,
      critical: criticalRaw,
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

  return { claims, gate, issues };
}

/** Assembles a thesis from every stage document found. */
export function parseThesis(
  documents: readonly { source: string; content: string }[],
): ParseResult {
  const claims: Claim[] = [];
  const gates: StageGate[] = [];
  const issues: ParseIssue[] = [];

  for (const document of documents) {
    const result = parseDocument(document.content, document.source);
    claims.push(...result.claims);
    if (result.gate) gates.push(result.gate);
    issues.push(...result.issues);
  }

  return { thesis: { claims, gates }, issues };
}
