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
1. Post a comment on the issue documenting what was tested on the live/beta environment — specific URLs visited, interactions tested, what was verified
2. Keep the card open until that verification is done and confirmed
3. Only close once the card does what it should and nothing else is broken

**Closing a card:**
```bash
gh issue close <id> --comment "..."
```

