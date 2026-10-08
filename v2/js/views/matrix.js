// Expectations, the landing page: every scope by area. Detailed by default, with each area's
// facets under its core line; Concise keeps only the core lines, so the whole framework fits on
// one screen. Above the grid, "Start here" sends readers with a task to the page for it; each
// row's heading carries the scope's mindset and reach, so the grid also explains the scopes.
// The explored scope (set from the header's Explore a scope menu) and the next one are marked.

import { esc, mdInline, storageGet, storageSet } from '../ui.js';
import { savedScope, nextScope, viewTabs, expectationGroups, bindPicker, EXPLORING } from './_parts.js';
import { areaIcon } from '../diagram.js';

const sectionText = (page, slug) => page.sections.find(s => s.slug === slug)?.body || '';

// "- [Task](#route): what it involves" lines from home.md's Start here section.
function tasks(page) {
    const items = [...sectionText(page, 'start-here').matchAll(/^- \[(.+?)\]\((.+?)\):\s*(.+)$/gm)];
    return `<nav class="start-here" aria-labelledby="start-here-label">
        <p class="start-here-label" id="start-here-label">Start here</p>
        <ul>${items.map(([, label, href, desc]) => `<li><a href="${esc(href)}">${esc(label)}</a><span>${mdInline(desc)}</span></li>`).join('')}</ul>
    </nav>`;
}

export function render(content) {
    const page = content.pages.home;
    const mine = savedScope(content);
    const next = mine && nextScope(content, mine);
    const full = storageGet('v2.matrixFull', true);
    const option = (value, label, on) => `<button type="button" role="radio" data-value="${value}"
        aria-checked="${on}" tabindex="${on ? 0 : -1}">${label}</button>`;

    const head = content.areas.map(a => `<div class="mx-col-head" role="columnheader" data-area="${a.key}">
            <a href="#area/${a.id}">${areaIcon(a.key)}${esc(a.name)}</a>
            <span>${esc(a.question)}</span>
        </div>`).join('');

    const rows = content.scopes.map(s => {
        const marker = s.id === mine?.id ? EXPLORING : next && s.id === next.id ? 'Next scope' : '';
        return `<div class="mx-row${s.id === mine?.id ? ' is-mine' : ''}${next && s.id === next.id ? ' is-next' : ''}" role="row">
            <div class="mx-row-head" role="rowheader">
                <a href="#scope/${s.id}" aria-label="${esc(s.name)} scope: full expectations"><span>${esc(s.name)}</span></a>
                ${marker ? `<p class="mx-marker">${marker}</p>` : ''}
                <p class="mx-mindset">${esc(s.mindset)}</p>
                <p class="mx-reach">${esc(s.reaches)}</p>
            </div>
            ${content.areas.map(a => `<div class="mx-cell" role="cell" data-area="${a.key}">
                <span class="mx-cell-area">${areaIcon(a.key)}${esc(a.name)}</span>
                <p class="core">${esc(s.areas[a.id].core)}</p>
                <div class="mx-detail">${expectationGroups(s.areas[a.id], 'plain-list')}</div>
            </div>`).join('')}
        </div>`;
    }).join('');

    const highlight = mine
        ? `${esc(mine.name)}, the scope you're exploring, is highlighted; change it with Explore a scope at the top of the page.`
        : 'Choose a scope with Explore a scope at the top of the page to highlight it here.';

    return {
        title: 'Expectations',
        html: `<section class="page">
            <header class="page-head matrix-head">
                <h1>Expectations</h1>
                <p class="lede">${esc(page.lede)}</p>
                ${tasks(page)}
                ${viewTabs('all')}
                <p class="hint matrix-hint">Each row is a scope and each column an area. Open a scope for its full expectations and how to tell you're meeting them. ${highlight}</p>
            </header>
            <div class="segmented" role="radiogroup" aria-label="Level of detail">
                ${option('concise', 'Concise', !full)}${option('detailed', 'Detailed', full)}
            </div>
            <div class="matrix${full ? '' : ' compact'}" role="table" aria-label="Expectations by scope and area">
                <div class="mx-row mx-head" role="row"><div class="mx-corner" role="columnheader"><span class="visually-hidden">Scope</span></div>${head}</div>
                ${rows}
            </div>
            <section class="matrix-growth" aria-labelledby="matrix-growth-head">
                <h2 id="matrix-growth-head">How growth happens</h2>
                <p>${mdInline(sectionText(page, 'how-growth-happens'))} <a href="#how-it-works/growing-into-the-next-scope">How growth works</a></p>
            </section>
        </section>`,
        mount(root) {
            const matrix = root.querySelector('.matrix');
            bindPicker(root.querySelector('.segmented'), value => {
                const detailed = value === 'detailed';
                matrix.classList.toggle('compact', !detailed);
                storageSet('v2.matrixFull', detailed);
            });
        },
    };
}
