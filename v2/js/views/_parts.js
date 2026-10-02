// Pieces several views share: scope marks, the picker behaviour, scope navigation and
// the grammar for expectation subgroups.

import { esc, mdInline, list, storageGet, storageSet } from '../ui.js';
import { scopeGlyph } from '../diagram.js';

export const scopeMark = (scope, size = 22) =>
    scopeGlyph(scope.order, { size, label: `${scope.name} scope` });

// The viewer's own scope, remembered from the home page picker. Null until they choose one,
// so a first visit never presents a default as if it were their agreed scope.
export const savedScope = content => content.scope(storageGet('v2.scope')) || null;

// Remember the scope someone is exploring, and tell the page so the header can show it.
export function saveScope(id) {
    storageSet('v2.scope', id);
    document.dispatchEvent(new CustomEvent('scopechange'));
}

// The marker shown wherever the explored scope appears; "exploring" so it never reads as agreed.
export const EXPLORING = '<span class="exploring-tag">Exploring</span>';

// Radio-group behaviour: click to choose, arrow keys to move, as a native radio set would.
// Each option carries its value in data-value.
export function bindPicker(picker, onChange) {
    const buttons = [...picker.querySelectorAll('[role="radio"]')];
    const select = (button, focus) => {
        buttons.forEach(b => {
            const on = b === button;
            b.setAttribute('aria-checked', on);
            b.tabIndex = on ? 0 : -1;
        });
        if (focus) button.focus();
        onChange(button.dataset.value);
    };
    buttons.forEach((button, i) => {
        button.addEventListener('click', () => select(button, false));
        button.addEventListener('keydown', e => {
            const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!delta) return;
            e.preventDefault();
            select(buttons[(i + delta + buttons.length) % buttons.length], true);
        });
    });
}

// All scopes and Compare are two views of the same statements, switched with these tabs.
export const viewTabs = current => `<nav class="view-tabs" aria-label="Expectations views">
    <a href="#expectations"${current === 'all' ? ' aria-current="page"' : ''}>All scopes</a>
    <a href="#compare"${current === 'compare' ? ' aria-current="page"' : ''}>Compare two</a>
</nav>`;

export function nextScope(content, scope) {
    return content.scopes.find(s => s.order === scope.order + 1) || null;
}

export function prevScope(content, scope) {
    return content.scopes.find(s => s.order === scope.order - 1) || null;
}

// The nature of impact at a scope: how far it reaches, how it gets there and what lasts after it.
export const NATURE = [
    { key: 'reach', label: 'Reach' },
    { key: 'how', label: 'How' },
    { key: 'lasts', label: 'What lasts' },
];

export const natureOf = scope => `<dl class="nature" aria-label="Nature of impact at ${esc(scope.name)}">
    ${NATURE.map(n => `<div><dt>${n.label}</dt><dd>${mdInline(scope[n.key])}</dd></div>`).join('')}
</dl>`;

// What each kind of subgroup means, said on the page wherever it appears so nobody
// has to infer whether a group is required.
export const GRAMMAR = {
    facets: 'All three facets count toward one rating',
    shared: scope => `Expected of everyone at ${scope.name}`,
    routes: 'Choose one or more',
    evidence: 'Signs that the impact is real and lasting',
    examples: 'Illustrations of what each rating can look like',
};

// An area's expectations: labelled facet groups, or Org & Community's shared lines.
export function expectationGroups(block, cls = 'plain-list') {
    if (!block.facets.length) return list(block.shared, cls);
    return `<div class="facet-groups">${block.facets.map(f => `<div class="facet">
        <p class="facet-label">${esc(f.title)}</p>${list(f.items, cls)}
    </div>`).join('')}</div>`;
}

// Org & Community's ways to contribute, each with this scope's examples.
export const routeGroups = (block, cls = 'plain-list secondary') => `<div class="route-groups">${block.routes.map(r => `<div class="facet">
        <p class="facet-label">${esc(r.title)}</p>${list(r.items, cls)}
    </div>`).join('')}</div>`;

// Scope selector for the working pages: links to the expectations someone is writing against.
export function scopeTool(content, selected, label) {
    return `<div class="ws-scope">
        <label class="field inline"><span>${esc(label)}</span>
            <select data-ws-scope>
                <option value=""${selected ? '' : ' selected'}>Choose a scope</option>
                ${content.scopes.map(s => `<option value="${s.id}"${s.id === selected?.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}
            </select>
        </label>
        <p class="ws-links" data-ws-links>${scopeLinks(content, selected)}</p>
    </div>`;
}

export function scopeLinks(content, scope) {
    if (!scope) return 'Choose a scope to link its expectations here.';
    const next = nextScope(content, scope);
    return [`<a href="#scope/${scope.id}">${esc(scope.name)} expectations</a>`,
        next && `<a href="#compare/${scope.id}/${next.id}">Compare with ${esc(next.name)}</a>`,
        `<a href="#scope/${scope.id}/org-community">Ways to contribute</a>`].filter(Boolean).join('');
}

export function bindScopeTool(root, content, { save = false } = {}) {
    const select = root.querySelector('[data-ws-scope]');
    select?.addEventListener('change', () => {
        const scope = content.scope(select.value) || null;
        if (save && scope) saveScope(scope.id);
        root.querySelector('[data-ws-links]').innerHTML = scopeLinks(content, scope);
    });
}
