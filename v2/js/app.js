// Boots V2: loads content, wires the theme toggle and mobile menu, and routes hash changes to views.

import { loadContent } from './content.js';
import * as home from './views/home.js';
import * as how from './views/how.js';
import * as teammates from './views/teammates.js';
import * as matrix from './views/matrix.js';
import * as scope from './views/scope.js';
import * as area from './views/area.js';
import * as compare from './views/compare.js';
import * as sheet from './views/sheet.js';
import * as assess from './views/assess.js';
import * as faq from './views/faq.js';

const ROUTES = [
    { pattern: /^(home)?$/, view: home, nav: 'home' },
    { pattern: /^how-it-works$/, view: how, nav: 'how-it-works' },
    { pattern: /^teammates$/, view: teammates, nav: 'how-it-works' },
    { pattern: /^expectations$/, view: matrix, nav: 'expectations' },
    { pattern: /^scope\/([\w-]+)(?:\/([\w-]+))?$/, view: scope, nav: 'expectations' },
    { pattern: /^area\/([\w-]+)$/, view: area, nav: 'expectations' },
    { pattern: /^compare(?:\/([\w-]+)\/([\w-]+))?$/, view: compare, nav: 'compare' },
    { pattern: /^set-expectations(?:\/([\w-]+))?$/, view: sheet, nav: 'set-expectations' },
    { pattern: /^self-assessment(?:\/([\w-]+))?$/, view: assess, nav: 'self-assessment' },
    { pattern: /^faq(?:\/([\w-]+))?$/, view: faq, nav: 'faq' },
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

function render(content) {
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
    setMenu(false);
    if (!result.keepScroll) window.scrollTo(0, 0);
    try {
        if (result.mount) result.mount(app);
    } catch (err) {
        app.innerHTML = pageError(err).html;
    }
    app.focus({ preventScroll: true });
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
    window.addEventListener('hashchange', () => render(content));
    render(content);
}

boot();
