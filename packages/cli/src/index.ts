export {
  STAGES,
  CONFIDENCE,
  METHOD_CEILINGS,
  REACH_KINDS,
  isStage,
  isConfidence,
  isReachKind,
  strengthOf,
  type Stage,
  type Confidence,
  type Claim,
  type Evidence,
  type StageGate,
  type Thesis,
  type ReachKind,
} from './model.js';

export {
  check,
  hasBlockingFindings,
  FINDING_CODES,
  type CheckOptions,
  type Finding,
  type FindingCode,
  type Severity,
} from './check.js';

export {
  parseThesis,
  parseDocument,
  extractFrontmatter,
  type ParseIssue,
  type ParseResult,
} from './parse.js';

export {
  summarise,
  renderStatus,
  renderFindings,
  renderParseIssues,
  type Status,
  type StageSummary,
} from './report.js';

export {
  init,
  loadThesis,
  loadDocuments,
  templateFor,
  STRATEGY_DIR,
  type InitResult,
  type LoadedDocument,
} from './workspace.js';

export { STAGE_TEMPLATES } from './templates.js';
