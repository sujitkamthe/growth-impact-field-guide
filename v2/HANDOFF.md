# Field Guide V2: handoff

V2 is a second version of the Field Guide, built beside V1 rather than replacing it. It exists to fix the pain points behind this work: growth expectations that are unclear, assumed rather than written down, and set differently in every office, which makes self-assessment conversations hard. It does that with a smaller model and one guide every office uses; expectations and self-assessments are written down in Google Workspace rather than in the portal. The model, its reasoning and the content conventions are in [README.md](README.md); this page is about where the work stands and what the next person needs to know.

## Where it stands

- **Branch:** `field-guide-v2`, not yet pushed or merged. V1 at the repo root is untouched.
- **Built and tested locally.** Every page was checked in a browser at desktop and phone width, in light and dark themes, with a clean console. 
- **Not yet reviewed by anyone else.** The content has been through several rounds of AI review but no human review.

Merging to `main` publishes V2. The Pages workflow uploads the whole repo on every push to `main`, so `v2/` goes live at `/v2/` with no further steps. Treat the merge as the launch.

## Run it

```bash
npm run dev:v2          # live reload at http://localhost:8080/v2/
python3 v2/scripts/export_expectations.py review.md   # all expectations as one file, for review
npm run templates:v2                                  # regenerate v2/doc-templates/*.docx after content changes
```

There is no build step: the site fetches `v2/content/*.md` at runtime and uses native ES modules, so it must be served over HTTP.

## Decisions to confirm before launch

These shape how people will be assessed and paid, so they need agreement from whoever owns those processes, not just a code review.

1. **Pay stays out of the guide.** The guide describes scope and expectations only and says nothing about compensation. Whoever owns pay decides how scope relates to it and communicates that separately.
2. **Org & Community is mandatory.** No contribution beyond delivery means that area is below expectations. The form of contribution is the person's choice.
3. **No Explorer scope.** Direct is the baseline because graduates are no longer hired. If that changes, add a scope file with `order: 0`.
4. **Scope names.** Direct, Extended, Team, Wider. The cheap test is to show them, with their one-line descriptions, to a few people from two offices and ask each to place a piece of their own recent work. If Extended and Team keep getting confused, fix the Team description before renaming anything.
5. **Leading an account.** Leading an account doesn't set anyone's scope, because many Sahaj accounts have a single team; what the role asks follows the person's scope. Building the client relationship and growing the account is Wider impact, and one route to it.
6. **Where mentoring counts.** Mentoring that grows out of your work is People & Team, including beyond your team at wider scopes. Mentoring you volunteer for through a Sahaj programme such as a capability track, or running that programme, is Org & Community. This keeps programme mentoring as a valid way to meet the mandatory Org & Community area.
7. **Who decides, and what happens on disagreement.** The guide describes an open team check where teammates confirm, correct or add, but not who makes the final call when reviewers and the person disagree, how that disagreement is escalated, whether someone can ask for a decision to be reviewed, or how ratings are calibrated across teams and offices. Naming a single decision owner would change the peer-based model, so this is a process decision, not a content fix. The cycle doc now records the guide version (the template's build date) and any agreed changes, so the basis for a cycle is fixed once agreed.
8. **What Sahaj guarantees for Org & Community.** If the area stays mandatory, people need a fair chance to meet it: protected time, opportunities that are open to them, reviewers checking whether the opportunity existed before rating it below, and support when project pressure blocks contribution. The guide currently tells people to raise an opportunity gap during the cycle and says "Sahaj creates opportunities", which readers will hold the organisation to; whoever owns the process should confirm what stands behind it.

## Open work

- **Expectation wording.** Expectations are now grouped by facet, one or two statements each, drawn from the V1 persona expectations for the matching capability. Several still run past the roughly 15-word target from the design review, and the facet split is new, so it needs the content review: check each facet progresses cleanly from Direct to Wider and that Team and Wider lines stay route-neutral. Use the export script to produce the file for that review.
- **Illustrations to replace.** The In practice story on each scope page (and the How it works stepper built from it) and the worked example on Self-assessment are written illustrations, labelled as such. Replace them with real, anonymised situations once there are some, keeping one situation across all four scopes.
- **Internal terms to explain.** Team check and demand conversations are explained where they first appear. Capability track, DevDays and Emerge are not, because their definitions weren't available; add a short explanation where each first appears, or a "Words we use" group in the FAQ.
- **Calibration examples.** There is one Meets and one Below example per scope, adapted from V1's. They are drafts and should be replaced with real, anonymised examples as soon as there are some.
- **V1 references.** Each scope page ends with "In the V1 guide this was…", and two "ways to create impact" cards mention Amplifier and Pioneer. Keep them while people are moving over from V1; remove them once V2 stands alone. The FAQ already avoids V1.
- **Old links break after renames.** Renaming a scope or area id breaks links people have shared, such as `#scope/team/client-delivery`. Freeze the ids once the guide is shared.
- **Expectations doc template and Drive structure.** The expectation sheet and the self-assessment form were removed in favour of Google Workspace; Self-assessment is now a guidance page. The four scope templates are in `doc-templates/`, generated by `scripts/build_doc_templates.js`, but not yet in Drive (the Drive connector had read-only access), and the Drive folder structure is still to be agreed. The folder is git-ignored for now, so regenerate the templates whenever expectations change, or the copies in Drive drift from the site. The templates link to the published portal, assumed to be `https://sujitkamthe.github.io/growth-impact-field-guide/v2/` (`PORTAL` in the script); confirm it once Pages is live.
- **Stale styles after deploys.** V2 has no `?v=` cache-busting on `styles.css` and the JS modules, unlike V1. Browsers may show stale styles for a while after a deploy. Add a version query, or bundle V2 in the existing CI step, before the first update after launch.
- **Other roles.** The expectations are written for delivery roles only, like V1.

## Where things are

| Path | What it holds |
|---|---|
| `content/scopes/*.md` | The four scopes: In practice story, expectations by facet, evidence, self-checks, signs it isn't there yet, examples |
| `content/areas/*.md` | The three areas |
| `content/how-it-works.md`, `faq.md` | Reading pages |
| `content/self-assessment.md`, `teammates.md` | Worksheet pages |
| `js/diagram.js` | The scope marker, the reach diagram and the three-sector model diagram |
| `js/views/` | One module per page |
| `styles.css` | The design system; tokens at the top, dark theme below them |
| `scripts/export_expectations.py` | Review export |
| `scripts/build_doc_templates.js`, `doc-templates/` | The expectations and self-assessment doc templates, one Word file per scope, generated from the content with the `docx` dev dependency; upload to Drive with "Convert uploads" on to get Google Docs |

## Useful context

The earlier conversations that shaped V2 also compared it with an office's one-page expectation sheet (four rows by three columns). That sheet's brevity is why the matrix opens compact, showing only each area's core line, and why each facet is capped at two statements. V1's reasoning, including why consulting gets extra emphasis and why the guide avoids checklists, is in `docs/context/framework-design-decisions.md` at the repo root, and most of it still applies.
