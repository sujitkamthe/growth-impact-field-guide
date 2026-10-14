// Principles: what we believe about growth, read before the scopes and areas. The principles
// section renders as a visual, the principles as pillars holding up the roof (growth and impact)
// on a base (the culture), followed by each principle in full. The words come from principles.md:
// the roof and base from its frontmatter, the pillars from the "- **Name**: text" list.

import { esc, mdInline } from '../ui.js';
import { renderProse } from './prose.js';

// One small line icon per principle, in list order; a principle without one gets none.
const ICONS = [
    // Self-directed: a compass.
    '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    // Without hierarchy: three peers side by side.
    '<circle cx="5" cy="9" r="2.5"/><circle cx="12" cy="9" r="2.5"/><circle cx="19" cy="9" r="2.5"/><path d="M1.5 17c.5-2.5 2-3.5 3.5-3.5s3 1 3.5 3.5M8.5 17c.5-2.5 2-3.5 3.5-3.5s3 1 3.5 3.5M15.5 17c.5-2.5 2-3.5 3.5-3.5s3 1 3.5 3.5"/>',
    // Transparency: an open eye.
    '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    // Feedback: two arrows passing back and forth.
    '<path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/>',
    // Reflection: a mirror on a stand.
    '<ellipse cx="12" cy="9.5" rx="5.5" ry="7"/><path d="M12 16.5V21M8.5 21h7M10 6.5l3-2"/>',
];

const icon = i => ICONS[i]
    ? `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[i]}</svg>`
    : '';

function principles(page) {
    const body = page.sections.find(s => s.slug === 'our-principles')?.body || '';
    return [...body.matchAll(/^- \*\*(.+?)\*\*:\s*(.+)$/gm)].map(m => ({ name: m[1], text: m[2] }));
}

function pillars(page, items) {
    return `<figure class="pillars" aria-label="${esc(`${page.roof}, held up by ${items.map(i => i.name).join(', ')}, on ${page.base}`)}">
        <div class="pillars-roof"><span>${esc(page.roof)}</span></div>
        <ul class="pillars-row">
            ${items.map((p, i) => `<li class="pillar">${icon(i)}<span>${esc(p.name)}</span></li>`).join('')}
        </ul>
        <div class="pillars-base"><span>${esc(page.base)}</span></div>
    </figure>`;
}

const explained = items => `<dl class="principles">
    ${items.map((p, i) => `<div><dt>${icon(i)}${esc(p.name)}</dt><dd>${mdInline(p.text)}</dd></div>`).join('')}
</dl>`;

export function render(content, [open]) {
    const page = content.pages.principles;
    const items = principles(page);
    return renderProse(content, 'principles', {
        open,
        bodies: { 'our-principles': pillars(page, items) + explained(items) },
    });
}
