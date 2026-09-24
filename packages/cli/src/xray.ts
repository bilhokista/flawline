/**
 * What an existing document is asserting, and which of it points anywhere.
 *
 * Nobody arrives with an empty `strategy/` folder. They arrive with a landing
 * page, a deck, a README, a Notion page — prose where the claim backed by a
 * case study and the claim someone typed at midnight are set in the same font.
 * `init` asks them to start again from a blank template, which is the most
 * expensive possible first minute.
 *
 * So the work splits the way `council` and `what-if --deep` split it. A model
 * reads the prose and quotes every sentence that asserts something about the
 * world, because finding assertions in prose is reading, and reading is what a
 * model is for. This module then refuses anything it cannot check for itself:
 * every quote must appear in the source word for word, a citation only counts
 * when the source actually carries it, and a number is spotted by looking at
 * it rather than by asking. A model that paraphrases, embellishes or invents a
 * claim gets that item rejected and named in the output.
 *
 * It never writes a strategy document. What an x-ray finds is a list of things
 * the page believes, all of them `assumed` until someone goes and checks, and
 * the founder decides which of them become claims.
 */
import { isStage, STAGES, type Stage } from './model.js';

export interface XrayItem {
  readonly quote: string;
  readonly stage: Stage;
  /** Where the source says the claim comes from, as the source spells it. */
  readonly cites: string | null;
}

export interface ParsedXrayVerdict {
  readonly items: readonly XrayItem[];
  readonly error: string | null;
}

export type Support = 'pointed' | 'none';

export interface XrayClaim extends XrayItem {
  /** `pointed` when the source itself names where the claim came from. */
  readonly support: Support;
  readonly hasNumber: boolean;
}

export interface Rejection {
  readonly quote: string;
  readonly reason: string;
}

export interface XrayResult {
  /** Verified claims, in pipeline order. */
  readonly claims: readonly XrayClaim[];
  readonly rejected: readonly Rejection[];
}

const NOT_IN_SOURCE = 'not in the source word for word';

export function parseXrayVerdict(raw: string): ParsedXrayVerdict {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { items: [], error: 'The x-ray verdict is not valid JSON.' };
  }

  const claims = (parsed as { claims?: unknown } | null)?.claims;

  if (!Array.isArray(claims)) {
    return { items: [], error: 'The x-ray verdict needs a `claims` array.' };
  }

  const items: XrayItem[] = [];

  for (const [index, entry] of claims.entries()) {
    const { quote, stage, cites } = (entry ?? {}) as Record<string, unknown>;

    if (typeof quote !== 'string' || quote.trim() === '') {
      return { items: [], error: `Claim ${index + 1} has no quote.` };
    }

    if (typeof stage !== 'string' || !isStage(stage)) {
      return {
        items: [],
        error: `Claim ${index + 1} names stage "${String(stage)}". Use one of ${STAGES.join(', ')}.`,
      };
    }

    items.push({
      quote: quote.trim(),
      stage,
      cites: typeof cites === 'string' && cites.trim() !== '' ? cites.trim() : null,
    });
  }

  return { items, error: null };
}

export function xray(source: string, items: readonly XrayItem[]): XrayResult {
  const haystack = normalise(source);
  const seen = new Set<string>();
  const claims: XrayClaim[] = [];
  const rejected: Rejection[] = [];

  for (const item of items) {
    const needle = normalise(item.quote);

    if (seen.has(needle)) continue;
    seen.add(needle);

    if (!haystack.includes(needle)) {
      rejected.push({ quote: item.quote, reason: NOT_IN_SOURCE });
      continue;
    }

    const pointed = item.cites !== null && haystack.includes(normalise(item.cites));

    claims.push({
      ...item,
      support: pointed ? 'pointed' : 'none',
      hasNumber: carriesNumber(item.quote),
    });
  }

  return {
    claims: [...claims].sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage)),
    rejected,
  };
}

/**
 * Prose writes its numbers out: "nine interviews", "twice as fast", "half of
 * teams". Those read as measured exactly as much as digits do. "One" is left
 * out because "the one we built" is not a count.
 */
const NUMBER_WORDS =
  /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozens?|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundreds?|thousands?|millions?|billions?|half|twice|double|triple|percent)\b/i;

function carriesNumber(quote: string): boolean {
  return /\d/.test(quote) || NUMBER_WORDS.test(quote);
}

/**
 * Makes a quote comparable to the page it came from.
 *
 * Markdown emphasis, typographic quotes and dashes, line wrapping and case all
 * differ between what a model copies and what the file holds, without
 * changing a single word. Anything beyond that is a different sentence.
 */
function normalise(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function renderXray(result: XrayResult, sourceName: string): string {
  const { claims, rejected } = result;
  const guesses = claims.filter((claim) => claim.support === 'none');
  const bareNumbers = guesses.filter((claim) => claim.hasNumber);
  const lines: string[] = [];

  lines.push(
    `${plural(claims.length, 'claim')} in ${sourceName}. ${guesses.length} point nowhere: ` +
      'nothing on the page says where they came from.',
  );

  if (bareNumbers.length === 1) {
    lines.push('1 of them is a number, which reads as measured and was not shown to be.');
  } else if (bareNumbers.length > 1) {
    lines.push(`${bareNumbers.length} of them are numbers, which read as measured and were not shown to be.`);
  }

  if (claims.length > 0) {
    lines.push('');
    const width = Math.max(...claims.map((claim) => claim.stage.length));

    for (const claim of claims) {
      const tag = claim.support === 'pointed' ? `points to ${claim.cites}` : 'points nowhere';
      lines.push(`  ${claim.stage.padEnd(width)}  "${claim.quote}"`);
      lines.push(`  ${' '.repeat(width)}  ${tag}${claim.hasNumber && claim.support === 'none' ? ', and carries a number' : ''}`);
    }
  }

  const foundation = guesses[0];

  if (foundation) {
    lines.push('');
    lines.push(
      claims.length > 1
        ? 'The rest of the page leans on this one, and nothing on the page backs it:'
        : 'Nothing on the page backs it:',
    );
    lines.push(`  "${foundation.quote}"`);
    lines.push(`Check that one first. Every claim on the page starts as \`assumed\`.`);
  }

  if (rejected.length > 0) {
    lines.push('');
    lines.push(`${plural(rejected.length, 'quote')} rejected: ${NOT_IN_SOURCE}.`);
    for (const rejection of rejected) lines.push(`  "${rejection.quote}"`);
  }

  return lines.join('\n');
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
