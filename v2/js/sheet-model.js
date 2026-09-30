// The expectation sheet: what was agreed for one person for one cycle.
// One reference scope sets the expectations in all three areas; areas can
// additionally take on the next scope's responsibilities as a stretch.
// Compact keys keep shared links short:
//   n name, c cycle, w set with, a reference scope id,
//   st area keys stretching into the next scope, r what the stretch involves,
//   t per-area team notes, o chosen Org & Community avenues, x other avenue.

import { encodeSheet, decodeSheet } from './ui.js';
import { SCOPE_IDS } from './content.js';

export function emptySheet(scope = 'direct') {
    return { v: 2, n: '', c: '', w: '', a: scope, st: [], r: '', t: {}, o: [], x: '' };
}

export function readSheet(code) {
    const sheet = code ? decodeSheet(code) : null;
    // Links from before the one-scope model (v1) or a renamed scope can't be read faithfully.
    if (!sheet || sheet.v !== 2 || !SCOPE_IDS.includes(sheet.a)) return null;
    return { ...emptySheet(sheet.a), ...sheet, st: sheet.st || [], t: sheet.t || {}, o: sheet.o || [] };
}

export const sheetCode = sheet => encodeSheet(sheet);

export function stretchScope(sheet, content) {
    return content.scopes.find(s => s.order === content.scope(sheet.a).order + 1) || null;
}

export const isStretched = (sheet, key) => sheet.st.includes(key);

export function avenuesOf(sheet) {
    return [...sheet.o, ...(sheet.x.trim() ? [sheet.x.trim()] : [])];
}

export function sheetProblems(sheet) {
    const problems = [];
    if (!avenuesOf(sheet).length) problems.push('Choose at least one Org & Community avenue. Contribution beyond delivery is part of every expectation.');
    if (sheet.st.length && !sheet.r.trim()) problems.push('Describe what the stretch involves, so everyone agrees what taking it on looks like.');
    return problems;
}

export function sheetToText(sheet, content) {
    const scope = content.scope(sheet.a);
    const next = stretchScope(sheet, content);
    const who = sheet.n.trim() || 'Unnamed';
    const lines = [`# Expectations for ${who}${sheet.c.trim() ? ` (${sheet.c.trim()})` : ''}`];
    if (sheet.w.trim()) lines.push(`Set with: ${sheet.w.trim()}`);
    lines.push(`Reference scope (confirmed at the last team check): ${scope.name}`);
    if (sheet.st.length && next) lines.push(`Stretching into ${next.name}: ${sheet.r.trim() || '(not described yet)'}`);
    for (const area of content.areas) {
        const block = scope.areas[area.id];
        lines.push('', `## ${area.name}`, `_${block.core}_`, '');
        block.expectations.forEach(e => lines.push(`- ${e}`));
        if (next && isStretched(sheet, area.key)) {
            lines.push('', `Stretch into ${next.name}: _${next.areas[area.id].core}_`);
            next.areas[area.id].expectations.forEach(e => lines.push(`- ${e}`));
        }
        if (area.key === 'oc' && avenuesOf(sheet).length) lines.push('', `Chosen avenues: ${avenuesOf(sheet).join('; ')}`);
        if ((sheet.t[area.key] || '').trim()) lines.push('', `Team-specific: ${sheet.t[area.key].trim()}`);
    }
    return lines.join('\n');
}
