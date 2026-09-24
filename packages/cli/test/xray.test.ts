import { describe, expect, test } from 'vitest';
import { parseXrayVerdict, renderXray, xray } from '../src/xray.js';

const LANDING = `# Acme Reports

**Finance teams lose 10 hours a week** to manual reporting.

Acme is the only tool built for mid-market CFOs.

Trusted by 500+ companies, including teams you know.

Customers cut close time by 40% ([case study](https://acme.example/case)).
`;

const verdict = (claims: unknown) => JSON.stringify({ claims });

describe('parseXrayVerdict', () => {
  test('reads quotes, stages and citations', () => {
    const parsed = parseXrayVerdict(
      verdict([
        { quote: 'Finance teams lose 10 hours a week', stage: 'problem' },
        { quote: 'cut close time by 40%', stage: 'offer', cites: 'https://acme.example/case' },
      ]),
    );

    expect(parsed.error).toBeNull();
    expect(parsed.items).toEqual([
      { quote: 'Finance teams lose 10 hours a week', stage: 'problem', cites: null },
      { quote: 'cut close time by 40%', stage: 'offer', cites: 'https://acme.example/case' },
    ]);
  });

  test('rejects a verdict that is not JSON', () => {
    expect(parseXrayVerdict('not json').error).toMatch(/not valid JSON/);
  });

  test('rejects a verdict without a claims array', () => {
    expect(parseXrayVerdict('{"quotes": []}').error).toMatch(/claims/);
  });

  test('rejects an item with an unknown stage rather than guessing one', () => {
    const parsed = parseXrayVerdict(verdict([{ quote: 'x', stage: 'marketing' }]));
    expect(parsed.error).toMatch(/marketing/);
  });

  test('rejects an item with an empty quote', () => {
    const parsed = parseXrayVerdict(verdict([{ quote: '  ', stage: 'problem' }]));
    expect(parsed.error).toMatch(/quote/);
  });
});

describe('xray', () => {
  test('keeps a quote that appears in the source, ignoring markdown and spacing', () => {
    const result = xray(LANDING, [
      { quote: 'Finance teams lose 10 hours a week to manual reporting.', stage: 'problem', cites: null },
    ]);

    expect(result.rejected).toEqual([]);
    expect(result.claims).toHaveLength(1);
  });

  test('rejects a quote the source never says, so a model cannot invent a claim', () => {
    const result = xray(LANDING, [
      { quote: 'Finance teams hate spreadsheets', stage: 'problem', cites: null },
    ]);

    expect(result.claims).toEqual([]);
    expect(result.rejected).toEqual([
      { quote: 'Finance teams hate spreadsheets', reason: 'not in the source word for word' },
    ]);
  });

  test('marks a claim as pointed only when its citation is in the source', () => {
    const result = xray(LANDING, [
      { quote: 'Customers cut close time by 40%', stage: 'offer', cites: 'https://acme.example/case' },
      { quote: 'Trusted by 500+ companies', stage: 'motion', cites: 'https://acme.example/logos' },
    ]);

    expect(result.claims.map((claim) => claim.support)).toEqual(['pointed', 'none']);
  });

  test('flags a claim that carries a number', () => {
    const result = xray(LANDING, [
      { quote: 'Trusted by 500+ companies', stage: 'motion', cites: null },
      { quote: 'Acme is the only tool built for mid-market CFOs.', stage: 'advantage', cites: null },
    ]);

    expect(result.claims.map((claim) => [claim.stage, claim.hasNumber])).toEqual([
      ['advantage', false],
      ['motion', true],
    ]);
  });

  test('spots a number written out in words, which prose does more often than digits', () => {
    const source = 'It saves nine hours. Twice as fast. Half of teams quit. The one we built.';
    const result = xray(source, [
      { quote: 'It saves nine hours.', stage: 'offer', cites: null },
      { quote: 'Twice as fast.', stage: 'advantage', cites: null },
      { quote: 'Half of teams quit.', stage: 'problem', cites: null },
      { quote: 'The one we built.', stage: 'narrative', cites: null },
    ]);

    expect(result.claims.map((claim) => [claim.quote, claim.hasNumber])).toEqual([
      ['Half of teams quit.', true],
      ['Twice as fast.', true],
      ['It saves nine hours.', true],
      ['The one we built.', false],
    ]);
  });

  test('orders claims by stage, so the one everything rests on comes first', () => {
    const result = xray(LANDING, [
      { quote: 'Trusted by 500+ companies', stage: 'motion', cites: null },
      { quote: 'Acme is the only tool built for mid-market CFOs.', stage: 'advantage', cites: null },
      { quote: 'Finance teams lose 10 hours a week', stage: 'problem', cites: null },
    ]);

    expect(result.claims.map((claim) => claim.stage)).toEqual(['problem', 'advantage', 'motion']);
  });

  test('counts a repeated quote once', () => {
    const item = { quote: 'Trusted by 500+ companies', stage: 'motion' as const, cites: null };
    expect(xray(LANDING, [item, item]).claims).toHaveLength(1);
  });
});

describe('renderXray', () => {
  test('leads with how many claims are guesses and names the foundation', () => {
    const result = xray(LANDING, [
      { quote: 'Trusted by 500+ companies', stage: 'motion', cites: null },
      { quote: 'Finance teams lose 10 hours a week', stage: 'problem', cites: null },
      { quote: 'Customers cut close time by 40%', stage: 'offer', cites: 'https://acme.example/case' },
    ]);

    const out = renderXray(result, 'landing.md');

    expect(out).toContain('3 claims in landing.md. 2 point nowhere');
    expect(out).toContain('2 of them are numbers');
    expect(out).toContain('"Finance teams lose 10 hours a week"');
    expect(out).toMatch(/leans on this one[\s\S]*Finance teams lose 10 hours a week/);
  });

  test('says what was rejected and why', () => {
    const result = xray(LANDING, [
      { quote: 'Finance teams hate spreadsheets', stage: 'problem', cites: null },
    ]);

    expect(renderXray(result, 'landing.md')).toContain(
      '1 quote rejected: not in the source word for word.',
    );
  });

  test('speaks in the singular about a single claim', () => {
    const result = xray(LANDING, [
      { quote: 'Trusted by 500+ companies', stage: 'motion', cites: null },
    ]);

    const out = renderXray(result, 'landing.md');
    expect(out).toContain('1 of them is a number, which reads as measured and was not shown to be.');
    expect(out).toContain('Nothing on the page backs it:');
    expect(out).not.toContain('leans on');
  });

  test('does not claim a foundation when every claim points somewhere', () => {
    const result = xray(LANDING, [
      { quote: 'Customers cut close time by 40%', stage: 'offer', cites: 'https://acme.example/case' },
    ]);

    const out = renderXray(result, 'landing.md');
    expect(out).toContain('1 claim in landing.md. 0 point nowhere');
    expect(out).not.toContain('leans on');
  });
});
