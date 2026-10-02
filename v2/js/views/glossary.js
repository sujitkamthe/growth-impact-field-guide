// The glossary: every term the guide uses, alphabetically, each linkable as #glossary/<term>.
// Pages link the first mention of a term in each section here (see js/terms.js).

import { esc, md } from '../ui.js';

const MATCHES = /^<!-- matches: .*? -->\s*/;

export function render(content, [open]) {
    const page = content.pages.glossary;
    return {
        title: page.title,
        keepScroll: Boolean(open),
        html: `<section class="page narrow">
            <header class="page-head">
                <h1>${esc(page.title)}</h1>
                <p class="lede">${esc(page.lede)}</p>
            </header>
            <dl class="glossary">
                ${page.sections.map(s => `<div class="glossary-term${s.slug === open ? ' is-target' : ''}" id="${s.slug}">
                    <dt>${esc(s.title)}</dt>
                    <dd>${md(s.body.replace(MATCHES, ''))}</dd>
                </div>`).join('')}
            </dl>
        </section>`,
        mount(root) {
            if (open) requestAnimationFrame(() => root.querySelector(`#${CSS.escape(open)}`)?.scrollIntoView({ block: 'start' }));
        },
    };
}
