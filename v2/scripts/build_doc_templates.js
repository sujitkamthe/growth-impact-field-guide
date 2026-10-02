#!/usr/bin/env node
// Build the expectations doc template: one plain Word file for every scope.
//
// The doc has one job: make a person's expectations visible, so the self-assessment
// conversation can focus on growth instead of a debate about what was expected. It is not a
// record for checking up on people, so it has no sign-offs, dates or approvals.
// The expectations themselves live in the portal, so the doc notes the person's scope, adds
// only what is specific to them or their team, and holds a short self-assessment. People keep feedback notes wherever they like; the doc
// doesn't collect them. It stays minimal and plain, written like a doc someone would make
// themselves rather than a form.
//
// Rerun this after changing the template and replace it in Drive (upload with
// "Convert uploads" on to get a Google Doc). From the repo root:
//
//     node v2/scripts/build_doc_templates.js [output-dir]
//
// Writes v2/doc-templates/expectations.docx by default.

const fs = require('fs');
const path = require('path');
const {
    Document, Packer, Paragraph, TextRun, ExternalHyperlink, Table, TableRow, TableCell,
    WidthType, ShadingType, BorderStyle, HeightRule,
} = require('docx');

// The published portal; the doc links here instead of repeating the guide.
const PORTAL = 'https://sujitkamthe.github.io/growth-impact-field-guide/v2/';


const SCOPES = [['Direct', 'direct'], ['Extended', 'extended'], ['Team', 'team'], ['Wider', 'wider']];
const AREAS = [
    { name: 'Client & Delivery', color: '087A6B', hint: "Your client's priorities, and anything your project needs from you" },
    { name: 'People & Team', color: '315FAF', hint: 'What your team needs from you, such as onboarding or mentoring someone' },
    { name: 'Org & Community', color: '95620B', hint: 'How you plan to contribute beyond your project' },
];
const INK = '18181B';
const TEXT = '27272A';
const MUTED = '6B7280';
const LINE = 'E4E4E7';
const LABEL_FILL = 'F7F7F8';
const FONT = 'IBM Plex Sans';
const WIDTH = 11906 - 2 * 1100; // A4 less the side margins

// Building blocks. One table does the work: each area is a row, with what matters this cycle on
// the left and, at the end, what happened beside it, so a self-assessment sits next to what it
// looks back on. Tables survive conversion to Google Docs and make each place to write obvious;
// hairlines and a soft label fill keep it light, and area colour appears only as a thin bar.

const t = (text, opts = {}) => new TextRun({ text, ...opts });
const p = (children, para = {}) => new Paragraph({ children: [].concat(children), spacing: { after: 60 }, ...para });
const link = (text, href) => new ExternalHyperlink({ link: href, children: [t(text, { color: INK, underline: {} })] });
const muted = (text, opts = {}) => t(text, { color: MUTED, ...opts });
const h1 = text => p(t(text, { bold: true, size: 34, color: INK }), { spacing: { after: 160 } });
const small = text => p(t(text.toUpperCase(), { bold: true, size: 14, color: MUTED, characterSpacing: 16 }), { spacing: { after: 40 } });
const gap = (after = 120) => p([], { spacing: { after } });

const edge = (color = LINE, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const borders = (left = edge()) => ({ top: edge(), bottom: edge(), right: edge(), left });

function cell(children, { width, fill, left, span } = {}) {
    return new TableCell({
        children: [].concat(children),
        width: { size: width, type: WidthType.DXA },
        columnSpan: span,
        shading: fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
        borders: borders(left),
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
    });
}
const row = (cells, height) => new TableRow({
    children: cells, cantSplit: true, height: height ? { value: height, rule: HeightRule.ATLEAST } : undefined,
});
const table = (widths, rows) => new Table({ width: { size: WIDTH, type: WidthType.DXA }, columnWidths: widths, rows });

// A label cell for one row of a card: the name, a bar in its colour, and an optional hint.
const nameCell = (name, color, hint, width) => cell([
    p(t(name, { bold: true, color: color === INK ? INK : color }), { spacing: { after: hint ? 30 : 0 } }),
    ...(hint ? [p(muted(hint, { size: 17 }), { spacing: { after: 0 } })] : []),
], { width, fill: LABEL_FILL, left: edge(color, 24) });

// The document.

function build() {
    const scopeLinks = SCOPES.flatMap(([name, id], i) => [...(i ? [muted(' · ')] : []), link(name, `${PORTAL}#scope/${id}`)]);

    const third = WIDTH / 3;
    const details = table([third, third, third], [row(
        ['Name', 'Cycle', 'Scope'].map(label => cell([small(label), gap(20)], { width: third })),
    480)]);

    // Columns: the area, My expectations (at the start) and Self-assessment (at the end).
    const A = 2200;
    const C = (WIDTH - A) / 2;
    const head = (title, hint, width) => cell([
        p(t(title, { bold: true, size: 19, color: INK }), { spacing: { after: 10 } }),
        ...(hint ? [p(muted(hint, { size: 16 }), { spacing: { after: 0 } })] : []),
    ], { width, fill: LABEL_FILL });
    // The rating stays small at the foot of the self-assessment, so the page reads as reflection first.
    const myView = p([muted('My rating:  ', { size: 16 }), ...['Below', 'Meets', 'Exceeds'].map(r => muted(`☐ ${r}    `, { size: 16 }))], { spacing: { before: 60, after: 0 } });
    const page = table([A, C, C], [
        row([head('', '', A), head('My expectations', 'Start of the cycle: what you will focus on, beyond what your scope expects', C), head('Self-assessment', 'End of the cycle: what changed because of you, with examples', C)]),
        ...AREAS.map(a => row([nameCell(a.name, a.color, a.hint, A), cell(gap(900), { width: C }), cell([gap(900), myView], { width: C })], 1900)),
        row([
            nameCell('Growth', INK, '', A),
            cell([p(muted('Next-scope responsibilities you want to take on this cycle, if any', { size: 16 })), gap(700)], { width: C }),
            cell([p(muted('How far you got with them, and what you want to take on next cycle', { size: 16 })), gap(700)], { width: C }),
        ], 1700),
    ]);

    return new Document({
        creator: 'Sahaj Growth & Impact',
        title: 'Expectations',
        styles: { default: { document: { run: { font: FONT, size: 20, color: TEXT }, paragraph: { spacing: { line: 276 } } } } },
        sections: [{
            properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
            children: [
                h1('Expectations'),
                p(muted('Fill in My expectations at the start of the cycle and your self-assessment at the end. Keep your feedback notes wherever you usually keep notes; they don\'t go in this doc.'), { spacing: { after: 160 } }),
                details,
                p([muted('Your scope\'s expectations are in the guide: '), ...scopeLinks, muted('. Write here only what goes beyond them for your work this cycle, such as what your client or team needs from you. Before you write your self-assessment, read '), link('how to write one', `${PORTAL}#self-assessment`), muted('.')], { spacing: { before: 140, after: 200 } }),
                page,
            ],
        }],
    });
}

async function main() {
    const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'doc-templates');
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, 'expectations.docx');
    fs.writeFileSync(file, await Packer.toBuffer(build()));
    console.log(`Wrote ${file}`);
}

main();
