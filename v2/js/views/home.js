// Home: answers "what is expected of me?" in the first screen, for first-time and returning readers alike.

import { esc, storageSet } from '../ui.js';
import { modelDiagram } from '../diagram.js';
import { areaCard, scopePicker, bindPicker, nextScope, savedScope } from './_parts.js';

function scopeNow(content, scope) {
    const next = nextScope(content, scope);
    return `<div class="scope-now-head">
            <h2 class="mindset">${esc(scope.mindset)}</h2>
            <p class="trusted">Trusted to answer: ${esc(scope.question)}</p>
        </div>
        <div class="area-grid">
            ${content.areas.map(a => areaCard(a, scope.areas[a.id])).join('')}
        </div>
        <p class="actions">
            <a class="button" href="#scope/${scope.id}">Read ${esc(scope.name)} in depth</a>
            ${next ? `<a href="#compare/${scope.id}/${next.id}">Compare with ${esc(next.name)}</a>` : ''}
            <a href="#set-expectations">Write down your expectations</a>
        </p>`;
}

export function render(content) {
    const page = content.pages.home;
    const selected = savedScope(content);

    return {
        title: '',
        html: `<section class="page home">
            <div class="home-top">
                <div class="home-intro">
                    <h1>${esc(page.headline)}</h1>
                    <p class="lede">${esc(page.lede)} New here? <a href="#how-it-works">Read how it works</a>.</p>
                    ${scopePicker(content, selected.id, 'Your scope')}
                    <p class="reach" data-reach>${esc(selected.radius)}</p>
                </div>
                <div class="home-diagram" data-diagram aria-hidden="true">${modelDiagram(content, { scope: selected, size: 200 })}</div>
            </div>
            <div class="scope-now" data-scope-now>${scopeNow(content, selected)}</div>
            <p class="visually-hidden" aria-live="polite" data-announce></p>
        </section>`,
        mount(root) {
            bindPicker(root.querySelector('.segmented'), id => {
                const scope = content.scope(id);
                storageSet('v2.scope', id);
                root.querySelector('[data-scope-now]').innerHTML = scopeNow(content, scope);
                root.querySelector('[data-diagram]').innerHTML = modelDiagram(content, { scope, size: 200 });
                root.querySelector('[data-reach]').textContent = scope.radius;
                root.querySelector('[data-announce]').textContent = `Showing ${scope.name} scope expectations`;
            });
        },
    };
}
