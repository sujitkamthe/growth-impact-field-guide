// Home: "Start here" sends readers with a task to the page for it; the four scopes
// double as the picker, and the chosen scope's core statement in each area answers
// "what is expected of me?"; then one situation stepped through all four scopes.
// Mechanics live on How it works. Linkable as #home/<section>, such as #home/practice.

import { esc, mdInline } from '../ui.js';
import { scopeGlyph, areaIcon } from '../diagram.js';
import { scopeMark, bindPicker, nextScope, savedScope, saveScope } from './_parts.js';

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
        ${content.scopes.map(s => `<button type="button" class="scope-step" role="radio" data-scope="${s.id}"
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
    const next = nextScope(content, scope);
    return `<p class="scope-now-mindset"><strong>${esc(scope.name)}</strong>: ${esc(scope.mindset)}
            <span>${esc(scope.reaches)}</span></p>
        <div class="area-grid">
            ${content.areas.map(a => `<div class="home-area" data-area="${a.key}">
                <h3 class="area-label"><a href="#scope/${scope.id}/${a.id}">${areaIcon(a.key)}${esc(a.name)}</a></h3>
                <p class="core">${esc(scope.areas[a.id].core)}</p>
            </div>`).join('')}
        </div>
        <p class="actions">
            <a class="button" href="#scope/${scope.id}">Read ${esc(scope.name)} in depth</a>
            ${next ? `<a href="#compare/${scope.id}/${next.id}">Compare with ${esc(next.name)}</a>` : ''}
        </p>`;
}

// One situation at every scope, stepped through by hand (tabs, or Previous and Next).
// Every step stays in the page, so it reads as plain text when printed.
function practice(content, page, selected) {
    const steps = content.scopes.filter(s => s.practice);
    if (!steps.length) return '';
    const start = Math.max(0, steps.findIndex(s => s.id === selected?.id));
    return `<section class="home-section practice-stepper" id="practice" aria-labelledby="home-practice">
        <h2 id="home-practice">Scopes in practice</h2>
        <p class="hint home-note">${mdInline(sectionText(page, 'scopes-in-practice'))}</p>
        <p class="practice-situation">${esc(steps[0].practice.situation)}</p>
        <div class="stepper-tabs" role="tablist" aria-label="Scopes">
            ${steps.map((s, i) => `<button type="button" role="tab" id="step-tab-${s.id}" aria-controls="step-${s.id}"
                aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}" data-step="${i}">${esc(s.name)}</button>`).join('')}
        </div>
        ${steps.map((s, i) => `<div class="step" role="tabpanel" id="step-${s.id}" aria-labelledby="step-tab-${s.id}"${i === start ? '' : ' hidden'}>
            <div class="step-ring">${scopeGlyph(s.order, { size: 120, total: content.scopes.length, label: `${s.name}: ${s.mindset}` })}</div>
            <div>
                <p class="step-name">${esc(s.name)} <span>${esc(s.mindset)}</span></p>
                <dl class="practice-steps">${s.practice.items.map(it => `<div><dt>${esc(it.name)}</dt><dd>${mdInline(it.text)}</dd></div>`).join('')}</dl>
                <p class="stepper-nav">
                    ${i > 0 ? `<button type="button" class="button quiet" data-go="${i - 1}">Previous: ${esc(steps[i - 1].name)}</button>` : ''}
                    ${i < steps.length - 1 ? `<button type="button" class="button quiet" data-go="${i + 1}">Next: ${esc(steps[i + 1].name)}</button>` : ''}
                    <a href="#scope/${s.id}">Read ${esc(s.name)} in depth</a>
                </p>
            </div>
        </div>`).join('')}
    </section>`;
}

function bindStepper(root) {
    const tabs = [...root.querySelectorAll('.stepper-tabs [role="tab"]')];
    const panels = [...root.querySelectorAll('.practice-stepper [role="tabpanel"]')];
    const show = (i, focus) => {
        tabs.forEach((t, j) => { t.setAttribute('aria-selected', j === i); t.tabIndex = j === i ? 0 : -1; });
        panels.forEach((p, j) => { p.hidden = j !== i; });
        if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
        t.addEventListener('click', () => show(i, false));
        t.addEventListener('keydown', e => {
            const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!delta) return;
            e.preventDefault();
            show((i + delta + tabs.length) % tabs.length, true);
        });
    });
    root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(Number(b.dataset.go), true)));
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
            ${practice(content, page, selected)}
            <section class="home-section home-growth" aria-labelledby="home-growth">
                <h2 id="home-growth">How growth happens</h2>
                <p>${mdInline(sectionText(page, 'how-growth-happens'))} <a href="#how-it-works/growing-into-the-next-scope">How growth works</a></p>
            </section>
            <p class="visually-hidden" aria-live="polite" data-announce></p>
        </section>`,
        mount(root) {
            bindStepper(root);
            if (open) requestAnimationFrame(() => root.querySelector(`#${CSS.escape(open)}`)?.scrollIntoView({ block: 'start' }));
            bindPicker(root.querySelector('.scope-steps'), id => {
                const scope = content.scope(id);
                saveScope(id);
                root.querySelector('[data-scope-now]').innerHTML = scopeNow(content, scope);
                root.querySelector('[data-announce]').textContent = `Showing ${scope.name} scope expectations`;
            });
        },
    };
}
