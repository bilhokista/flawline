import { describe, expect, test } from 'vitest';
import { check, type Finding } from '../src/check.js';
import type { Claim, Confidence, Evidence, Stage, Thesis } from '../src/model.js';

const NOW = new Date('2026-09-18T00:00:00Z');

interface ClaimOverrides {
  readonly id?: string;
  readonly confidence?: Confidence;
  readonly evidence?: readonly Evidence[];
  readonly stage?: Stage;
  readonly critical?: boolean;
}

function claim(overrides: ClaimOverrides = {}): Claim {
  return {
    id: overrides.id ?? 'a-claim',
    statement: 'Something is believed to be true',
    confidence: overrides.confidence ?? 'assumed',
    evidence: overrides.evidence ?? [],
    dependsOn: [],
    critical: overrides.critical ?? false,
    stage: overrides.stage ?? 'motion',
    source: 'strategy/motion.md',
  };
}

function thesis(claims: readonly Claim[], gates: Thesis['gates'] = []): Thesis {
  return { claims, gates };
}

function codes(findings: readonly Finding[]): string[] {
  return findings.map((finding) => finding.code).sort();
}

function run(t: Thesis): Finding[] {
  return check(t, { now: NOW });
}

/** A gate with a four-month shelf life, as the model and motion stages ship. */
function decayingGate(stage: Stage = 'motion'): Thesis['gates'] {
  return [{ stage, minObservations: 1, requires: 'indicated', evidenceHalfLifeDays: 120 }];
}

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString().slice(0, 10);
}

describe('method ceilings', () => {
  test('engagement buys no confidence at all', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'indicated',
          evidence: [{ method: 'engagement', source: 'ig-insights.png', n: 4200 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
    expect(findings[0]?.message).toContain('"assumed"');
  });

  test('volume does not lift a ceiling', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [{ method: 'saves', source: 'ig-insights.png', n: 100_000 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('warm replies in DMs buy nothing', () => {
    const findings = run(
      thesis([
        claim({ confidence: 'indicated', evidence: [{ method: 'dm', source: 'chats.md', n: 30 }] }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('interviews reach indicated', () => {
    const findings = run(
      thesis([
        claim({
          stage: 'customer',
          confidence: 'indicated',
          evidence: [{ method: 'interview', source: 'research.md', n: 9 }],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('interviews never reach validated, however many you run', () => {
    const findings = run(
      thesis([
        claim({
          stage: 'customer',
          confidence: 'validated',
          evidence: [{ method: 'interview', source: 'research.md', n: 400 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
    expect(findings[0]?.message).toContain('Nothing was at stake');
  });

  test('a proposal request that went nowhere stops at indicated', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [{ method: 'quote-request', source: 'crm.md', n: 12 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('payment reaches validated', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [{ method: 'payment', source: 'stripe.md', n: 6, collectedAt: daysAgo(10) }],
        }),
      ]),
      );

    expect(findings).toEqual([]);
  });

  test('an unprompted approach reaches validated', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [
            { method: 'inbound-unprompted', source: 'inbox.md', n: 5, collectedAt: daysAgo(3) },
          ],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('the best evidence on a claim sets the ceiling', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [
            { method: 'interview', source: 'research.md', n: 9 },
            { method: 'payment', source: 'stripe.md', n: 5, collectedAt: daysAgo(5) },
          ],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('a colleague is not a stranger, however many of them there are', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'indicated',
          evidence: [{ method: 'colleague', source: 'notes.md', n: 12 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('a friend using the product proves nothing about the market', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'indicated',
          evidence: [{ method: 'friend', source: 'notes.md', n: 8 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('scraped complaints stay an assumption whatever the volume', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'indicated',
          evidence: [{ method: 'scraping', source: 'posts.json', n: 2000 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('desk research stays an assumption', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'indicated',
          evidence: [{ method: 'desk-research', source: 'report.md', n: 30 }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['method-ceiling']);
  });

  test('a signed contract settles a claim', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [{ method: 'signed-contract', source: 'legal.md', n: 6, collectedAt: daysAgo(1) }],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('an unrecognised method carries no more than an assumption', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [{ method: 'vibes', source: 'gut.md', n: 6, collectedAt: daysAgo(1) }],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['unknown-method']);
    expect(findings[0]?.message).toContain('vibes');
  });

  test('names every unrecognised method so the writer can fix or rename it', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'indicated',
          evidence: [
            { method: 'gut-feel', source: 'notes.md', n: 2000 },
            { method: 'court-order', source: 'odd.md', n: 6, collectedAt: daysAgo(1) },
          ],
        }),
      ]),
    );

    expect(codes(findings)).toEqual(['unknown-method']);
    expect(findings[0]?.message).toContain('gut-feel');
    expect(findings[0]?.message).toContain('court-order');
  });

  test('an unrecognised method does not drag down stronger evidence beside it', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'validated',
          evidence: [
            { method: 'scraping', source: 'posts.json', n: 2000 },
            { method: 'payment', source: 'stripe.md', n: 5, collectedAt: daysAgo(5) },
          ],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('an unrecognised method is free to sit under an assumption', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'assumed',
          evidence: [{ method: 'scraping', source: 'posts.json', n: 2000 }],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('an assumption is never capped, because it claims nothing', () => {
    const findings = run(
      thesis([
        claim({
          confidence: 'assumed',
          evidence: [{ method: 'engagement', source: 'ig.png', n: 9000 }],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });
});

describe('evidence freshness', () => {
  test('recent evidence passes', () => {
    const findings = run(
      thesis(
        [
          claim({
            confidence: 'validated',
            evidence: [{ method: 'payment', source: 's.md', n: 4, collectedAt: daysAgo(30) }],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(findings).toEqual([]);
  });

  test('evidence exactly at the shelf life still passes', () => {
    const findings = run(
      thesis(
        [
          claim({
            confidence: 'validated',
            evidence: [{ method: 'payment', source: 's.md', n: 4, collectedAt: daysAgo(120) }],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(findings).toEqual([]);
  });

  test('evidence past the shelf life is an error, and the message says how old', () => {
    const findings = run(
      thesis(
        [
          claim({
            confidence: 'validated',
            evidence: [{ method: 'payment', source: 's.md', n: 4, collectedAt: daysAgo(200) }],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(codes(findings)).toEqual(['stale-evidence']);
    expect(findings[0]?.message).toContain('200 days old');
    expect(findings[0]?.message).toContain('120-day');
  });

  test('the newest evidence entry is the one that counts', () => {
    const findings = run(
      thesis(
        [
          claim({
            confidence: 'validated',
            evidence: [
              { method: 'payment', source: 'old.md', n: 2, collectedAt: daysAgo(400) },
              { method: 'payment', source: 'new.md', n: 2, collectedAt: daysAgo(10) },
            ],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(findings).toEqual([]);
  });

  test('undated evidence in a decaying stage is a warning, not a block', () => {
    const findings = run(
      thesis(
        [claim({ confidence: 'validated', evidence: [{ method: 'payment', source: 's.md', n: 4 }] })],
        decayingGate(),
      ),
    );

    expect(codes(findings)).toEqual(['undated-evidence']);
    expect(findings[0]?.severity).toBe('warning');
  });

  test('an unparseable date is treated as no date at all', () => {
    const findings = run(
      thesis(
        [
          claim({
            confidence: 'validated',
            evidence: [{ method: 'payment', source: 's.md', n: 4, collectedAt: 'last summer' }],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(codes(findings)).toEqual(['undated-evidence']);
  });

  test('stages with no shelf life never expire', () => {
    const findings = run(
      thesis([
        claim({
          stage: 'problem',
          confidence: 'validated',
          evidence: [{ method: 'payment', source: 's.md', n: 9, collectedAt: daysAgo(3000) }],
        }),
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('only settled claims expire; an indicated claim is already provisional', () => {
    const findings = run(
      thesis(
        [
          claim({
            confidence: 'indicated',
            evidence: [{ method: 'payment', source: 's.md', n: 1, collectedAt: daysAgo(900) }],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(findings).toEqual([]);
  });

  test('a refuted claim does not expire', () => {
    const findings = run(
      thesis([claim({ confidence: 'refuted' })], decayingGate()),
    );

    expect(findings).toEqual([]);
  });
});

describe('the two rules together', () => {
  test('a channel claim built on engagement six months ago fails on the kind, not the age', () => {
    const findings = run(
      thesis(
        [
          claim({
            id: 'first-channel-proven',
            confidence: 'validated',
            critical: true,
            evidence: [{ method: 'engagement', source: 'ig.png', n: 50_000, collectedAt: daysAgo(190) }],
          }),
        ],
        decayingGate(),
      ),
    );

    expect(codes(findings)).toEqual(['method-ceiling', 'stale-evidence']);
  });
});
