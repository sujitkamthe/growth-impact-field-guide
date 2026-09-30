// Pieces several views share: the scope picker, area cards, breadcrumbs and the side list.

import { esc, list, storageGet } from '../ui.js';
import { scopeGlyph } from '../diagram.js';

export const scopeMark = (scope, size = 22) =>
    scopeGlyph(scope.order, { size, label: `${scope.name} scope` });

// The viewer's own scope, remembered from the home page picker.
export const savedScope = content => content.scope(storageGet('v2.scope')) || content.scopes[0];

export function areaCard(area, block, { heading = 'h3' } = {}) {
    return `<article class="area-card" data-area="${area.key}">
        <${heading} class="area-label"><a href="#area/${area.id}">${esc(area.name)}</a></${heading}>
        <p class="core">${esc(block.core)}</p>
        ${list(block.expectations, 'plain-list')}
    </article>`;
}

export function scopePicker(content, selected, label = 'Scope') {
    return `<div class="segmented" role="radiogroup" aria-label="${esc(label)}">
        ${content.scopes.map(s => `<button type="button" role="radio" data-scope="${s.id}"
            aria-checked="${s.id === selected}" tabindex="${s.id === selected || (!selected && s.order === 1) ? 0 : -1}">${esc(s.name)}</button>`).join('')}
    </div>`;
}

// Radio-group behaviour: click to choose, arrow keys to move, as a native radio set would.
export function bindPicker(picker, onChange) {
    const buttons = [...picker.querySelectorAll('[role="radio"]')];
    const select = (button, focus) => {
        buttons.forEach(b => {
            const on = b === button;
            b.setAttribute('aria-checked', on);
            b.tabIndex = on ? 0 : -1;
        });
        if (focus) button.focus();
        onChange(button.dataset.scope);
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

export function nextScope(content, scope) {
    return content.scopes.find(s => s.order === scope.order + 1) || null;
}

export function prevScope(content, scope) {
    return content.scopes.find(s => s.order === scope.order - 1) || null;
}

export function breadcrumb(items) {
    return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>
        ${items.map((item, i) => `<li>${i < items.length - 1 ? `<a href="${item.href}">${esc(item.label)}</a>` : `<span aria-current="page">${esc(item.label)}</span>`}</li>`).join('')}
    </ol></nav>`;
}

// Scopes and areas side by side, so moving between detail pages never needs the top nav.
export function sideList(content, { scopeId = null, areaId = null } = {}) {
    const item = (href, label, current) =>
        `<li><a href="${href}"${current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
    return `<nav class="side-list" aria-label="Scopes and areas">
        <p class="side-heading">Scopes</p>
        <ul>${content.scopes.map(s => item(`#scope/${s.id}`, s.name, s.id === scopeId)).join('')}</ul>
        <p class="side-heading">Areas</p>
        <ul>${content.areas.map(a => item(`#area/${a.id}`, a.name, a.id === areaId)).join('')}</ul>
        <p class="side-heading">See also</p>
        <ul>${item('#expectations', 'All expectations', false)}${item('#compare', 'Compare scopes', false)}</ul>
    </nav>`;
}
