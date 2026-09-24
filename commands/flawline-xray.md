---
description: Read an existing landing page, deck or README and show which of its sentences are claims that point nowhere.
argument-hint: <file-or-url>
allowed-tools: Bash, Read, Write, WebFetch
---

X-ray `$1`: find every claim the page makes, and show which of them it backs.

## 1. Get the page onto disk

If `$1` is a file, use it as it is.

If it is a URL, fetch it and save the visible text, as close to verbatim as you
can, to `.flawline/xray/source.md`. Keep the wording exactly; drop navigation,
cookie banners and footers. The checker compares your quotes against this file,
so anything you rewrite here is something you could later quote back to it and
pass.

## 2. Read it

```bash
npx flawline xray <file>
```

That prints what to return. Read the document and quote every sentence that
asserts something about the world — a problem, who has it, what it costs, a
result, a number, a claim to be first, only or best. Skip what the product
does; "exports to CSV" is a feature, not a claim.

Rules that the tool enforces, so there is no point bending them:

- **Quote word for word.** A paraphrase is rejected and listed as rejected.
  Tidying the grammar counts as paraphrase.
- **`cites` only when the page says it.** A link, a footnote, a named study
  next to the sentence. Your own knowledge that the claim is true is not a
  citation, and a citation the page does not contain is ignored.
- **One stage per claim.** Where would this sentence live in the strategy:
  `problem`, `customer`, `offer`, `advantage`, `model`, `motion`, `narrative`,
  `evidence`.

Do not judge whether a claim is true. That is not what this reports.

## 3. Ingest

Write the JSON to `.flawline/xray/verdict.json`, then:

```bash
npx flawline xray <file> --ingest .flawline/xray/verdict.json
```

Show the output as it is. Then say one thing: which claim to check first, and
the cheapest way to check it this week. The output names the first claim in
pipeline order that points nowhere; the rest of the page leans on it.

Nothing here writes to `strategy/`. If the founder wants the claims tracked,
`flawline init` opens the first stage, and every claim from the page goes in as
`assumed` — a page saying something is not evidence that it is so.
