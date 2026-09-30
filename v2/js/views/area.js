// One area across all scopes: how it grows first, then what it covers and its notes.

import { esc, md, list } from '../ui.js';

// Each scope's own examples, side by side, so the step between scopes is visible.
function waysByScope(content, area) {
    return `<div class="ways-by-scope">${content.scopes.map(s => `<div>
        <h3><a href="#scope/${s.id}/${area.id}">${esc(s.name)}</a></h3>
        ${list(s.areas[area.id].ways, 'plain-list secondary')}
    </div>`).join('')}</div>`;
}

export function render(content, [id]) {
    const area = content.area(id);
    if (!area) return null;

    const thread = content.scopes.map(s => {
        const block = s.areas[area.id];
        return `<li class="thread-step">
            <a class="thread-scope" href="#scope/${s.id}/${area.id}"><span>${esc(s.name)}</span></a>
            <div>
                <p class="core">${esc(block.core)}</p>
                ${list(block.expectations, 'plain-list')}
            </div>
        </li>`;
    }).join('');

    const onPage = [{ slug: 'how-it-grows', title: 'How it grows' }, { slug: 'what-it-covers', title: 'What it covers' }, ...area.sections];

    return {
        title: area.name,
        html: `<article class="page area-page" data-area="${area.key}">
                <header class="page-head area-head">
                    <p class="eyebrow"><a href="#expectations">Expectations</a></p>
                    <h1>${esc(area.name)}</h1>
                    <p class="area-question">${esc(area.question)}</p>
                    ${md(area.summary)}
                </header>
                <nav class="on-page" aria-label="On this page">
                    ${onPage.map(s => `<a href="#area/${area.id}" data-jump="${s.slug}">${esc(s.title)}</a>`).join('')}
                </nav>
                <section id="how-it-grows">
                    <h2>How it grows</h2>
                    <ol class="thread">${thread}</ol>
                </section>
                <section id="what-it-covers">
                    <h2>What it covers</h2>
                    <div class="facets">${area.facets.map(f => `<div><h3>${esc(f.title)}</h3>${md(f.body)}</div>`).join('')}</div>
                </section>
                ${area.sections.map(s => `<section class="prose section-${s.slug}" id="${s.slug}">
                    <h2>${esc(s.title)}</h2>${md(s.body)}${s.slug === 'ways-to-contribute' ? waysByScope(content, area) : ''}
                </section>`).join('')}
            </article>`,
        mount(root) {
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                root.querySelector(`#${CSS.escape(a.dataset.jump)}`)?.scrollIntoView({ block: 'start' });
            }));
        },
    };
}
