// Feedback film, chapter 5, Every way, every area: feedback in every direction, on all three areas, and
// for the people already doing well.
//
// 1. "There are no titles at Sahaj, so how long someone has been here is never a reason to stay quiet..."  The camera rises from the riverbank over the
//    whole village: pairs turning to each other in every district, and at the notice board the new
//    joiner telling one of the older villagers something, who nods. The explorer sets off for the hall.
// 2. "It covers more than the code too..."  The HUD's three area rows appear and fill one by one as
//    exchanges go on in each district: at the market's workbench (Client & Delivery), among the houses
//    (People & Team), and at the notice board (Org & Community). The teammate from the riverbank walks
//    back towards the square; the explorer reaches the hall's door.
// 3. "Tell the people already doing well what their work changed..."  At the hall's door, the teammate
//    who runs the client's planning. The explorer tells them what their work changed, then points out
//    across the river; they both look, and the teammate nods. Toast, labelled "Ask for more": "What
//    would you like to take on next?"
//
// Starts where What should change ends. Ends with the explorer and the planner facing each other.

import { run, arrival, keepWorld, villageLife, facingTo, beatClock, camera, hoursOver, cartGone, seg, areaSlots, CAST, SPOT, PATH, SHOT, PACE, WAIT, CIRCLE } from './_feedback.js';

const BRIDGE = [6, -11.6];

export default {
    id: 'everyone',

    build(world) { return new world.THREE.Group(); },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'change', 'everyone');
        keepWorld(world);
        villageLife(world, clock);
        cartGone(world);
        V[CAST.presenter].place(SPOT.presenterWait, WAIT.presenter);

        // ---- The explorer: from the riverbank to the hall's door, and the planner -------------------------
        const explorer = {
            at: SPOT.bankExplorer, facing: facingTo(SPOT.bankExplorer, SPOT.bankMate),
            moves: [{ t: at(0, 0.22), path: PATH.explorerToHall, pace: PACE, face: facingTo(SPOT.byPlanner, SPOT.planner) }],
            gestures: [
                { clip: 'Interact', from: at(2, 0.04), to: at(2, 0.3), weight: 0.8 },
                // pointing out over the river: the next challenge
                { clip: 'Interact', from: at(2, 0.42), to: at(2, 0.62), weight: 0.6 },
            ],
            looks: [{ from: at(2, 0.4), to: at(2, 0.76), at: BRIDGE, k: 0.85 }],
        };
        run(ex, t, clock, explorer);
        const arrived = arrival(explorer, 0);
        run(V[CAST.planner], t, clock, {
            at: SPOT.planner, facing: WAIT.planner,
            looks: [
                { from: arrived - 0.8, at: SPOT.byPlanner, k: 1 },
                { from: at(2, 0.46), to: at(2, 0.78), at: BRIDGE, k: 0.8 },
            ],
            nods: [[at(2, 0.3), at(2, 0.4)], [at(2, 0.84), at(2, 0.95)]],
        });

        // the teammate from the riverbank, back towards the square
        run(V[CAST.mate], t, clock, {
            at: SPOT.bankMate, facing: facingTo(SPOT.bankMate, SPOT.bankExplorer),
            moves: [{ t: at(0, 0.62), path: PATH.mateToCircle, pace: PACE, face: CIRCLE.mate[2] }],
        });

        // ---- At the notice board: the newest person to an older one, then back -----------------------------
        run(V[CAST.joiner], t, clock, {
            at: SPOT.boardJoiner, facing: WAIT.joiner,
            looks: [{ from: at(0, 0.12), at: SPOT.boardReader, k: 1 }],
            gestures: [{ clip: 'Interact', from: at(0, 0.34), to: at(0, 0.62), weight: 0.8 }],
            nods: [[at(1, 0.86), at(1, 0.96)]],
        });
        run(V[CAST.reader], t, clock, {
            at: SPOT.boardReader, facing: WAIT.reader,
            looks: [{ from: at(0, 0.18), at: SPOT.boardJoiner, k: 1 }],
            gestures: [{ clip: 'Interact', from: at(1, 0.62), to: at(1, 0.84), weight: 0.75 }],
            nods: [[at(0, 0.64), at(0, 0.76)]],
        });

        camera(world, t, [
            [0, SHOT.bankClose],
            [at(0, 0.1), SHOT.bankClose],
            [at(0, 0.78), SHOT.wide],
            [at(1, 0.9), SHOT.wide],
            [at(2, 0.28), SHOT.hall],
        ]);

        // ---- HUD: the three areas fill in as each district's exchange happens ------------------------------
        world.hud.quest('Make feedback a habit', null);
        world.hud.notes(3);
        if (t >= at(1, 0.02) && t < at(2, 0.14)) {
            const marked = [['cd', 0.1], ['pt', 0.38], ['oc', 0.66]].filter(([, f]) => t >= at(1, f)).map(([a]) => a);
            // (the rows' opacity is 4k, clamped: in over the first stretch, out over the next beat's start)
            const k = t < at(2, 0) ? seg(t, at(1, 0.02), at(1, 0.2)) : 0.25 * (1 - seg(t, at(2, 0), at(2, 0.12)));
            world.hud.rows(areaSlots(marked), k);
        }
        world.hud.toast('What would you like to take on next?', seg(t, at(2, 0.08), at(2, 0.96)), { label: 'Ask for more' });
    },
};
