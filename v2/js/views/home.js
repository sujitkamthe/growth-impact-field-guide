// Home: "Start here" sends readers with a task to the page for it; the four scopes
// double as the picker, and the chosen scope's core statement in each area answers
// "what is expected of me?". Mechanics, and the situation stepped through all four
// scopes, live on How it works. Linkable as #home/<section>, such as #home/explore.

import { esc, mdInline } from '../ui.js';
import { areaIcon } from '../diagram.js';
import { scopeMark, bindPicker, savedScope, saveScope } from './_parts.js';

const sectionText = (page, slug) => page.sections.find(s => s.slug === slug)?.body || '';

// "- [Task](#route): what it involves" lines from the Start here section.
function tasks(page) {
    const items = [...sectionText(page, 'start-here').matchAll(/^- \[(.+?)\]\((.+?)\):\s*(.+)$/gm)];
    return `<ul class="home-tasks">
        ${items.map(([, label, href, desc]) => `<li><a href="${esc(href)}">${esc(label)}</a><span>${mdInline(desc)}</span></li>`).join('')}
    </ul>`;
}

// Nothing is selected until the viewer chooses; the first card then takes keyboard focus.
// On phones the cards shrink to a row of names, and scopeNow repeats the chosen one's mindset.
function scopeCards(content, selected) {
    const focusId = (selected || content.scopes[0]).id;
    return `<div class="scope-steps" role="radiogroup" aria-label="Explore a scope">
        ${content.scopes.map(s => `<button type="button" class="scope-step" role="radio" data-value="${s.id}"
            aria-checked="${s.id === selected?.id}" tabindex="${s.id === focusId ? 0 : -1}">
            <span class="scope-step-name">${scopeMark(s, 26)}${esc(s.name)}</span>
            <span class="scope-step-mindset">${esc(s.mindset)}</span>
            <span class="scope-step-reach">${esc(s.reaches)}</span>
        </button>`).join('')}
    </div>`;
}

function scopeNow(content, scope) {
    if (!scope) {
        return `<p class="scope-none">Choose a scope to see what it expects in each area. Not sure which is yours?
            <a href="#how-it-works/scopes">Read about the scopes</a>.</p>`;
    }
    return `<p class="scope-now-mindset"><strong>${esc(scope.name)}</strong>: ${esc(scope.mindset)}
            <span>${esc(scope.reaches)}</span></p>
        <div class="area-grid">
            ${content.areas.map(a => `<div class="home-area" data-area="${a.key}">
                <h3 class="area-label"><a href="#scope/${scope.id}/${a.id}">${areaIcon(a.key)}${esc(a.name)}</a></h3>
                <p class="core">${esc(scope.areas[a.id].core)}</p>
            </div>`).join('')}
        </div>
        <p class="actions">
            <a class="button quiet" href="#scope/${scope.id}">Read ${esc(scope.name)} in depth</a>
            <a href="#expectations">See all scopes side by side</a>
        </p>`;
}

export function render(content, [open]) {
    const page = content.pages.home;
    const selected = savedScope(content);

    return {
        title: '',
        keepScroll: Boolean(open),
        html: `<section class="page home">
            <header class="home-hero">
                <h1>${esc(page.headline)}</h1>
                <p class="lede">${esc(page.lede)}</p>
            </header>
            <nav class="home-section" aria-labelledby="home-start">
                <h2 id="home-start">Start here</h2>
                ${tasks(page)}
            </nav>
            <section class="home-section" id="explore" aria-labelledby="home-scope">
                <h2 id="home-scope">Explore a scope</h2>
                <p class="hint home-note">${mdInline(sectionText(page, 'your-scope'))}</p>
                ${scopeCards(content, selected)}
                <div data-scope-now>${scopeNow(content, selected)}</div>
            </section>
            <section class="home-section home-growth" aria-labelledby="home-growth">
                <h2 id="home-growth">How growth happens</h2>
                <p>${mdInline(sectionText(page, 'how-growth-happens'))} <a href="#how-it-works/growing-into-the-next-scope">How growth works</a></p>
            </section>
            <p class="visually-hidden" aria-live="polite" data-announce></p>
        </section>`,
        mount(root) {
            if (open) requestAnimationFrame(() => root.querySelector(`#${CSS.escape(open)}`)?.scrollIntoView({ block: 'start' }));
            bindPicker(root.querySelector('.scope-steps'), id => {
                const scope = content.scope(id);
                saveScope(id);
                const now = root.querySelector('[data-scope-now]');
                now.dataset.changed = '';
                now.innerHTML = scopeNow(content, scope);
                root.querySelector('[data-announce]').textContent = `Showing ${scope.name} scope expectations`;
            });
        },
    };
}
