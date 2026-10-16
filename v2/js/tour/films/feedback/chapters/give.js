// Feedback film, chapter 3, The same day: recognition right after the moment, in the guide's form.
//
// 1. "When a teammate's work goes well, tell them that day..."  The showcase ends: the client nods,
//    turns to the cart's shafts and pulls it away along the road and over the bridge, their colleague
//    walking on ahead. The teammate who gave the showcase watches it go, then walks over to the
//    explorer. The joiner heads off across the square to the notice board.
// 2. "Say what you saw, what it changed, and which expectation..."  Close on the two of them: the
//    explorer tells them, and the parchment card opens, labelled "Said the same day", on the three
//    parts. The teammate nods.
//
// Starts where Ask first ends. Ends with the cart on the far bank and the two teammates facing each
// other in the square.

import { run, arrival, keepWorld, villageLife, bridgeLift, facingTo, beatClock, camera, hoursOver, cartRoll, pullAlong, seg, CAST, SPOT, PATH, SHOT, PACE, WAIT, CART, CLIENT2_END } from './_feedback.js';

const NOTE = [
    'What I saw: your fix halved the page load',
    'What it changed: the client noticed it in the showcase',
    'Which expectation: Client & Delivery, technical craft',
];
// a wider look that takes in the road to the bridge as the cart goes
const CART_GOES = { target: [7.2, 0.8, -6.2], distance: 34, yaw: 14, pitch: 52, fov: 28 };

export default {
    id: 'give',

    build(world) {
        const group = new world.THREE.Group();
        bridgeLift(world, group);              // the client's people cross on the planks
        return group;
    },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'ask', 'give');
        keepWorld(world);
        villageLife(world, clock);
        V[CAST.planner].place(SPOT.planner, WAIT.planner);
        V[CAST.reader].place(SPOT.boardReader, WAIT.reader);

        // ---- The cart leaves with the client ------------------------------------------------------------
        // the client nods, steps round to the shafts, and pulls
        const toShafts = {
            at: SPOT.client, facing: facingTo(SPOT.client, SPOT.presenter),
            moves: [{ t: at(0, 0.1), path: PATH.toShafts, pace: 1.2, face: facingTo(PATH.pull[0], PATH.pull[1]) }],
            nods: [[at(0, 0.0), at(0, 0.09)]],
        };
        const rollAt = arrival(toShafts, 0) + 0.55;
        const d = cartRoll(world, t, rollAt);
        if (t < rollAt) run(V[CAST.client], t, clock, toShafts);
        else pullAlong(V[CAST.client], d);
        run(V[CAST.client2], t, clock, {
            at: SPOT.client2, facing: facingTo(SPOT.client2, SPOT.presenter),
            moves: [{ t: Math.max(0.6, at(0, 0.05)), path: PATH.client2Out, pace: 1.4, face: CLIENT2_END }],
        });

        // ---- The teammate who gave the showcase, over to the explorer ------------------------------------------
        const presenter = {
            at: SPOT.presenter, facing: facingTo(SPOT.presenter, SPOT.client),
            moves: [{ t: at(0, 0.28), path: PATH.presenterOver, pace: PACE, face: facingTo(SPOT.presenterStop, SPOT.square) }],
            loops: [{ from: -1, to: at(0, 0.1), clip: 'Interact', phase: 0.3, rate: 0.8, weight: 0.8 }],
            looks: [{ from: at(0, 0.1), to: at(0, 0.2), at: [6.4, -7.0], k: 0.6 }],
            nods: [[at(1, 0.42), at(1, 0.54)], [at(1, 0.82), at(1, 0.92)]],
        };
        run(V[CAST.presenter], t, clock, presenter);
        const over = arrival(presenter, 0);

        // ---- The explorer -------------------------------------------------------------------------------
        run(ex, t, clock, {
            at: SPOT.square, facing: facingTo(SPOT.square, CART),
            looks: [{ from: over - 0.9, at: SPOT.presenterStop, k: 1, turn: 0.8 }],
            gestures: [
                { clip: 'Interact', from: at(1, 0.1), to: at(1, 0.36), weight: 0.8 },
                { clip: 'Interact', from: at(1, 0.58), to: at(1, 0.76), weight: 0.6 },
            ],
        });

        // ---- The teammate who watched, the joiner on to the notice board -----------------------------------------
        // the teammate who watched comes over and waits their turn (they speak in What should change)
        const upEnd = PATH.mateUp.at(-1);
        run(V[CAST.mate], t, clock, {
            at: SPOT.mate, facing: facingTo(SPOT.mate, CART),
            looks: [{ from: at(0, 0.3), to: at(1, 0.2), at: [6.2, -10], k: 0.5 }],
            moves: [{ t: at(1, 0.45), path: PATH.mateUp, pace: PACE, face: facingTo(upEnd, SPOT.square) }],
        });
        run(V[CAST.joiner], t, clock, {
            at: SPOT.joinerStop, facing: facingTo(SPOT.joinerStop, SPOT.square),
            moves: [{ t: 0.6, path: PATH.joinerToBoard, pace: PACE, face: WAIT.joiner }],
        });

        camera(world, t, [
            [0, SHOT.showcase],
            [at(0, 0.12), SHOT.showcase],
            [at(0, 0.8), CART_GOES],
            [at(1, 0.02), CART_GOES],
            [at(1, 0.36), SHOT.pair],
        ]);

        world.hud.quest('Make feedback a habit', null);
        world.hud.notes(2);
        world.hud.card(NOTE, seg(t, at(1, 0.06), at(1, 0.97)), { label: 'Said the same day' });
    },
};
