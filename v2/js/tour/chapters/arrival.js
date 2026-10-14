// Chapter 1, Arrival: the reference example of the chapter contract (see WORLD.md).
//
// 1. "Welcome to Sahaj..."  The camera comes down from high over a valley lost in fog to the one
//    clear patch: a camp in the south-west, in early morning light. The explorer is still in the tent.
// 2. "This is you..."       The explorer steps out of the tent, turns to us (a friendly close shot,
//                           three-quarters on) and gives a small wave, then turns back to the field.
// 3. "Let's see what's out there."  A few steps towards the fog, which parts around them; the quest
//    box offers its first quest. Ends on layout.states.afterArrival, where Principles begins.
//
// Everything is set from `time` alone: the same t always gives the same frame.

import { line, stroll, travel } from './_shared.js';

const QUEST = 'Explore the field';
// Beat 2: close on the explorer from the front, three-quarters on, as they turn to us.
const FRIENDLY = { target: [-43.3, 1.3, 40.4], distance: 7.2, yaw: 32, pitch: 9, fov: 30 };
const FACE_US = 160;          // facing the camera, a little to one side
const FIELD = 31;             // the way the first steps go

export default {
    id: 'arrival',

    build(world) {
        return new world.THREE.Group();
    },

    update(world, group, time) {
        const { t, beatStarts, beatEnds } = time;
        const { seg, ease, mix } = world.util;
        const { REVEALS, states } = world;
        const ex = world.explorer;
        // the moment fraction f of the way through beat i
        const at = (i, f) => beatStarts[i] + (beatEnds[i] - beatStarts[i]) * f;

        // Morning light warming a little over the chapter.
        world.setTimeOfDay(mix(states.start.hours, states.afterArrival.hours, seg(t, 0, beatEnds[2])));

        // ---- The explorer ----------------------------------------------------------------
        // Out of the tent, a turn to us with a small wave, a turn back, then the first steps; both
        // walks at an even pace (no eased speed peaks), the steps ending where afterArrival has them.
        const { tentExit, arrivalSteps } = world.layout.paths;
        const exit = stroll(at(1, 0.02), line(tentExit).total, { pace: 1.4 });
        const t0 = at(1, 0.64), t1 = at(2, 0.97);
        const stepsL = line(arrivalSteps).total;
        const steps = stroll(t0, stepsL, { pace: stepsL / Math.max(0.5, t1 - t0 - 0.7) });
        const walk = seg(t, t0, t1);                           // for the fog that travels with them
        if (t < at(1, 0.02)) {
            ex.show(0);                                        // still inside the tent
        } else if (t < t0) {
            ex.walk(tentExit, travel(exit.keys, t) / line(tentExit).total);
            const turn = (from, to, k) => from + ((((to - from) % 360) + 540) % 360 - 180) * ease.inOut(k);
            const toUs = seg(t, exit.end, exit.end + 0.45), back = seg(t, t0 - 0.42, t0);
            if (toUs > 0) ex.face(turn(turn(ex.facing, FACE_US, toUs), FIELD, back));
            const w0 = exit.end + 0.4, w1 = t0 - 0.4;
            const wave = seg(t, w0, w1);
            if (w1 > w0 && wave > 0 && wave < 1) ex.play('Wave', (t - w0) * 1.25, { weight: Math.min(0.995, ease.sine(Math.min(1, wave * 4)) * ease.sine(Math.min(1, (1 - wave) * 4))) });
            ex.ring(ease.out(seg(t, at(1, 0.2), at(1, 0.5))));
        } else {
            ex.walk(arrivalSteps, travel(steps.keys, t) / stepsL);
        }

        // ---- Camera ------------------------------------------------------------------------
        if (t < beatStarts[1]) world.lerpShot('arrivalHigh', 'start', seg(t, 0, at(0, 0.9)));
        else if (t < at(1, 0.3)) world.lerpShot('start', 'campClose', seg(t, at(1, 0), at(1, 0.3)));
        else if (t < beatStarts[2]) world.lerpShot('campClose', FRIENDLY, seg(t, at(1, 0.3), at(1, 0.5)));
        else world.lerpShot(FRIENDLY, 'camp', seg(t, at(2, 0), at(2, 0.85)));

        // ---- Fog of war ----------------------------------------------------------------------
        // The camp's patch breathes open as we arrive; then a second patch travels with the
        // explorer and settles where afterArrival leaves it.
        const camp = REVEALS.start[0];
        const reveals = [{ ...camp, r: camp.r * mix(0.8, 1, ease.out(seg(t, 0, at(0, 0.9)))) }];
        if (walk > 0) {
            const end = REVEALS.afterArrival[1];
            const [x, , z] = ex.pos;
            const k = ease.out(walk);
            reveals.push({ x: mix(x, end.x, k), z: mix(z, end.z, k), r: end.r * ease.out(Math.min(1, walk * 1.3)) });
        }
        world.fog.set(reveals);

        // ---- HUD ----------------------------------------------------------------------------
        if (t >= at(1, 0.8)) world.hud.quest(QUEST, null);
    },
};
