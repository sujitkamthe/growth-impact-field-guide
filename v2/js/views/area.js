// One area: what it covers (facets that all count, or ways to contribute to choose from), then how it
// grows across the scopes, then its notes. Linkable to a section as #area/<area>/<section>.

import { esc, md, list } from '../ui.js';
import { GRAMMAR, expectationGroups, savedScope, EXPLORING } from './_parts.js';
import { areaIcon } from '../diagram.js';
import { BAND } from './prose.js';

// Each scope's own examples, side by side, so the step between scopes is visible.
function waysByScope(content, area) {
    return `<div class="ways-by-scope">${content.scopes.map(s => `<div>
        <h3><a href="#scope/${s.id}/${area.id}">${esc(s.name)}</a></h3>
        ${list(s.areas[area.id].ways, 'plain-list secondary')}
    </div>`).join('')}</div>`;
}

export function render(content, [id, open]) {
    const area = content.area(id);
    if (!area) return null;

    const mine = savedScope(content);
    const thread = content.scopes.map(s => {
        const block = s.areas[area.id];
        const exploring = s.id === mine?.id;
        return `<li class="thread-step${exploring ? ' is-mine' : ''}">
            <div class="thread-scope-cell">
                <a class="thread-scope" href="#scope/${s.id}/${area.id}"><span>${esc(s.name)}</span></a>
                ${exploring ? EXPLORING : ''}
            </div>
            <div>
                <p class="core">${esc(block.core)}</p>
                ${expectationGroups(block)}
            </div>
        </li>`;
    }).join('');

    const routes = area.groupKind === 'routes';
    const covers = routes ? 'Ways to contribute' : 'What it covers';
    const onPage = [{ slug: 'what-it-covers', title: covers }, { slug: 'how-it-grows', title: 'How it grows' }, ...area.sections];

    return {
        title: area.name,
        keepScroll: Boolean(open),
        html: `<article class="page area-page" data-area="${area.key}">
                <header class="page-head area-head">
                    <p class="eyebrow"><a href="#expectations">Expectations</a></p>
                    <h1 class="area-title">${areaIcon(area.key)}${esc(area.name)}</h1>
                    <p class="area-question">${esc(area.question)}</p>
                    ${md(area.summary)}
                </header>
                <nav class="on-page" aria-label="On this page">
                    ${onPage.map(s => `<a href="#area/${area.id}" data-jump="${s.slug}">${esc(s.title)}</a>`).join('')}
                </nav>
                <section id="what-it-covers">
                    <h2>${covers}</h2>
                    <p class="kind">${routes ? GRAMMAR.routes : GRAMMAR.facets}</p>
                    ${area.groupIntro ? `<div class="prose">${md(area.groupIntro)}</div>` : ''}
                    <div class="facets">${area.facets.map(f => `<div><h3>${esc(f.title)}</h3>${md(f.body)}</div>`).join('')}</div>
                </section>
                <section id="how-it-grows">
                    <h2>How it grows</h2>
                    <ol class="thread">${thread}</ol>
                </section>
                ${area.sections.map(s => `<section class="prose section-${s.slug}${BAND.test(s.body) ? ' band' : ''}" id="${s.slug}">
                    <h2>${esc(s.title)}</h2>${md(s.body)}${s.slug === 'examples-at-each-scope' ? waysByScope(content, area) : ''}
                </section>`).join('')}
            </article>`,
        mount(root) {
            if (open) requestAnimationFrame(() => root.querySelector(`#${CSS.escape(open)}`)?.scrollIntoView({ block: 'start' }));
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                history.replaceState(null, '', `#area/${area.id}/${a.dataset.jump}`);
                root.querySelector(`#${CSS.escape(a.dataset.jump)}`)?.scrollIntoView({ block: 'start' });
            }));
        },
    };
}
