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
  COUNCIL_DIR,
  WHATIF_DIR,
  writePack,
  writeDeepPack,
  readVerdict,
  type InitResult,
  type LoadedDocument,
} from './workspace.js';

export { STAGE_TEMPLATES } from './templates.js';

export { renderAnnotations } from './annotations.js';

export {
  checkMarketCreation,
  missingPrecautions,
  precautionsHold,
  type Precautions,
} from './market.js';

export {
  COUNCIL_SEATS,
  JUDGING_SEATS,
  POSITIONS,
  buildPack,
  councilFindings,
  parseVerdict,
  isPosition,
  type Seat,
  type Position,
  type PackedClaim,
  type CouncilPack,
  type CouncilVerdict,
  type SeatReturn,
  type SeatVerdict,
  type VerdictParse,
} from './council.js';

export {
  parseAssignment,
  whatIf,
  type Assignment,
  type WhatIfResult,
} from './whatif.js';

export {
  EDGE_SEATS,
  PERSONA_IMPACTS,
  buildDeepPack,
  deepFindings,
  parseDeepVerdict,
  personaMaterial,
  type DeepClaim,
  type DeepPack,
  type DeepVerdict,
  type DeepVerdictParse,
  type EdgeReturn,
  type PersonaImpact,
  type PersonaMaterial,
  type PersonaReturn,
} from './deep.js';
