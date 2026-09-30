// Set expectations: a form that produces a written, shareable expectation sheet.
// The sheet lives in the URL, so the link itself is the record.

import { esc, list, copyText, storageGet } from '../ui.js';
import { modelDiagram } from '../diagram.js';
import { scopePicker, bindPicker } from './_parts.js';
import { emptySheet, readSheet, sheetCode, sheetProblems, sheetToText, stretchScope, isStretched, avenuesOf } from '../sheet-model.js';

const stretchLabel = next => (next ? `Take on ${next.name} responsibilities this cycle as a stretch` : '');

function areaFields(content, sheet) {
    const next = stretchScope(sheet, content);
    return content.areas.map(a => `<fieldset class="area-fieldset" data-area="${a.key}">
        <legend>${esc(a.name)}</legend>
        <label class="check" data-stretch-wrap ${next ? '' : 'hidden'}>
            <input type="checkbox" data-stretch="${a.key}"${isStretched(sheet, a.key) ? ' checked' : ''}>
            <span data-stretch-label>${esc(stretchLabel(next))}</span>
        </label>
        <label class="field">
            <span>Team-specific expectations <em>optional</em></span>
            <textarea rows="2" data-field="t.${a.key}" placeholder="Anything this team needs beyond the guide, or less of">${esc(sheet.t[a.key] || '')}</textarea>
        </label>
        ${a.key === 'oc' ? avenueFields(a, sheet) : ''}
    </fieldset>`).join('');
}

function avenueFields(area, sheet) {
    return `<div class="field">
        <span id="avenue-label">Ways you'll contribute beyond delivery <em>choose at least one</em></span>
        <div class="checks" role="group" aria-labelledby="avenue-label">
            ${area.avenues.filter(v => v.label !== 'Something else').map(v => `<label class="check">
                <input type="checkbox" value="${esc(v.label)}"${sheet.o.includes(v.label) ? ' checked' : ''} data-avenue>
                <span>${esc(v.label)}</span>
            </label>`).join('')}
        </div>
        <label class="field"><span>Something else</span>
            <input type="text" data-field="x" value="${esc(sheet.x)}" placeholder="Describe it in a few words">
        </label>
    </div>`;
}

function preview(content, sheet) {
    const scope = content.scope(sheet.a);
    const next = stretchScope(sheet, content);
    const problems = sheetProblems(sheet);
    const areas = content.areas.map(a => {
        const block = scope.areas[a.id];
        const stretch = next && isStretched(sheet, a.key) ? `<div class="sheet-stretch">
                <p class="stretch-label">Stretching into ${esc(next.name)}</p>
                <p class="core">${esc(next.areas[a.id].core)}</p>
                ${list(next.areas[a.id].expectations, 'expect-list')}
            </div>` : '';
        const avenues = a.key === 'oc' && avenuesOf(sheet).length
            ? `<p class="sheet-note"><strong>Chosen avenues:</strong> ${esc(avenuesOf(sheet).join(', '))}</p>` : '';
        const notes = (sheet.t[a.key] || '').trim()
            ? `<p class="sheet-note"><strong>Team-specific:</strong> ${esc(sheet.t[a.key])}</p>` : '';
        return `<section class="sheet-area" data-area="${a.key}">
            <h3>${esc(a.name)}</h3>
            <p class="core">${esc(block.core)}</p>
            ${list(block.expectations, 'expect-list')}
            ${stretch}${avenues}${notes}
        </section>`;
    }).join('');

    const meta = [sheet.c.trim(), sheet.w.trim() && `set with ${sheet.w.trim()}`].filter(Boolean).join(', ');
    return `<p class="actions top">
            <button type="button" class="button" data-copy-link>Copy link</button>
            <button type="button" class="button quiet" data-copy-text>Copy as text</button>
            <button type="button" class="button quiet" data-print>Print</button>
        </p>
        ${problems.length ? `<div class="notice" role="status"><h3>Before you share</h3>${list(problems)}</div>` : ''}
        <div class="sheet-doc">
            <div class="sheet-top">
                <h2>Expectations for ${esc(sheet.n.trim() || 'you')}</h2>
                <div class="sheet-diagram" aria-hidden="true">${modelDiagram(content, { scope, stretch: sheet.st, size: 120, labels: false })}</div>
            </div>
            ${meta ? `<p class="sheet-meta">${esc(meta)}</p>` : ''}
            <p class="sheet-note"><strong>Reference scope:</strong> ${esc(scope.name)}, confirmed at the last team check</p>
            ${next && sheet.st.length && sheet.r.trim() ? `<p class="sheet-note"><strong>Stretching into ${esc(next.name)}:</strong> ${esc(sheet.r)}</p>` : ''}
            ${areas}
        </div>
        <p><a data-start-assess href="#self-assessment/${sheetCode(sheet)}">Start a self-assessment against this sheet</a></p>`;
}

export function render(content, [code]) {
    const page = content.pages['set-expectations'];
    const sheet = readSheet(code) || emptySheet(content.scope(storageGet('v2.scope'))?.id || 'direct');

    return {
        title: page.title,
        keepScroll: Boolean(code),
        html: `<section class="page">
            <header class="page-head">
                <h1>${esc(page.title)}</h1>
                <p class="lede">${esc(page.lede)}</p>
                <p class="inline-links"><a href="#how-it-works">How reference scope and stretch work</a><a href="#teammates">Guidance for the teammates setting them</a></p>
            </header>
            <div class="tool">
                <form class="tool-form" autocomplete="off">
                    <fieldset>
                        <legend>Who and when</legend>
                        <label class="field"><span>Name</span><input type="text" data-field="n" value="${esc(sheet.n)}"></label>
                        <label class="field"><span>Cycle</span><input type="text" data-field="c" value="${esc(sheet.c)}" placeholder="For example, Oct to Dec 2026"></label>
                        <label class="field"><span>Set with</span><input type="text" data-field="w" value="${esc(sheet.w)}" placeholder="The teammates who agreed these"></label>
                    </fieldset>
                    <fieldset>
                        <legend>Reference scope</legend>
                        <p class="hint">The scope you have shown consistently across all three areas, confirmed at your last team check. It sets this cycle's expectations in every area.</p>
                        ${scopePicker(content, sheet.a, 'Reference scope')}
                    </fieldset>
                    ${areaFields(content, sheet)}
                    <label class="field" data-stretch-note ${sheet.st.length ? '' : 'hidden'}>
                        <span>What the stretch involves</span>
                        <textarea rows="2" data-field="r" placeholder="The next-scope responsibilities being taken on, for example leading the second team on the account">${esc(sheet.r)}</textarea>
                    </label>
                </form>
                <div class="tool-preview" aria-live="polite" data-preview>${preview(content, sheet)}</div>
            </div>
        </section>`,
        mount(root) {
            const form = root.querySelector('.tool-form');
            const out = root.querySelector('[data-preview]');

            const update = () => {
                root.querySelector('[data-stretch-note]').hidden = !sheet.st.length;
                out.innerHTML = preview(content, sheet);
                history.replaceState(null, '', `#set-expectations/${sheetCode(sheet)}`);
            };

            bindPicker(form.querySelector('.segmented'), id => {
                sheet.a = id;
                const next = stretchScope(sheet, content);
                if (!next) sheet.st = [];
                form.querySelectorAll('[data-stretch-wrap]').forEach(wrap => {
                    wrap.hidden = !next;
                    wrap.querySelector('[data-stretch-label]').textContent = stretchLabel(next);
                    if (!next) wrap.querySelector('input').checked = false;
                });
                update();
            });

            form.addEventListener('input', e => {
                const field = e.target.dataset.field;
                if (field) {
                    const [key, sub] = field.split('.');
                    if (sub) sheet[key][sub] = e.target.value; else sheet[key] = e.target.value;
                }
                if (e.target.matches('[data-avenue]')) {
                    sheet.o = [...form.querySelectorAll('[data-avenue]:checked')].map(c => c.value);
                }
                if (e.target.matches('[data-stretch]')) {
                    sheet.st = [...form.querySelectorAll('[data-stretch]:checked')].map(c => c.dataset.stretch);
                }
                update();
            });

            out.addEventListener('click', e => {
                if (e.target.matches('[data-copy-link]')) copyText(location.href, e.target);
                if (e.target.matches('[data-copy-text]')) copyText(sheetToText(sheet, content), e.target);
                if (e.target.matches('[data-print]')) window.print();
            });
        },
    };
}
