// Self-assessment against a written expectation sheet: evidence first, rating second.
// Drafts are kept in this browser only, keyed by the sheet they belong to.

import { esc, md, list, copyText, storageGet, storageSet } from '../ui.js';
import { modelDiagram } from '../diagram.js';
import { scopePicker, bindPicker } from './_parts.js';
import { emptySheet, readSheet, sheetCode, avenuesOf, stretchScope, isStretched } from '../sheet-model.js';

const RATINGS = [
    { id: 'below', label: 'Below expectations', section: 'below-expectations' },
    { id: 'meets', label: 'Meets expectations', section: 'meets-expectations' },
    { id: 'exceeds', label: 'Exceeds expectations', section: 'exceeds-expectations' },
];
const GAPS = [
    { id: 'opportunity', label: 'I had no chance to show it, and raised that during the cycle' },
    { id: 'growth', label: 'I had the chance and did not take it' },
    { id: 'development', label: 'I took the chance and found it hard' },
];

function guide(content, slug) {
    return content.pages['self-assessment'].sections.find(s => s.slug === slug)?.body || '';
}

function emptyDraft() {
    return { ev: {}, fb: {}, rt: {}, gp: {}, sx: {}, short: '', focus: '' };
}

// A neutral summary of where the draft is, never a list of what's missing.
function progress(content, draft) {
    const written = content.areas.filter(a => (draft.ev[a.key] || '').trim()).length;
    const rated = content.areas.filter(a => draft.rt[a.key]).length;
    return `Evidence written for ${written} of 3 areas; ${rated} of 3 rated.`;
}

function toText(content, sheet, draft) {
    const label = id => RATINGS.find(r => r.id === id)?.label || 'Not rated';
    const next = stretchScope(sheet, content);
    const lines = [`# Self-assessment for ${sheet.n.trim() || 'Unnamed'}${sheet.c.trim() ? ` (${sheet.c.trim()})` : ''}`];
    lines.push(`Reference scope: ${content.scope(sheet.a).name}`);
    if (next && sheet.st.length) lines.push(`Stretching into ${next.name} in: ${content.areas.filter(a => isStretched(sheet, a.key)).map(a => a.name).join(', ')}`);
    for (const a of content.areas) {
        lines.push('', `## ${a.name}: ${label(draft.rt[a.key])}`);
        if (draft.gp[a.key]) lines.push(`What best describes it: ${GAPS.find(g => g.id === draft.gp[a.key]).label}`);
        if (a.key === 'oc' && avenuesOf(sheet).length) lines.push(`Ways I contributed: ${avenuesOf(sheet).join('; ')}`);
        lines.push('', `What changed because of me: ${(draft.ev[a.key] || '').trim() || '(not written yet)'}`);
        if ((draft.fb[a.key] || '').trim()) lines.push('', `Feedback I received: ${draft.fb[a.key].trim()}`);
        if (next && isStretched(sheet, a.key)) lines.push('', `Stretch into ${next.name}: ${(draft.sx[a.key] || '').trim() || '(not written yet)'}`);
    }
    if (draft.short.trim()) lines.push('', '## Where I fell short', draft.short.trim());
    if (draft.focus.trim()) lines.push('', '## Focus for next cycle', draft.focus.trim());
    return lines.join('\n');
}

function areaBlock(content, sheet, draft, area) {
    const scope = content.scope(sheet.a);
    const block = scope.areas[area.id];
    const next = stretchScope(sheet, content);
    const stretched = next && isStretched(sheet, area.key);
    const rating = draft.rt[area.key];
    const notes = (sheet.t[area.key] || '').trim();
    const examples = scope.examples['meets-expectations'] ? `<details>
            <summary>What Meets and Below look like at ${esc(scope.name)}</summary>
            <h4>Meets expectations</h4>${md(scope.examples['meets-expectations'])}
            <h4>Below expectations</h4>${md(scope.examples['below-expectations'])}
        </details>` : '';

    return `<fieldset class="assess-area" data-area="${area.key}">
        <legend>${esc(area.name)}</legend>
        ${stretched ? `<p class="stretch-label">Stretching into ${esc(next.name)} this cycle</p>` : ''}
        <p class="core">${esc(block.core)}</p>
        <label class="field">
            <span>What changed because of you? <em>show the pattern across the cycle, not one moment</em></span>
            <textarea rows="4" data-field="ev.${area.key}" placeholder="${esc('For example: ' + block.evidence.slice(0, 2).join('; ').toLowerCase())}">${esc(draft.ev[area.key] || '')}</textarea>
        </label>
        <label class="field">
            <span>What feedback did you receive, and what did you take from it?</span>
            <textarea rows="3" data-field="fb.${area.key}">${esc(draft.fb[area.key] || '')}</textarea>
        </label>
        <details>
            <summary>All ${esc(scope.name)} expectations${notes || (area.key === 'oc' && avenuesOf(sheet).length) ? ' and what your team added' : ''}</summary>
            ${list(block.expectations, 'plain-list')}
            ${area.key === 'oc' && avenuesOf(sheet).length ? `<p class="sheet-note"><strong>Ways you chose to contribute:</strong> ${esc(avenuesOf(sheet).join(', '))}</p>` : ''}
            ${notes ? `<p class="sheet-note"><strong>Team-specific:</strong> ${esc(notes)}</p>` : ''}
            <h4>Ask yourself</h4>${list(block.selfCheck, 'plain-list')}
        </details>
        ${stretched ? `<details>
            <summary>The ${esc(next.name)} stretch</summary>
            <p class="core">${esc(next.areas[area.id].core)}</p>
            ${list(next.areas[area.id].expectations, 'plain-list')}
        </details>` : ''}
        <div class="field">
            <span id="rt-${area.key}">How did you do against your ${esc(scope.name)} expectations?</span>
            <div class="ratings" role="radiogroup" aria-labelledby="rt-${area.key}">
                ${RATINGS.map(r => `<label class="rating">
                    <input type="radio" name="rt-${area.key}" value="${r.id}" data-rating="${area.key}"${rating === r.id ? ' checked' : ''}>
                    <span>${r.label}</span>
                </label>`).join('')}
            </div>
            <div class="rating-guide" data-guide="${area.key}">${rating ? md(guide(content, RATINGS.find(r => r.id === rating).section)) : ''}</div>
            ${examples}
        </div>
        <label class="field" data-gap="${area.key}" ${rating === 'below' ? '' : 'hidden'}>
            <span>What best describes this?</span>
            <select data-field="gp.${area.key}">
                <option value="">Choose one</option>
                ${GAPS.map(g => `<option value="${g.id}"${draft.gp[area.key] === g.id ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}
            </select>
        </label>
        ${stretched ? `<label class="field">
            <span>How far did you get with the ${esc(next.name)} stretch?</span>
            <textarea rows="3" data-field="sx.${area.key}" placeholder="Which of these responsibilities you took on, how consistently, and what others now rely on you for">${esc(draft.sx[area.key] || '')}</textarea>
        </label>` : ''}
    </fieldset>`;
}

function startScreen(content) {
    return {
        title: 'Self-assessment',
        html: `<section class="page narrow">
            <header class="page-head">
                <h1>Self-assessment</h1>
                <p class="lede">${esc(content.pages['self-assessment'].lede)}</p>
            </header>
            <section>
                <h2>Start from your expectation sheet</h2>
                <p>A self-assessment only works against expectations that were agreed and written down. Open the sheet link you saved
                and choose "Start a self-assessment against this sheet", or paste the link here.</p>
                <form class="paste" data-paste>
                    <label class="field"><span>Expectation sheet link</span><input type="url" name="link" placeholder="Paste the link to your sheet" required></label>
                    <button class="button" type="submit">Open</button>
                </form>
                <p class="form-error" data-paste-error hidden>That link doesn't contain an expectation sheet. It should end in #set-expectations/ followed by a code.</p>
            </section>
            <section>
                <h2>No written sheet?</h2>
                <p>Then that's the first gap to fix: <a href="#set-expectations">write one now</a>, even mid-cycle, and say that you did.
                If you and your team agreed your reference scope verbally, you can start from it here.</p>
                ${scopePicker(content, null, 'Your reference scope')}
            </section>
        </section>`,
        mount(root) {
            bindPicker(root.querySelector('.segmented'), id => {
                location.hash = `self-assessment/${sheetCode(emptySheet(id))}`;
            });
            root.querySelector('[data-paste]').addEventListener('submit', e => {
                e.preventDefault();
                const code = (e.target.link.value.match(/#(?:set-expectations|self-assessment)\/([\w-]+)/) || [])[1];
                if (code && readSheet(code)) location.hash = `self-assessment/${code}`;
                else root.querySelector('[data-paste-error]').hidden = false;
            });
        },
    };
}

export function render(content, [code]) {
    const sheet = readSheet(code);
    if (!sheet) return startScreen(content);

    const key = `v2.assess.${code}`;
    const draft = { ...emptyDraft(), ...storageGet(key, {}) };
    const scope = content.scope(sheet.a);
    const hasStretch = sheet.st.length > 0 && Boolean(stretchScope(sheet, content));

    return {
        title: 'Self-assessment',
        html: `<section class="page">
            <header class="page-head with-figure">
                <div>
                    <h1>Self-assessment${sheet.n.trim() ? ` for ${esc(sheet.n.trim())}` : ''}</h1>
                    <p class="lede">Write what changed because of you first, then rate yourself against your ${esc(scope.name)} scope expectations.
                    ${sheet.c.trim() ? `This covers ${esc(sheet.c.trim())}.` : ''} <a href="#set-expectations/${code}">View the expectation sheet</a>.</p>
                </div>
                <div class="head-diagram" aria-hidden="true">${modelDiagram(content, { scope, stretch: sheet.st, size: 120, labels: false })}</div>
            </header>
            <div class="tool">
                <form class="tool-form assess-form" autocomplete="off">
                    ${content.areas.map(a => areaBlock(content, sheet, draft, a)).join('')}
                    <fieldset>
                        <legend>Looking across the cycle</legend>
                        <label class="field"><span>Where did you fall short, and why?</span>
                            <textarea rows="3" data-field="short">${esc(draft.short)}</textarea></label>
                        <label class="field"><span>What do you want to focus on next cycle?</span>
                            <textarea rows="3" data-field="focus">${esc(draft.focus)}</textarea></label>
                    </fieldset>
                </form>
                <aside class="tool-preview">
                    <p class="progress" role="status" data-progress>${progress(content, draft)}</p>
                    <p class="actions">
                        <button type="button" class="button" data-copy-text>Copy as text</button>
                        <button type="button" class="button quiet" data-print>Print</button>
                    </p>
                    <p class="hint">Your draft is saved in this browser only. Copy it into your team's self-assessment doc to share it.</p>
                    ${hasStretch ? `<details><summary>Stretch expectations</summary>${md(guide(content, 'stretch-expectations'))}</details>` : ''}
                    <details><summary>Describing a shortfall</summary>${md(guide(content, 'gap-types'))}</details>
                    <details><summary>Common traps</summary>${md(guide(content, 'common-traps'))}</details>
                    <p><button type="button" class="link-button" data-clear>Clear this draft</button></p>
                </aside>
            </div>
        </section>`,
        mount(root) {
            const form = root.querySelector('.assess-form');
            form.addEventListener('input', e => {
                const field = e.target.dataset.field;
                if (field) {
                    const [k, sub] = field.split('.');
                    if (sub) draft[k][sub] = e.target.value; else draft[k] = e.target.value;
                }
                const area = e.target.dataset.rating;
                if (area) {
                    draft.rt[area] = e.target.value;
                    const rating = RATINGS.find(r => r.id === e.target.value);
                    root.querySelector(`[data-guide="${area}"]`).innerHTML = md(guide(content, rating.section));
                    root.querySelector(`[data-gap="${area}"]`).hidden = e.target.value !== 'below';
                }
                storageSet(key, draft);
                root.querySelector('[data-progress]').textContent = progress(content, draft);
            });

            root.querySelector('[data-copy-text]').addEventListener('click', e => copyText(toText(content, sheet, draft), e.target));
            root.querySelector('[data-print]').addEventListener('click', () => window.print());
            root.querySelector('[data-clear]').addEventListener('click', () => {
                if (!confirm('Clear everything you have written in this self-assessment?')) return;
                storageSet(key, emptyDraft());
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            });
        },
    };
}
