// Home: the four scopes double as the picker, and the chosen scope's core
// statement in each area answers "what is expected of me?". Mechanics live on How it works.

import { esc, mdInline, storageSet } from '../ui.js';
import { scopeMark, bindPicker, nextScope, savedScope } from './_parts.js';

const sectionText = (page, slug) => page.sections.find(s => s.slug === slug)?.body || '';

function scopeCards(content, selected) {
    return `<div class="scope-steps" role="radiogroup" aria-label="Your scope">
        ${content.scopes.map(s => `<button type="button" class="scope-step" role="radio" data-scope="${s.id}"
            aria-checked="${s.id === selected.id}" tabindex="${s.id === selected.id ? 0 : -1}">
            <span class="scope-step-name">${scopeMark(s, 26)}${esc(s.name)}</span>
            <span class="scope-step-mindset">${esc(s.mindset)}</span>
            <span class="scope-step-reach">${esc(s.reaches)}</span>
        </button>`).join('')}
    </div>`;
}

function scopeNow(content, scope) {
    const next = nextScope(content, scope);
    return `<div class="area-grid">
            ${content.areas.map(a => `<div class="home-area" data-area="${a.key}">
                <h3 class="area-label"><a href="#scope/${scope.id}/${a.id}">${esc(a.name)}</a></h3>
                <p class="core">${esc(scope.areas[a.id].core)}</p>
            </div>`).join('')}
        </div>
        <p class="actions">
            <a class="button" href="#scope/${scope.id}">Read ${esc(scope.name)} in depth</a>
            ${next ? `<a href="#compare/${scope.id}/${next.id}">Compare with ${esc(next.name)}</a>` : ''}
        </p>`;
}

export function render(content) {
    const page = content.pages.home;
    const selected = savedScope(content);

    return {
        title: '',
        html: `<section class="page home">
            <header class="home-hero">
                <h1>${esc(page.headline)}</h1>
                <p class="lede">${esc(page.lede)}</p>
            </header>
            <section class="home-section" aria-label="Your scope">
                ${scopeCards(content, selected)}
                <p class="hint home-note">${mdInline(sectionText(page, 'your-scope'))}</p>
                <div data-scope-now>${scopeNow(content, selected)}</div>
            </section>
            <section class="home-section home-growth" aria-labelledby="home-growth">
                <h2 id="home-growth">How growth happens</h2>
                <p>${mdInline(sectionText(page, 'how-growth-happens'))} <a href="#how-it-works/growing-into-the-next-scope">How growth works</a></p>
            </section>
            <p class="visually-hidden" aria-live="polite" data-announce></p>
        </section>`,
        mount(root) {
            bindPicker(root.querySelector('.scope-steps'), id => {
                const scope = content.scope(id);
                storageSet('v2.scope', id);
                root.querySelector('[data-scope-now]').innerHTML = scopeNow(content, scope);
                root.querySelector('[data-announce]').textContent = `Showing ${scope.name} scope expectations`;
            });
        },
    };
}
