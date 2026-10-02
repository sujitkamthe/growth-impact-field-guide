// Reading pages: a title, a lede, an "on this page" list and markdown sections.
// Views can replace a section's body or add content after it, keyed by the section's
// slug, and open the page at a section (#<page>/<section>).
//
// Worksheet pages (Self-assessment, Reviewing and feedback) also turn runs of
// "1. **Step**: text" into numbered steps, "- **Title**: text" into cards and
// blockquotes into example panels, and can put a tool under the header. A list preceded by
// "<!-- scale -->" becomes a scale (the ratings), and one preceded by "<!-- list -->" stays an
// ordinary list, so cards are kept for things a reader fills in.
//
// On every page, a section whose body starts with "<!-- band -->" is set on a tinted band:
// one per page at most, for the section whose register changes.

import { esc, md, mdInline } from '../ui.js';

const ITEM = /^(\d+\.|-) \*\*(.+?)\*\*:?\s*(.*)$/;
const NOTE = /^<!-- (scale|list) -->$/;
export const BAND = /^<!-- band -->\s*/;

function worksheetBody(body) {
    const out = [];
    let text = [];
    let run = null;
    let next = null; // what the next list should render as, from a NOTE
    const flushText = () => { if (text.length) out.push(md(text.join('\n'))); text = []; };
    const flushRun = () => {
        if (!run) return;
        const items = run.items.map(i => `<li><strong>${mdInline(i.title)}</strong>${i.text ? `<span>${mdInline(i.text)}</span>` : ''}</li>`).join('');
        out.push(run.ordered ? `<ol class="ws-steps">${items}</ol>`
            : run.kind === 'scale' ? `<ol class="ws-scale">${items}</ol>` : `<ul class="ws-cards">${items}</ul>`);
        run = null;
    };
    for (const line of body.split('\n')) {
        const note = line.match(NOTE);
        if (note) { flushRun(); next = note[1]; continue; }
        const m = line.match(ITEM);
        if (m && next === 'list') {
            text.push(line);
        } else if (m) {
            const ordered = m[1] !== '-';
            if (!run || run.ordered !== ordered) { flushText(); flushRun(); run = { ordered, kind: next, items: [] }; next = null; }
            run.items.push({ title: m[2], text: m[3].charAt(0).toUpperCase() + m[3].slice(1) });
        } else if (run && !line.trim()) {
            continue;
        } else {
            if (line.trim() && next === 'list') next = null;
            flushRun();
            text.push(line);
        }
    }
    flushText();
    flushRun();
    return out.join('').replace(/<blockquote>/g, '<blockquote class="ws-example"><p class="eyebrow">Example</p>');
}

export function renderProse(content, pageId, { bodies = {}, after = {}, open = null, worksheet = false, lead = '', mount: extra } = {}) {
    const page = content.pages[pageId];
    const body = s => bodies[s.slug] ?? (worksheet ? worksheetBody(s.body) : md(s.body));
    const band = s => (BAND.test(s.body) ? ' band' : '');
    return {
        title: page.title,
        keepScroll: Boolean(open),
        html: `<section class="page narrow${worksheet ? ' worksheet' : ''}">
            <header class="page-head">
                ${worksheet ? '<p class="eyebrow">Worksheet</p>' : ''}
                <h1>${esc(page.title)}</h1>
                <p class="lede">${esc(page.lede)}</p>
                ${lead}
                <nav class="on-page" aria-label="On this page">
                    ${page.sections.map(s => `<a href="#${pageId}" data-jump="${s.slug}">${esc(s.title)}</a>`).join('')}
                </nav>
            </header>
            ${page.sections.map(s => `<section class="prose${band(s)}" id="${s.slug}">
                <h2>${esc(s.title)}</h2>${body(s)}${after[s.slug] || ''}
            </section>`).join('')}
        </section>`,
        mount(root) {
            extra?.(root);
            if (open) requestAnimationFrame(() => root.querySelector(`#${CSS.escape(open)}`)?.scrollIntoView({ block: 'start' }));
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                history.replaceState(null, '', `#${pageId}/${a.dataset.jump}`);
                root.querySelector(`#${CSS.escape(a.dataset.jump)}`)?.scrollIntoView({ block: 'start' });
            }));
        },
    };
}
