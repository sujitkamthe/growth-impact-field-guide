# Field Guide V2: handoff

V2 is a second version of the Field Guide, built beside V1 rather than replacing it. It exists to fix the pain points behind this work: growth expectations that are unclear, assumed rather than written down, and set differently in every office, which makes self-assessment conversations hard. It does that with a smaller model, a written expectation sheet, and a self-assessment built from that sheet. The model, its reasoning and the content conventions are in [README.md](README.md); this page is about where the work stands and what the next person needs to know.

## Where it stands

- **Branch:** `field-guide-v2`, not yet pushed or merged. V1 at the repo root is untouched.
- **Built and tested locally.** Every page was checked in a browser at desktop and phone width, in light and dark themes, with a clean console. That includes the full journey from writing an expectation sheet to a finished self-assessment.
- **Not yet reviewed by anyone else.** The content has been through several rounds of AI review but no human review.

Merging to `main` publishes V2. The Pages workflow uploads the whole repo on every push to `main`, so `v2/` goes live at `/v2/` with no further steps. Treat the merge as the launch.

## Run it

```bash
npm run dev:v2          # live reload at http://localhost:8080/v2/
python3 v2/scripts/export_expectations.py review.md   # all expectations as one file, for review
```

There is no build step: the site fetches `v2/content/*.md` at runtime and uses native ES modules, so it must be served over HTTP.

## Decisions to confirm before launch

These shape how people will be assessed and paid, so they need agreement from whoever owns those processes, not just a code review.

1. **Pay rule.** One reference scope per person maps to one pay band. A stretch doesn't change pay by itself; sustaining it is what raises the reference scope. This is stated in How it works and in the FAQ's salary answer.
2. **Org & Community is mandatory.** No contribution beyond delivery means that area is below expectations. The form of contribution is the person's choice.
3. **No Explorer scope.** Direct is the baseline because graduates are no longer hired. If that changes, add a scope file with `order: 0`.
4. **Scope names.** Direct, Extended, Team, Wider. The cheap test is to show them, with their one-line descriptions, to a few people from two offices and ask each to place a piece of their own recent work. If Extended and Team keep getting confused, fix the Team description before renaming anything.
5. **Leading an account.** A one-team account is Team scope; a multi-team account is Wider.

## Open work

- **Expectation wording.** Several statements run past the roughly 15-word target from the design review. Rewrite them together with the content review, not separately. Use the export script to produce the file for that review.
- **Calibration examples.** There is one Meets and one Below example per scope, adapted from V1's. They are drafts and should be replaced with real, anonymised examples as soon as there are some.
- **V1 references.** Each scope page ends with "In the V1 guide this was…", and two "ways to create impact" cards mention Amplifier and Pioneer. Keep them while people are moving over from V1; remove them once V2 stands alone. The FAQ already avoids V1.
- **Old links break after renames.** Expectation sheets live in their links (sheet format version 2, keys documented in `js/sheet-model.js`). Renaming a scope id or area key breaks links people have already shared; old links show the start screen rather than wrong data. Freeze the ids once the guide is shared.
- **Stale styles after deploys.** V2 has no `?v=` cache-busting on `styles.css` and the JS modules, unlike V1. Browsers may show stale styles for a while after a deploy. Add a version query, or bundle V2 in the existing CI step, before the first update after launch.
- **Other roles.** The expectations are written for delivery roles only, like V1.

## Where things are

| Path | What it holds |
|---|---|
| `content/scopes/*.md` | The four scopes: expectations, evidence, self-checks, signs it isn't there yet, examples |
| `content/areas/*.md` | The three areas; `org-community.md` also holds the ways-to-contribute list the sheet uses |
| `content/how-it-works.md`, `teammates.md`, `faq.md` | Reading pages |
| `js/sheet-model.js` | Expectation sheet format and rules (stretch, required avenue) |
| `js/diagram.js` | The scope marker and the three-sector model diagram |
| `js/views/` | One module per page |
| `styles.css` | The design system; tokens at the top, dark theme below them |
| `scripts/export_expectations.py` | Review export |

## Useful context

The earlier conversations that shaped V2 also compared it with an office's one-page expectation sheet (four rows by three columns). That sheet's brevity is why the matrix opens compact and why each area is capped at four statements. V1's reasoning, including why consulting gets extra emphasis and why the guide avoids checklists, is in `docs/context/framework-design-decisions.md` at the repo root, and most of it still applies.
