// Small rendering helpers shared by every view.

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// "<!-- callout -->" before a paragraph marks it as a rule readers must not miss.
const CALLOUT = /^<!-- callout -->\n+((?:.+\n?)+)/gm;
export const md = text => window.marked.parse((text || '').replace(CALLOUT,
    (_, para) => `<div class="callout">\n\n${para.trim()}\n\n</div>\n\n`));
export const mdInline = text => window.marked.parseInline(text || '');

export const list = (items, cls = '') =>
    items.length ? `<ul class="${cls}">${items.map(i => `<li>${mdInline(i)}</li>`).join('')}</ul>` : '';

export function storageGet(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

export function storageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Private windows and blocked storage: drafts simply aren't kept.
    }
}

export async function copyText(text, button) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const area = Object.assign(document.createElement('textarea'), { value: text });
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
    }
    if (button) {
        const original = button.textContent;
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = original; }, 1600);
    }
}

// Read more: detail folded under a section's short line or visual, so a page can be taken in at a
// glance. Show less sits under the text it closes; printing opens every fold (see app.js).
export const fold = (inner, label = 'Read more') => inner && inner.trim()
    ? `<details class="fold"><summary>${label}</summary>${inner}
        <button type="button" class="fold-less" data-fold-close>Show less</button></details>`
    : '';

export function bindFolds(root) {
    root.querySelectorAll('[data-fold-close]').forEach(b => b.addEventListener('click', () => {
        const details = b.closest('details');
        details.open = false;
        const summary = details.querySelector('summary');
        summary.focus({ preventScroll: true });
        if (summary.getBoundingClientRect().top < 0) details.scrollIntoView({ block: 'start' });
    }));
}

// Open the fold that holds an element, so a link to a section or term inside it lands on view.
export function openFoldAround(el) {
    for (let d = el?.closest('details.fold'); d; d = d.parentElement?.closest('details.fold')) d.open = true;
    el?.querySelector?.(':scope > details.fold')?.setAttribute('open', '');
}
