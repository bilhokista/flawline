/**
 * Claims that cannot be evidenced because the market does not exist yet.
 *
 * Every method in this tool reads demand that is already out there: what people
 * searched for, asked about, bought, complained about. A founder genuinely
 * creating a category has none of it, and never will until they have built the
 * thing. Run against them, the checker says the thesis is empty, which is true
 * and useless, and they stop using it.
 *
 * The obvious fix — a flag that exempts a claim from evidence — would be the
 * widest backdoor in the project. Every founder would take it, because every
 * founder would rather be Amundsen than be asked for a transcript.
 *
 * So the flag is not an exemption. It is a different and more expensive
 * obligation, and the argument for it is Amundsen's:
 *
 *   "Victory awaits him who has everything in order — luck, people call it.
 *    Defeat is certain for him who has neglected to take the necessary
 *    precautions in time; this is called bad luck."
 *
 * He did not improvise his way to the pole. He foresaw, laid depots, and fixed
 * his turn-back dates before leaving. Scott improvised, and Scott died. What a
 * market creator can offer in place of evidence is exactly that: a date decided
 * in advance, and a cost they have agreed to stop at.
 *
 * Which is why the date is enforced mechanically. A turn-back date honoured
 * only when it feels right is not a precaution, it is a hope — and the whole
 * point of setting one in advance is that the person at 89°S, cold and
 * committed and certain the market is nearly there, is the last person who
 * should get a vote on it.
 */
import type { Finding } from './check.js';
import type { Claim } from './model.js';

/** What a founder must fix in advance to proceed without evidence. */
export interface Precautions {
  /** ISO date this bet stops, decided before it starts. */
  readonly turnBack: string;
  /** What this may consume before it stops. The downside, capped. */
  readonly costCeiling: string;
  /** What is learned either way, so a loss is still bought and paid for. */
  readonly learn: string;
}

const MS_PER_DAY = 86_400_000;

/**
 * Methods that read demand which already exists.
 *
 * Citing one of these on a market-creation claim is a contradiction worth
 * naming: if people are already searching, asking and buying, the market is
 * there and the harder, slower path was chosen by mistake.
 *
 * Deliberately excludes the methods that measure your own selling — a landing
 * page or a demo is you making the market, not finding it.
 */
const EXISTING_DEMAND_METHODS: ReadonlySet<string> = new Set([
  'search-demand',
  'forum-question',
  'verified-review',
  'shipped-workaround',
  'incident-record',
]);

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** The fields a claim is missing before it may proceed on precautions alone. */
export function missingPrecautions(claim: Claim): string[] {
  const precautions = claim.precautions;

  if (precautions === undefined) return ['turn_back', 'cost_ceiling', 'learn'];

  const missing: string[] = [];

  if (!isDate(precautions.turnBack)) missing.push('turn_back');
  if (precautions.costCeiling.trim() === '') missing.push('cost_ceiling');
  if (precautions.learn.trim() === '') missing.push('learn');

  return missing;
}

/**
 * Whether a claim may currently stand in for evidence it does not have.
 *
 * Complete precautions, and time still on the clock. Both, always: an expired
 * set is not a weaker precaution, it is the moment the precaution was for.
 */
export function precautionsHold(claim: Claim, now: Date): boolean {
  if (!claim.createsMarket) return false;
  if (missingPrecautions(claim).length > 0) return false;

  const turnBack = claim.precautions?.turnBack;
  if (turnBack === undefined) return false;

  return Date.parse(turnBack) > now.getTime();
}

export function checkMarketCreation(claims: readonly Claim[], now: Date): Finding[] {
  const findings: Finding[] = [];

  for (const claim of claims) {
    if (!claim.createsMarket) continue;

    const missing = missingPrecautions(claim);

    if (missing.length > 0) {
      findings.push({
        code: 'precautions-missing',
        severity: 'error',
        claimId: claim.id,
        source: claim.source,
        message: `Declares "creates_market" without ${missing.join(', ')}. Proceeding without evidence is allowed here, and it is not free: name the date this stops, what it may cost before it does, and what you learn either way. A bet with no stopping rule is not a bet, it is a hope with a budget.`,
      });
      continue;
    }

    findings.push(...expiry(claim, now));
    findings.push(...contradiction(claim));
  }

  return findings;
}

/**
 * The turn-back date, honoured whether or not it is convenient.
 *
 * Only for a claim still unsettled. One that reached `validated` won its bet
 * and one marked `refuted` has already been written off; neither needs to be
 * told the date has passed.
 */
function expiry(claim: Claim, now: Date): Finding[] {
  const turnBack = claim.precautions?.turnBack as string;

  if (Date.parse(turnBack) > now.getTime()) {
    const days = Math.ceil((Date.parse(turnBack) - now.getTime()) / MS_PER_DAY);

    return [
      {
        code: 'proceeding-without-evidence',
        severity: 'warning',
        claimId: claim.id,
        source: claim.source,
        message: `Standing on precautions rather than evidence, for ${days} more day(s), until ${turnBack}. That is a legitimate way to carry a claim nobody can evidence yet, and it is not the same as having evidence. On ${turnBack} this becomes an error and the stages behind it close again.`,
      },
    ];
  }

  if (claim.confidence === 'refuted') return [];
  if (claim.confidence === 'validated') return [];

  return [
    {
      code: 'turn-back-passed',
      severity: 'error',
      claimId: claim.id,
      source: claim.source,
      message: `The turn-back date was ${turnBack} and this claim is still "${claim.confidence}". You set that date yourself, before starting, for this moment — when you are far enough in to be certain it is nearly there. Mark it "refuted" and take what you learned, or move the date deliberately and in writing, knowing that is what you are doing.`,
    },
  ];
}

/** A market that turns out to have been there all along. */
function contradiction(claim: Claim): Finding[] {
  const found = claim.evidence.filter((entry) => EXISTING_DEMAND_METHODS.has(entry.method));

  if (found.length === 0) return [];

  return [
    {
      code: 'market-already-exists',
      severity: 'warning',
      claimId: claim.id,
      source: claim.source,
      message: `Declares "creates_market" while citing ${found.map((entry) => entry.method).join(', ')} — evidence of demand that is already out there. Creating a market is the expensive path. If people are already searching and asking, drop the flag and use the evidence, which is worth more than the precautions are.`,
    },
  ];
}
