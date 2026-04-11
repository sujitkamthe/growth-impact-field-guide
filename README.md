# Sahaj Engineering Competency Framework Website

A minimalistic, single-page website for the Sahaj Engineering Competency Framework.

## Quick Start

```bash
npm run dev
```

This starts a dev server at `http://localhost:8080` with live reload.

## Updating Content

Content is stored in Markdown files in the `content/` directory:

```
content/
├── home.md                    # Home page content
├── personas.md                # Personas overview page
├── capabilities.md            # Capabilities overview page
├── self-assessment.md         # Self-assessment guide
├── quick-reference.md         # Quick reference guide
├── calibration-examples.md    # Calibration examples
├── personas/
│   ├── explorer.md
│   ├── artisan.md
│   ├── catalyst.md
│   ├── multiplier.md
│   ├── amplifier.md
│   ├── strategist.md
│   └── pioneer.md
├── capabilities/
│   ├── technical-delivery.md
│   ├── consulting.md
│   ├── delivery-excellence.md
│   ├── mentorship.md
│   └── communication.md
└── icons/
    └── *.svg                  # Capability icons
```

### To update content:

1. Edit the relevant `.md` file in the `content/` directory
2. Run the build script to regenerate `manifest.json`:

```bash
node build.js
```

3. Refresh the browser to see changes (or use `npm run dev` for auto-reload)

### Markdown File Format

Each persona file has this structure:

```markdown
---
layout: persona-detail
id: explorer
name: Explorer
scope: Task-level impact
tagline: Learning the terrain
color: "#6c5ce7"
order: 1
---

## Mindset

"Quote here"

## Nature of Impact

- Item 1
- Item 2

## Success Looks Like

- Item 1
- Item 2

---

# Technical Delivery

## Expectations

- Expectation 1
- Expectation 2

## Self-Assessment

- Question 1?
- Question 2?

---

# Consulting
...
```

### Annotations

Use HTML comments to trigger special rendering:

- `<!-- cards -->` - Render following h3 sections as cards
- `<!-- key-truths -->` - Render section as key truths list
- `<!-- usage -->` - Render section as usage guide
- `<!-- explore-cards -->` - Insert explore cards (links to Personas/Capabilities)
- `<!-- balance -->` - Render section with balance styling
- `<!-- diagram: impact-rings -->` - Insert impact rings diagram
- `<!-- diagram: capability-radar -->` - Insert capability radar diagram
- `<!-- persona-cards -->` - Insert persona cards grid
- `<!-- capability-cards -->` - Insert capability cards grid
- `<!-- tracks-intro -->` - Render intro text before persona cards
- `<!-- calibration-insert -->` - Insert calibration examples content

## File Structure

```
├── index.html      # Minimal HTML shell
├── styles.css      # Styling (minimalistic theme)
├── manifest.json   # Generated metadata (don't edit directly)
├── app.js          # Application logic (runtime markdown parsing)
├── build.js        # Build script (generates manifest.json)
├── content/        # Editable Markdown content
└── README.md       # This file
```

## Hosting

This site requires a web server (content is fetched at runtime):

1. Use any static hosting service (GitHub Pages, Netlify, Vercel, etc.)
2. Or run locally with `npm run dev`

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
