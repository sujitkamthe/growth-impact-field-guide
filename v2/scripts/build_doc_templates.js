#!/usr/bin/env node
// Build the expectations and self-assessment doc templates, one Word file per scope.
//
// Each template is built from the same content files the site renders, so rerun
// this after changing expectations and replace the templates
// in Drive (upload with "Convert uploads" on to get Google Docs). From the repo root:
//
//     node v2/scripts/build_doc_templates.js [output-dir]
//
// Writes to v2/doc-templates/ by default.

const fs = require('fs');
const path = require('path');
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
    BorderStyle, AlignmentType, LevelFormat, Footer, PageNumber, HeightRule, VerticalAlign,
} = require('docx');

const CONTENT = path.join(__dirname, '..', 'content');
const SCOPES = ['direct', 'extended', 'team', 'wider'];
const AREAS = [
    { name: 'Client & Delivery', color: '0F6E62', tint: 'E6F2F0' },
    { name: 'People & Team', color: '3257A8', tint: 'EAF0F9' },
    { name: 'Org & Community', color: '7A5A1E', tint: 'F5EFE3' },
];
const INK = '18181B';
const TEXT = '27272A';
const MUTED = '6B7280';
const LINE = 'E4E4E7';
const PANEL = 'F4F4F5';
const SOFT = 'FAFAFA';
const WIDTH = 9906; // A4 less 1000-twip margins
const FONT = 'IBM Plex Sans';

// Content: the same Markdown conventions the site parses.

function parse(file) {
    const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const meta = {};
    for (const line of m[1].split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '');
    }
    return { meta, body: m[2] };
}

function sections(body, level) {
    const marker = '#'.repeat(level) + ' ';
    const intro = [];
    const out = [];
    let current = null;
    for (const line of body.split('\n')) {
        if (line.startsWith(marker)) out.push(current = { title: line.slice(marker.length).trim(), lines: [] });
        else (current ? current.lines : intro).push(line);
    }
    return { intro: intro.join('\n').trim(), list: out.map(s => ({ title: s.title, body: s.lines.join('\n').trim() })) };
}

const items = md => md.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());

function loadScopes() {
    return SCOPES.map(id => {
        const { meta, body } = parse(path.join(CONTENT, 'scopes', `${id}.md`));
        const secs = Object.fromEntries(sections(body, 2).list.map(s => [s.title, s.body]));
        const areas = {};
        for (const area of AREAS) {
            const { intro, list } = sections(secs[area.name], 3);
            const subs = Object.fromEntries(list.map(s => [s.title, items(s.body)]));
            areas[area.name] = { core: (intro.match(/^> (.+)$/m) || [])[1] || '', ...subs };
        }
        return { ...meta, areas };
    });
}

function ratingGuide() {
    const { body } = parse(path.join(CONTENT, 'self-assessment.md'));
    return Object.fromEntries(sections(body, 2).list.map(s => [s.title, s.body.split('\n\n').map(p => p.trim()).filter(Boolean)]));
}

// Building blocks.

// While building every row of a card but its last, paragraphs keep with the next one,
// so Word and LibreOffice don't strand a card's header or notes on another page.
let keep = false;
function kept(fn) {
    keep = true;
    try { return fn(); } finally { keep = false; }
}

// Text runs, keeping the Markdown bold the content uses.
function runs(text, opts = {}) {
    return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(part => part.startsWith('**')
        ? new TextRun({ text: part.slice(2, -2), ...opts, bold: true })
        : new TextRun({ text: part, ...opts }));
}

const p = (text, opts = {}, para = {}) => new Paragraph({ children: runs(text, opts), spacing: { after: 80 }, keepNext: keep, ...para });
const hint = (text, para = {}) => p(text, { color: MUTED, italics: true, size: 18 }, para);
const label = (text, color = INK) => p(text, { bold: true, size: 17, color, characterSpacing: 10 }, { spacing: { after: 60 } });
const bullet = (text, opts = {}) => new Paragraph({ children: runs(text, opts), numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, keepNext: keep });
const check = text => new Paragraph({ children: [new TextRun({ text: '☐  ', color: MUTED }), ...runs(text)], spacing: { after: 60 }, keepNext: keep });
const gap = (after = 160) => new Paragraph({ children: [], spacing: { after } });
const space = n => Array.from({ length: n }, () => new Paragraph({ children: [], spacing: { after: 120 }, keepNext: keep }));

const edge = (color = LINE, size = 4, style = BorderStyle.SINGLE) => ({ style, size, color });
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const boxBorders = color => ({ top: edge(color), bottom: edge(color), left: edge(color), right: edge(color) });

function cell(children, { width = WIDTH, fill, borders, span, margins, valign } = {}) {
    return new TableCell({
        children,
        width: { size: width, type: WidthType.DXA },
        columnSpan: span,
        shading: fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
        borders,
        margins: margins || { top: 140, bottom: 140, left: 200, right: 200 },
        verticalAlign: valign,
    });
}

function table(columnWidths, rows, borders) {
    return new Table({
        width: { size: WIDTH, type: WidthType.DXA },
        columnWidths,
        rows,
        borders: borders || {
            top: edge(), bottom: edge(), left: edge(), right: edge(), insideHorizontal: edge(), insideVertical: edge(),
        },
    });
}

const row = (cells, height, header = false) => new TableRow({ children: cells, height: height ? { value: height, rule: HeightRule.ATLEAST } : undefined, cantSplit: true, tableHeader: header });

// A numbered section heading with a rule under it.
function heading(number, title, { pageBreak = false } = {}) {
    return new Paragraph({
        children: [
            new TextRun({ text: `${number}`, bold: true, color: MUTED, size: 30 }),
            new TextRun({ text: `   ${title}`, bold: true, color: INK, size: 30 }),
        ],
        pageBreakBefore: pageBreak,
        border: { bottom: edge(INK, 12) },
        spacing: { before: 360, after: 160 },
        keepNext: true,
    });
}

// A grey guidance panel with a dark rule on the left.
function callout(paragraphs) {
    return table([WIDTH], [row([cell(paragraphs, {
        fill: PANEL,
        borders: { top: NONE, bottom: NONE, right: NONE, left: edge(INK, 18) },
    })])], { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE });
}

// A table whose first row is a dark header.
function logTable(headers, widths, emptyRows, height) {
    const head = kept(() => row(headers.map((h, i) => cell([p(h, { bold: true, color: 'FFFFFF', size: 18 })], { width: widths[i], fill: INK })), undefined, true));
    const body = Array.from({ length: emptyRows }, () => row(widths.map(w => cell([gap(0)], { width: w })), height));
    return table(widths, [head, ...body]);
}

// An area card: coloured header, tinted core line, then body rows. Every row but
// the last keeps with the next, so the card stays together on one page.
function areaCard(area, core, bodyRows, lastRow) {
    const top = kept(() => [
        row([cell([label(area.name.toUpperCase(), 'FFFFFF')], { fill: area.color, borders: boxBorders(area.color) })]),
        ...(core ? [row([cell([p(core, { bold: true, size: 22, color: INK })], { fill: area.tint, borders: boxBorders(LINE) })])] : []),
        ...bodyRows(),
    ]);
    return table([WIDTH], [...top, lastRow()]);
}

const cardRow = (children, { fill, height } = {}) => row([cell(children, { fill, borders: boxBorders(LINE) })], height);

// The document.

function cover(scope, next) {
    const banner = table([WIDTH], [row([cell([
        p(`${scope.name.toUpperCase()} SCOPE`, { bold: true, color: 'A1A1AA', size: 17, characterSpacing: 20 }),
        p(scope.mindset, { bold: true, color: 'FFFFFF', size: 30 }, { spacing: { after: 100 } }),
        p(scope.radius, { color: 'D4D4D8', size: 19 }, { spacing: { after: 0 } }),
    ], { fill: INK, borders: boxBorders(INK), margins: { top: 280, bottom: 280, left: 320, right: 320 } })])]);

    const L = 1700;
    const V = (WIDTH - 2 * L) / 2;
    const field = t => cell([p(t, { bold: true, size: 17, color: MUTED })], { width: L, fill: PANEL });
    const value = (t = '') => cell([p(t, { size: 20 })], { width: V });
    const details = table([L, V, L, V], [
        row([field('Name'), value(), field('Office'), value()]),
        row([field('Account'), value(), field('Team'), value()]),
        row([field('Cycle'), value(), field('Reviewed by'), value()]),
        row([field('Reference scope'), value(scope.name), field('Stretching into'), value(next ? `${next.name}, in: ` : 'Not applicable')]),
    ]);

    const steps = [
        ['Write', 'Choose your scope and draft this doc.'],
        ['Get it reviewed', 'Share it. Reviewers ask for changes until it is agreed.'],
        ['Collect feedback', 'Add feedback to the log as it happens, all cycle.'],
        ['Self-assess', 'Fill in the self-assessment and discuss it at the team check.'],
    ];
    const W4 = WIDTH / 4;
    const strip = table([W4, W4, W4, W4], [row(steps.map(([title, text], i) => cell([
        p(`${i + 1}  ${title}`, { bold: true, size: 19, color: INK }, { spacing: { after: 40 } }),
        p(text, { size: 17, color: MUTED }, { spacing: { after: 0 } }),
    ], { width: W4, borders: { top: edge(INK, 12), bottom: NONE, left: NONE, right: NONE }, margins: { top: 120, bottom: 60, left: 60, right: 200 } })))],
    { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE });

    return [
        p('SAHAJ  ·  GROWTH & IMPACT', { bold: true, size: 16, color: MUTED, characterSpacing: 30 }, { spacing: { after: 60 } }),
        p('Expectations and self-assessment', { bold: true, size: 44, color: INK }, { spacing: { after: 240 } }),
        banner, gap(240),
        details, gap(280),
        label('HOW THIS DOC WORKS', MUTED),
        strip, gap(120),
        hint('This is your doc, and you drive it. Save a copy as "Your name, cycle" in the Growth & Impact folder for your cycle, account and team. Delete the grey guidance as you go.'),
    ];
}

function expectations(n, scope) {
    const out = [heading(n, 'Expectations'), hint(`What ${scope.name} asks of you in each area. Add anything your team needs beyond the guide, or less of, before you share it for review.`), gap(80)];
    for (const area of AREAS) {
        const block = scope.areas[area.name];
        const body = () => [
            cardRow(block.Expectations.map(e => bullet(e))),
            ...(area.name === 'Org & Community' ? [cardRow([
                p('How I will contribute this cycle', { bold: true, size: 19 }),
                hint(`Choose at least one, from these ${scope.name} examples or something else. It is judged by what it changes.`),
                ...(block['Ways to contribute'] || []).map(check),
                check('Something else: '),
            ])] : []),
        ];
        const notes = () => cardRow([p('Team notes', { bold: true, size: 17, color: MUTED }), ...space(2)], { fill: SOFT });
        out.push(areaCard(area, block.core, body, notes), gap(240));
    }
    return out;
}

function stretch(n, next) {
    const out = [
        heading(n, `Stretch into ${next.name}`),
        callout([
            p('Keep only the areas you are stretching in, and delete this section if there is no stretch this cycle.', { size: 19 }),
            p('A stretch adds to your current expectations rather than replacing them.', { size: 19 }, { spacing: { after: 0 } }),
        ]),
        gap(200),
        table([WIDTH], [row([cell([p('What the stretch involves', { bold: true, size: 19 }), ...space(3)], { borders: boxBorders(LINE) })])]),
        gap(240),
    ];
    for (const area of AREAS) {
        const block = next.areas[area.name];
        const header = kept(() => row([cell([
            new Paragraph({ keepNext: true, children: [
                new TextRun({ text: `${area.name.toUpperCase()}`, bold: true, size: 17, color: area.color, characterSpacing: 10 }),
                new TextRun({ text: '     ☐  Stretching in this area', size: 17, color: MUTED }),
            ], spacing: { after: 60 } }),
            p(block.core, { bold: true, size: 20, color: INK }, { spacing: { after: 0 } }),
        ], { fill: area.tint, borders: { ...boxBorders(LINE), top: edge(area.color, 12) } })]));
        out.push(table([WIDTH], [header, cardRow(block.Expectations.map(e => bullet(e, { size: 19 })))]), gap(200));
    }
    return out;
}

function review(n) {
    const L = 1700;
    return [
        heading(n, 'Review', { pageBreak: true }),
        callout([
            p('Senior teammates usually review for others on the team; a senior\'s doc is reviewed by seniors on other projects in the account or the office.', { size: 19 }),
            p('Reviewers comment in the doc or note their inputs below. If the scope you chose does not match the impact reviewers have seen, it is corrected here, before the doc is agreed.', { size: 19 }, { spacing: { after: 0 } }),
        ]),
        gap(200),
        logTable(['Reviewer', 'Inputs or changes asked for', 'How it was resolved'], [2200, 4206, 3500], 3, 700),
        gap(120),
        table([L, WIDTH - L], [row([cell([p('Agreed on', { bold: true, size: 17, color: MUTED })], { width: L, fill: PANEL }), cell([gap(0)], { width: WIDTH - L })])]),
    ];
}

function feedback(n) {
    return [
        heading(n, 'Feedback during the cycle', { pageBreak: true }),
        callout([p('Add feedback when it happens, from anyone: what they saw, what it changed, and which expectation it relates to. This log is the evidence your self-assessment starts from.', { size: 19 }, { spacing: { after: 0 } })]),
        gap(200),
        logTable(['Date', 'From', 'Area', 'What they saw, and what it changed'], [1300, 1900, 1800, 4906], 11, 700),
    ];
}

function selfAssessment(n, scope, next, feedbackNumber) {
    const out = [
        heading(n, 'Self-assessment', { pageBreak: true }),
        callout([p(`Written at the end of the cycle, against your expectations and the feedback in section ${feedbackNumber}. Show a pattern across the cycle: one example shows you can, while consistency and others relying on it show you do.`, { size: 19 }, { spacing: { after: 0 } })]),
        gap(200),
    ];
    for (const area of AREAS) {
        const block = scope.areas[area.name];
        const rating = () => cardRow([
            new Paragraph({ keepNext: true, children: [
                new TextRun({ text: 'Rating', bold: true, size: 19 }),
                new TextRun({ text: '        ☐  Below        ☐  Meets        ☐  Exceeds', size: 19 }),
            ], spacing: { after: 80 } }),
            new Paragraph({ keepNext: keep, children: [
                new TextRun({ text: 'If below', bold: true, size: 17, color: MUTED }),
                new TextRun({ text: '     ☐  No chance to show it, and raised it     ☐  Had the chance, didn\'t take it     ☐  Took it, found it hard', size: 17, color: MUTED }),
            ], spacing: { after: 0 } }),
        ], { fill: SOFT });
        const stretchRow = () => cardRow([p(`If stretching here: how far did you get with the ${next.name} stretch?`, { bold: true, size: 19 }), ...space(2)]);
        const body = () => [
            cardRow([p('Evidence to look for', { bold: true, size: 17, color: area.color }), ...block.Evidence.map(e => bullet(e, { size: 18, color: MUTED }))]),
            cardRow([p('What changed because of you?', { bold: true, size: 19 }), ...space(4)], { height: 1800 }),
            cardRow([p(`What did you take from the feedback in section ${feedbackNumber}?`, { bold: true, size: 19 }), ...space(2)], { height: 1100 }),
            ...(next ? [rating()] : []),
        ];
        out.push(areaCard(area, block.core, body, next ? stretchRow : rating), gap(240));
    }
    const across = table([WIDTH], [
        ...kept(() => [
            row([cell([label('LOOKING ACROSS THE CYCLE', 'FFFFFF')], { fill: INK, borders: boxBorders(INK) })]),
            cardRow([p('Where did you fall short, and why?', { bold: true, size: 19 }), ...space(2)], { height: 1100 }),
        ]),
        cardRow([p('What do you want to focus on next cycle?', { bold: true, size: 19 }), ...space(2)], { height: 1100 }),
    ]);
    out.push(across);
    return out;
}

function teamCheck(n) {
    return [
        heading(n, 'Team check', { pageBreak: true }),
        callout([p('You can present this doc, or others can read it beforehand for context. Teammates confirm what matches their experience, correct where they read it differently, with the example that shows it, and add what was left out.', { size: 19 }, { spacing: { after: 0 } })]),
        gap(200),
        logTable(['Teammate', 'Area', 'Confirm, correct or add', 'Example'], [1900, 1800, 2400, 3806], 8, 900),
    ];
}

function guide(g) {
    const W3 = WIDTH / 3;
    const ratings = ['Below expectations', 'Meets expectations', 'Exceeds expectations'];
    const shades = ['F4F4F5', 'E4E4E7', 'D4D4D8'];
    const grid = table([W3, W3, W3], [
        row(ratings.map((r, i) => cell([p(r.replace(' expectations', ''), { bold: true, size: 20, color: INK })], { width: W3, fill: shades[i] }))),
        row(ratings.map(r => cell(g[r].map(t => p(t, { size: 18 })), { width: W3 }))),
    ]);
    const box = title => callout([p(title, { bold: true, size: 19 }), ...g[title].map((t, i, all) => p(t, { size: 18 }, { spacing: { after: i === all.length - 1 ? 0 : 80 } }))]);
    return [
        heading('', 'Rating guide', { pageBreak: true }),
        grid, gap(240),
        box('Stretch expectations'), gap(160),
        box('Describing a shortfall'), gap(160),
        box('Common traps'),
    ];
}

function build(scope, next, g) {
    let n = 0;
    const children = [...cover(scope, next), ...expectations(++n, scope)];
    if (next) children.push(...stretch(++n, next));
    children.push(...review(++n));
    const feedbackNumber = ++n;
    children.push(...feedback(feedbackNumber));
    children.push(...selfAssessment(++n, scope, next, feedbackNumber));
    children.push(...teamCheck(++n));
    children.push(...guide(g));

    return new Document({
        creator: 'Sahaj Growth & Impact',
        title: `Expectations and self-assessment: ${scope.name} scope`,
        styles: { default: { document: { run: { font: FONT, size: 20, color: TEXT }, paragraph: { spacing: { line: 276 } } } } },
        numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
        sections: [{
            properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
            footers: { default: new Footer({ children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({ text: `Growth & Impact at Sahaj  ·  ${scope.name} scope  ·  `, size: 16, color: MUTED }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                ],
            })] }) },
            children,
        }],
    });
}

async function main() {
    const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'doc-templates');
    fs.mkdirSync(outDir, { recursive: true });
    const scopes = loadScopes();
    const g = ratingGuide();
    for (const [i, scope] of scopes.entries()) {
        const file = path.join(outDir, `${scope.id}.docx`);
        fs.writeFileSync(file, await Packer.toBuffer(build(scope, scopes[i + 1], g)));
        console.log(`Wrote ${file}`);
    }
}

main();
