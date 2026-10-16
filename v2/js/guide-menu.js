// The Guide menu at the end of the nav: the reference pages (How it works, Principles, Agreed
// focus, Reviewing a teammate, Questions, Glossary), kept out of the way of the three everyday
// tasks and All scopes, which the nav leads with. It opens from its button, closes on Escape, a click outside
// or a change of page, and its button shows as current when the page is one of its links. On a
// phone it is part of the open menu, already expanded.

const focus = el => el.focus({ preventScroll: true });

export function initGuideMenu() {
    const item = document.querySelector('.nav-guide');
    if (!item) return;
    const button = item.querySelector('[data-guide-button]');
    const panel = item.querySelector('#guide-menu');
    const setOpen = (open, { focusButton = false } = {}) => {
        panel.hidden = !open;
        button.setAttribute('aria-expanded', open);
        if (open) focus(panel.querySelector('a[aria-current]') || panel.querySelector('a'));
        else if (focusButton) focus(button);
    };
    button.addEventListener('click', () => setOpen(panel.hidden));
    item.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); setOpen(false, { focusButton: true }); }
    });
    document.addEventListener('click', e => { if (!panel.hidden && !item.contains(e.target)) setOpen(false); });
    window.addEventListener('hashchange', () => setOpen(false));
}

// After each page change: the Guide button is current when the page is one of its links.
export function markGuideMenu() {
    const button = document.querySelector('[data-guide-button]');
    button?.classList.toggle('is-current', Boolean(document.querySelector('#guide-menu a[aria-current]')));
}
