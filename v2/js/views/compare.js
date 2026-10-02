// Compare two scopes area by area, facet by facet, with one sentence on what changes
// in each area between adjacent scopes. Defaults to your scope and the one above it,
// or the first two scopes if you haven't chosen one. On a phone the pairs stack, so the
// "from" scope's facet lists start hidden and a toggle brings them back.

import { esc, md, mdInline, list } from '../ui.js';
import { savedScope, nextScope, viewTabs, NATURE } from './_parts.js';
import { areaIcon } from '../diagram.js';

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
    const from = content.scope(fromId)
        || (!mine ? content.scopes[0] : nextScope(content, mine) ? mine : content.scopes[content.scopes.length - 2]);
    const to = content.scope(toId) || nextScope(content, from) || content.scopes[content.scopes.length - 1];
    const adjacentUp = to.order === from.order + 1;

    // Each column names its scope so the pairs still read once they stack on a phone.
    const pair = (fromHtml, toHtml) => `<div class="cmp-cols">
        <div><p class="cmp-scope">${esc(from.name)}</p>${fromHtml}</div>
        <div><p class="cmp-scope">${esc(to.name)}</p>${toHtml}</div>
    </div>`;

    const rows = content.areas.map(a => {
        const f = from.areas[a.id];
        const t = to.areas[a.id];
        const detail = t.facets.length
            ? t.facets.map(tf => `<div class="cmp-facet">
                <p class="facet-label">${esc(tf.title)}</p>
                ${pair(list(f.facets.find(ff => ff.slug === tf.slug)?.items || [], 'plain-list secondary'), list(tf.items, 'plain-list secondary'))}
            </div>`).join('')
            : `<div class="cmp-facet"><p class="facet-label">Expected of everyone</p>
                ${pair(list(f.shared, 'plain-list secondary'), list(t.shared, 'plain-list secondary'))}</div>`;
        return `<section class="cmp-area" data-area="${a.key}">
            <div class="area-intro">
                <h2 class="area-heading">${areaIcon(a.key)}${esc(a.name)}</h2>
                ${adjacentUp && t.change ? `<p class="cmp-change">${mdInline(t.change)}</p>` : ''}
                ${pair(`<p class="core">${esc(f.core)}</p>`, `<p class="core">${esc(t.core)}</p>`)}
            </div>
            ${detail}
        </section>`;
    }).join('');

    return {
        title: `Compare ${from.name} and ${to.name}`,
        html: `<section class="page cmp-only-to">
            <header class="page-head">
                <h1>Expectations</h1>
                ${viewTabs('compare')}
                <p class="lede">See what changes between two scopes, area by area.</p>
                <form class="cmp-pick">
                    ${select(content, 'from', from.id, 'From')}
                    ${select(content, 'to', to.id, 'To')}
                </form>
                <button type="button" class="button quiet cmp-toggle" aria-pressed="false" data-from-toggle>Show ${esc(from.name)} alongside</button>
            </header>
            <div class="cmp-cols cmp-shift">
                <div><p class="cmp-scope">${esc(from.name)} is trusted to answer</p><p class="q">${esc(from.question)}</p></div>
                <div><p class="cmp-scope">${esc(to.name)} is trusted to answer</p><p class="q">${esc(to.question)}</p></div>
            </div>
            <section class="cmp-nature" aria-labelledby="cmp-nature-head">
                <h2 id="cmp-nature-head">Nature of impact</h2>
                ${NATURE.map(n => `<div class="cmp-facet"><p class="facet-label">${n.label}</p>
                    ${pair(`<p>${mdInline(from[n.key])}</p>`, `<p>${mdInline(to[n.key])}</p>`)}</div>`).join('')}
            </section>
            ${adjacentUp ? `<section class="what-changes"><h2>What changes</h2>${md(to.whatChanges)}</section>` : ''}
            ${rows}
        </section>`,
        mount(root) {
            const toggle = root.querySelector('[data-from-toggle]');
            toggle.addEventListener('click', () => {
                const both = root.querySelector('.page').classList.toggle('cmp-only-to') === false;
                toggle.setAttribute('aria-pressed', both);
                toggle.textContent = both ? `Show only ${to.name}` : `Show ${from.name} alongside`;
            });
            root.querySelector('.cmp-pick').addEventListener('change', e => {
                const form = e.currentTarget;
                location.hash = `compare/${form.from.value}/${form.to.value}`;
            });
        },
    };
}
