// The tour's narration: one sentence per beat, in chapter order. This is the single source of the
// words: the player shows each beat as a caption and plays its pre-rendered audio, and
// scripts/render-tour-voice.mjs renders that audio from here. Change a line here, then re-render.
// The storyboard (STORYBOARD.md) says what each beat shows on screen.

export const CHAPTERS = [
    { id: 'arrival', title: 'Arrival', beats: [
        'Welcome to Sahaj. Picture it as an open field. Most of it is still under fog, because you have not been there yet.',
        'This is you, new to Sahaj. No title is waiting for you here, and no fixed path: you will choose your own.',
        "Let's see what's out there.",
    ] },
    { id: 'principles', title: 'Principles', beats: [
        'Growth at Sahaj rests on five principles. You will come across them one at a time.',
        'Principle one: Growth is self-directed. You choose the direction, shape and pace of your growth. The guide shows paths people have already taken, not fences.',
        'Principle two: Clarity without hierarchy. There are no titles, so growing means being trusted with problems that reach further.',
        'Principle three: Transparency and trust. Your expectations are written down, visible and fair, and anyone on your team can review them.',
        'Principle four: Feedback is a habit. You give it and ask for it when the moment happens, with anyone.',
        'Principle five: Honest reflection. When you look back, you say what really happened and what your feedback told you.',
    ] },
    { id: 'scopes', title: 'How far you reach', beats: [
        'Your scope is how far your impact reaches. There are four, and in this valley, each one is how much of the field you can see.',
        'The first scope is Direct: your own patch, work you own end to end.',
        'The second is Extended: work beyond your own, like helping a neighbour bring in their harvest.',
        'The third is Team: the whole village, and how it builds, delivers and grows.',
        'The fourth is Wider: beyond the village and across the river, to the account, Sahaj and the community.',
        'Each scope includes the ones inside it, so as you grow, your reach widens and nothing you did before stops counting.',
    ] },
    { id: 'areas', title: 'Three areas', beats: [
        'At every scope, you have impact in the same three areas.',
        'Client and Delivery: understanding what the client needs, building it with sound technical craft, and delivering it reliably.',
        'People and Team: helping the people around you get better at what they do.',
        'Org and Community: making Sahaj better beyond your own project, in a way you choose.',
        'Each area is looked at on its own, against what your scope expects.',
    ] },
    { id: 'expectations', title: 'Your quest', beats: [
        'Every cycle starts like a new quest: you align your expectations with your team, and write them down in a short doc.',
        'You note your scope, anything specific to your work, and where you want to grow.',
        "Your teammates read it and suggest changes until you can all point to what's expected.",
    ] },
    { id: 'feedback', title: 'Along the way', beats: [
        'As the season goes on, you ask the people you work with for feedback, often and while the work is fresh.',
        'A useful note says what they saw, what it changed, and which expectation it relates to.',
        'You keep the notes as you go, so the end of the cycle holds no surprises.',
    ] },
    { id: 'self-assessment', title: 'Around the fire', beats: [
        'At the end of the cycle, you look back one area at a time, starting from your notes.',
        'For each area, you say what changed because of you, and you decide where it stands against what your scope expects.',
        'Then comes the team check: around the fire, your teammates talk it through with you, confirming, correcting or adding to what you wrote.',
    ] },
    { id: 'growth', title: 'Further', beats: [
        "You grow by taking on some of the next scope's work, usually as a stretch you agree with your team.",
        'When that work goes well in one area, that area exceeds what your scope expects.',
        'Once people come to rely on you for it in all three areas, your scope gets bigger, and the fog lifts further.',
        'Then a new season begins, with more of the field in view.',
    ] },
    { id: 'close', title: 'Your turn', beats: [
        "There's always more of the field to explore. Find your scope, and start your next quest.",
    ] },
];

// Voices rendered by scripts/render-tour-voice.mjs (edge-tts, Microsoft neural voices). The first is
// the default; the player offers the others.
export const VOICES = [
    { id: 'en-GB-SoniaNeural', label: 'Sonia (British)' },
    { id: 'en-IN-NeerjaExpressiveNeural', label: 'Neerja (Indian, expressive)' },
];
