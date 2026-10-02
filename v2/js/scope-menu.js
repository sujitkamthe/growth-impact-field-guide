// The scope being explored, as a dropdown at the start of the nav: it shows the scope on every
// page and lets people change it from anywhere. Choosing one saves it and calls onChange with its
// id, so the page underneath can follow it or re-render its highlights. It says "exploring", never "your scope", because
// only the agreed expectations doc sets someone's scope.

import { esc } from './ui.js';
import { scopeGlyph } from './diagram.js';
import { savedScope, saveScope } from './views/_parts.js';

const chevron = `<svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>`;

export function initScopeMenu(content, { onChange }) {
    const item = document.querySelector('.nav-scope');
    const button = item.querySelector('[data-scope-button]');
    const panel = item.querySelector('#scope-menu');

    panel.innerHTML = `<p class="scope-menu-note">Highlights a scope across the guide. The scope you're held to is the one agreed in your expectations doc.</p>
        <div class="scope-menu-options" role="radiogroup" aria-label="Explore a scope">
            ${content.scopes.map(s => `<button type="button" role="radio" data-scope="${s.id}">
                ${scopeGlyph(s.order, { size: 22 })}
                <span><strong>${esc(s.name)}</strong><span>${esc(s.mindset)}</span></span>
            </button>`).join('')}
        </div>
        <a class="scope-menu-read" data-scope-read href="#how-it-works/scopes">Read about the scopes</a>`;
    const options = [...panel.querySelectorAll('[role="radio"]')];
    const read = panel.querySelector('[data-scope-read]');

    function update() {
        const scope = savedScope(content);
        button.innerHTML = scope
            ? `${scopeGlyph(scope.order, { size: 18 })}<span>Exploring <strong>${esc(scope.name)}</strong></span>${chevron}`
            : `<span>Explore a scope</span>${chevron}`;
        button.setAttribute('aria-label', scope ? `Exploring ${scope.name} scope: change it` : 'Explore a scope');
        options.forEach(o => {
            const on = o.dataset.scope === scope?.id;
            o.setAttribute('aria-checked', on);
            o.tabIndex = on || (!scope && o === options[0]) ? 0 : -1;
        });
        read.href = scope ? `#scope/${scope.id}` : '#how-it-works/scopes';
        read.textContent = scope ? `Read ${scope.name} expectations` : 'Read about the scopes';
    }

    // Focus without scrolling: the menu sits in the sticky header, inside the strip the page's
    // scroll padding reserves for it, so a plain focus() would scroll the page to "reveal" it.
    const focus = el => el.focus({ preventScroll: true });

    function setOpen(open, { focusButton = false } = {}) {
        panel.hidden = !open;
        button.setAttribute('aria-expanded', open);
        if (open) focus(options.find(o => o.tabIndex === 0) || options[0]);
        else if (focusButton) focus(button);
    }

    function choose(option, { close }) {
        if (option.dataset.scope !== savedScope(content)?.id) {
            saveScope(option.dataset.scope);
            onChange(option.dataset.scope);
        }
        if (close) setOpen(false, { focusButton: true });
        else focus(option);
    }

    button.addEventListener('click', () => setOpen(panel.hidden));
    options.forEach((option, i) => {
        // Click or Enter chooses and closes; arrow keys move the choice as a radio group does.
        option.addEventListener('click', () => choose(option, { close: true }));
        option.addEventListener('keydown', e => {
            const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!delta) return;
            e.preventDefault();
            choose(options[(i + delta + options.length) % options.length], { close: false });
        });
    });
    item.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); setOpen(false, { focusButton: true }); }
    });
    document.addEventListener('click', e => { if (!panel.hidden && !item.contains(e.target)) setOpen(false); });
    window.addEventListener('hashchange', () => setOpen(false));
    document.addEventListener('scopechange', update);
    update();
}
