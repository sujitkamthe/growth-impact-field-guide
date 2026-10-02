# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static single-page website for "The Sahaj Field Guide to Growth & Impact" - an engineering competency framework. The site presents personas (growth stages) and capability areas with self-assessment guidance.

## Build Command

```bash
node build.js
```

This scans Markdown files from `content/` and generates `manifest.json` (frontmatter + file paths). No external dependencies required.

## Development Workflow

1. Edit Markdown files in `content/` (personas, capabilities, or home)
2. Run `node build.js` to regenerate `manifest.json`
3. Run `npm run dev` to start the dev server (required - site fetches content at runtime)

### Dev Server (watch + live reload)

```bash
npm run dev
```

This watches `content/*.md` for changes, rebuilds `manifest.json` automatically, and serves the site at `http://localhost:8080` with live reload.

### Field Guide V2

A second version lives in `v2/` and is served at `/v2/`, beside V1 which stays unchanged. It has no build step: run `npm run dev:v2`. Its model, decisions and content conventions are in `v2/README.md`.

#### Writing guide content: clarity over ambiguity

People read the guide to find out what is expected of them, so every sentence must be one a new joiner can act on without asking what it means. When writing or editing anything in `v2/content/`:

- **Name who does what.** Say "the people around you", "your reviewers" or "the team", not "others"; say who relies on what. "Until others rely on them" became "keeping them up until the people around you depend on you for them".
- **Give every pronoun one obvious referent.** If "it", "them" or "that" could point at two things, name the thing: "before it became the norm" became "before the long hours became the norm".
- **State the observable outcome, not a shorthand verb.** Avoid "holds", "lands", "sticks", "scales", "shows up" and "is addressed"; say what someone would see, such as "you show it consistently in all three areas", "shipped on time", "the team keeps it up without being made to".
- **Keep the guide's terms to their defined meanings.** "Scope" means only Direct, Extended, Team or Wider, never the size of a piece of work; Org & Community's groups are "ways to contribute"; don't use "route", "level" or "persona" as framework terms.
- **Avoid delivery jargon that reads two ways.** "Story" (ticket or narrative), "contract" (legal or API), "land" (ship or succeed): pick the plain word.
- **Prefer a full clause to a compressed one.** "It can still be addressed then, which it can't at assessment" became "Raised during the cycle, it can still be fixed; raised for the first time in your self-assessment, it's too late to change anything."

Changing a core statement, mindset or other framework wording is the user's decision: propose the rewrite and say why before applying it.

## Architecture

**Content Pipeline:**
- `content/*.md` → `build.js` → `manifest.json` → `app.js` fetches markdown at runtime and renders

**Key Files:**
- `build.js` - Scans markdown files, extracts frontmatter, outputs `manifest.json`
- `manifest.json` - Generated file with page metadata and file paths (do not edit directly)
- `app.js` - Client-side SPA: fetches markdown at runtime, parses content, renders via layout-based system, generates SVG diagrams from data
- `index.html` - Minimal shell with `<main id="app">` container; pages created dynamically
- `styles.css` - Styling with CSS custom properties, dark mode via `[data-theme="dark"]`
- `content/icons/*.svg` - Capability icons referenced in frontmatter

**Content Structure:**
- Persona files (`content/personas/*.md`): frontmatter (layout, id, name, scope, tagline, color, order) + sections (Mindset, Nature of Impact, Success Looks Like) + capability expectations
- Capability files (`content/capabilities/*.md`): frontmatter (layout, id, name, question, icon, order) + Description, Introduction, Note sections
- Overview pages use annotations: `<!-- cards -->`, `<!-- key-truths -->`, `<!-- usage -->`, `<!-- explore-cards -->`

**Routing:**
- Hash-based SPA routing (e.g., `#home`, `#personas`, `#capabilities`, `#self-assessment`, `#quick-reference`)
- Detail pages: `#persona-{id}`, `#capability-{id}`
- In-page anchors: `#page-id/section-id` format (e.g., `#quick-reference/common-questions`)
- Pages created dynamically on first navigation

## Task Management

Tasks are tracked as GitHub Issues at https://github.com/sujitkamthe/growth-impact-field-guide/issues.

Use the Story issue template (`.github/ISSUE_TEMPLATE/story.md`) when creating new issues.

Labels:
- `content` — changes to guide content or framing
- `ux` — website structure and presentation
- `bug` — something isn't working

### Workflow Rules

**When picking up a card:**
```bash
gh issue edit <id> --add-assignee @me
```

**Every commit for a card must reference it:**
```
Short description #<id>
```

**Before closing a card:**
1. Post a closing comment that includes:
   - The value delivered (what can a user now do that they couldn't before?)
   - Specific URLs visited and interactions tested, with enough detail to verify or spot a lie
2. Keep the card open until that verification is done and confirmed
3. Only close once the card does what it should and nothing else is broken

**Closing a card:**
```bash
gh issue close <id> --comment "..."
```

