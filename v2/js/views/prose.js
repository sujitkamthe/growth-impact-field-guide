// Reading pages: a title, a lede and markdown sections. Sections are short enough to take in at a
// glance, so there is no "on this page" list; each is still linkable as #<page>/<section>.
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
//
// So a page can be taken in at a glance, a section with a short line (see takeShort in
// content.js) shows only that line, and the rest opens from Read more. "<!-- more -->" in a
// section keeps what comes before it in view and folds the rest; a view can do the same by
// passing { visual, more } as a section's body.

import { esc, md, mdInline, fold, bindFolds, openFoldAround } from '../ui.js';

const ITEM = /^(\d+\.|-) \*\*(.+?)\*\*:?\s*(.*)$/;
const NOTE = /^<!-- (scale|list) -->$/;
export const BAND = /^<!-- band -->\s*/;
const MORE = /^<!-- more -->$/m;

// A section's short line, what stays in view and what folds behind Read more. The short line is
// the summary; markdown before "<!-- more -->" stays in view.
export function glance(s, render, given) {
    const short = s.short ? `<p class="glance-short">${mdInline(s.short)}</p>` : '';
    if (given && typeof given === 'object') return short + (given.visual || '') + fold(given.more || '');
    if (typeof given === 'string') return short + given;
    const body = s.body.replace(BAND, '');
    if (MORE.test(body)) {
        const [shown, folded] = body.split(MORE);
        return short + render(shown) + fold(render(folded));
    }
    return s.short ? short + fold(render(body)) : render(body);
}

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
    const render = text => (worksheet ? worksheetBody(text) : md(text));
    const body = s => glance(s, render, bodies[s.slug]);
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
            </header>
            ${page.sections.map(s => `<section class="prose${band(s)}" id="${s.slug}">
                <h2>${esc(s.title)}</h2>${body(s)}${after[s.slug] || ''}
            </section>`).join('')}
        </section>`,
        mount(root) {
            extra?.(root);
            bindFolds(root);
            const show = slug => {
                const target = root.querySelector(`#${CSS.escape(slug)}`);
                openFoldAround(target);
                target?.scrollIntoView({ block: 'start' });
            };
            if (open) requestAnimationFrame(() => show(open));
        },
    };
}
