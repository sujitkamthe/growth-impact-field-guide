// Pieces several views share: scope marks, the picker behaviour and scope navigation.

import { storageGet } from '../ui.js';
import { scopeGlyph } from '../diagram.js';

export const scopeMark = (scope, size = 22) =>
    scopeGlyph(scope.order, { size, label: `${scope.name} scope` });

// The viewer's own scope, remembered from the home page picker.
export const savedScope = content => content.scope(storageGet('v2.scope')) || content.scopes[0];

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
