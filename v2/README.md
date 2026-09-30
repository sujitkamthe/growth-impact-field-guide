# Growth & Impact at Sahaj (Field Guide V2)

V2 sits beside V1 rather than replacing it. V1 (the repo root) is unchanged and still served at `/`; V2 is self-contained in this folder and served at `/v2/`. The existing Pages workflow uploads the whole repo, so no CI change is needed.

## Run it

```bash
npm run dev:v2      # live-server with reload, opens /v2/
```

There is no build step. The site fetches `content/*.md` at runtime and renders with native ES modules, so it must be served over HTTP rather than opened as a file.

## The model

**4 scopes × 3 areas**, with at most four expectations per cell.

| Scope | Radius | Replaces (V1) |
|---|---|---|
| Direct | Impact through work directly in your hands (your own stories and features) | Artisan, late Explorer |
| Extended | Improves work beyond your own (others' features, a stream, a teammate) | Catalyst |
| Team | Changes how the whole team operates, performs and grows | Multiplier, Amplifier |
| Wider | Crosses the team boundary: multi-team account, client org, Sahaj or community | Strategist, Pioneer |

Areas: **Client & Delivery** (craft, consulting, delivery), **People & Team** (mentoring, feedback, communication), **Org & Community** (culture, initiatives, community).

The decisions behind it:

- **Area-neutral scope names.** Each scope describes how far impact reaches, and each area's cells describe what that means for it. Concrete nouns like Feature only made sense for Client & Delivery. "Project" was dropped as a rung because on many engagements project and team are the same people. The names are deliberately plain so they describe an expectation, never a person.
- **Extended vs Team** is the boundary to protect: improving work beyond your own, versus improving the system that produces the work.
- **One scope per person, uneven strengths within it.** The reference scope reflects impact sustained across all three areas, sets the expectations in every area, and maps to one pay band. Strength per area is captured by the Below / Meets / Exceeds rating, not by setting areas at different scopes. Growth happens by taking on some of the next scope's responsibilities as a stretch (per area, adding to current expectations, not moving pay by itself) until they are sustained. This is compensation policy and needs sign-off from whoever owns pay decisions.
- **Evidence is a pattern, not an instance.** Evidence prompts ask for consistency, durability and reliance across the cycle, because one good example shows you can, not that you do.
- **Scopes instead of persona names.** Scopes say what they mean, and they resist becoming identities ("I'm a Catalyst"). Compensation still follows scope, and the FAQ says so plainly, because in an open-salary org a euphemism would be noticed.
- **Explorer became ramp-up.** Direct is the baseline for every hire; being new to our stack or ways of working is temporary and not a stage. If graduate hiring returns, add a scope file with `order: 0`.
- **Amplifier and Pioneer became "ways to create impact"** at Team and Wider scope, keeping V1's "not the easier path" argument.
- **Three areas, facets kept visible.** Client & Delivery merges three V1 capabilities; its page says a gap in one facet is still a gap, so strong craft can't average out weak consulting.
- **Org & Community is not optional.** Your choice of how, not whether. No contribution beyond delivery means the area is below expectations; an opportunity gap must be raised during the cycle, not at assessment.
- **Expectations are written down.** The Set expectations page produces a sheet whose state lives in its URL (keys documented in `js/sheet-model.js`, currently version 2), so the link is the record and every office uses the same format. Self-assessment opens from that link and assesses against exactly what was agreed.

## Design

Documentation style: text on a quiet background, IBM Plex Sans throughout, colour only where it means something. Purple is scope and interaction; the three area colours (teal, blue, ochre) mark areas on labels and 2px rules, never bullets or panels. No shadows, one radius for panels (8px) and one for controls (6px), no pills. Notices are neutral grey panels; semantic colours appear only in form validation. The model diagram (`js/diagram.js`) shows one scope as a band across three area sectors, with a stretch reaching dashed into the next ring; it never fills cumulatively, so it reads as reach rather than rank. The theme follows the system unless someone uses the toggle.

## Content conventions

Scope files (`content/scopes/*.md`) have frontmatter (`id`, `name`, `order`, `radius`, `mindset`, `question`, `v1`) and these sections:

```markdown
## Summary
## What changes            (from the previous scope)
## Client & Delivery       (one per area, matching the area's name)
> The one-line core statement.
### Expectations           (four at most)
### Evidence
### Self-check
### Not yet
## Ways to create impact   (optional; intro paragraph, then ### per way)
## Examples                (### Meets expectations, ### Below expectations: one paragraph each)
```

Area files (`content/areas/*.md`) have `id`, `name`, `key` (`cd`, `pt`, `oc`, used in sheet links), `order` and `question`, then `## Summary`, `## Facets` with `###` per facet, and any further `##` sections, which render as prose. In `org-community.md`, the `## Ways to contribute` list feeds the avenue checkboxes, so keep the `**Label**: detail` format.

Renaming a scope or area heading changes what the parser matches, and changing an area `key` or scope `id` breaks sheet links already shared. Treat both as breaking changes.

Pages: `how-it-works.md` and `teammates.md` render as plain reading pages (`##` sections). `faq.md` groups questions: `##` is a group, `###` a question, and each question is linkable as `#faq/<slug>`. Scope sections are linkable as `#scope/<scope>/<area>`.
