// Expectations: every scope by area. Concise by default, listing only each expectation's handle
// so the grid reads like a one-page sheet; Detailed puts each handle over the bullets that unpack
// it. Each row's heading carries the scope's mindset and reach, so the grid also explains the scopes.
// The explored scope (set from the header's Explore a scope menu) and the next one are marked.
// Once someone explores a scope, the grid shows only its row, with a link to compare it with the
// next one and a button that brings every level back; a first visit sees all four.

import { esc, mdInline, storageGet, storageSet } from '../ui.js';
import { savedScope, nextScope, viewTabs, expectationGroups, bindPicker, EXPLORING } from './_parts.js';
import { areaIcon } from '../diagram.js';

const sectionText = (page, slug) => page.sections.find(s => s.slug === slug)?.body || '';

// An area whose expectations have no handles has no Concise form, so Concise shows only its core line.
const hasHandles = block => [...block.shared, ...block.facets.flatMap(f => f.items)].some(e => e.handle);

export function render(content) {
    const page = content.pages.home;
    const mine = savedScope(content);
    const next = mine && nextScope(content, mine);
    const full = storageGet('v2.matrixFull', false);
    const oneLevel = Boolean(mine) && !storageGet('v2.matrixAllLevels', false);
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
                <div class="mx-detail${hasHandles(s.areas[a.id]) ? '' : ' no-concise'}">${expectationGroups(s.areas[a.id], 'plain-list', 'detailed')}</div>
            </div>`).join('')}
        </div>`;
    }).join('');

    const highlight = mine
        ? `${esc(mine.name)} is the scope you're exploring; change it with Explore a scope at the top of the page.`
        : 'Choose a scope with Explore a scope at the top of the page to see only its expectations here.';
    const levels = mine ? `<button type="button" class="button quiet matrix-levels" data-levels>
        ${oneLevel ? 'Show all levels' : `Show only ${esc(mine.name)}`}</button>` : '';
    const compareNext = next ? `<p class="matrix-next"><a href="#compare/${mine.id}/${next.id}">See what changes at ${esc(next.name)} →</a></p>` : '';

    return {
        title: 'Expectations',
        html: `<section class="page">
            <header class="page-head matrix-head">
                <h1>Expectations</h1>
                ${viewTabs('all')}
                <p class="hint matrix-hint">Each row is a scope and each column an area. Open a scope for its full expectations and how to tell you're meeting them. ${highlight}</p>
            </header>
            <div class="matrix-controls">
                ${levels}
                <div class="segmented" role="radiogroup" aria-label="Level of detail">
                    ${option('concise', 'Concise', !full)}${option('detailed', 'Detailed', full)}
                </div>
            </div>
            <div class="matrix${full ? '' : ' compact'}${oneLevel ? ' one-level' : ''}" role="table" aria-label="Expectations by scope and area">
                <div class="mx-row mx-head" role="row"><div class="mx-corner" role="columnheader"><span class="visually-hidden">Scope</span></div>${head}</div>
                ${rows}
            </div>
            ${compareNext}
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
            const levels = root.querySelector('[data-levels]');
            levels?.addEventListener('click', () => {
                const one = matrix.classList.toggle('one-level');
                storageSet('v2.matrixAllLevels', !one);
                levels.textContent = one ? 'Show all levels' : `Show only ${mine.name}`;
            });
        },
    };
}
