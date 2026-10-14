// Org film, chapter 1, Built by all of us: the village building itself, and a teammate making room.
//
// 1. "Sahaj has no separate team that builds its culture and capability..."  Morning. The camera
//    comes down over the village (no guild hall, no "culture department"): villagers going about
//    their day, the explorer at work in their own plot.
// 2. "People like you build it, alongside their client work..."  Over the village's heart, each
//    villager is doing something for the village beyond their own field: one mends the garden's
//    fence, one teaches two others in the meadow, one hangs a banner in the square. Quest box:
//    "Contribute to the village".
// 3. "You choose how you contribute... in working time, with your team making room for it."  Down
//    to the plot: a teammate comes in, waves towards the village and takes over the explorer's crops;
//    the explorer sets off for the village under a high morning sun.
//
// The film's own start: morning, the fog lifted to the Extended ring (layout.REVEALS.afterScopes), the
// explorer at their plot. Ends with the explorer on the road from the plot (PATH.plotOut's end).

import { buildVillage, AFTER, keepWorld, run, SPOT, CLASS, SHOT, HOURS, PATH, ease, seg, mix } from './_org.js';
import { beatClock, camera } from '../../../chapters/_shared.js';

const ANYWHERE = [0, 0];

export default {
    id: 'together',

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

        world.setTimeOfDay(mix(HOURS.start, HOURS.together, ease.inOut(seg(t, 0, duration))));
        world.fog.set(world.REVEALS.afterScopes);
        keepWorld(world, 0, { note: 0 });

        // ---- The plot: the explorer at work; the teammate comes in and takes over ----------------------
        const leave = at(2, 0.23);
        run(ex, t, clock, {
            at: SPOT.plotWork, facing: 270,
            moves: [{ t: leave, by: at(2, 0.9), path: PATH.plotOut, face: 22 }],
            loops: [{ from: -1, to: at(2, 0.12), clip: 'Interact', phase: 0 }],
            looks: [{ from: at(2, 0.04), to: at(2, 0.2), at: [-17.4, 21.2], k: 0.8 }],
            nods: [[at(2, 0.16), at(2, 0.26)]],
        });
        const mate = {
            at: [-13.9, 31.2], facing: 270,
            moves: [
                { by: at(2, 0.06), path: [[-13.9, 31.2], [-13.9, 28.8], [-13.5, 22.6], [-14.1, 21.5], [-16.0, 21.5], [-17.4, 21.2]], face: 25 },
                { t: at(2, 0.4), path: [[-17.4, 21.2], [-17.0, 21.9], [-16.9, 22.3]], face: 270 },
            ],
            loops: [{ from: -1, to: at(0, 0.5), clip: 'Interact', phase: 0.7 }, { from: at(2, 0.6), clip: 'Interact', phase: 0.3 }],
            // a wave towards the village: "go, I've got this"
            gestures: [{ clip: 'Wave', from: at(2, 0.09), to: at(2, 0.27) }],
        };
        run(V[2], t, clock, mate);

        // ---- The village: everyone building something beyond their own field ---------------------------
        // a banner hung at the stage's pole
        run(V[4], t, clock, {
            at: [-0.8, 7.4], facing: 300,
            moves: [{ by: at(1, 0.05), path: [[-0.8, 7.4], [-1.6, 6.3], [-2.25, 5.45]], face: 0 }],
            loops: [{ from: at(1, 0.08), to: at(1, 0.8), clip: 'Interact', phase: 0.2 }],
        });
        // a lesson in the meadow
        const [tx, tz, tf] = CLASS.teacher, [ax, az, af] = CLASS.a, [bx, bz, bf] = CLASS.b;
        run(V[8], t, clock, { at: [tx, tz], facing: tf, loops: [{ from: -1, clip: 'Interact', phase: 0.5, rate: 0.7, weight: 0.7 }] });
        run(V[5], t, clock, { at: [ax, az], facing: af, nods: [[at(1, 0.3), at(1, 0.45)], [at(2, 0.5), at(2, 0.65)]] });
        run(V[6], t, clock, { at: [bx, bz], facing: bf, nods: [[at(1, 0.55), at(1, 0.7)]] });
        // a fence mended by the road
        run(V[7], t, clock, { at: [-19.3, 7.4], facing: 180, loops: [{ from: -1, to: at(2, 0.1), clip: 'Interact', phase: 0.1 }] });
        // readers at the notice board, someone at the workbench, someone watching the banner go up
        run(V[0], t, clock, { at: [-6.0, 8.4], facing: 72 });
        run(V[1], t, clock, { at: [-6.1, 10.2], facing: 104 });
        run(V[9], t, clock, { at: [-6.96, 3.16], facing: 165, loops: [{ from: -1, clip: 'Interact', phase: 0.6 }] });
        run(V[3], t, clock, { at: [-0.4, 6.9], facing: 321 });
        // a newcomer on the west road, on their way into the village
        run(V[10], t, clock, {
            at: [-27.6, 8.4], facing: 80,
            moves: [{ t: at(1, 0.1), path: [[-27.6, 8.4], [-24.0, 9.3], [-21.0, 9.9], [-17.2, 9.4], [-15.6, 8.4], [-13.4, 8.0]], face: 90 }],
        });
        void ANYWHERE;

        // ---- Props ------------------------------------------------------------------------------------
        set?.apply({
            ...AFTER.start,
            stage: { rise: 0, banners: [seg(t, at(1, 0.2), at(1, 0.75)), 0], lights: 0 },
            rail: ease.inOut(seg(t, at(1, 0.15), at(1, 0.7))),
        }, clock);

        // ---- Camera --------------------------------------------------------------------------------
        camera(world, t, [
            [0, SHOT.high],
            [at(0, 0.88), SHOT.village],
            [at(1, 0.06), SHOT.village],
            [at(1, 0.9), SHOT.villageCore],
            [at(2, 0.02), SHOT.villageCore],
            [at(2, 0.34), SHOT.plot],
            [at(2, 0.5), SHOT.plot],
            [at(2, 0.97), SHOT.plotRoad],
        ]);

        // ---- HUD ------------------------------------------------------------------------------------
        if (t >= at(1, 0.12)) world.hud.quest('Contribute to the village', null);
        world.hud.toast('Your team makes room', seg(t, at(2, 0.12), at(2, 0.9)), { label: 'Working time' });
    },
};
