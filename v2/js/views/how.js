// How it works: the mechanics in one place. Sections whose idea is a picture
// (how far scopes reach, how growth and the cycle run) render as visuals from
// the same Markdown lists, so the words still live in content.

import { esc, md, mdInline } from '../ui.js';
import { modelDiagram, reachDiagram } from '../diagram.js';
import { renderProse } from './prose.js';

// A section's "- **Title**: text" items, and the prose after them.
function parts(page, slug) {
    const lines = (page.sections.find(s => s.slug === slug)?.body || '').split('\n');
    const items = lines.filter(l => /^- /.test(l)).map(l => {
        const m = l.slice(2).match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
        return m ? { name: m[1], text: m[2] } : { name: l.slice(2), text: '' };
    });
    return { items, rest: lines.filter(l => !/^- /.test(l)).join('\n').trim() };
}

const flow = (items, numbered) => `<ol class="flow${numbered ? ' numbered' : ''}">
    ${items.map(i => `<li><strong>${esc(i.name)}</strong><span>${mdInline(i.text)}</span></li>`).join('')}
</ol>`;

export function render(content, [open]) {
    const page = content.pages['how-it-works'];
    const scopes = parts(page, 'scopes');
    const growth = parts(page, 'growing-into-the-next-scope');
    const cycle = parts(page, 'the-cycle');
    const team = content.scope('team');

    return renderProse(content, 'how-it-works', {
        open,
        bodies: {
            scopes: `<figure class="reach-figure">${reachDiagram(scopes.items)}</figure>${md(scopes.rest)}`,
            'growing-into-the-next-scope': `${flow(growth.items, true)}${md(growth.rest)}
                <figure class="diagram-figure">${modelDiagram(content, { scope: team, stretch: ['cd'], size: 170 })}
                <figcaption>Team scope in every area, stretching into Wider in Client & Delivery.</figcaption></figure>`,
            'the-cycle': `${flow(cycle.items, false)}${md(cycle.rest)}`,
        },
    });
}
