// Narration for the second film, "Building Sahaj together": the Org & Community area and the ways
// people contribute to it. One sentence per beat, in chapter order; the single source of the words
// (the player shows each beat as a caption and plays its pre-rendered audio). Grounded in
// v2/content/areas/org-community.md and each scope's ways to contribute. STORYBOARD.md beside this
// file says what each beat shows on screen.

export const CHAPTERS = [
    { id: 'together', title: 'Built by all of us', beats: [
        'Sahaj has no separate team that builds its culture and capability for everyone else.',
        'People like you build it, alongside their client work. That is the Org and Community area.',
        'You choose how you contribute. Contributing is part of the work here, done in working time, with your team making room for it.',
    ] },
    { id: 'ways', title: 'Three ways to contribute', beats: [
        'There are three ways to contribute, and you can choose one or more.',
        'Culture and organisational health: upholding how we work, speaking up when something does not fit, and fixing what wears people down.',
        'Initiatives and capability: the programmes that make Sahaj better, like capability tracks, hiring, onboarding and internal tools.',
        'Community and external contribution: sessions, DevDay, writing, talks and open source, inside Sahaj and beyond it.',
    ] },
    { id: 'reach', title: 'How far it reaches', beats: [
        'Like everything in the guide, the reach of your contribution grows with your scope.',
        'At Direct, you contribute steadily: you help new joiners settle in, or share what your team learned in a session.',
        'At Extended, you drive a piece of org work, like running a community of practice, or carrying a DevDay from choosing the speakers to the follow-up.',
        'At Team, you build a programme, forum or tool Sahaj needs, and set it up so other people keep it running.',
        'At Wider, you shape how Sahaj grows, how it works, or how it is seen, like designing how Sahaj builds a capability across offices.',
    ] },
    { id: 'counts', title: 'What counts', beats: [
        'What counts is what changed, not how visible it was.',
        'A quiet fix that saves many people time every week can matter more than a big stage.',
        'And it lasts through the cycle: a contribution you keep up, and can point to.',
    ] },
    { id: 'room', title: 'When there is no room', beats: [
        'If your project leaves no room to contribute, say so early, to the seniors on your team or your account lead.',
        'Raised during the cycle, it can still be fixed, and your team can make the room together.',
    ] },
    { id: 'close', title: 'Your way in', beats: [
        'Find your way to contribute, and Sahaj gets a little stronger because you are here.',
    ] },
];

// Same voices as the guide's film.
export { VOICES } from '../../script.js';
