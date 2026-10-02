#!/usr/bin/env python3
"""Export V2's detailed expectations as one Markdown file for outside review.

Reads the same content files the site renders, so the export always matches
what readers see. Usage (from the repo root):

    python3 v2/scripts/export_expectations.py [output.md]

Writes to field-guide-v2-expectations.md in the current directory by default.
"""

import re
import sys
from pathlib import Path

CONTENT = Path(__file__).resolve().parent.parent / 'content'
SCOPES = ['direct', 'extended', 'team', 'wider']
AREAS = ['Client & Delivery', 'People & Team', 'Org & Community']
AREA_FILES = ['client-delivery', 'people-team', 'org-community']
LABELS = {
    'Expectations': 'Expectations',
    'Evidence': 'Evidence of a pattern',
    'Self-check': 'Ask yourself',
    'Not yet': "Signs it isn't there yet",
}

BRIEF = """# Sahaj Field Guide V2: detailed expectations (for review)

The full content behind the growth framework, exported from the site.

## How the model works

- **Scopes of impact**, one per person: Direct, Extended, Team, Wider. A scope describes how far your impact reaches, not a title.
- **Areas**, the same at every scope: Client & Delivery, People & Team, Org & Community. The scope is the same in all three; strength within it is rated Below / Meets / Exceeds per area.
- **Reference scope**: the scope shown consistently across all three areas, confirmed at the team check. It sets the expectations in every area.
- **Stretch**: once a scope is established, some of the next scope's responsibilities are taken on in one or more areas. A stretch adds to current expectations.
- **Org & Community is mandatory**: people choose how they contribute, and anyone can go beyond their scope.
- **Expectations are grouped**: Client & Delivery and People & Team by three facets that all count toward one rating, one or two statements each; Org & Community by shared expectations plus routes people choose from. **Evidence is a pattern** across the cycle, not a single example.

## What to check

1. Does each area progress clearly from Direct to Wider, without jumps, overlaps or statements at the wrong scope?
2. Do the statements hold the Extended/Team line: improving work beyond your own versus improving the system that produces the work?
3. Can each expectation be evidenced by a pattern over a cycle, or could someone claim it from one instance?
4. Is anything in the wrong area, missing, or worded as management in a flat organisation?
5. Does any language imply a ladder, a title, or seniority by visibility?

Please quote each statement you object to, say what's wrong, and propose replacement wording.

---
"""


def parse(path):
    text = path.read_text().replace('\r\n', '\n')
    match = re.match(r'^---\n([\s\S]*?)\n---\n?([\s\S]*)$', text)
    meta = {}
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            meta[key.strip()] = value.strip().strip('"')
    return meta, match.group(2).strip()


def sections(body, level):
    marker = '#' * level + ' '
    intro, out, current = [], [], None
    for line in body.split('\n'):
        if line.startswith(marker):
            current = [line[len(marker):].strip(), []]
            out.append(current)
        else:
            (current[1] if current else intro).append(line)
    return '\n'.join(intro).strip(), [(title, '\n'.join(lines).strip()) for title, lines in out]


def export():
    doc = [BRIEF]
    for name in SCOPES:
        meta, body = parse(CONTENT / 'scopes' / f'{name}.md')
        secs = dict(sections(body, 2)[1])
        doc.append(f"# {meta['name']} scope\n")
        doc.append(f"**Reach:** {meta['reach']}  ")
        doc.append(f"**How:** {meta['how']}  ")
        doc.append(f"**What lasts:** {meta['lasts']}  ")
        doc.append(f"**Mindset:** \"{meta['mindset']}\"  ")
        doc.append(f"**Trusted to answer:** {meta['question']}\n")
        doc.append(secs.get('Summary', '') + '\n')
        doc.append(f"**What changes from the scope below:** {secs.get('What changes', '')}\n")
        if 'In practice' in secs:
            doc.append(f"**In practice (an illustration):** {secs['In practice']}\n")
        for area in AREAS:
            intro, subs = sections(secs[area], 3)
            core = re.search(r'^> (.+)$', intro, re.M).group(1)
            doc.append(f"## {meta['name']}: {area}\n\n> {core}\n")
            for title, content in subs:
                # Facet and route groups ("#### Title") read as labels in the export.
                content = re.sub(r'^#### (.+)$', r'*\1*', content, flags=re.M)
                doc.append(f"**{LABELS.get(title, title)}**\n\n{content}\n")
        if 'Examples' in secs:
            doc.append(f"## {meta['name']}: examples\n")
            for title, content in sections(secs['Examples'], 3)[1]:
                doc.append(f"**{title}**\n\n{content}\n")
        if 'Ways to create impact' in secs:
            intro, ways = sections(secs['Ways to create impact'], 3)
            doc.append(f"## {meta['name']}: ways to create impact\n")
            if intro:
                doc.append(intro + '\n')
            for title, content in ways:
                doc.append(f"**{title}**: {content}\n")
        doc.append('---\n')

    doc.append('# The three areas\n')
    for name in AREA_FILES:
        meta, body = parse(CONTENT / 'areas' / f'{name}.md')
        doc.append(f"## {meta['name']}\n\n*{meta['question']}*\n")
        for title, content in sections(body, 2)[1]:
            if title in ('Facets', 'Routes'):
                intro, facets = sections(content, 3)
                label = 'What it covers (all facets count)' if title == 'Facets' else 'Routes (choose one or more)'
                doc.append(f'**{label}**\n\n' + (intro + '\n\n' if intro else '') + '\n'.join(f'- **{t}**: {c}' for t, c in facets) + '\n')
            elif title == 'Summary':
                doc.append(content + '\n')
            else:
                doc.append(f'**{title}**\n\n{content}\n')
    return '\n'.join(doc)


if __name__ == '__main__':
    out = Path(sys.argv[1] if len(sys.argv) > 1 else 'field-guide-v2-expectations.md')
    text = export()
    out.write_text(text)
    print(f'Wrote {out} ({len(text.split())} words)')
