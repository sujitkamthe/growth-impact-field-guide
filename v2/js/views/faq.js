// Questions, grouped. Each question can be linked to directly as #faq/<slug>.

import { esc, md } from '../ui.js';
import { splitSections } from '../content.js';

export function render(content, [open]) {
    const page = content.pages.faq;
    const groups = page.sections.map(g => ({ ...g, questions: splitSections(g.body, 3).sections }));

    return {
        title: page.title,
        keepScroll: Boolean(open),
        html: `<section class="page narrow">
            <header class="page-head">
                <h1>${esc(page.title)}</h1>
                <p class="lede">${md(page.lede).replace(/^<p>|<\/p>\s*$/g, '')}</p>
                <nav class="on-page" aria-label="Question groups">
                    ${groups.map(g => `<a href="#faq" data-jump="${g.slug}">${esc(g.title)}</a>`).join('')}
                </nav>
            </header>
            ${groups.map(g => `<section class="faq-group" id="${g.slug}">
                <h2>${esc(g.title)}</h2>
                <div class="faq">
                    ${g.questions.map(q => `<details id="${q.slug}"${q.slug === open ? ' open' : ''}>
                        <summary>${esc(q.title)}</summary>
                        <div class="prose">${md(q.body)}</div>
                    </details>`).join('')}
                </div>
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
