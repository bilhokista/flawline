---
name: False positive
about: check reported a finding on work that was actually sound
labels: false-positive
---

**The finding**

Paste the exact output of `npx thesis-os check`.

**Smallest document that reproduces it**

The minimal `strategy/*.md` frontmatter that triggers it.

**Why the claim was sound**

What evidence you had, and why the rule should not have fired.

**Version**

`npx thesis-os --version`
