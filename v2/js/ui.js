// Small rendering helpers shared by every view.

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const md = text => window.marked.parse(text || '');
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

// Expectation sheets travel as a URL-safe base64 blob so they can be shared as a link.
export function encodeSheet(sheet) {
    const bytes = new TextEncoder().encode(JSON.stringify(sheet));
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSheet(code) {
    try {
        const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}
