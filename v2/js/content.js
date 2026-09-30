// Loads the markdown in content/ and turns its conventions into structured data.
// Scope files: frontmatter + "## <Area name>" sections, each with a "> core" line
// and "### Expectations / Evidence / Self-check / Not yet" lists.

export const SCOPE_IDS = ['direct', 'extended', 'team', 'wider'];
export const AREA_IDS = ['client-delivery', 'people-team', 'org-community'];
const PAGE_IDS = ['home', 'how-it-works', 'teammates', 'set-expectations', 'self-assessment', 'faq'];

export function slugify(text) {
    return text.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseFrontmatter(text) {
    const match = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { data: {}, body: text };
    const data = {};
    for (const line of match[1].split('\n')) {
        const i = line.indexOf(':');
        if (i < 0) continue;
        let value = line.slice(i + 1).trim();
        if (/^".*"$/.test(value)) value = value.slice(1, -1);
        data[line.slice(0, i).trim()] = /^\d+$/.test(value) ? Number(value) : value;
    }
    return { data, body: match[2] };
}

export function splitSections(md, level) {
    const marker = '#'.repeat(level) + ' ';
    const intro = [];
    const sections = [];
    let current = null;
    for (const line of md.split('\n')) {
        if (line.startsWith(marker)) {
            current = { title: line.slice(marker.length).trim(), lines: [] };
            sections.push(current);
        } else {
            (current ? current.lines : intro).push(line);
        }
    }
    return {
        intro: intro.join('\n').trim(),
        sections: sections.map(s => ({ title: s.title, slug: slugify(s.title), body: s.lines.join('\n').trim() })),
    };
}

function listItems(md) {
    return md.split('\n').filter(l => /^- /.test(l)).map(l => l.slice(2).trim());
}

function parseAreaBlock(body) {
    const { intro, sections } = splitSections(body, 3);
    const core = (intro.match(/^> (.+)$/m) || [])[1] || '';
    const lists = Object.fromEntries(sections.map(s => [s.slug, listItems(s.body)]));
    return {
        core,
        expectations: lists['expectations'] || [],
        evidence: lists['evidence'] || [],
        selfCheck: lists['self-check'] || [],
        notYet: lists['not-yet'] || [],
    };
}

function parseScope(text) {
    const { data, body } = parseFrontmatter(text);
    const { sections } = splitSections(body, 2);
    const scope = { ...data, areas: {}, summary: '', whatChanges: '', ways: null, examples: {} };
    for (const s of sections) {
        if (AREA_IDS.includes(s.slug)) scope.areas[s.slug] = parseAreaBlock(s.body);
        else if (s.slug === 'summary') scope.summary = s.body;
        else if (s.slug === 'what-changes') scope.whatChanges = s.body;
        else if (s.slug === 'ways-to-create-impact') scope.ways = splitSections(s.body, 3);
        else if (s.slug === 'examples') {
            scope.examples = Object.fromEntries(splitSections(s.body, 3).sections.map(e => [e.slug, e.body]));
        }
    }
    return scope;
}

function parseArea(text) {
    const { data, body } = parseFrontmatter(text);
    const { sections } = splitSections(body, 2);
    const area = { ...data, summary: '', facets: [], sections: [], avenues: [] };
    for (const s of sections) {
        if (s.slug === 'summary') area.summary = s.body;
        else if (s.slug === 'facets') area.facets = splitSections(s.body, 3).sections;
        else area.sections.push(s);
        if (s.slug === 'ways-to-contribute') {
            area.avenues = listItems(s.body).map(item => {
                const m = item.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
                return m ? { label: m[1], detail: m[2] } : { label: item, detail: '' };
            });
        }
    }
    return area;
}

function parsePage(text) {
    const { data, body } = parseFrontmatter(text);
    return { ...data, ...splitSections(body, 2) };
}

async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    return res.text();
}

export async function loadContent() {
    const [scopes, areas, pages] = await Promise.all([
        Promise.all(SCOPE_IDS.map(id => fetchText(`content/scopes/${id}.md`).then(parseScope))),
        Promise.all(AREA_IDS.map(id => fetchText(`content/areas/${id}.md`).then(parseArea))),
        Promise.all(PAGE_IDS.map(id => fetchText(`content/${id}.md`).then(parsePage))),
    ]);
    scopes.sort((a, b) => a.order - b.order);
    areas.sort((a, b) => a.order - b.order);
    return {
        scopes,
        areas,
        pages: Object.fromEntries(PAGE_IDS.map((id, i) => [id, pages[i]])),
        scope: id => scopes.find(s => s.id === id),
        area: id => areas.find(a => a.id === id),
        areaByKey: key => areas.find(a => a.key === key),
    };
}
