// Org film, chapter 6, Your way in: the village at golden hour, and the area's own question.
//
// 1. "Find your way to contribute, and Sahaj gets a little stronger because you are here."  The
//    explorer walks on towards the village as the camera pulls up over it into golden hour: DevDay's
//    lanterns lit in the square, the workshop and the tool shed busy, people on the mended bridge,
//    villagers everywhere. The last toast asks Building Sahaj's question: "Is Sahaj stronger because
//    you're here?" The player's end card follows.
//
// Starts where When there is no room ends.

import { buildVillage, AFTER, keepWorld, run, SPOT, CROWD, SHOT, HOURS, STAGE_TOP, ease, seg, mix } from './_org.js';
import { beatClock, camera } from '../../../chapters/_shared.js';

export default {
    id: 'close',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.v = buildVillage(world, group);
        return group;
    },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;
        const set = group?.userData.v;
        const OUT_OF_GATE = SPOT.outOfGate;
        const bench = set?.workshop.spots, shed = set?.shed;

        world.setTimeOfDay(mix(HOURS.room, HOURS.close, ease.inOut(seg(t, 0, at(0, 0.9)))));
        keepWorld(world, 1);
        world.fog.set(world.REVEALS.afterGrowth);

        // the explorer, on towards the village
        run(ex, t, clock, { at: OUT_OF_GATE, facing: 356, moves: [{ t: 0.6, path: [OUT_OF_GATE, [-13.4, 17.0], [-12.1, 16.4], [-11.0, 15.4]], face: 40 }] });

        // everyone as When there is no room leaves them, going on with their day
        run(V[8], t, clock, { at: [-13.4, 22.0], facing: 280, looks: [{ from: -1, at: OUT_OF_GATE, k: 0.7 }] });
        run(V[2], t, clock, { at: SPOT.plotWork, facing: 270, loops: [{ from: -1, clip: 'Interact', phase: 0.3 }] });
        run(V[10], t, clock, { at: [-18.8, 23.2], facing: 270, loops: [{ from: -1, clip: 'Interact', phase: 0.4 }] });
        run(V[3], t, clock, { at: set?.stage.speaker ?? [-0.3, 4.5], facing: 180, loops: [{ from: -1, clip: 'Interact', phase: 0.1, rate: 0.8, weight: 0.8 }], gestures: [{ clip: 'Wave', from: at(0, 0.4), to: at(0, 0.62), weight: 0.7 }] });
        set?.tip.lift(V[3], STAGE_TOP);
        for (const [who, i] of [[1, 3], [4, 0]]) {
            const [x, z, f] = CROWD[i];
            run(V[who], t, clock, { at: [x, z], facing: f, gestures: [{ clip: 'Wave', from: at(0, 0.45 + i * 0.03), to: at(0, 0.65 + i * 0.03), weight: 0.7 }] });
        }
        run(V[9], t, clock, { at: bench?.local(-0.3, -0.85) ?? [-6.0, 2.9], facing: 165, loops: [{ from: -1, clip: 'Interact', phase: 0.7 }] });
        run(V[5], t, clock, { at: shed?.doorLeft ?? [-10.29, 7.7], facing: 135, loops: [{ from: -1, clip: 'Interact', phase: 0.9 }] });
        run(V[6], t, clock, { at: shed?.doorRight ?? [-8.98, 6.11], facing: 300, moves: [{ t: 0.6, path: [shed?.doorRight ?? [-8.98, 6.11], [-8.0, 7.4], [-7.6, 9.2]], face: 160 }] });
        // the two who crossed back over the bridge, still talking at its foot
        run(V[7], t, clock, { at: [4.6, -2.8], facing: 160, loops: [{ from: 0.4, clip: 'Interact', phase: 0.5, weight: 0.4 }] });
        run(V[0], t, clock, { at: [5.3, -4.6], facing: 330, nods: [[at(0, 0.5), at(0, 0.62)]] });

        set?.apply({ ...AFTER.room, fingerpost: { rise: 1, arms: [1, 1, 1], lit: [0.3, 0.3, 0.3] } }, clock);

        camera(world, t, [[0, SHOT.roomRoad], [at(0, 0.06), SHOT.roomRoad], [at(0, 0.92), SHOT.closeHigh]]);

        world.hud.quest('Room made together', null);
        // the area's question, held on screen to the end (the toast is fully shown for k 0.12..0.86)
        world.hud.toast("Is Sahaj stronger because you're here?", 0.8 * ease.out(seg(t, at(0, 0.12), at(0, 0.4))), { label: 'Building Sahaj' });
    },
};
