// Expectations: every scope by area. Concise by default so the whole framework fits on
// one screen; Detailed adds each area's facets. The viewer's scope and the next one are marked.

import { esc, storageGet, storageSet } from '../ui.js';
import { savedScope, nextScope, viewTabs, expectationGroups, bindPicker, EXPLORING } from './_parts.js';
import { areaIcon } from '../diagram.js';

export function render(content) {
    const mine = savedScope(content);
    const next = mine && nextScope(content, mine);
    const full = storageGet('v2.matrixFull', false);
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
                <p class="mx-question">${esc(s.question)}</p>
            </div>
            ${content.areas.map(a => `<div class="mx-cell" role="cell" data-area="${a.key}">
                <span class="mx-cell-area">${areaIcon(a.key)}${esc(a.name)}</span>
                <p class="core">${esc(s.areas[a.id].core)}</p>
                <div class="mx-detail">${expectationGroups(s.areas[a.id], 'plain-list')}</div>
            </div>`).join('')}
        </div>`;
    }).join('');

    return {
        title: 'Expectations',
        html: `<section class="page">
            <header class="page-head matrix-head">
                <h1>Expectations</h1>
                ${viewTabs('all')}
                <p class="lede">Each row is a scope and each column an area. Open a scope for its full expectations and how to tell you're meeting them. ${mine ? `${esc(mine.name)}, the scope you last explored, is highlighted; you can change it on the <a href="#home">home page</a>.` : 'Choose a scope on the <a href="#home">home page</a> to highlight it here.'}</p>
            </header>
            <div class="segmented" role="radiogroup" aria-label="Level of detail">
                ${option('concise', 'Concise', !full)}${option('detailed', 'Detailed', full)}
            </div>
            <div class="matrix${full ? '' : ' compact'}" role="table" aria-label="Expectations by scope and area">
                <div class="mx-row mx-head" role="row"><div class="mx-corner" role="columnheader"><span class="visually-hidden">Scope</span></div>${head}</div>
                ${rows}
            </div>
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
