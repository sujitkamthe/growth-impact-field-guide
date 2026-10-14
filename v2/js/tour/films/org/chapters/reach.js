// Org film, chapter 3, How far it reaches: the reach of a contribution grows with your scope, drawn
// with the guide's lavender scope rings (layout.SCOPE_RINGS, built by _shared.js's buildRings).
//
// 1. "Like everything in the guide, the reach of your contribution grows with your scope."  The
//    camera rises from the notice board and the four rings draw on; the explorer sets off for the plot.
// 2. "At Direct..."  By the plot, inside the Direct ring: the explorer greets the newcomer and gives a
//    short session by a small fire to them and a teammate. Toast "Direct".
// 3. "At Extended..."  The explorer runs a gathering by the fingerpost (a community of practice) that
//    people walk in from the plots and the meadow to join, while DevDay carries on at the stage, its
//    crowd cheering the speaker and then talking it over. Toast "Extended".
// 4. "At Team..."  A tool shed goes up in the meadow; the explorer hands it over to two villagers,
//    who open its door, and walks away. The fog lifts to the Team ring and stays. Toast "Team".
// 5. "At Wider..."  The camera lifts across the river: in the hamlet the same shed goes up and two
//    villagers run it there. The Wider ring glows and the fog rolls back for a moment; then the rings
//    settle and the fog closes in again to the Team ring. Toast "Wider".
//
// Starts where Three ways ends. Ends with the explorer on the square's north side, heading for the bridge.

import { buildVillage, AFTER, keepWorld, run, SPOT, CLASS, CROWD, ring, SHOT, HOURS, STAGE_TOP, stumbleOnPlank, ease, seg, mix } from './_org.js';
import { beatClock, camera, buildRings } from '../../../chapters/_shared.js';

const ORDER = ['direct', 'extended', 'team', 'wider'];
const LABEL_AT = { direct: 20, extended: 325, team: 40, wider: 62 };
const D = { explorer: [-14.9, 16.6], newcomer: [-17.4, 16.3], mate: [-16.4, 18.0] };   // round the small fire
const SQUARE_N = [4.4, -1.0];              // where the chapter leaves the explorer, on the way to the bridge
const BRIDGE_S = [5.0, -5.6];              // where the fence mender waits to cross
// from the board, past the fingerpost and the slate house, to the fire by the plot
const BOARD_TO_FIRE = [[-5.9, 9.3], [-7.2, 10.3], [-9.4, 11.6], [-10.4, 13.4], [-11.0, 15.4], [-12.1, 16.4], [-13.4, 16.6], D.explorer];
const FIRE_TO_GATHER = [D.explorer, [-12.1, 16.4], [-11.0, 15.4], [-10.7, 13.2]];
// from the meadow shed, round the workshop and the stage, to the square's north side
const SHED_TO_SQUARE = [[-6.4, 6.2], [-3.2, 5.9], [-2.9, 2.4], [-1.8, 1.3], [1.2, 1.4], [3.4, 0.6], SQUARE_N];
// to the hamlet: behind the workshop, round the stage, over the bridge and up the road
const TO_HAMLET = [[-3.1, 2.8], [-2.0, 1.6], [1.2, 1.2], [4.0, -0.2], [5.2, -3.0], [5.6, -6.6], [6.0, -11.6], [6.4, -16.0], [7.4, -20.0], [5.4, -22.6]];

export default {
    id: 'reach',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.v = buildVillage(world, group, { fire: true, hamlet: true });
        group.userData.rings = buildRings(world, { labelAt: LABEL_AT });
        group.add(group.userData.rings.group);
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;
        const set = group?.userData.v;
        const shed = set?.shed, hamletShed = set?.hamletShed;

        world.setTimeOfDay(mix(HOURS.ways, HOURS.reach, seg(t, 0, duration)));
        keepWorld(world, 1);

        // ---- The explorer ----------------------------------------------------------------------------
        const shedFront = shed?.front ?? [-8.92, 7.49];
        run(ex, t, clock, {
            at: [-5.9, 9.3], facing: 90,
            moves: [
                { t: 0.5, path: BOARD_TO_FIRE, face: 268 },
                { t: at(2, 0.06), path: [...FIRE_TO_GATHER, ring(235)], face: ring(235)[2] },
                { t: at(3, 0.03), path: [ring(235), [-11.2, 9.2], [-10.2, 8.2], shedFront], face: 308 },
                { t: at(3, 0.6), by: at(4, 0.86), maxPace: 1.6, path: [shedFront, ...SHED_TO_SQUARE], face: 32 },
            ],
            gestures: [
                { clip: 'Wave', from: at(1, 0.5), to: at(1, 0.64), weight: 0.85 },
                { clip: 'Interact', from: at(1, 0.64), to: at(1, 0.96) },
                { clip: 'Interact', from: at(2, 0.82), to: at(3, 0.02), weight: 0.8 },
                { clip: 'Interact', from: at(3, 0.4), to: at(3, 0.58) },
            ],
        });

        // ---- Direct: the newcomer and a teammate by the fire, then over to the gathering, then home ------
        const plotIn = [[-10.7, 13.2], [-11.0, 15.4], [-12.1, 16.4], [-13.4, 17.0], [-13.5, 18.6], [-13.4, 20.4], [-14.1, 21.5], [-16.0, 21.5]];
        run(V[10], t, clock, {
            at: D.newcomer, facing: 115,
            moves: [
                { t: at(2, 0.0), path: [D.newcomer, [-16.6, 15.5], [-14.2, 15.9], ...FIRE_TO_GATHER.slice(1), ring(190)], face: ring(190)[2] },
                { t: at(3, 0.12), path: [ring(190), ...plotIn, [-17.6, 22.0], [-18.8, 23.2]], face: 270 },
            ],
            gestures: [{ clip: 'Wave', from: at(1, 0.54), to: at(1, 0.68), weight: 0.8 }],
            nods: [[at(1, 0.8), at(1, 0.92)]],
            loops: [{ from: at(4, 0.6), clip: 'Interact', phase: 0.4 }],
        });
        run(V[2], t, clock, {
            at: SPOT.plotWork, facing: 270,
            moves: [
                { t: 0.6, path: [SPOT.plotWork, [-16.0, 21.5], [-14.1, 21.5], [-13.5, 20.0], [-14.3, 18.6], [-15.6, 18.2], D.mate], face: 352 },
                { t: at(2, 0.02), path: [D.mate, [-15.2, 18.1], [-13.6, 17.2], ...FIRE_TO_GATHER.slice(1), ring(290)], face: ring(290)[2] },
                { t: at(3, 0.2), path: [ring(290), [-10.9, 12.0], ...plotIn.slice(1), SPOT.plotWork], face: 270 },
            ],
            loops: [{ from: -1, to: 0.5, clip: 'Interact', phase: 0.3 }, { from: at(4, 0.7), clip: 'Interact', phase: 0.3 }],
            nods: [[at(1, 0.84), at(1, 0.96)]],
        });

        // ---- The class becomes the gathering, and two of them the shed's keepers ------------------------
        const [tx, tz, tf] = CLASS.teacher, [ax, az, af] = CLASS.a, [bx, bz, bf] = CLASS.b;
        const doorL = shed?.doorLeft ?? [-10.29, 7.7], doorR = shed?.doorRight ?? [-8.98, 6.11];
        run(V[8], t, clock, {
            at: [tx, tz], facing: tf,
            moves: [
                { t: at(2, 0.12), path: [[tx, tz], [-9.4, 8.2], ring(30)], face: ring(30)[2] },
                // the gathering over, across to DevDay
                { t: at(3, 0.3), path: [ring(30), [-8.2, 8.4], [-6.4, 6.6], [-3.2, 6.4], [-2.2, 6.8], [CROWD[0][0], CROWD[0][1]]], face: CROWD[0][2] },
            ],
            loops: [{ from: -1, to: at(2, 0.08), clip: 'Interact', phase: 0.5, rate: 0.7, weight: 0.7 }],
            nods: [[at(2, 0.86), at(2, 0.96)]],
        });
        run(V[5], t, clock, {
            at: [ax, az], facing: af,
            moves: [
                { t: at(2, 0.1), path: [[ax, az], [-8.6, 7.4], [-8.0, 9.0], ring(90)], face: ring(90)[2] },
                { t: at(3, 0.02), path: [ring(90), [-9.2, 9.0], doorL], face: 135 },
            ],
            nods: [[at(3, 0.56), at(3, 0.7)]],
            loops: [{ from: at(3, 0.9), clip: 'Interact', phase: 0.9 }],
        });
        run(V[6], t, clock, {
            at: [bx, bz], facing: bf,
            moves: [
                { t: at(2, 0.16), path: [[bx, bz], [-10.6, 7.6], ring(345)], face: ring(345)[2] },
                { t: at(3, 0.0), path: [ring(345), [-9.5, 7.6], doorR], face: 300 },
            ],
            gestures: [{ clip: 'Interact', from: at(3, 0.62), to: at(3, 0.86) }],
        });

        // ---- DevDay carries on: the crowd cheers the speaker, then talks it over ------------------------
        const crowd = [[4, 0], [0, 1], [1, 3], [7, 4]];
        for (const [who, i] of crowd) {
            const [cx, cz, cf] = CROWD[i];
            const plan = { at: [cx, cz], facing: cf, gestures: [{ clip: 'Wave', from: at(2, 0.2 + i * 0.04), to: at(2, 0.42 + i * 0.04), weight: 0.75 }] };
            if (who === 1) plan.looks = [{ from: at(2, 0.6), to: at(3, 0.4), at: [CROWD[0][0], CROWD[0][1]], k: 0.8 }];
            if (who === 0) plan.loops = [{ from: at(2, 0.62), to: at(3, 0.3), clip: 'Interact', phase: 0.4, weight: 0.5 }];
            if (who === 4) {
                // off over the bridge to the hamlet, with the workshop's other hand
                plan.moves = [{ t: 1.0, path: [[cx, cz], [-2.4, 6.6], [-3.2, 5.6], [-3.1, 3.0], ...TO_HAMLET, hamletShed?.doorLeft ?? [2.0, -23.6]], face: 140 }];
                plan.gestures = [];
                plan.loops = [{ from: at(4, 0.45), clip: 'Interact', phase: 0.2 }];
            }
            if (who === 7) {
                // off to the bridge, round the east side of the fountain
                plan.moves = [{ t: at(2, 0.9), path: [[cx, cz], [4.0, 9.4], [7.0, 8.4], [8.0, 6.4], [8.0, 2.0], [6.6, 0.0], [5.4, -2.6], BRIDGE_S], face: 10 }];
            }
            run(V[who], t, clock, plan);
        }
        run(V[9], t, clock, {
            at: set?.workshop.spots.backLeft ?? [-6.96, 3.16], facing: 165,
            moves: [{ t: 0.7, path: [set?.workshop.spots.backLeft ?? [-6.96, 3.16], set?.workshop.spots.local(0.2, -1.0) ?? [-5.6, 2.6], set?.workshop.spots.local(1.5, -1.0) ?? [-4.5, 2.2], ...TO_HAMLET, hamletShed?.doorRight ?? [1.8, -26.6]], face: 290 }],
            loops: [{ from: -1, to: 0.3, clip: 'Interact', phase: 0.6 }, { from: at(4, 0.3), clip: 'Interact', phase: 0.7 }],
        });
        run(V[3], t, clock, {
            at: set?.stage.speaker ?? [-0.3, 4.5], facing: 180,
            loops: [{ from: -1, clip: 'Interact', phase: 0.1, rate: 0.8, weight: 0.8 }],
            gestures: [{ clip: 'Wave', from: at(2, 0.3), to: at(2, 0.5), weight: 0.8 }],
        });
        set?.tip.lift(V[3], STAGE_TOP);
        set && stumbleOnPlank(set.tip, [V[4], V[9]], 0);

        // ---- Props ---------------------------------------------------------------------------------------
        set?.apply({
            ...AFTER.ways,
            fingerpost: { rise: 1, arms: [1, 1, 1], lit: [0.3, 0.3, mix(1, 0.3, seg(t, 0, at(0, 0.5)))] },
            fire: ease.out(seg(t, at(1, 0.05), at(1, 0.25))) * (1 - ease.inOut(seg(t, at(2, 0.3), at(2, 0.8)))),
            fireLaid: seg(t, at(0, 0.5), at(1, 0.05)) * (1 - seg(t, at(3, 0.3), at(3, 0.6))),
            shed: { build: seg(t, at(3, 0.0), at(3, 0.45)), sign: seg(t, at(3, 0.38), at(3, 0.5)), door: seg(t, at(3, 0.66), at(3, 0.84)) },
            hamletShed: { build: seg(t, at(4, 0.1), at(4, 0.42)), sign: seg(t, at(4, 0.36), at(4, 0.46)), door: seg(t, at(4, 0.46), at(4, 0.6)) },
        }, clock);

        // ---- Reach: the rings draw on together, then each takes its turn ---------------------------------
        const rings = group?.userData.rings;
        const settle = 1 - ease.inOut(seg(t, at(4, 0.8), at(4, 0.98)));
        ORDER.forEach((key, i) => {
            const draw = ease.sine(seg(t, at(0, 0.05 + i * 0.12), at(0, 0.5 + i * 0.12)));
            const b = i + 1;
            const current = seg(t, at(b, 0.0), at(b, 0.2)) * (b < 4 ? 1 - seg(t, at(b + 1, 0.0), at(b + 1, 0.2)) : 1);
            const solid = i < 2 ? 1 : seg(t, at(b, 0.05), at(b, 0.4));
            rings?.set(key, { draw, alpha: settle, fill: current, pulse: ease.bump(seg(t, at(b, 0.05), at(b, 0.45))), dashed: 1 - solid });
        });

        // the fog: Team lifts with its beat and stays; Wider opens for a moment and closes again
        const SR = world.layout.SCOPE_RINGS;
        const reveals = world.REVEALS.afterScopes.slice();
        const team = ease.inOut(seg(t, at(3, 0.05), at(3, 0.6)));
        const wider = ease.inOut(seg(t, at(4, 0.0), at(4, 0.35))) * (1 - ease.inOut(seg(t, at(4, 0.72), at(4, 0.98))));
        if (team > 0.004) reveals.push(world.fog.grow({ x: SR.team.c[0], z: SR.team.c[1], r: SR.team.r + 3 }, team));
        if (wider > 0.004) reveals.push(world.fog.grow({ x: SR.wider.c[0], z: SR.wider.c[1], r: SR.wider.r + 3 }, wider));
        world.fog.set(reveals);

        // ---- Camera --------------------------------------------------------------------------------------
        camera(world, t, [
            [0, SHOT.note],
            [at(0, 0.85), SHOT.rings],
            [at(1, 0.04), SHOT.rings],
            [at(1, 0.42), SHOT.direct],
            [at(1, 0.96), SHOT.direct],
            [at(2, 0.45), SHOT.extended],
            [at(2, 0.96), SHOT.extended],
            [at(3, 0.3), SHOT.team],
            [at(3, 0.86), SHOT.team],
            [at(4, 0.36), SHOT.hamlet],
            [at(4, 0.52), SHOT.hamlet],
            [at(4, 0.9), SHOT.wider],
        ]);

        // ---- HUD -----------------------------------------------------------------------------------------
        const n = [1, 2, 3, 4].filter(b => t >= at(b, 0.1)).length;
        world.hud.quest(t < at(0, 0.15) ? 'Choose one or more' : 'How far it reaches', t < at(0, 0.15) ? '3/3' : `${n}/4`);
        ORDER.forEach((key, i) => {
            const k = seg(t, at(i + 1, 0.02), at(i + 1, 0.55));
            if (k > 0 && k < 1) world.hud.toast(SR[key].name, k, { label: 'Reach' });
        });
    },
};
