// The tour's narration: one sentence per beat, in chapter order. This is the single source of the
// words: the player shows each beat as a caption and plays its pre-rendered audio, and
// scripts/render-tour-voice.mjs renders that audio from here. Change a line here, then re-render.
// The storyboard (STORYBOARD.md) says what each beat shows on screen.

export const CHAPTERS = [
    { id: 'arrival', title: 'Welcome', beats: [
        'Welcome to Sahaj. This guide explains how we think about growth and the impact of our work.',
        "Whether you're new here or thinking about what to take on next, the guide helps you and your team agree on expectations.",
        "Let's start with the principles behind it.",
    ] },
    { id: 'principles', title: 'Principles', beats: [
        'Five principles shape how we approach growth at Sahaj.',
        'Principle one: Growth is self-directed. You choose the direction, shape and pace of your growth.',
        'Principle two: Clarity without hierarchy. Sahaj has no titles. We describe growth through the impact of your work and the responsibilities people trust you with.',
        'Principle three: Transparency and trust. Expectations are written down and open for discussion. Anyone on your team can review them.',
        'Principle four: Feedback is a habit. Anyone can give or ask for feedback, whatever their scope, while the work is still fresh.',
        'Principle five: Honest reflection. You look back at what happened and what you learned from feedback, including what was difficult.',
    ] },
    { id: 'scopes', title: 'How far you reach', beats: [
        'To make those responsibilities clear, the guide uses four scopes. Your scope describes how far your impact reaches.',
        'Direct is the work you own end to end.',
        'Extended reaches beyond your own work, helping your teammates with theirs.',
        'Team covers how the whole team builds, delivers and grows.',
        'Wider reaches beyond the team, to the account, Sahaj and the community.',
        'Each scope builds on the ones before it. Your own work and the help you give teammates still matter as your responsibilities grow.',
    ] },
    { id: 'areas', title: 'Three areas', beats: [
        'At every scope, you have impact in the same three areas.',
        'Client and Delivery: understanding what the client needs, building it well, and delivering it reliably.',
        'People and Team: helping the people around you get better at what they do.',
        'Org and Community: contributing beyond your delivery work, through hiring, sharing knowledge or community events. You choose how to contribute.',
        "Each area has its own rating against your scope, so you can see where you're doing well and where you need support.",
    ] },
    { id: 'expectations', title: 'Agreeing expectations', beats: [
        'At the start of each cycle, you write a short expectations doc to discuss with your team.',
        'You note your scope, anything specific to your work, and where you want to grow.',
        'Your teammates read it and suggest changes. Together, you agree on what to expect from your work.',
    ] },
    { id: 'feedback', title: 'Along the way', beats: [
        'During the cycle, ask the people you work with for feedback while the work is fresh.',
        'A useful note says what they saw, what it changed, and which expectation it relates to.',
        'Keep those notes as you go, so you have examples to look back on at the end of the cycle.',
    ] },
    { id: 'self-assessment', title: 'Looking back together', beats: [
        'At the end of the cycle, you look back one area at a time, starting from your notes.',
        'For each area, describe what changed because of your work, what you learned from feedback, and how your impact compares with your scope.',
        'Then you discuss your self-assessment with your teammates at the team check. They add their observations, help correct anything you missed, and confirm the ratings.',
    ] },
    { id: 'growth', title: 'Growing your scope', beats: [
        "You grow by taking on some of the next scope's work, usually as a stretch you agree with your team.",
        'When you sustain that impact in one area, that area is rated as exceeding your current scope.',
        'Your scope is raised at the team check when you consistently show next-scope impact in all three areas and people depend on you for it.',
        'You then agree expectations for the next cycle at your new scope.',
    ] },
    { id: 'close', title: 'Getting started', beats: [
        'Start with the scope that reflects your work today, and talk with your team about where you want to grow.',
    ] },
];

// Voices rendered by scripts/render-tour-voice.mjs (edge-tts, Microsoft neural voices). The first is
// the default; the player offers the others.
export const VOICES = [
    { id: 'en-GB-SoniaNeural', label: 'Sonia (British)' },
    { id: 'en-IN-NeerjaExpressiveNeural', label: 'Neerja (Indian, expressive)' },
];
