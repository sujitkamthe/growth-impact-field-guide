// Org film, chapter 5, When there is no room: say so early, and the team makes room together.
//
// 1. "If your project leaves no room to contribute, say so early..."  Dawn. The explorer is at work
//    in their plot, the village's life going on beyond the houses, out of reach. They walk over to
//    the senior villager waiting at the gate and talk it through. Toast "Raised early".
// 2. "Raised during the cycle, it can still be fixed, and your team can make the room together."  The
//    senior waves towards the village; a teammate moves over to take the explorer's rows; the explorer
//    heads out of the gate towards the village in the morning light. Quest "Room made together".
//
// Starts where What counts ends (dawn, everyone at rest). Ends with the explorer just out of the gate.

import { buildVillage, AFTER, keepWorld, run, SPOT, CROWD, SHOT, HOURS, STAGE_TOP, ease, seg, mix } from './_org.js';
import { beatClock, camera } from '../../../chapters/_shared.js';

const AT_GATE = [-16.0, 22.55];             // inside the gate, across it from the senior
const SENIOR = [-13.4, 22.0];
const OUT_OF_GATE = SPOT.outOfGate;        // where the chapter leaves the explorer
const FIELD = { mate: [-18.4, 21.2], newcomer: [-18.8, 23.2] };

export default {
    id: 'room',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.v = buildVillage(world, group);
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;
        const set = group?.userData.v;
        const bench = set?.workshop.spots, shed = set?.shed;

        world.setTimeOfDay(mix(HOURS.counts, HOURS.room, ease.inOut(seg(t, 0, duration))));
        keepWorld(world, 1);
        world.fog.set(world.REVEALS.afterGrowth);

        // ---- The plot: busy from dawn, then raising it early -------------------------------------------
        run(ex, t, clock, {
            at: SPOT.plotWork, facing: 270,
            moves: [
                { t: at(0, 0.34), path: [SPOT.plotWork, AT_GATE], face: 100 },
                { t: at(1, 0.16), path: [AT_GATE, [-15.9, 21.7], [-14.1, 21.5], [-13.4, 20.4], OUT_OF_GATE], face: 356 },
            ],
            loops: [{ from: 0.2, to: at(0, 0.3), clip: 'Interact', phase: 0 }],
            gestures: [{ clip: 'Interact', from: at(0, 0.5), to: at(0, 0.84) }],
            nods: [[at(1, 0.06), at(1, 0.2)]],
        });
        run(V[8], t, clock, {
            at: SENIOR, facing: 280,
            looks: [{ from: at(1, 0.45), at: OUT_OF_GATE, k: 0.7 }],
            gestures: [
                { clip: 'Interact', from: at(0, 0.62), to: at(0, 0.82), weight: 0.8 },
                // "go on, we'll sort it out": a wave towards the village
                { clip: 'Wave', from: at(1, 0.02), to: at(1, 0.22), weight: 0.85 },
            ],
            nods: [[at(0, 0.84), at(0, 0.96)]],
        });
        // the team makes room: the teammate takes over the explorer's rows
        run(V[2], t, clock, {
            at: FIELD.mate, facing: 270,
            moves: [{ t: at(1, 0.12), path: [FIELD.mate, [-17.7, 21.8], SPOT.plotWork], face: 270 }],
            loops: [{ from: 0.3, to: at(1, 0.1), clip: 'Interact', phase: 0.3 }, { from: at(1, 0.5), clip: 'Interact', phase: 0.3 }],
            looks: [{ from: at(0, 0.6), to: at(1, 0.05), at: AT_GATE, k: 0.6 }],
        });
        run(V[10], t, clock, { at: FIELD.newcomer, facing: 270, loops: [{ from: 0.4, clip: 'Interact', phase: 0.4 }] });

        // ---- The village's day, out of reach beyond the houses -----------------------------------------
        run(V[3], t, clock, { at: set?.stage.speaker ?? [-0.3, 4.5], facing: 180, loops: [{ from: 0.3, clip: 'Interact', phase: 0.1, rate: 0.8, weight: 0.8 }] });
        set?.tip.lift(V[3], STAGE_TOP);
        run(V[1], t, clock, { at: [CROWD[3][0], CROWD[3][1]], facing: CROWD[3][2] });
        run(V[4], t, clock, {
            at: bench?.backRight ?? [-4.72, 2.61], facing: 165,
            moves: [{ t: at(0, 0.8), path: [bench?.backRight ?? [-4.72, 2.61], [-3.6, 3.2], [-3.2, 5.8], [-2.2, 6.6], [CROWD[0][0], CROWD[0][1]]], face: CROWD[0][2] }],
            loops: [{ from: 0.3, to: at(0, 0.76), clip: 'Interact', phase: 0.2 }],
        });
        run(V[9], t, clock, { at: bench?.local(-0.3, -0.85) ?? [-6.0, 2.9], facing: 165, loops: [{ from: 0.3, clip: 'Interact', phase: 0.7 }] });
        run(V[5], t, clock, { at: shed?.doorLeft ?? [-10.29, 7.7], facing: 135, loops: [{ from: 0.3, clip: 'Interact', phase: 0.9 }] });
        run(V[6], t, clock, { at: shed?.doorRight ?? [-8.98, 6.11], facing: 300 });
        // back over the mended bridge, at an ordinary pace now
        run(V[7], t, clock, {
            at: [7.2, -18.4], facing: 200,
            moves: [{ t: 0.4, path: [[7.2, -18.4], [6.3, -15.4], [5.9, -11.6], [5.5, -7.4], [5.0, -5.6], [4.6, -2.8]], face: 160 }],
        });
        run(V[0], t, clock, {
            at: [8.2, -19.6], facing: 200,
            moves: [{ t: 1.4, path: [[8.2, -19.6], [6.5, -16.0], [6.0, -11.6], [5.6, -7.4], [5.3, -4.6]], face: 330 }],
        });

        set?.apply({ ...AFTER.room, fingerpost: { rise: 1, arms: [1, 1, 1], lit: [0.3, 0.3, 0.3] } }, clock);

        // ---- Camera --------------------------------------------------------------------------------------
        camera(world, t, [
            [0, SHOT.dawnPlot],
            [at(0, 0.3), SHOT.dawnPlot],
            [at(0, 0.6), SHOT.talk],
            [at(1, 0.15), SHOT.talk],
            [at(1, 0.92), SHOT.roomRoad],
        ]);

        // ---- HUD -----------------------------------------------------------------------------------------
        world.hud.toast('Raised early', seg(t, at(0, 0.48), at(1, 0.3)), { label: 'A note' });
        world.hud.quest(t < at(1, 0.4) ? 'A contribution you keep up' : 'Room made together', null);
    },
};
