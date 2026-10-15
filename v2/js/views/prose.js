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
import { icon } from '../icons.js';

const ITEM = /^(\d+\.|-) \*\*(.+?)\*\*:?\s*(.*)$/;
const NOTE = /^<!-- (scale|list) -->$/;
export const BAND = /^<!-- band -->\s*/;
const MORE = /^<!-- more -->$/m;

// A section's short line, what stays in view and what folds behind Read more. The short line is
// the summary; markdown before "<!-- more -->" stays in view.
export function glance(s, render, given) {
    const short = s.short ? `<p class="glance-short">${mdInline(s.short)}</p>` : '';
    if (given && typeof given === 'object') return short + (given.visual || '') + fold(given.more || '', given.label);
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

// Pages read as a journey when their sections are grouped: "<!-- group: Title | one line | icon -->"
// at the start of a section opens a numbered stage that runs until the next marker, and
// "<!-- tips: Title -->" opens a set of optional cards. The page then leads with a map of the stages,
// so a reader sees where to start and what they can skip. Sections before the first marker are an
// introduction. A stage's sections keep their own ids, so links such as #how-it-works/the-cycle work.
const GROUP = /^<!-- (group|tips): (.*?) -->\s*/;
const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function groupSections(sections) {
    const intro = [], groups = [];
    let current = null;
    for (const section of sections) {
        const m = section.body.match(GROUP);
        const s = m ? { ...section, body: section.body.replace(GROUP, '') } : section;
        if (m) {
            const [title, desc = '', iconName = ''] = m[2].split('|').map(x => x.trim());
            current = { kind: m[1], title, desc, icon: iconName || (m[1] === 'tips' ? 'tip' : ''), slug: `part-${slugify(title)}`, sections: [] };
            groups.push(current);
        }
        (current ? current.sections : intro).push(s);
    }
    return { intro, groups };
}

function journey(pageId, sections, part) {
    const { intro, groups } = groupSections(sections);
    const stages = groups.filter(g => g.kind === 'group');
    const map = `<nav class="journey-map" aria-label="Parts of this page"><ol>
        ${stages.map((g, i) => `<li><a href="#${pageId}/${g.slug}" data-jump="${g.slug}">
            <span class="jm-num">${i + 1}</span>${icon(g.icon)}<strong>${esc(g.title)}</strong><span class="jm-desc">${esc(g.desc)}</span>
        </a></li>`).join('')}
    </ol></nav>`;
    // A stage's own heading is enough when its only section, or its first, has the same name.
    const sub = (g, s) => (g.sections.length === 1 || s.title.toLowerCase() === g.title.toLowerCase() ? '' : `<h3>${esc(s.title)}</h3>`);
    const stage = (g, n) => `<section class="journey-stage" id="${g.slug}">
        <div class="js-rail" aria-hidden="true"><span class="js-num">${n}</span></div>
        <div class="js-body">
            <h2>${icon(g.icon)}${esc(g.title)}</h2>
            ${g.desc ? `<p class="js-desc">${esc(g.desc)}</p>` : ''}
            ${g.sections.map(s => `<section class="prose js-part" id="${s.slug}">${sub(g, s)}${part(s)}</section>`).join('')}
        </div>
    </section>`;
    const tips = g => `<section class="journey-tips" id="${g.slug}">
        <h2>${icon(g.icon)}${esc(g.title)}</h2>
        <div class="tip-grid">${g.sections.map(s => `<section class="tip-card prose" id="${s.slug}">
            <h3>${esc(s.title)}</h3>${part(s)}
        </section>`).join('')}</div>
    </section>`;
    let n = 0;
    return `${intro.map(s => `<section class="prose journey-intro" id="${s.slug}"><h2>${esc(s.title)}</h2>${part(s)}</section>`).join('')}
        ${map}
        ${groups.map(g => (g.kind === 'tips' ? tips(g) : stage(g, ++n))).join('')}`;
}

export function renderProse(content, pageId, { bodies = {}, after = {}, open = null, worksheet = false, lead = '', mount: extra } = {}) {
    const page = content.pages[pageId];
    const render = text => (worksheet ? worksheetBody(text) : md(text));
    const body = s => glance(s, render, bodies[s.slug]);
    const band = s => (BAND.test(s.body) ? ' band' : '');
    const isJourney = page.sections.some(s => GROUP.test(s.body));
    const sections = isJourney
        ? journey(pageId, page.sections, s => body(s) + (after[s.slug] || ''))
        : page.sections.map(s => `<section class="prose${band(s)}" id="${s.slug}">
                <h2>${esc(s.title)}</h2>${body(s)}${after[s.slug] || ''}
            </section>`).join('');
    return {
        title: page.title,
        keepScroll: Boolean(open),
        html: `<section class="page narrow${worksheet ? ' worksheet' : ''}${isJourney ? ' journey' : ''}">
            <header class="page-head">
                ${worksheet ? '<p class="eyebrow">Worksheet</p>' : ''}
                <h1>${esc(page.title)}${page.status === 'draft' ? ' <span class="draft-tag">Draft</span>' : ''}</h1>
                <p class="lede">${esc(page.lede)}</p>
                ${page.status === 'draft' ? `<p class="draft-note">${icon('info')}<span><strong>Work in progress, not finalised.</strong> This page is a view still being refined. It doesn't change the expectations set out elsewhere in the guide.</span></p>` : ''}
                ${lead}
            </header>
            ${sections}
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
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                history.replaceState(null, '', `#${pageId}/${a.dataset.jump}`);
                show(a.dataset.jump);
            }));
        },
    };
}
