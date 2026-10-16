// Feedback film, chapter 1, Small and often: feedback as part of an ordinary day.
//
// 1. "At Sahaj, feedback is part of an ordinary day..."  Early morning. The camera comes down from
//    high over the valley to the square. All over the village pairs turn to each other for a moment
//    (at the market's workbench, by a house west of the square); at the head of the bridge road a teammate is
//    showing the loaded cart to the client's two people while another teammate watches. The explorer
//    stands in the square, glancing over at the showcase. The new joiner is walking in over the bridge.
// 2. "It works when the person giving it means to help..."  The camera settles on the explorer, who
//    turns back as the joiner comes off the bridge and stops in front of them. Quest box: "Make
//    feedback a habit".
//
// The film's own start: morning, the fog lifted to the Team ring (layout.REVEALS.afterGrowth), the
// explorer where the guide's film leaves them (layout.states.afterGrowth). Ends with the joiner at
// SPOT.joinerStop, facing the explorer.

import { run, keepWorld, villageLife, showcaseOn, bridgeLift, facingTo, beatClock, camera, hoursOver, cartRoll, CAST, SPOT, PATH, SHOT, PACE, WAIT, CART } from './_feedback.js';

export default {
    id: 'habit',

    build(world) {
        const group = new world.THREE.Group();
        bridgeLift(world, group);              // the joiner walks the bridge's planks, not the river bed
        return group;
    },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'start', 'habit');
        keepWorld(world);
        villageLife(world, clock);
        showcaseOn(world, clock);
        cartRoll(world, t, null);
        V[CAST.planner].place(SPOT.planner, WAIT.planner);
        V[CAST.reader].place(SPOT.boardReader, WAIT.reader);

        // the joiner, in over the bridge (already on it as the film opens)
        run(V[CAST.joiner], t, clock, {
            at: PATH.joinerIn[0], facing: 190,
            moves: [{ by: at(1, 0.82), path: PATH.joinerIn, pace: PACE, face: facingTo(SPOT.joinerStop, SPOT.square) }],
        });
        // the explorer glances over at the showcase, then back as the joiner comes up
        run(ex, t, clock, {
            at: SPOT.square, facing: 340,
            looks: [{ from: at(0, 0.45), to: at(1, 0.25), at: CART, k: 0.75 }],
        });

        camera(world, t, [
            [0, SHOT.top],
            [at(0, 0.9), SHOT.square],
            [at(1, 0.08), SHOT.square],
            [at(1, 0.88), SHOT.explorer],
        ]);

        if (t >= at(1, 0.06)) world.hud.quest('Make feedback a habit', null);
    },
};
