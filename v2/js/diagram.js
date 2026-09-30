// The two pictures of the model. Both show reach, never rank: a scope is one
// band of the circle, not a meter that fills up.

import { esc } from './ui.js';

// Clockwise from twelve o'clock: Client & Delivery on top, People & Team lower right,
// Org & Community lower left.
const SECTORS = { cd: [-60, 60], pt: [60, 180], oc: [180, 300] };
const LABEL_ANGLE = { cd: 0, pt: 120, oc: 240 };

function polar(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
}

function band(cx, cy, r0, r1, a0, a1) {
    const [x1, y1] = polar(cx, cy, r1, a0);
    const [x2, y2] = polar(cx, cy, r1, a1);
    if (r0 === 0) return `M${cx},${cy} L${x1},${y1} A${r1},${r1} 0 0 1 ${x2},${y2} Z`;
    const [x3, y3] = polar(cx, cy, r0, a1);
    const [x4, y4] = polar(cx, cy, r0, a0);
    return `M${x1},${y1} A${r1},${r1} 0 0 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 0 ${x4},${y4} Z`;
}

// Small marker for a scope: four rings with only that scope's band shaded.
export function scopeGlyph(order, { size = 22, total = 4, label = '' } = {}) {
    const c = size / 2;
    const step = (c - 1) / total;
    const r1 = step * order;
    const r0 = step * (order - 1);
    const annulus = `M${c - r1},${c} a${r1},${r1} 0 1,0 ${2 * r1},0 a${r1},${r1} 0 1,0 ${-2 * r1},0 Z`
        + (r0 ? ` M${c - r0},${c} a${r0},${r0} 0 1,0 ${2 * r0},0 a${r0},${r0} 0 1,0 ${-2 * r0},0 Z` : '');
    const circles = Array.from({ length: total }, (_, i) => `<circle cx="${c}" cy="${c}" r="${step * (i + 1)}" class="g-ring"/>`).join('');
    const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
    return `<svg class="glyph" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${a11y}>
        <path class="g-band" fill-rule="evenodd" d="${annulus}"/>${circles}</svg>`;
}

// The model: one scope across three areas, with any stretch reaching into the next ring.
export function modelDiagram(content, { scope, stretch = [], size = 240, labels = true } = {}) {
    const R = size / 2;
    const padX = labels ? 118 : 4;
    const padTop = labels ? 30 : 4;
    const padBottom = labels ? 34 : 4;
    const W = size + padX * 2;
    const H = size + padTop + padBottom;
    const cx = W / 2;
    const cy = padTop + R;
    const total = content.scopes.length;
    const step = (R - 1) / total;
    const next = content.scopes.find(s => s.order === scope.order + 1);

    let shapes = '';
    for (const area of content.areas) {
        const [a0, a1] = SECTORS[area.key];
        shapes += `<path class="md-band" d="${band(cx, cy, step * (scope.order - 1), step * scope.order, a0, a1)}"/>`;
        if (next && stretch.includes(area.key)) {
            shapes += `<path class="md-stretch" d="${band(cx, cy, step * scope.order, step * next.order, a0, a1)}"/>`;
        }
    }
    for (let i = 1; i <= total; i++) shapes += `<circle class="md-ring" cx="${cx}" cy="${cy}" r="${step * i}"/>`;
    for (const deg of [60, 180, 300]) {
        const [x, y] = polar(cx, cy, step * total, deg);
        shapes += `<line class="md-divider" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
    }

    let text = '';
    if (labels) {
        for (const s of content.scopes) {
            const y = cy + step * (s.order - 0.5) + 4;
            text += `<text class="md-scope${s.order === scope.order ? ' current' : ''}" x="${cx}" y="${y}">${esc(s.name)}</text>`;
        }
        for (const area of content.areas) {
            const deg = LABEL_ANGLE[area.key];
            const [x, y] = polar(cx, cy, R + 12, deg);
            const anchor = deg === 0 ? 'middle' : deg < 180 ? 'start' : 'end';
            text += `<text class="md-area" data-area="${area.key}" x="${x}" y="${deg === 0 ? y - 4 : y + 4}" text-anchor="${anchor}">${esc(area.name)}</text>`;
        }
    }

    const stretched = content.areas.filter(a => stretch.includes(a.key)).map(a => a.name);
    const label = `${scope.name} scope across all three areas` + (next && stretched.length ? `, stretching into ${next.name} in ${stretched.join(' and ')}` : '');
    return `<svg class="model" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">${shapes}${text}</svg>`;
}

// How far each scope reaches: nested circles resting on one point, so each scope
// visibly contains the ones inside it. Outlines only, so it reads as reach, not rank.
// items: [{ name, text }] from the inner scope outwards.
export function reachDiagram(items, { step = 52 } = {}) {
    const outer = step * items.length;
    const size = outer * 2 + 4;
    const cx = size / 2;
    const bottom = size - 2;
    const top = r => bottom - 2 * r;

    const rings = items.map((_, i) => {
        const r = step * (i + 1);
        return `<circle class="rd-ring" cx="${cx}" cy="${bottom - r}" r="${r}"/>`;
    }).reverse().join('');

    const labels = items.map((item, i) => {
        const r = step * (i + 1);
        const mid = i === 0 ? bottom - r : (top(r) + top(r - step)) / 2;
        return `<text class="rd-name" x="${cx}" y="${mid - 3}">${esc(item.name)}</text>
            <text class="rd-text" x="${cx}" y="${mid + 15}">${esc(item.text)}</text>`;
    }).join('');

    const label = items.map(i => `${i.name}: ${i.text}`).join('; ');
    return `<svg class="reach-diagram" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label)}">${rings}${labels}</svg>`;
}
