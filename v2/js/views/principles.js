// Principles: what we believe about growth, read before the scopes and areas. Each principle is a
// tile with a small line drawing of its idea, its name and one short line; the full explanation
// opens from the tile, so the page can be taken in at a glance. The words come from principles.md's
// "- **Name**: *Short line.* Full text" list; drawings are matched to principles in list order.

import { esc, mdInline } from '../ui.js';
import { sketch } from '../sketches.js';

// Line drawings in the reach diagram's style: thin strokes in ink, with one shaded element as the
// focus. Drawn on a 160 × 100 grid. Each shows its principle's idea rather than a symbol for it.
const DRAWINGS = [
    // Growth is self-directed: paths fanning out from one start across an open field, no fences.
    `<path class="pd-faint" d="M8 94h144"/>
     <path class="pd-faint" stroke-dasharray="3 4" d="M80 90C78 70 44 62 24 20M80 90C82 66 66 42 64 12M80 90C84 72 126 66 140 30"/>
     <path class="pd-ink" d="M80 90C80 64 102 48 108 16"/>
     <circle class="pd-dot" cx="24" cy="20" r="3.5"/><circle class="pd-dot" cx="64" cy="12" r="3.5"/>
     <circle class="pd-dot" cx="140" cy="30" r="3.5"/><circle class="pd-focus" cx="108" cy="16" r="5"/>
     <circle class="pd-start" cx="80" cy="90" r="4.5"/>`,
    // Clarity without hierarchy: reach as nested circles resting on one point, not rungs to climb.
    `<circle class="pd-focus" cx="80" cy="76" r="18"/>
     <circle class="pd-ink" cx="80" cy="76" r="18"/><circle class="pd-line" cx="80" cy="64" r="30"/>
     <circle class="pd-line" cx="80" cy="52" r="42"/><circle class="pd-faint" cx="80" cy="47" r="47" stroke-dasharray="3 4"/>
     <circle class="pd-start" cx="80" cy="88" r="4"/>`,
    // Transparency and trust: one written page, open to the people on either side of it.
    `<rect class="pd-focus" x="58" y="12" width="44" height="76" rx="4"/>
     <rect class="pd-ink" x="58" y="12" width="44" height="76" rx="4"/>
     <path class="pd-line" d="M67 28h26M67 40h26M67 52h18M67 64h22"/>
     <circle class="pd-line" cx="24" cy="44" r="7"/><path class="pd-line" d="M12 72c0-8 5-14 12-14s12 6 12 14"/>
     <circle class="pd-line" cx="136" cy="44" r="7"/><path class="pd-line" d="M124 72c0-8 5-14 12-14s12 6 12 14"/>
     <path class="pd-faint" stroke-dasharray="2 4" d="M36 44h16M108 44h16"/>`,
    // Feedback is a habit: two people, with feedback going both ways, round and round.
    `<circle class="pd-focus" cx="38" cy="54" r="15"/><circle class="pd-ink" cx="38" cy="54" r="15"/>
     <circle class="pd-line" cx="122" cy="54" r="15"/>
     <path class="pd-ink" d="M50 38C66 18 94 18 110 38"/><path class="pd-ink" d="M102 35l8 3 1-8"/>
     <path class="pd-line" d="M110 70C94 90 66 90 50 70"/><path class="pd-line" d="M58 73l-8-3-1 8"/>`,
    // Honest reflection: a ridge and its reflection in still water, shown as it is.
    `<circle class="pd-focus" cx="118" cy="24" r="9"/>
     <path class="pd-ink" d="M14 58l30-30 16 14 22-26 30 42 14-10 20 10"/>
     <path class="pd-line" d="M8 58h144"/>
     <path class="pd-faint" stroke-dasharray="3 4" d="M14 58l30 17 16-8 22 15 30-24 14 6 20-6"/>`,
];

const drawing = i => DRAWINGS[i]
    ? `<svg class="principle-drawing" viewBox="0 0 160 100" aria-hidden="true">${DRAWINGS[i]}</svg>`
    : '';

function principles(page) {
    const body = page.sections.find(s => s.slug === 'our-principles')?.body || '';
    return [...body.matchAll(/^- \*\*(.+?)\*\*:\s*(?:\*(.+?)\*\s*)?(.+)$/gm)]
        .map(([, name, short, text]) => ({ name, short: short || '', text }));
}

const tile = (p, i) => `<li>
    <details class="principle">
        <summary>
            <span class="principle-art">${drawing(i)}</span>
            <span class="principle-name">${esc(p.name)}</span>
            ${p.short ? `<span class="principle-short">${mdInline(p.short)}</span>` : ''}
            <span class="principle-more" aria-hidden="true"></span>
        </summary>
        <p class="principle-text">${mdInline(p.text)}</p>
        <button type="button" class="principle-less" data-close>Show less −</button>
    </details>
</li>`;

export function render(content) {
    const page = content.pages.principles;
    return {
        title: page.title,
        html: `<section class="page principles-page">
            <header class="page-head${page.sketch ? ' has-sketch' : ''}">
                <div class="page-head-text">
                    <h1>${esc(page.title)}</h1>
                    <p class="lede">${esc(page.lede)}</p>
                </div>
                ${sketch(page.sketch)}
            </header>
            <ul class="principles" aria-label="Our principles">${principles(page).map(tile).join('')}</ul>
            <p class="principles-next">See them in practice: <a href="#how-it-works">How it works</a> · <a href="#expectations">Scopes</a></p>
        </section>`,
        // Show less sits under the text it closes; the tile's summary still toggles it too.
        mount(root) {
            root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
                const tile = b.closest('details');
                tile.open = false;
                tile.querySelector('summary').focus();
            }));
        },
    };
}
