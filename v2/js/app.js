// Boots V2: loads content, wires the theme toggle and mobile menu, and routes hash changes to views.

import { loadContent } from './content.js';
import { initScopeMenu } from './scope-menu.js';
import * as home from './views/home.js';
import * as how from './views/how.js';
import * as teammates from './views/teammates.js';
import * as selfAssessment from './views/self-assessment.js';
import * as matrix from './views/matrix.js';
import * as scope from './views/scope.js';
import * as area from './views/area.js';
import * as compare from './views/compare.js';
import * as faq from './views/faq.js';
import * as glossary from './views/glossary.js';
import { glossaryTerms, linkTerms } from './terms.js';

const ROUTES = [
    { pattern: /^(?:home(?:\/([\w-]+))?)?$/, view: home, nav: 'home', terms: true },
    { pattern: /^how-it-works(?:\/([\w-]+))?$/, view: how, nav: 'how-it-works', terms: true },
    { pattern: /^teammates(?:\/([\w-]+))?$/, view: teammates, nav: 'teammates', terms: true },
    { pattern: /^expectations$/, view: matrix, nav: 'expectations' },
    { pattern: /^scope\/([\w-]+)(?:\/([\w-]+))?$/, view: scope, nav: 'expectations' },
    { pattern: /^area\/([\w-]+)(?:\/([\w-]+))?$/, view: area, nav: 'expectations', terms: true },
    { pattern: /^compare(?:\/([\w-]+)\/([\w-]+))?$/, view: compare, nav: 'expectations' },
    { pattern: /^self-assessment(?:\/([\w-]+))?$/, view: selfAssessment, nav: 'self-assessment', terms: true },
    { pattern: /^faq(?:\/([\w-]+))?$/, view: faq, nav: 'faq', terms: true },
    { pattern: /^glossary(?:\/([\w-]+))?$/, view: glossary, nav: 'faq' },
];

const SITE = 'Growth & Impact at Sahaj';
const app = document.getElementById('app');
const menu = document.querySelector('.menu-button');
const links = document.querySelector('.nav-links');

function notFound() {
    return {
        title: 'Page not found',
        html: `<section class="page narrow"><h1>That page doesn't exist</h1>
            <p>The link may be from an older version of the guide. <a href="#home">Go to the start</a> or <a href="#expectations">see all expectations</a>.</p></section>`,
    };
}

function setMenu(open) {
    menu.setAttribute('aria-expanded', open);
    links.classList.toggle('open', open);
}

function pageError(err) {
    console.error(err);
    return {
        title: 'Something went wrong',
        html: `<section class="page narrow"><h1>This page hit an error</h1>
            <p>${err.message}. <a href="#home">Go to the start</a>, or reload the page.</p></section>`,
    };
}

// keep: re-render in place (the explored scope changed), holding the scroll position and menu.
function render(content, { keep = false } = {}) {
    const scrollY = window.scrollY;
    const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const route = ROUTES.find(r => r.pattern.test(hash));
    const params = route ? hash.match(route.pattern).slice(1) : [];
    let result;
    try {
        result = (route && route.view.render(content, params)) || notFound();
    } catch (err) {
        result = pageError(err);
    }

    app.innerHTML = result.html;
    document.title = result.title ? `${result.title} | ${SITE}` : SITE;
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.toggleAttribute('aria-current', a.dataset.nav === route?.nav);
    });
    if (!keep) setMenu(false);
    if (keep) window.scrollTo(0, scrollY);
    else if (!result.keepScroll) window.scrollTo(0, 0);
    // Reading pages link their glossary terms; lists of expectations stay unlinked.
    if (route?.terms) linkTerms(app, glossaryTerms(content));
    try {
        if (result.mount) result.mount(app);
    } catch (err) {
        app.innerHTML = pageError(err).html;
    }
    // An in-place re-render leaves focus in the dropdown, and undoes any scroll a view's mount
    // queues (it runs after the view's own frame).
    if (keep) requestAnimationFrame(() => window.scrollTo(0, scrollY));
    else app.focus({ preventScroll: true });
}

// A new explored scope. Pages that are about one scope follow it: a scope page opens the new
// scope (at the same area, if one was open), and Compare compares it with the next scope up.
// Every other page re-renders in place, so its highlights update where the reader is.
function scopeChanged(content, id) {
    const hash = location.hash.replace(/^#\/?/, '');
    const onScope = hash.match(/^scope\/[\w-]+(\/[\w-]+)?$/);
    if (onScope) {
        location.hash = `scope/${id}${onScope[1] || ''}`;
    } else if (/^compare(\/|$)/.test(hash)) {
        const scope = content.scope(id);
        const next = content.scopes.find(s => s.order === scope.order + 1);
        location.hash = next ? `compare/${id}/${next.id}` : `compare/${content.scopes[content.scopes.length - 2].id}/${id}`;
    } else {
        render(content, { keep: true });
    }
}

// Printing shows everything: folded sections open for the print and close again after.
function initPrint() {
    let opened = [];
    window.addEventListener('beforeprint', () => {
        opened = [...app.querySelectorAll('details:not([open])')];
        opened.forEach(d => { d.open = true; });
    });
    window.addEventListener('afterprint', () => {
        opened.forEach(d => { d.open = false; });
        opened = [];
    });
}

// The theme follows the system unless someone has chosen one with the toggle.
function initTheme() {
    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch { /* storage blocked */ }
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    document.querySelector('.theme-toggle').addEventListener('click', () => {
        const current = root.getAttribute('data-theme')
            || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch { /* storage blocked */ }
    });
}

async function boot() {
    initTheme();
    initPrint();
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    let content;
    try {
        content = await loadContent();
    } catch (err) {
        app.innerHTML = `<section class="page narrow"><h1>The guide couldn't load</h1>
            <p>${err.message}. The site reads its content at runtime, so open it through a web server
            (for example <code>npm run dev:v2</code>) rather than as a file.</p></section>`;
        return;
    }
    // The version a cycle's doc records, so a doc can be matched to the guide it was agreed against.
    const version = content.pages.home.version;
    if (version) document.querySelector('[data-version]').textContent = `Guide version ${version} · `;
    window.addEventListener('hashchange', () => render(content));
    initScopeMenu(content, { onChange: id => scopeChanged(content, id) });
    render(content);
}

boot();
