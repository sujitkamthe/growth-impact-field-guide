// Narration for the third film, "Feedback, every day": building a habit of frequent, genuine
// feedback, from the side of the person giving it and the person hearing it. One or two sentences
// per beat, in chapter order; the single source of the words (the player shows each beat as a
// caption and plays its pre-rendered audio). Grounded in v2/content/feedback.md, the "Giving
// feedback during the cycle" section of v2/content/teammates.md and the "Feedback is a habit"
// principle. STORYBOARD.md beside this file says what each beat shows on screen.

export const CHAPTERS = [
    { id: 'habit', title: 'Small and often', beats: [
        'At Sahaj, feedback is part of an ordinary day: a few words soon after the moment, from anyone to anyone.',
        'It works when the person giving it means to help, and the person hearing it listens and acts on it.',
    ] },
    { id: 'ask', title: 'Ask first', beats: [
        "If you've been on the team longest, ask a new joiner for feedback first. It shows them that asking is safe.",
        "Keep the question small: what's one thing I could do differently next time? 'Any feedback?' usually gets 'all good', which you can't act on.",
    ] },
    { id: 'give', title: 'The same day', beats: [
        "When a teammate's work goes well, tell them that day, while you both remember the moment.",
        "Say what you saw, what it changed, and which expectation it relates to. 'Nice work' is kind, but it doesn't say what to do again.",
    ] },
    { id: 'change', title: 'What should change', beats: [
        'When something should change, say so soon and in private, about the work, not the person, with one thing to try instead.',
        "And say why you're telling them: you expect a lot of their work because you know they can do it.",
        "When it's said to you, and your first instinct is to explain, ask a question instead: what would you have done?",
        "Then thank them. Thanking someone isn't agreeing with them; you can decide later what to do with the feedback.",
    ] },
    { id: 'everyone', title: 'Every way, every area', beats: [
        "Feedback goes every way, whatever anyone's scope, including from the newest person on the team to the most experienced.",
        'It covers more than the code too: how someone works with the client, who grew because of them, and what they gave back to Sahaj.',
        "Tell the people already doing well what their work changed, and ask what they'd like to take on next.",
    ] },
    { id: 'loop', title: 'Closing the loop', beats: [
        'When you act on feedback, go back and tell the person who gave it what you changed and what happened.',
        'Knowing it made a difference is what makes them tell you again next time.',
    ] },
    { id: 'ahead', title: 'Looking ahead', beats: [
        'At each team check, look for what nobody has seen yet, such as an area with no feedback, and agree who will arrange an opportunity for it next cycle.',
        'This week, tell one teammate what you saw them do and what it changed, and ask another what you could do differently next time.',
    ] },
];

// Same voices as the guide's film.
export { VOICES } from '../../script.js';
