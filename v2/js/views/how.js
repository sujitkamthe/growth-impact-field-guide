// How it works: the mechanics in one place. Sections whose idea is a picture
// (how far scopes reach, how growth and the cycle run) render as visuals from
// the same Markdown lists, so the words still live in content. Scopes in practice
// steps one situation through every scope, from each scope file's In practice section.

import { esc, md, mdInline } from '../ui.js';
import { modelDiagram, reachDiagram, scopeGlyph } from '../diagram.js';
import { savedScope } from './_parts.js';
import { renderProse } from './prose.js';

// A section's "- **Title**: text" items, and the prose after them.
function parts(page, slug) {
    const lines = (page.sections.find(s => s.slug === slug)?.body || '').split('\n');
    const items = lines.filter(l => /^- /.test(l)).map(l => {
        const m = l.slice(2).match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
        return m ? { name: m[1], text: m[2] } : { name: l.slice(2), text: '' };
    });
    return { items, rest: lines.filter(l => !/^- /.test(l)).join('\n').trim() };
}

const flow = (items, numbered) => `<ol class="flow${numbered ? ' numbered' : ''}">
    ${items.map(i => `<li><strong>${esc(i.name)}</strong><span>${mdInline(i.text)}</span></li>`).join('')}
</ol>`;

// One situation at every scope, stepped through by hand (tabs, or Previous and Next),
// starting at the scope being explored.
// Every step stays in the page, so it reads as plain text when printed.
function practice(content, intro, selected) {
    const steps = content.scopes.filter(s => s.practice);
    if (!steps.length) return md(intro);
    const start = Math.max(0, steps.findIndex(s => s.id === selected?.id));
    return `<div class="practice-stepper">
        <p class="hint">${mdInline(intro)}</p>
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
    </div>`;
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
    const page = content.pages['how-it-works'];
    const scopes = parts(page, 'scopes');
    const growth = parts(page, 'growing-into-the-next-scope');
    const cycle = parts(page, 'the-cycle');
    const team = content.scope('team');
    const practiceIntro = page.sections.find(s => s.slug === 'scopes-in-practice')?.body || '';

    return renderProse(content, 'how-it-works', {
        open,
        bodies: {
            scopes: `<figure class="reach-figure">${reachDiagram(scopes.items)}</figure>${md(scopes.rest)}`,
            'growing-into-the-next-scope': `${flow(growth.items, true)}${md(growth.rest)}
                <figure class="diagram-figure">${modelDiagram(content, { scope: team, stretch: ['cd'], size: 170 })}
                <figcaption>Team scope in every area, stretching into Wider in Client & Delivery.</figcaption></figure>`,
            'the-cycle': `${flow(cycle.items, false)}${md(cycle.rest)}`,
            'scopes-in-practice': practice(content, practiceIntro, savedScope(content)),
        },
        mount: bindStepper,
    });
}
