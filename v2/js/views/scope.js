// One scope in depth. Deep-linkable to an area: #scope/<scope>/<area>.

import { esc, md, list, copyText } from '../ui.js';
import { modelDiagram } from '../diagram.js';
import { nextScope, prevScope, breadcrumb, sideList } from './_parts.js';

function areaSection(scope, area, block) {
    return `<section class="scope-area" data-area="${area.key}" id="${area.id}">
        <div class="section-head">
            <h2 class="area-heading">${esc(area.name)}</h2>
            <button type="button" class="link-button small" data-copy-area="${area.id}">Copy link to this section</button>
        </div>
        <p class="core large">${esc(block.core)}</p>
        <div class="two-col">
            <div><h3>Expectations</h3>${list(block.expectations, 'plain-list')}</div>
            <div><h3>Evidence of a pattern</h3>${list(block.evidence, 'plain-list')}</div>
        </div>
        <div class="two-col">
            <div><h3>Ask yourself</h3>${list(block.selfCheck, 'plain-list')}</div>
            <div><h3>Signs it isn't there yet</h3>${list(block.notYet, 'plain-list')}</div>
        </div>
    </section>`;
}

export function render(content, [id, areaId]) {
    const scope = content.scope(id);
    if (!scope) return null;
    const prev = prevScope(content, scope);
    const next = nextScope(content, scope);
    const link = target => `${location.origin}${location.pathname}#scope/${scope.id}/${target}`;

    const ways = scope.ways ? `<section class="ways" id="ways">
            <h2>Ways to create impact at this scope</h2>
            ${scope.ways.intro ? `<div class="prose">${md(scope.ways.intro)}</div>` : ''}
            <div class="ways-grid">${scope.ways.sections.map(w => `<div><h3>${esc(w.title)}</h3>${md(w.body)}</div>`).join('')}</div>
        </section>` : '';

    const examples = scope.examples['meets-expectations'] ? `<section class="examples" id="examples">
            <h2>What this looks like in practice</h2>
            <div class="two-col">
                <div><h3>Meets expectations</h3>${md(scope.examples['meets-expectations'])}</div>
                <div><h3>Below expectations</h3>${md(scope.examples['below-expectations'])}</div>
            </div>
        </section>` : '';

    return {
        title: `${scope.name} scope`,
        keepScroll: Boolean(areaId),
        html: `<div class="with-side">
            ${sideList(content, { scopeId: scope.id })}
            <article class="page-main">
                ${breadcrumb([{ href: '#expectations', label: 'All expectations' }, { label: `${scope.name} scope` }])}
                <header class="scope-head">
                    <div>
                        <h1>${esc(scope.name)}</h1>
                        <p class="reach">${esc(scope.radius)}</p>
                        <p class="mindset">${esc(scope.mindset)}</p>
                        <p class="trusted">Trusted to answer: ${esc(scope.question)}</p>
                    </div>
                    <div class="scope-diagram" aria-hidden="true">${modelDiagram(content, { scope, size: 132, labels: false })}</div>
                </header>
                <section class="what-changes">
                    <h2>${prev ? `What changes from ${esc(prev.name)}` : 'Where everyone starts'}</h2>
                    ${md(scope.whatChanges)}
                    <p class="inline-links">
                        ${next ? `<a href="#compare/${scope.id}/${next.id}">Compare with ${esc(next.name)}</a>` : ''}
                        ${prev ? `<a href="#compare/${prev.id}/${scope.id}">Compare with ${esc(prev.name)}</a>` : ''}
                    </p>
                </section>
                <div class="prose">${md(scope.summary)}</div>
                <div class="sticky-bar">
                    <span class="sticky-title">${esc(scope.name)}</span>
                    <nav aria-label="Sections on this page">
                        ${content.areas.map(a => `<a href="#scope/${scope.id}/${a.id}" data-jump="${a.id}">${esc(a.name)}</a>`).join('')}
                        ${scope.examples['meets-expectations'] ? `<a href="#scope/${scope.id}/examples" data-jump="examples">Examples</a>` : ''}
                    </nav>
                </div>
                <p class="hint">Evidence means a pattern: one example shows you can; consistency, and others relying on it, shows you do.</p>
                ${content.areas.map(a => areaSection(scope, a, scope.areas[a.id])).join('')}
                ${examples}
                ${ways}
                <p class="v1-note">In the V1 guide this was ${esc(scope.v1)}.</p>
            </article>
        </div>`,
        mount(root) {
            const scrollTo = target => root.querySelector(`#${CSS.escape(target)}`)?.scrollIntoView({ block: 'start' });
            if (areaId) requestAnimationFrame(() => scrollTo(areaId));
            root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
                e.preventDefault();
                history.replaceState(null, '', a.getAttribute('href'));
                scrollTo(a.dataset.jump);
            }));
            root.querySelectorAll('[data-copy-area]').forEach(b => b.addEventListener('click', () => copyText(link(b.dataset.copyArea), b)));
        },
    };
}
