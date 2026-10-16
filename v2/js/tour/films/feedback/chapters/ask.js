// Feedback film, chapter 2, Ask first: the most experienced person goes first, asks about their own
// work, and thanks the critical answer.
//
// 1. "If you've been on the team the longest, go first..."  Close on the two of them in the square.
//    The explorer asks; the joiner answers at some length; the explorer nods. Toast, labelled "Ask
//    first": "What would you change about how I run planning?" Notes: 1.
// 2. "If what they tell you is critical, thank them..."  The joiner answers, glancing towards the hall; the
//    explorer nods. Toast, labelled "Thank them": "Thanks, that's useful. Tell me more?" Notes: 2. The
//    explorer turns to the showcase at the cart.
//
// Starts where Small and often ends. Ends with the explorer facing the cart.

import { run, keepWorld, villageLife, showcaseOn, facingTo, beatClock, camera, hoursOver, cartRoll, CAST, SPOT, SHOT, WAIT, CART } from './_feedback.js';

const HALL = [-2.4, -3.8];

export default {
    id: 'ask',

    build(world) { return new world.THREE.Group(); },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'habit', 'ask');
        keepWorld(world);
        villageLife(world, clock);
        showcaseOn(world, clock);
        cartRoll(world, t, null);
        V[CAST.planner].place(SPOT.planner, WAIT.planner);
        V[CAST.reader].place(SPOT.boardReader, WAIT.reader);

        run(ex, t, clock, {
            at: SPOT.square, facing: 340,
            // (340 is already within a few degrees of the joiner; settle on them exactly, then turn to the cart)
            looks: [
                { from: 0, at: SPOT.joinerStop, k: 1 },
                { from: at(1, 0.8), at: CART, k: 1, turn: 0.8 },
            ],
            gestures: [
                { clip: 'Interact', from: at(0, 0.1), to: at(0, 0.3), weight: 0.75 },
                { clip: 'Interact', from: at(1, 0.06), to: at(1, 0.24), weight: 0.75 },
            ],
            nods: [[at(0, 0.74), at(0, 0.86)], [at(1, 0.62), at(1, 0.74)]],
        });
        run(V[CAST.joiner], t, clock, {
            at: SPOT.joinerStop, facing: facingTo(SPOT.joinerStop, SPOT.square),
            gestures: [
                { clip: 'Interact', from: at(0, 0.34), to: at(0, 0.72), weight: 0.85 },
                { clip: 'Interact', from: at(1, 0.28), to: at(1, 0.58), weight: 0.85 },
            ],
            // a glance at the hall while they explain
            looks: [{ from: at(1, 0.3), to: at(1, 0.5), at: HALL, k: 0.5 }],
            nods: [[at(0, 0.22), at(0, 0.32)]],
        });

        camera(world, t, [
            [0, SHOT.explorer],
            [at(0, 0.3), SHOT.meet],
            [at(1, 0.6), SHOT.meet],
            [at(1, 0.98), SHOT.showcase],
        ]);

        world.hud.quest('Make feedback a habit', null);
        // (one toast a frame: the last call wins)
        if (t < at(1, 0)) world.hud.toast('What would you change about how I run planning?', world.util.seg(t, at(0, 0.08), at(0, 0.98)), { label: 'Ask first' });
        else world.hud.toast("Thanks, that's useful. Tell me more?", world.util.seg(t, at(1, 0.03), at(1, 0.95)), { label: 'Thank them' });
        if (t >= at(0, 0.72)) world.hud.notes(t >= at(1, 0.6) ? 2 : 1);
    },
};
