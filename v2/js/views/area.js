// One area: what it covers (facets that all count, or ways to contribute to choose from), then how it
// grows across the scopes, listing only each expectation's handle, then its notes, each a short line
// with the rest behind Read more. Linkable to a section as #area/<area>/<section>.

import { esc, md, list, bindFolds, openFoldAround } from '../ui.js';
import { GRAMMAR, expectationGroups, savedScope, EXPLORING } from './_parts.js';
import { areaIcon } from '../diagram.js';
import { BAND, glance } from './prose.js';
import { filmForArea } from '../tour/films.js';
import { filmLink } from './tour.js';

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
                <div class="handles-only">${expectationGroups(block, 'plain-list', 'detailed')}</div>
            </div>
        </li>`;
    }).join('');

    // The neighbouring areas, in order, so a reader can move across without going back to Expectations.
    const i = content.areas.findIndex(a => a.id === area.id);
    const [prev, next] = [content.areas[i - 1], content.areas[i + 1]];
    const routes = area.groupKind === 'routes';
    const covers = routes ? 'Ways to contribute' : 'What it covers';
    const film = filmForArea(area.id);

    return {
        title: area.name,
        keepScroll: Boolean(open),
        html: `<article class="page area-page" data-area="${area.key}">
                <header class="page-head area-head">
                    <p class="eyebrow"><a class="back-link" href="#expectations">Expectations</a></p>
                    <h1 class="area-title">${areaIcon(area.key)}${esc(area.name)}</h1>
                    <p class="area-question">${esc(area.question)}</p>
                    ${md(area.summary)}
                    ${film ? filmLink(film, 'a narrated film about this area') : ''}
                </header>
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
                    <h2>${esc(s.title)}</h2>${glance(s, md, s.slug === 'examples-at-each-scope'
                        ? { more: md(s.body.replace(BAND, '')) + waysByScope(content, area) } : undefined)}
                </section>`).join('')}
                <nav class="pager" aria-label="Other areas">
                    ${prev ? `<a href="#area/${prev.id}"><span>Previous</span>${esc(prev.name)}</a>` : '<span></span>'}
                    ${next ? `<a class="pager-next" href="#area/${next.id}"><span>Next</span>${esc(next.name)}</a>` : ''}
                </nav>
            </article>`,
        mount(root) {
            bindFolds(root);
            if (open) requestAnimationFrame(() => {
                const target = root.querySelector(`#${CSS.escape(open)}`);
                openFoldAround(target);
                target?.scrollIntoView({ block: 'start' });
            });
        },
    };
}
