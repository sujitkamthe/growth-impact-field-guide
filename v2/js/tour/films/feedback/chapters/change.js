// Feedback film, chapter 4, What should change: said soon and in private, and heard without defending.
//
// 1. "When something should change, don't hold it back to be kind..."  The teammate who watched the
//    showcase steps up to the explorer and asks for two minutes (toast, labelled "Soon, in private":
//    "Got two minutes?"). They walk together out of the square to the riverbank east of the bridge.
// 2. "And say why you're telling them..."  By the water, the teammate talks it through. The card opens,
//    labelled "In private", in the guide's form plus what to try instead.
// 3. "When it's said to you and you feel a 'yes, but' coming..."  The explorer starts to explain (toast,
//    labelled "The first instinct": "Yes, but…"), stops halfway, looks out at the river for a moment, nods, and asks with a smaller gesture. Toast,
//    labelled "Hearing it": "What would you have done?" The teammate answers.
// 4. "Then thank them. It's feedback about something you did..."  The explorer nods and raises a hand in thanks; the teammate nods back. Notes: 3.
//
// Starts where The same day ends. Ends with the two of them facing each other on the riverbank.

import { run, arrival, keepWorld, villageLife, facingTo, beatClock, camera, hoursOver, cartGone, seg, CAST, SPOT, PATH, SHOT, PACE, WAIT } from './_feedback.js';

const NOTE = [
    'What I saw: you agreed the date before showing our estimate',
    'What it changed: long hours, or a missed date',
    'Try next time: show both options and let the client choose',
    'Area: Client & Delivery, delivery ownership',
];
const RIVER = [9.6, -11.4];

export default {
    id: 'change',

    build(world) { return new world.THREE.Group(); },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'give', 'change');
        keepWorld(world);
        villageLife(world, clock);
        cartGone(world);
        V[CAST.planner].place(SPOT.planner, WAIT.planner);
        V[CAST.reader].place(SPOT.boardReader, WAIT.reader);
        V[CAST.joiner].place(SPOT.boardJoiner, WAIT.joiner);

        // the teammate from the showcase steps back to watch the bridge
        run(V[CAST.presenter], t, clock, {
            at: SPOT.presenterStop, facing: facingTo(SPOT.presenterStop, SPOT.square),
            moves: [{ t: 0.5, path: PATH.presenterAway, pace: PACE, face: WAIT.presenter }],
        });

        // ---- The teammate: up to the explorer, two minutes, and out to the riverbank -----------------------
        // (they came over at the end of The same day and are waiting beside the explorer)
        const upEnd = PATH.mateUp.at(-1);
        const ask = at(0, 0.03), go = at(0, 0.24);
        const mate = {
            at: upEnd, facing: facingTo(upEnd, SPOT.square),
            moves: [{ t: go, path: PATH.mateToBank, pace: PACE, face: facingTo(SPOT.bankMate, SPOT.bankExplorer) }],
            gestures: [
                { clip: 'Interact', from: ask, to: ask + 1.3, weight: 0.8 },
                { clip: 'Interact', from: at(2, 0.8), to: at(3, 0.1), weight: 0.8 },
            ],
            nods: [[at(3, 0.66), at(3, 0.78)]],
        };
        const there = arrival(mate, 0);
        mate.gestures.push({ clip: 'Interact', from: Math.max(there + 0.3, at(1, 0.3)), to: Math.max(there + 2.4, at(1, 0.8)), weight: 0.85 });
        run(V[CAST.mate], t, clock, mate);

        // ---- The explorer: hears it, starts to explain, stops, asks, thanks ----------------------------------
        run(ex, t, clock, {
            at: SPOT.square, facing: facingTo(SPOT.square, SPOT.presenterStop),
            moves: [{ t: go + 0.25, path: PATH.explorerToBank, pace: PACE, face: facingTo(SPOT.bankExplorer, SPOT.bankMate) }],
            looks: [
                { from: 0, to: go - 0.4, at: upEnd, k: 1 },
                // a moment's pause, looking out at the water
                { from: at(2, 0.27), to: at(2, 0.4), at: RIVER, k: 0.3 },
            ],
            gestures: [
                // starting to explain, and stopping halfway
                { clip: 'Interact', from: at(2, 0.05), to: at(2, 0.24), weight: 0.85, blend: 0.18 },
                // the question
                { clip: 'Interact', from: at(2, 0.56), to: at(2, 0.78), weight: 0.55 },
                // thanks
                { clip: 'Wave', from: at(3, 0.3), to: at(3, 0.6), weight: 0.7 },
            ],
            nods: [[at(2, 0.44), at(2, 0.54)], [at(3, 0.1), at(3, 0.22)]],
        });

        const [x, y, z] = ex.pos;
        const follow = () => ({ target: [x, y + 0.9, z - 1.2], distance: 24, yaw: 18, pitch: 46, fov: 28 });
        camera(world, t, [
            [0, SHOT.pair],
            [at(0, 0.32), SHOT.pair],
            [at(0, 0.62), follow],
            [at(1, 0.28), SHOT.bank],
            [at(2, 0.02), SHOT.bank],
            [at(2, 0.42), SHOT.bankClose],
        ]);

        world.hud.quest('Make feedback a habit', null);
        world.hud.notes(t >= at(3, 0.46) ? 3 : 2);
        if (t < at(2, 0)) world.hud.toast('Got two minutes?', seg(t, at(0, 0.1), at(0, 0.7)), { label: 'Soon, in private' });
        else if (t < at(2, 0.46)) world.hud.toast('Yes, but…', seg(t, at(2, 0.06), at(2, 0.44)), { label: 'The first instinct' });
        else world.hud.toast('What would you have done?', seg(t, at(2, 0.5), at(3, 0.25)), { label: 'Hearing it' });
        world.hud.card(NOTE, seg(t, at(1, 0.0), at(2, 0.3)), { label: 'In private' });
    },
};
