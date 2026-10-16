// The films the tour player can play. Each film is a narration script (CHAPTERS and VOICES), a
// folder of chapters (`<base>chapters/<id>.js`, relative to this file) built on the shared world,
// and its pre-rendered narration (`<audio>manifest.json`, relative to the site root), rendered by
// scripts/render-tour-voice.mjs. The page plays a film at `#<route>`.
//
// To add a film: write its script.js and chapters under films/<id>/, add it here, then run
// `npm run tour:voice` to render its audio, and put its length (from the player's total) in `length`.

import * as guide from './script.js';
import * as org from './films/org/script.js';

export const FILMS = [
    {
        id: 'guide',
        title: 'The guide in three minutes',
        chapters: guide.CHAPTERS,
        voices: guide.VOICES,
        base: './',
        audio: 'audio/tour/',
        thumbnail: 'assets/tour/thumbnail.jpeg',
        route: 'tour',
        length: '5:12',
        playLabel: 'Play the tour',
        // The end card's links; "Watch again" is always offered after them.
        end: [{ href: '#home', label: 'Find your scope' }],
    },
    {
        id: 'org',
        title: 'Building Sahaj together',
        chapters: org.CHAPTERS,
        voices: org.VOICES,
        base: './films/org/',
        audio: 'audio/tour/org/',
        // Set to 'assets/tour/thumbnail-org.jpeg' once that still exists; until then the links show
        // a play mark on a plain tile (null avoids a 404 on every page that links here).
        thumbnail: 'assets/tour/thumbnail-org.jpeg',
        route: 'tour/org',
        length: '2:17',
        playLabel: 'Play the film',
        // The area page that links to this film (views/area.js).
        area: 'org-community',
        end: [
            { href: '#area/org-community', label: 'Read Org & Community' },
            { href: '#tour', label: 'Watch the guide in three minutes', quiet: true },
        ],
    },
];

export const film = id => FILMS.find(f => f.id === id);
export const filmAtRoute = route => FILMS.find(f => f.route === route);
export const filmForArea = areaId => FILMS.find(f => f.area === areaId);
// The film's length to the nearest minute, for labels like "(2 min)".
export const filmMinutes = f => { const [m, s] = f.length.split(':').map(Number); return Math.max(1, Math.round(m + s / 60)); };
