// The game HUD, as HTML over the canvas: a quest box (top left) with an optional notes counter and
// area rows under it, a "Discovered" toast (top centre) and a parchment card for an opened note. Like the 3D world it is stateless per frame: the world
// clears it on reset, the chapter sets what it wants, and commit() touches the DOM only where the
// result differs from what is already shown.

import { clamp01, seg, ease } from './util.js';

// Versioned, so a browser that cached an older HUD stylesheet fetches the new one after a change.
const CSS_VERSION = '2026-10-15';
const css = new URL(`./hud.css?v=${CSS_VERSION}`, import.meta.url).href;
function ensureCss() {
    if (document.querySelector(`link[data-tw-hud]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = css;
    link.dataset.twHud = '';
    document.head.append(link);
}

const AREA = {
    cd: { name: 'Client & Delivery', color: 'var(--cd, #087a6b)' },
    pt: { name: 'People & Team', color: 'var(--pt, #315faf)' },
    oc: { name: 'Org & Community', color: 'var(--oc, #95620b)' },
};

const NOTE_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 1.8h5.6L12.6 5v9.2H4z"/><path d="M9.4 1.8V5h3.2M6 8h4.6M6 10.6h4.6"/></svg>';

function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
}

export function createHud(root) {
    ensureCss();
    const hud = el('div', 'tw-hud');
    hud.setAttribute('aria-hidden', 'true');   // the captions carry the words; this is decoration
    const left = el('div', 'tw-left');
    const quest = el('section', 'tw-panel tw-quest');
    const qLabel = el('div', 'tw-eyebrow', 'Quest');
    const qTitle = el('div', 'tw-quest-title');
    const qProg = el('div', 'tw-quest-progress');
    const segs = el('span', 'tw-segs');
    const count = el('span', 'tw-count');
    qProg.append(segs, count);
    quest.append(qLabel, qTitle, qProg);
    const notes = el('div', 'tw-panel tw-notes', `${NOTE_ICON}<span>Notes</span>`);
    const notesN = el('b');
    notes.append(notesN);
    const rows = el('section', 'tw-panel tw-rows');
    left.append(quest, notes, rows);
    const toast = el('div', 'tw-panel tw-toast');
    const tLabel = el('div', 'tw-eyebrow', 'Discovered');
    const tTitle = el('div', 'tw-toast-title');
    toast.append(tLabel, tTitle);
    const card = el('article', 'tw-card');
    const cLabel = el('div', 'tw-eyebrow', 'A note');
    const cList = el('ol');
    card.append(cLabel, cList);
    hud.append(left, toast, card);
    root.append(hud);

    let want, shown = {};
    const blank = () => ({ quest: null, toast: null, notes: null, card: null, rows: null });
    want = blank();

    const setVisible = (node, on) => node.classList.toggle('tw-hidden', !on);
    const pulse = node => { node.classList.remove('tw-changed'); void node.offsetWidth; node.classList.add('tw-changed'); };
    // Opacity and a small slide from k's in/out ramps.
    function fadeStyle(node, k, dy = -10, inEnd = 0.12, outStart = 0.86) {
        const a = Math.min(ease.out(seg(k, 0, inEnd)), 1 - ease.in(seg(k, outStart, 1)));
        const op = a.toFixed(3);
        if (node.dataset.op !== op) {
            node.dataset.op = op;
            node.style.opacity = op;
            node.style.visibility = a > 0.001 ? 'visible' : 'hidden';
            node.style.translate = `0 ${((1 - a) * dy).toFixed(1)}px`;
        }
    }

    return {
        el: hud,
        quest(title, progress = null) { want.quest = { title, progress }; },
        toast(text, k = 1, { label = null } = {}) { want.toast = { text, k, label }; },
        notes(n) { want.notes = n; },
        card(lines, k = 1, { label = 'A note' } = {}) { want.card = { lines, k, label }; },
        // rows: [{ area: 'cd', rating: 'Meets' | null }] (or [area, rating] pairs); k fades them in.
        rows(list, k = 1) {
            want.rows = { list: list.map(r => (Array.isArray(r) ? { area: r[0], rating: r[1] } : r)), k };
        },
        clear() { want = blank(); },
        show(on) { hud.style.display = on ? '' : 'none'; },
        commit() {
            // quest
            const q = want.quest;
            setVisible(quest, !!q);
            if (q && q.title !== shown.qTitle) { qTitle.textContent = q.title; if (shown.qTitle) pulse(qTitle); shown.qTitle = q.title; }
            const prog = q?.progress ?? null;
            if (prog !== shown.prog) {
                shown.prog = prog;
                qProg.hidden = !prog;
                if (prog) {
                    const [a, b] = String(prog).split('/').map(Number);
                    count.textContent = prog;
                    if (b > 0 && b <= 12) {
                        if (segs.childElementCount !== b) segs.innerHTML = '<i></i>'.repeat(b);
                        [...segs.children].forEach((s, i) => s.classList.toggle('on', i < a));
                        segs.hidden = false;
                    } else segs.hidden = true;
                }
            }
            // notes
            const n = want.notes;
            setVisible(notes, n != null);
            if (n != null && n !== shown.notes) { notesN.textContent = String(n); if (shown.notes != null) pulse(notesN); }
            shown.notes = n;
            // rows
            const r = want.rows;
            if (!r) { setVisible(rows, false); rows.style.opacity = ''; }
            else {
                setVisible(rows, true);
                const key = r.list.map(x => `${x.area}:${x.rating ?? ''}`).join('|');
                if (key !== shown.rows) {
                    const prev = new Map((shown.rowList || []).map(x => [x.area, x.rating]));
                    rows.innerHTML = '';
                    for (const row of r.list) {
                        const a = AREA[row.area] || { name: row.label || row.area, color: '#888' };
                        const node = el('div', 'tw-row');
                        node.style.setProperty('--tw-area', a.color);
                        const rating = el('span', `tw-rating${row.rating ? ' set' : ''}`, row.rating || '…');
                        node.append(el('span', 'tw-swatch'), el('span', 'tw-name', row.label || a.name), rating);
                        if (row.rating && prev.get(row.area) !== row.rating && shown.rows != null) pulse(rating);
                        rows.append(node);
                    }
                    shown.rows = key;
                    shown.rowList = r.list;
                }
                rows.style.opacity = ease.out(clamp01(r.k * 4)).toFixed(3);
            }
            if (!r) { shown.rows = null; shown.rowList = null; }
            // toast
            const t = want.toast;
            if (t && t.k > 0 && t.k < 1) {
                if (t.text !== shown.toast) { tTitle.textContent = t.text; shown.toast = t.text; }
                const label = t.label || '';
                if (label !== shown.toastLabel) { tLabel.textContent = label; tLabel.hidden = !label; shown.toastLabel = label; }
                fadeStyle(toast, t.k);
            } else fadeStyle(toast, 0);
            // card
            const c = want.card;
            if (c && c.k > 0) {
                const key = c.lines.join('\n');
                if (key !== shown.card) {
                    cList.innerHTML = '';
                    c.lines.forEach((line, i) => { const li = el('li'); li.dataset.n = `${i + 1}`; li.textContent = line; cList.append(li); });
                    shown.card = key;
                }
                if (c.label !== shown.cardLabel) { cLabel.textContent = c.label; shown.cardLabel = c.label; }
                fadeStyle(card, c.k, 14, 0.15, 0.85);
                card.style.transform = `translateY(-50%) rotate(${(-1.2).toFixed(1)}deg)`;
            } else fadeStyle(card, 0);
        },
    };
}
