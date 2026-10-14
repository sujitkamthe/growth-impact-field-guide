// Chapter 2, Principles: the explorer sets out and finds the five principles as places in the fog.
//
// Each principle beat opens on its name: a painted sign rises at the place, the toast reads
// "Principle n of 5 · name" and the quest box counts it. Finding is not reach, so the fog never lifts
// on the way: each place lights up as it is found (a warm pool and a lantern) and lets go after.
//
// 1. "Five principles shape how growth works..."  The quest box takes the new quest;
//    the explorer sets off and the camera lingers on the camp they leave behind.
// 2. "Principle one: Growth is self-directed..."  The crossroads emerge; the explorer stops at the signpost, looks
//    down the village road, then up the hill road, and takes it.
// 3. "Principle two: Clarity without hierarchy..."  The stone ring on its hill, every stone the same height. The explorer
//    walks into the middle and the camera rises to show how far you see from the top.
// 4. "Principle three: Transparency and trust..."  The notice board at the village's edge,
//    two villagers reading it.
// 5. "Principle four: Feedback is a habit..."  Two villagers coming up from the lake turn and wave; the
//    explorer waves back.
// 6. "Principle five: Honest reflection..."  The still lake: the camera comes down low over the water and the
//    explorer stands at the shore, reflected. Ends on layout.states.afterPrinciples.
//
// The camera leads: it moves on to the next place while the explorer is still on the way, and the
// explorer walks into frame at a real pace. Any stretch they cover faster happens out of frame.

import { beatClock, line, catchUp, stroll, follow, camera, lookAround, turnTo, wave, work, PACE, CAST, buildSigns, PRINCIPLE_SIGNS } from './_shared.js';
import { village } from './_cast.js';

const QUEST = 'Discover the five principles';

// ---- The explorer's route, leg by leg (around the ring's stones and the house by the junction) ----
const toCrossroads = [[-39.8, 35.3], [-36.4, 32.4], [-32, 28.6], [-29.1, 26.1]];
const toRing = [[-29.1, 26.1], [-28.7, 24.0], [-29.4, 19.2], [-31.3, 13.8], [-32.0, 12.0], [-32.6, 9.4], [-33, 7.3]];
const toMeeting = [[-33, 7.3], [-30.6, 6.5], [-28.3, 6.2], [-25.5, 8.0], [-21, 9.4], [-17.2, 9.4], [-15.6, 8.4], [-14.0, 5.8], [-13.2, 4.2]];
const toShore = [[-13.2, 4.2], [-13.0, 2.6], [-13.5, 0.6], [-14.6, -1.7]];

// Two villagers walking up from the lake to the village, who stop to wave.
const walkers = [
    { who: 6, in: [[-19.8, 0.5], [-16.6, 0.3], [-13.5, 0.5], [-11.0, 1.5]], on: [[-11.0, 1.5], [-9.4, 3.4], [-8.0, 5.4], [-7.3, 6.8]], clip: 0.3 },
    { who: 3, in: [[-20.6, 1.5], [-17.2, 1.4], [-14.2, 1.6], [-11.7, 2.6]], on: [[-11.7, 2.6], [-10.3, 4.4], [-9.0, 6.3], [-8.2, 7.6]], clip: 1.1 },
];
// Two villagers reading the notice board (it faces west; they stand in front of it).
const readers = CAST.readers;

// ---- Shots ------------------------------------------------------------------------------------------
const FAREWELL = { target: [-43.6, 1.0, 40.2], distance: 15, yaw: 72, pitch: 27, fov: 30 };   // the camp, left behind
const FAREWELL_UP = { target: [-44.0, 1.0, 39.8], distance: 27, yaw: 74, pitch: 44, fov: 28 };   // craning up over the camp
const CROSS = { target: [-29.2, 0.9, 24.0], distance: 24, yaw: 356, pitch: 56, fov: 28 };
const RING_LOW = { target: [-32.9, 4.4, 8.2], distance: 16.5, yaw: 12, pitch: 19, fov: 30 };
const BOARD = { target: [-4.9, 1.5, 9.1], distance: 14, yaw: 231, pitch: 24, fov: 30 };
const MEET = { target: [-12.3, 1.0, 3.2], distance: 12.5, yaw: 226, pitch: 25, fov: 30 };

export default {
    id: 'principles',

    build(world) {
        const group = new world.THREE.Group();
        const signs = buildSigns(world);
        group.add(signs.group);
        group.userData.signs = signs;
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const { seg, ease, mix } = world.util;
        const { REVEALS, states } = world;
        const at = beatClock(time);
        const ex = world.explorer;
        const V = world.villagers;

        world.setTimeOfDay(mix(states.afterArrival.hours, states.afterPrinciples.hours, seg(t, 0, duration)));

        // ---- The explorer ----------------------------------------------------------------------
        const legA = { points: toCrossroads, keys: catchUp(0.3, at(1, 0.24), line(toCrossroads).total, { head: 3.4, tail: 2.0 }) };
        const legB = { points: toRing, keys: catchUp(at(1, 0.47), at(2, 0.84), line(toRing).total, { head: 2.1, tail: 6.0 }) };
        const legC = { points: toMeeting, keys: catchUp(at(3, 0.0), at(4, 0.22), line(toMeeting).total, { head: 2.6, tail: 2.2 }) };
        const legD = { points: toShore, keys: stroll(at(4, 0.76), line(toShore).total).keys };
        const state = follow(ex, [legA, legB, legC, legD], t);

        // Setting off: turn from where Arrival left them onto the road.
        if (t < 1.2) {
            const onto = ex.facing;
            ex.face(states.afterArrival.explorer.facing);
            turnTo(ex, onto, ease.inOut(seg(t, 0.05, 1.1)));
        }
        // At the crossroads: a look down the village road, then up the hill road, which they take.
        if (state.i === 0 && t >= legA.keys.at(-1)[0]) {
            ex.lookAt([-21.5, 22.6], ease.inOut(seg(t, at(1, 0.25), at(1, 0.34))));
            ex.lookAt([-28.7, 21.5], ease.inOut(seg(t, at(1, 0.37), at(1, 0.46))));
        }
        // In the ring: a look around from the top of the hill, then a turn towards the village.
        if (state.i === 1 && t >= legB.keys.at(-1)[0]) {
            const look = seg(t, at(2, 0.87), at(3, 0.0) - 0.9);
            ex.face(lookAround(ex.facing, look, 55));
            ex.lookAt([-30.6, 6.5], ease.inOut(seg(t, at(3, 0.0) - 0.9, at(3, 0.0))));
        }
        // On the path by the lake: turn to the walkers, wave back.
        if (state.i === 2 && t >= legC.keys.at(-1)[0]) {
            ex.lookAt(walkers[1].in.at(-1), ease.inOut(seg(t, at(4, 0.24), at(4, 0.4))));
            wave(ex, seg(t, at(4, 0.4), at(4, 0.74)), (t - at(4, 0.4)) * 1.0 + 0.2);
        }
        // At the shore: settle facing the water.
        if (state.i === 3 && t >= legD.keys.at(-1)[0]) {
            turnTo(ex, states.afterPrinciples.explorer.facing, ease.inOut(seg(t, legD.keys.at(-1)[0], legD.keys.at(-1)[0] + 0.9)));
        }

        // ---- Villagers ----------------------------------------------------------------------------
        // the village goes about its day (mostly still under the fog); the lake pair is choreographed here
        village(world, world.clock, walkers.map(w => w.who));
        work(V[readers[0].who], seg(t, at(3, 0.42), at(3, 0.8)), t - at(3, 0.42));
        V[readers[1].who].nod(seg(t, at(3, 0.72), at(3, 0.9)));

        walkers.forEach(({ who, in: pin, on, clip }, i) => {
            const v = V[who];
            const Lin = line(pin).total, Lon = line(on).total;
            const arrive = at(4, 0.26 + i * 0.03);
            const dur = 0.7 + Lin / PACE;
            const legs = [
                { points: pin, keys: stroll(arrive - dur, Lin).keys },
                { points: on, keys: stroll(at(4, 0.74 + i * 0.03), Lon).keys },
            ];
            const s = follow(v, legs, t);
            if (s.i === 0 && t >= arrive) {
                v.lookAt(ex.pos ? [ex.pos[0], ex.pos[2]] : [-13.2, 4.2], ease.inOut(seg(t, arrive, arrive + 0.6)));
                wave(v, seg(t, at(4, 0.3 + i * 0.05), at(4, 0.68 + i * 0.02)), t - at(4, 0.3) + clip);
            }
        });

        // ---- Camera --------------------------------------------------------------------------------
        camera(world, t, [
            [0, 'camp'],
            [at(0, 0.04), 'camp'],
            [at(0, 0.5), FAREWELL],
            [at(0, 0.7), FAREWELL],
            [at(0, 0.97), FAREWELL_UP],
            [at(1, 0.26), CROSS],
            [at(1, 0.48), CROSS],
            [at(1, 0.98), RING_LOW],
            [at(2, 0.5), RING_LOW],
            [at(2, 0.96), 'stoneRingHigh'],
            [at(3, 0.04), 'stoneRingHigh'],
            [at(3, 0.55), BOARD],
            [at(3, 0.9), BOARD],
            [at(4, 0.4), MEET],
            [at(4, 0.8), MEET],
            [at(5, 0.62), 'lake'],
        ]);

        // ---- Light, not reach: the fog never lifts along the way. Each principle's place lights up as
        // it is found (a warm pool round it and its sign's lantern) and lets go during the next beat; the
        // lake's pool is still lit as the chapter ends (layout.states.afterPrinciples).
        const pools = [
            null,
            { x: -29.8, z: 24.4, r: 8 },          // the crossroads
            { x: -33, z: 7.4, r: 10 },            // the stone ring
            { x: -4.9, z: 7.6, r: 7.5 },          // the notice board
            { x: -12.4, z: 4.2, r: 6.5 },         // the path by the lake
            states.afterPrinciples.reveals.at(-1), // the lake shore
        ];
        const lit = [0, 1, 2, 3, 4, 5].map(i => (i === 0 ? 0
            : ease.inOut(seg(t, at(i, 0.0), at(i, 0.3))) * (i < 5 ? 1 - ease.inOut(seg(t, at(i + 1, 0.15), at(i + 1, 0.6))) : 1)));
        const reveals = REVEALS.afterArrival.slice();
        for (let i = 1; i <= 5; i++) if (lit[i] > 0.004) reveals.push(world.fog.grow(pools[i], lit[i]));
        world.fog.set(reveals);

        // ---- HUD and discoveries ------------------------------------------------------------------
        // Each principle: its sign rises at the landmark, the toast names it, the quest box counts it.
        const landmark = [null, 'crossroads', 'stoneRing', 'noticeBoard', null, 'lake'];
        const rise = [null, [0.06, 0.4], [0.02, 0.36], [0.28, 0.6], [0.14, 0.46], [0.24, 0.58]];
        const signs = group?.userData.signs;
        for (let i = 1; i <= 5; i++) {
            const k = seg(t, at(i, 0.02), at(i, 0.5));
            if (landmark[i]) world.discover(landmark[i], k);
            if (k > 0 && k < 1) world.hud.toast(`Principle ${i} of 5 · ${PRINCIPLE_SIGNS[i - 1].name}`, k, { label: 'Discovered' });
            signs?.set(i - 1, seg(t, at(i, rise[i][0]), at(i, rise[i][1])), 0.3 + 0.7 * lit[i]);
        }
        if (t < at(0, 0.12)) world.hud.quest('Explore the field', null);
        else {
            const found = [1, 2, 3, 4, 5].filter(i => t >= at(i, 0.1)).length;
            world.hud.quest(QUEST, `${found}/5`);
        }
    },
};
