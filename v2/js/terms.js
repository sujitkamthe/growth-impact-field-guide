// Links glossary terms where they are mentioned: the first mention of each term on a reading
// page becomes a link to its glossary entry, with its first sentence as a hover
// preview. Each glossary entry lists the phrases that count as a mention ("matches:"), so a
// phrase links only where it means the term. Headings, links, controls and diagrams are left alone.

const MATCHES = /^<!-- matches: (.*?) -->/;
const SKIP = 'a, button, summary, label, select, h1, h2, h3, h4, svg, code, .eyebrow, .on-page, .kind, .facet-label, .ws-scope, .glossary';

export function glossaryTerms(content) {
    const page = content.pages.glossary;
    if (!page) return [];
    return page.sections.flatMap(s => {
        const m = s.body.match(MATCHES);
        if (!m) return [];
        const text = s.body.replace(/^<!--.*?-->\s*/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
        const preview = (text.match(/^[^.]*\./) || [text])[0];
        return m[1].split(',').map(p => p.trim()).filter(Boolean).map(phrase => ({ slug: s.slug, phrase, preview }));
    // Longer phrases first, so "reference scope" is matched before anything it contains.
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
            acceptNode: node => (node.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const m = node.data.match(re);
            if (!m) continue;
            const word = node.splitText(m.index);
            word.splitText(m[0].length);
            const a = document.createElement('a');
            a.className = 'term';
            a.href = `#glossary/${term.slug}`;
            a.title = term.preview;
            word.replaceWith(a);
            a.append(word);
            linked.add(term.slug);
            break;
        }
    }
}
