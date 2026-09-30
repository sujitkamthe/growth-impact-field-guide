// One scope in depth. Deep-linkable to an area: #scope/<scope>/<area>.
// Expectations lead; evidence, self-checks, examples and routes open on demand.

import { esc, md, list, copyText } from '../ui.js';
import { nextScope, prevScope } from './_parts.js';

function areaSection(scope, area, block) {
    return `<section class="scope-area" data-area="${area.key}" id="${area.id}">
        <div class="section-head">
            <h2 class="area-heading">${esc(area.name)}</h2>
            <button type="button" class="link-button small copy-section" data-copy-area="${area.id}">Copy link</button>
        </div>
        <p class="core large">${esc(block.core)}</p>
        ${list(block.expectations, 'plain-list expect')}
        ${block.ways.length ? `<details class="how-to-tell">
            <summary>Ways to contribute at ${esc(scope.name)}</summary>
            <p class="hint">Examples to choose from. Anything else counts too, judged by what it changed.</p>
            ${list(block.ways, 'plain-list secondary')}
        </details>` : ''}
        <details class="how-to-tell">
            <summary>How to tell</summary>
            <p class="hint">Look for a pattern: one example shows you can; consistency, and others relying on it, shows you do.</p>
            <div class="tell-cols">
                <div><h3>Evidence</h3>${list(block.evidence, 'plain-list secondary')}</div>
                <div><h3>Ask yourself</h3>${list(block.selfCheck, 'plain-list secondary')}</div>
                <div><h3>Not there yet</h3>${list(block.notYet, 'plain-list secondary')}</div>
            </div>
        </details>
    </section>`;
}

export function render(content, [id, areaId]) {
    const scope = content.scope(id);
    if (!scope) return null;
    const prev = prevScope(content, scope);
    const next = nextScope(content, scope);
    const link = target => `${location.origin}${location.pathname}#scope/${scope.id}/${target}`;

    const more = [
        scope.examples['meets-expectations'] && `<details class="more" id="examples">
            <summary>What Meets and Below look like</summary>
            <div class="two-col">
                <div><h3>Meets expectations</h3>${md(scope.examples['meets-expectations'])}</div>
                <div><h3>Below expectations</h3>${md(scope.examples['below-expectations'])}</div>
            </div>
        </details>`,
        scope.ways && `<details class="more" id="ways">
            <summary>Ways to create impact at ${esc(scope.name)}</summary>
            ${scope.ways.intro ? `<div class="prose">${md(scope.ways.intro)}</div>` : ''}
            <div class="ways-grid">${scope.ways.sections.map(w => `<div><h3>${esc(w.title)}</h3>${md(w.body)}</div>`).join('')}</div>
        </details>`,
        `<details class="more" id="about">
            <summary>More about ${esc(scope.name)}</summary>
            <div class="prose">${md(scope.summary)}</div>
            <p class="v1-note">In the V1 guide this was ${esc(scope.v1)}.</p>
        </details>`,
    ].filter(Boolean).join('');

    return {
        title: `${scope.name} scope`,
        keepScroll: Boolean(areaId),
        html: `<article class="page scope-page">
            <header class="scope-head">
                <p class="eyebrow"><a href="#expectations">Expectations</a></p>
                <h1>${esc(scope.name)}</h1>
                <p class="mindset">${esc(scope.mindset)}</p>
                <div class="lede">${md(scope.whatChanges)}</div>
                ${next ? `<p><a href="#compare/${scope.id}/${next.id}">Compare with ${esc(next.name)}</a></p>` : ''}
            </header>
            <div class="sticky-bar">
                <span class="sticky-title">${esc(scope.name)}</span>
                <nav aria-label="Sections on this page">
                    ${content.areas.map(a => `<a href="#scope/${scope.id}/${a.id}" data-jump="${a.id}">${esc(a.name)}</a>`).join('')}
                </nav>
            </div>
            ${content.areas.map(a => areaSection(scope, a, scope.areas[a.id])).join('')}
            <div class="more-group">${more}</div>
            <nav class="pager" aria-label="Other scopes">
                ${prev ? `<a href="#scope/${prev.id}"><span>Previous</span>${esc(prev.name)}</a>` : '<span></span>'}
                ${next ? `<a class="pager-next" href="#scope/${next.id}"><span>Next</span>${esc(next.name)}</a>` : ''}
            </nav>
        </article>`,
        mount(root) {
            const scrollTo = target => root.querySelector(`#${CSS.escape(target)}`)?.scrollIntoView({ block: 'start' });
            if (areaId) {
                const target = root.querySelector(`#${CSS.escape(areaId)}`);
                if (target?.tagName === 'DETAILS') target.open = true;
                requestAnimationFrame(() => scrollTo(areaId));
            }
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                history.replaceState(null, '', a.getAttribute('href'));
                scrollTo(a.dataset.jump);
            }));
            root.querySelectorAll('[data-copy-area]').forEach(b => b.addEventListener('click', () => copyText(link(b.dataset.copyArea), b)));
        },
    };
}
