// Start, the landing page: what the guide is and how to find your way in, before any expectations.
// It explains scopes and areas beside the reach diagram, offers the four scopes as cards to find
// your own, then sends readers with a task to the page for it. The words come from home.md, looked
// up by heading; the diagram's labels come from How it works' Scopes list, so they match that page.

import { esc, md, mdInline } from '../ui.js';
import { reachDiagram, scopeGlyph, areaIcon } from '../diagram.js';
import { savedScope, EXPLORING } from './_parts.js';
import { sectionParts } from './how.js';
import { icon, iconLink } from '../icons.js';
import { film } from '../tour/films.js';
import { filmLink } from './tour.js';

// An icon for each task link, by where it goes.
const TASK_ICONS = { principles: 'compass', 'how-it-works/the-cycle': 'doc', 'how-it-works/growing-into-the-next-scope': 'stretch', 'self-assessment': 'rating', teammates: 'check' };

const sectionText = (page, slug) => page.sections.find(s => s.slug === slug)?.body || '';

// "- [Task](#route): what it involves" lines from home.md's Where to go next section.
function tasks(page) {
    const items = [...sectionText(page, 'where-to-go-next').matchAll(/^- \[(.+?)\]\((.+?)\):\s*(.+)$/gm)];
    return `<nav class="start-here" aria-labelledby="start-tasks-head">
        <h2 id="start-tasks-head">Where to go next</h2>
        <ul>${items.map(([, label, href, desc]) => `<li><a href="${esc(href)}">${icon(TASK_ICONS[href.slice(1)])}${esc(label)}</a><span>${mdInline(desc)}</span></li>`).join('')}</ul>
    </nav>`;
}

function scopeCards(content) {
    const mine = savedScope(content);
    return `<ul class="scope-cards">${content.scopes.map(s => `<li>
        <a class="scope-card" href="#scope/${s.id}">
            ${scopeGlyph(s.order, { size: 40, total: content.scopes.length })}
            <span class="scope-card-name">${esc(s.name)}${s.id === mine?.id ? ` ${EXPLORING}` : ''}</span>
            <span class="scope-card-mindset">${esc(s.mindset)}</span>
            <span class="scope-card-reach">${esc(s.reaches)}</span>
        </a>
    </li>`).join('')}</ul>`;
}

export function render(content) {
    const page = content.pages.home;
    const reach = sectionParts(content.pages['how-it-works'], 'scopes').items;
    const areas = content.areas.map(a => `<li data-area="${a.key}">
        <a href="#area/${a.id}">${areaIcon(a.key)}${esc(a.name)}</a><span>${esc(a.question)}</span>
    </li>`).join('');

    return {
        title: '',
        html: `<section class="page start">
            <header class="page-head start-hero">
                <div>
                    <h1>${esc(page.headline)}</h1>
                    <p class="lede">${esc(page.lede)}</p>
                </div>
                <div class="start-films">
                <a class="tour-card" href="#tour">
                    <img src="assets/tour/thumbnail.jpeg" width="1920" height="1080" alt="">
                    <span class="tour-card-play" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span>
                    <span class="tour-card-text">
                        <strong>Watch the guide in three minutes</strong>
                        <span>Walk a valley under fog with an explorer: the principles, the scopes, the areas and a whole cycle</span>
                    </span>
                    <span class="tour-card-time">${esc(film('guide').length)}</span>
                </a>
                ${filmLink(film('org'), 'about the Org & Community area')}
                </div>
            </header>
            <section class="start-intro" aria-labelledby="start-intro-head">
                <div>
                    <h2 id="start-intro-head">How the guide works</h2>
                    ${md(sectionText(page, 'how-the-guide-works'))}
                    <ul class="start-areas">${areas}</ul>
                    <p>${iconLink('#how-it-works', 'How it works, in detail', 'arrow')}</p>
                </div>
                <figure class="reach-figure">${reachDiagram(reach)}</figure>
            </section>
            <section class="start-scopes" aria-labelledby="start-scopes-head">
                <h2 id="start-scopes-head">Find your scope</h2>
                <p class="start-scopes-hint">${mdInline(sectionText(page, 'find-your-scope'))}</p>
                ${scopeCards(content)}
                <p>${iconLink('#expectations', "See every scope's expectations side by side", 'grid')}</p>
            </section>
            ${tasks(page)}
        </section>`,
    };
}
