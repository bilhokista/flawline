# Contributing

## Setup

```bash
npm install
npm test          # 98 tests
npm run lint      # typecheck, no emit
npm run build
```

Node 20 or newer. No other tooling to install.

## The bar for a new check

The value of this tool rests entirely on its findings being trustworthy. A
founder who hits one false positive learns to ignore the output, and from then
on the tool is worse than nothing — it is a source of noise that also looks
authoritative.

So a new rule in `check.ts` needs, in this order:

1. **A failing test first**, in `test/check.test.ts`, describing the thing that
   should be caught.
2. **A test for the case that should pass**, proving the rule does not fire on
   legitimate work. This is the one that gets skipped, and it is the one that
   prevents the false positive.
3. **An entry in `FINDING_CODES`** and a row in the README table.
4. **A message that says what to do next**, not only what is wrong. Compare:

   - Bad: `Invalid confidence for claim.`
   - Good: `Marked "validated" on 2 observations; the customer gate requires 5.
     Downgrade to "indicated" or gather more.`

The existing messages name the claim, the numbers involved, and the action.
Match that.

## Changing the methodology

The stage templates and skills encode opinions about how to find out whether a
business idea works. Opinions can be wrong, and pull requests that improve them
are welcome — but "I would phrase it differently" is not a reason.

Say instead:

- What goes wrong for a real founder under the current wording.
- What the change would have caught, ideally with an example.
- Which claim ids are affected, since other stages depend on them by name.

**Do not rename a claim id** without changing every `depends_on` that points at
it. The templates ship as a connected graph, and `test/cli.test.ts` has a test
that fails if a dependency dangles. That test is there on purpose.

## Licensing, before you add content

This repository is deliberately split:

- `packages/` is MIT.
- `canvases/` is CC BY-SA 3.0, because it adapts ShareAlike work.

**Do not move content from `canvases/` into `packages/`.** It would pull a
copyleft obligation into the MIT package, which defeats the reason the split
exists.

If you are adding material derived from someone else's framework, book or
canvas:

1. Check the actual licence. Do not assume it is Creative Commons because it is
   widely reproduced — the Business Model Canvas is, and the Value Proposition
   Canvas is not.
2. Add it to `canvases/` with attribution in `ATTRIBUTION.md`.
3. If the licence forbids inclusion in software, do not include it. Reference it
   and let people get it from the source, which is what this project does for
   the Value Proposition Canvas.

## Style

The existing code is the specification, but explicitly:

- Immutable data. `readonly` on interface fields, no in-place mutation of
  anything that came in as an argument.
- Validate at the boundary. `parse.ts` collects issues and reports all of them
  rather than throwing on the first; keep that behaviour, because founders fix
  documents faster when they can see every problem at once.
- Comments explain **why**, not what. If a comment restates the code, delete it.
- No dependency added without a reason that survives the question "what breaks
  if we write the twenty lines ourselves?" The package has one runtime
  dependency and that is deliberate.

## Commits and pull requests

Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

Keep pull requests to one thing. In the description, give three sections and
nothing else:

```
Root cause / motivation
Key changes
Verification
```

Under Verification, say what you actually ran. "Should work" is not
verification; `npm test` output is.

## Reporting a false positive

Open an issue with the smallest `strategy/` document that reproduces it and the
exact output. These get priority over features, for the reason at the top of
this file.
