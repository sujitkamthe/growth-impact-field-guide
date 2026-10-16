// Feedback film, chapter 6, Closing the loop: going back to say what changed.
//
// 1. "When you act on feedback, go back and tell the person who gave it..."  The explorer walks from the
//    hall's door to the teammate from the riverbank, who is waiting between the notice board and the
//    fountain, and tells them. The card opens, labelled "Going back": what I changed, what happened.
// 2. "Knowing it made a difference is what makes them tell you again next time."  The teammate nods, then
//    tells the explorer something more. Notes: 4. Around them the rest of the team gathers in a circle
//    for the team check: the planner from the hall, the joiner and the reader from the notice board.
//
// Starts where Every way, every area ends. Ends with everyone in the circle (CIRCLE), the explorer and
// the teammate facing each other.

import { run, arrival, keepWorld, villageLife, facingTo, beatClock, camera, hoursOver, cartGone, seg, circleAt, CAST, SPOT, PATH, SHOT, PACE, WAIT, CIRCLE } from './_feedback.js';

const NOTE = [
    'What I changed: I showed the client both options',
    'What happened: they chose the smaller release',
];

export default {
    id: 'loop',

    build(world) { return new world.THREE.Group(); },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'everyone', 'loop');
        keepWorld(world);
        villageLife(world, clock);
        cartGone(world);
        V[CAST.presenter].place(SPOT.presenterWait, WAIT.presenter);

        // ---- The explorer goes back to the teammate --------------------------------------------------------
        const toMate = facingTo(circleAt('explorer'), circleAt('mate'));
        const explorer = {
            at: SPOT.byPlanner, facing: facingTo(SPOT.byPlanner, SPOT.planner),
            moves: [{ t: Math.max(0.6, at(0, 0.06)), path: PATH.explorerToCircle, pace: PACE, face: toMate }],
        };
        const there = arrival(explorer, 0);
        explorer.gestures = [{ clip: 'Interact', from: there + 0.35, to: there + 1.9, weight: 0.8 }];
        explorer.nods = [[at(1, 0.5), at(1, 0.62)]];
        run(ex, t, clock, explorer);
        run(V[CAST.mate], t, clock, {
            at: circleAt('mate'), facing: CIRCLE.mate[2],
            looks: [{ from: there - 1.0, at: circleAt('explorer'), k: 1 }],
            nods: [[there + 1.9, there + 2.4]],
            gestures: [{ clip: 'Interact', from: at(1, 0.1), to: at(1, 0.44), weight: 0.8 }],
        });

        // ---- The rest of the team gathers --------------------------------------------------------------------
        run(V[CAST.planner], t, clock, {
            at: SPOT.planner, facing: facingTo(SPOT.planner, SPOT.byPlanner),
            moves: [{ t: at(0, 0.32), path: PATH.plannerToCircle, pace: PACE, face: CIRCLE.planner[2] }],
        });
        run(V[CAST.reader], t, clock, {
            at: SPOT.boardReader, facing: facingTo(SPOT.boardReader, SPOT.boardJoiner),
            moves: [{ t: at(0, 0.16), path: PATH.readerToCircle, pace: PACE, face: CIRCLE.reader[2] }],
        });
        run(V[CAST.joiner], t, clock, {
            at: SPOT.boardJoiner, facing: facingTo(SPOT.boardJoiner, SPOT.boardReader),
            moves: [{ t: at(0, 0.45), path: PATH.joinerToCircle, pace: PACE, face: CIRCLE.joiner[2] }],
        });

        camera(world, t, [
            [0, SHOT.hall],
            [at(0, 0.08), SHOT.hall],
            [at(0, 0.7), SHOT.circle],
        ]);

        world.hud.quest('Make feedback a habit', null);
        world.hud.notes(t >= at(1, 0.42) ? 4 : 3);
        world.hud.card(NOTE, seg(t, at(0, 0.42), at(1, 0.8)), { label: 'Going back' });
    },
};
