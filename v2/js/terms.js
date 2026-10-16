// Links glossary terms where they are mentioned: the first mention of each term on a reading
// page becomes a link that, when tapped or clicked, shows the term's definition in place, with a
// link on to the page that explains it (or to its glossary entry), so checking a word never takes
// the reader away from what they were reading. Without JavaScript the link opens the glossary. Each glossary entry lists the phrases that count as a mention ("matches:"), so a
// phrase links only where it means the term. Headings, links, controls and diagrams are left alone,
// and so is everything in view when a page opens: terms link only inside text a reader has opened
// (Read more, a principle, an answer), so the first view of a page isn't dotted with links.

const MATCHES = /^<!-- matches: (.*?) -->/;
const TERMS = new Map(); // slug → { title, definition, more }, for the in-place definition
const SKIP = 'a, button, summary, label, select, h1, h2, h3, h4, svg, code, .eyebrow, .on-page, .kind, .facet-label, .ws-scope, .glossary';

export function glossaryTerms(content) {
    const page = content.pages.glossary;
    if (!page) return [];
    return page.sections.flatMap(s => {
        const m = s.body.match(MATCHES);
        if (!m) return [];
        const body = s.body.replace(/^<!--.*?-->\s*/, '').trim();
        // "See [Page](#route)." at the end names the page that explains the term properly.
        const see = body.match(/\s*See \[([^\]]+)\]\(([^)]+)\)\.?$/);
        const definition = (see ? body.slice(0, see.index) : body).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
        const more = see ? { href: see[2], label: `See ${see[1]}` } : { href: `#glossary/${s.slug}`, label: 'Open in the glossary' };
        TERMS.set(s.slug, { title: s.title, definition, more });
        return m[1].split(',').map(p => p.trim()).filter(Boolean).map(phrase => ({ slug: s.slug, phrase }));
    // Longer phrases first, so "raise in scope" is matched before anything it contains.
    }).sort((a, b) => b.phrase.length - a.phrase.length);
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function linkTerms(root, terms) {
    if (!terms.length) return;
    const linked = new Set(); // slugs already linked on this page
    for (const term of terms) {
        if (linked.has(term.slug)) continue;
        const re = new RegExp(`\\b${escapeRe(term.phrase).replace(/ /g, '\\s+')}\\b`, 'i');
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: node => (node.parentElement.closest(SKIP) || !node.parentElement.closest('details')
                ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const m = node.data.match(re);
            if (!m) continue;
            const word = node.splitText(m.index);
            word.splitText(m[0].length);
            const a = document.createElement('a');
            a.className = 'term';
            a.href = `#glossary/${term.slug}`;
            a.dataset.term = term.slug;
            a.setAttribute('aria-expanded', 'false');
            a.setAttribute('aria-controls', 'term-pop');
            word.replaceWith(a);
            a.append(word);
            linked.add(term.slug);
            break;
        }
    }
}

// One definition box for the whole page, opened from whichever term was tapped and placed just
// under it. It closes on Escape, on a tap anywhere else, and when the page changes.
const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let pop, current;

function close({ refocus = false } = {}) {
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    current?.setAttribute('aria-expanded', 'false');
    if (refocus) current?.focus();
    current = null;
}

function open(a) {
    const term = TERMS.get(a.dataset.term);
    if (!term) return;
    close();
    pop.innerHTML = `<p class="term-pop-title">${esc(term.title)}</p><p>${esc(term.definition)}</p>
        <a class="term-pop-more" href="${esc(term.more.href)}">${esc(term.more.label)}</a>`;
    pop.hidden = false;
    const r = a.getBoundingClientRect();
    const width = pop.offsetWidth;
    pop.style.top = `${r.bottom + window.scrollY + 8}px`;
    pop.style.left = `${Math.max(16, Math.min(r.left, window.innerWidth - width - 16)) + window.scrollX}px`;
    a.setAttribute('aria-expanded', 'true');
    current = a;
}

export function bindTermDefinitions() {
    if (pop) return;
    pop = document.createElement('div');
    pop.id = 'term-pop';
    pop.className = 'term-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Definition');
    pop.hidden = true;
    document.body.append(pop);
    document.addEventListener('click', e => {
        const a = e.target.closest('a.term[data-term]');
        if (a) {
            e.preventDefault();
            if (a === current) close();
            else open(a);
        } else if (!pop.contains(e.target)) {
            close();
        }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close({ refocus: true }); });
    window.addEventListener('hashchange', () => close());
    window.addEventListener('resize', () => close());
}
