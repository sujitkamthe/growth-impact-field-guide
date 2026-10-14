// Line icons for links, steps and section headings, drawn like the area icons (24px grid, 1.8 stroke,
// currentColor), so an icon takes the colour of the text beside it. Use one where it tells the reader
// what kind of thing a link or section is; text still carries the meaning, so icons are aria-hidden.

const PATHS = {
    // How far impact reaches: nested rings resting on one point, as in the reach diagram.
    scope: '<circle cx="12" cy="15" r="3"/><circle cx="12" cy="12.5" r="5.5"/><circle cx="12" cy="10" r="8"/>',
    // Three areas: a circle split into three.
    areas: '<circle cx="12" cy="12" r="9"/><path d="M12 12V3M12 12l7.8 4.5M12 12l-7.8 4.5"/>',
    // A cycle: two arrows chasing round.
    cycle: '<path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    // Growing: a step up and out.
    growth: '<path d="M4 18h5v-5h5V8h6"/><path d="M16 4h4v4"/>',
    // The expectations doc.
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    // Feedback: two speech bubbles.
    feedback: '<path d="M4 5h11v8H9l-3 3v-3H4z"/><path d="M15 9h5v7h-2v3l-3-3h-4v-3"/>',
    // A rating: a three-step scale with one marked.
    rating: '<path d="M4 18h16"/><path d="M6 18v-3M12 18v-7M18 18v-11"/><circle cx="12" cy="8" r="1.6"/>',
    // Reviewing: a check in a circle.
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9"/>',
    // People.
    team: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.6 14.2c.5-.1.9-.2 1.4-.2 2.5 0 4.5 2 4.5 4.5"/>',
    // Principles: a compass.
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    // A stretch: an arrow reaching beyond a line.
    stretch: '<path d="M4 20V4"/><path d="M8 12h12M16 8l4 4-4 4"/>',
    // A tip: a light bulb.
    tip: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    // An example: a quotation mark in a panel.
    example: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h3v3l-2 2M13 10h3v3l-2 2"/>',
    // Disagreeing: two arrows meeting.
    disagree: '<path d="M3 12h7M7 8l3 4-3 4M21 12h-7M17 8l-3 4 3 4"/>',
    // Before you start: a flag.
    start: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    // Comparing: two columns.
    compare: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>',
    // The grid of every scope.
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    // Information.
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    // Paths to choose from.
    paths: '<circle cx="6" cy="19" r="2"/><path d="M6 17c0-6 4-8 12-12M6 17c2-3 6-4 12-4M6 17c3 0 8 1 12 4"/>',
    // Watching: a play triangle in a circle.
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
    // Direction.
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    // Read more.
    more: '<path d="M6 9l6 6 6-6"/>',
};

export const icon = (name, cls = 'icon') => PATHS[name]
    ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`
    : '';

// A link that leads with an icon: for links that send the reader somewhere, not links inside a sentence.
export const iconLink = (href, text, name, cls = 'icon-link') =>
    `<a class="${cls}" href="${href}">${icon(name)}<span>${text}</span></a>`;
