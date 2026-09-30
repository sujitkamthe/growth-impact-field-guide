// Compare two scopes area by area. Defaults to your scope and the one above it.

import { esc, md, list } from '../ui.js';
import { savedScope, nextScope, viewTabs } from './_parts.js';

function select(content, name, selected, label) {
    return `<label class="field inline">
        <span>${label}</span>
        <select name="${name}">${content.scopes.map(s =>
            `<option value="${s.id}"${s.id === selected ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
    </label>`;
}

export function render(content, [fromId, toId]) {
    const mine = savedScope(content);
    const from = content.scope(fromId) || (nextScope(content, mine) ? mine : content.scopes[content.scopes.length - 2]);
    const to = content.scope(toId) || nextScope(content, from) || content.scopes[content.scopes.length - 1];
    const adjacentUp = to.order === from.order + 1;

    const rows = content.areas.map(a => {
        const f = from.areas[a.id];
        const t = to.areas[a.id];
        return `<section class="cmp-area" data-area="${a.key}">
            <h2 class="area-heading">${esc(a.name)}</h2>
            <div class="cmp-cols">
                <div><p class="cmp-scope">${esc(from.name)}</p><p class="core">${esc(f.core)}</p>${list(f.expectations, 'plain-list secondary')}</div>
                <div><p class="cmp-scope">${esc(to.name)}</p><p class="core">${esc(t.core)}</p>${list(t.expectations, 'plain-list secondary')}</div>
            </div>
        </section>`;
    }).join('');

    return {
        title: `Compare ${from.name} and ${to.name}`,
        html: `<section class="page">
            <header class="page-head">
                <h1>Expectations</h1>
                ${viewTabs('compare')}
                <p class="lede">See what changes between two scopes, area by area.</p>
                <form class="cmp-pick">
                    ${select(content, 'from', from.id, 'From')}
                    ${select(content, 'to', to.id, 'To')}
                </form>
            </header>
            <div class="cmp-cols cmp-shift">
                <div><p class="cmp-scope">${esc(from.name)} is trusted to answer</p><p class="q">${esc(from.question)}</p></div>
                <div><p class="cmp-scope">${esc(to.name)} is trusted to answer</p><p class="q">${esc(to.question)}</p></div>
            </div>
            ${adjacentUp ? `<section class="what-changes"><h2>What changes</h2>${md(to.whatChanges)}</section>` : ''}
            ${rows}
        </section>`,
        mount(root) {
            root.querySelector('.cmp-pick').addEventListener('change', e => {
                const form = e.currentTarget;
                location.hash = `compare/${form.from.value}/${form.to.value}`;
            });
        },
    };
}
