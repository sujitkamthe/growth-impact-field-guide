// Plain reading pages: a title, a lede, an "on this page" list and markdown sections.
// Views can replace a section's body or add content after it, keyed by the section's
// slug, and open the page at a section (#<page>/<section>).

import { esc, md } from '../ui.js';

export function renderProse(content, pageId, { bodies = {}, after = {}, open = null } = {}) {
    const page = content.pages[pageId];
    return {
        title: page.title,
        keepScroll: Boolean(open),
        html: `<section class="page narrow">
            <header class="page-head">
                <h1>${esc(page.title)}</h1>
                <p class="lede">${esc(page.lede)}</p>
                <nav class="on-page" aria-label="On this page">
                    ${page.sections.map(s => `<a href="#${pageId}" data-jump="${s.slug}">${esc(s.title)}</a>`).join('')}
                </nav>
            </header>
            ${page.sections.map(s => `<section class="prose" id="${s.slug}">
                <h2>${esc(s.title)}</h2>${bodies[s.slug] ?? md(s.body)}${after[s.slug] || ''}
            </section>`).join('')}
        </section>`,
        mount(root) {
            if (open) requestAnimationFrame(() => root.querySelector(`#${CSS.escape(open)}`)?.scrollIntoView({ block: 'start' }));
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                root.querySelector(`#${CSS.escape(a.dataset.jump)}`)?.scrollIntoView({ block: 'start' });
            }));
        },
    };
}
