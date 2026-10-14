// Org film, chapter 4, What counts: the quiet fix weighs as much as the stage.
//
// 1. "What counts is what changed, not how visible it was."  The camera comes down beside the square:
//    the DevDay stage, bright and crowded, on one side; the bridge on the other, where a villager
//    catches a foot on a broken plank and stumbles. Toast "What changed, not how visible".
// 2. "A quiet fix that saves many people time every week can matter more than a big stage."  The
//    explorer kneels on the bridge and lays a new plank; villagers cross it smoothly, and then the
//    day speeds up: a time-lapse, the sun racing, people crossing again and again.
// 3. "And it lasts through the cycle: a contribution you keep up, and can point to."  The season
//    passes (the sun sweeps a day and a half): the bridge still in use, the tool shed still busy with
//    its keepers. Quest "A contribution you keep up". It ends at dawn with the explorer back at their
//    plot.
//
// The time-lapse is a warped time (timeLapse in _org.js): everyone's walks and work run on it, so
// they all quicken together with the sun, and their feet keep pace with the ground.
//
// Starts where How far it reaches ends.

import { buildVillage, AFTER, keepWorld, run, moves, SPOT, CROWD, SHOT, HOURS, STAGE_TOP, lurch, timeLapse, ease, seg, mix } from './_org.js';
import { beatClock, camera } from '../../../chapters/_shared.js';
import { patrol, pathLength } from '../../../chapters/_shared2.js';

const KNEEL = [5.75, -7.95];               // on the deck, just short of the broken plank
const BRIDGE_S = [5.0, -5.6], NORTH_END = [7.2, -18.4];
const CROSS_N = [BRIDGE_S, [5.5, -7.4], [5.9, -11.6], [6.3, -15.4], NORTH_END];
const CROSS_S = CROSS_N.slice().reverse();
// home from the bridge to the plot: past the stage, the workshop and the fingerpost
const HOME = [KNEEL, [5.4, -6.0], [4.4, -1.0], [1.2, 1.2], [-2.0, 1.6], [-3.1, 2.8], [-3.2, 5.9], [-6.4, 6.6], [-7.4, 8.6],
    [-9.4, 11.6], [-10.4, 13.4], [-11.0, 15.4], [-12.1, 16.4], [-13.4, 17.0], [-13.5, 18.6], [-13.4, 20.4], [-14.1, 21.5], [-16.0, 21.5], SPOT.plotWork];
const RATE = 5;                            // how much faster the time-lapse runs
const FIELD = { mate: [-18.4, 21.2], newcomer: [-18.8, 23.2] };

export default {
    id: 'counts',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.v = buildVillage(world, group, { hamlet: true });
        return group;
    },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;
        const set = group?.userData.v;

        // ---- Time: the day speeds up after the fix, and the season passes ------------------------------
        const T0 = at(1, 0.6), T1 = at(2, 0.9);
        const tl = timeLapse(T0, T1, RATE);
        const tau = tl(t), tauEnd = tl(at(2, 1)), tauT1 = tl(T1);
        const ck = clock + (tau - t);          // the clock for idle work, quickened too
        // work loops end with the time-lapse, so the next chapter's loops start from a plain idle
        const stopWork = tauT1 - 0.3;
        // the sun: from the afternoon on through a day and a half to the next dawn (dusk at 19.3 and the
        // light before sunrise at 6.1 look alike, so the day turns over between them)
        const start = HOURS.reach + 0.3;
        const off = (19.3 - start + 13.2 + (HOURS.counts - 6.1)) * ease.sine(seg(t, T0, T1));
        const hours = off <= 19.3 - start ? start + off : off <= 19.3 - start + 13.2 ? 6.1 + off - (19.3 - start) : 6.1 + off - (19.3 - start) - 13.2;
        world.setTimeOfDay(t < T0 ? HOURS.reach + 0.3 * seg(t, 0, T0) : hours);
        keepWorld(world, 1);
        world.fog.set(world.REVEALS.afterGrowth);

        // ---- The explorer: to the bridge, the fix, then home through the time-lapse ----------------------
        const fixFrom = at(1, 0.2), fixTo = at(1, 0.52);
        run(ex, tau, ck, {
            at: [4.4, -1.0], facing: 32,
            moves: [
                { t: 0.6, path: [[4.4, -1.0], [5.3, -4.6], [5.6, -6.6], KNEEL], face: 0 },
                { t: at(1, 0.58), path: HOME, face: 270 },
            ],
            gestures: [{ clip: 'Interact', from: fixFrom, to: fixTo + 0.15 }],
        });

        // ---- The stumble, and the crossings that follow ---------------------------------------------------
        // the fence mender crosses first, catches a foot on the broken plank, and goes on carefully
        const stop = [5.8, -8.72];
        const v7plan = {
            at: BRIDGE_S, facing: 10,
            moves: [
                { t: 0.6, ramp: 0.25, path: [BRIDGE_S, [5.5, -7.4], stop], face: 2 },
                { after: 0.95, path: [stop, [5.9, -11.6], [6.3, -15.4], NORTH_END], face: 200 },
            ],
        };
        // after the fix, back and forth through the time-lapse, ending on the far bank
        {
            const first = moves({ ...v7plan, moves: v7plan.moves.slice() })[1].end;   // (a copy: plans are compiled once)
            const span = tauEnd - 1.5 - Math.max(first, T0);
            const one = 13.6 / 1.4 + 0.7 + 1.2;
            let n = Math.max(0, Math.floor(span / one));
            if (n % 2) n -= 1;                 // an even number, so they finish on the far bank
            for (let i = 0; i < n; i++) v7plan.moves.push({ after: i ? 1.2 : Math.max(1.2, T0 - first), path: i % 2 ? CROSS_N : CROSS_S, face: i % 2 ? 200 : 20 });
        }
        run(V[7], tau, ck, v7plan);
        const v7stumble = moves(v7plan)[0].end;
        set?.tip.tip(V[7], lurch(seg(tau, v7stumble - 0.05, v7stumble + 0.85)));
        V[7].nod(seg(tau, v7stumble + 0.3, v7stumble + 0.9));

        // the two from the hamlet come down to the bridge and cross the new plank, back to the workshop
        const bench = set?.workshop.spots;
        const hd = set?.hamletShed;
        const homeFromHamlet = (door, spot) => [door, [5.4, -22.6], [7.4, -20.0], [6.6, -16.6], [6.0, -11.6], [5.6, -6.6], [4.6, -3.0], [1.2, 1.2], [-2.0, 1.6], [-3.1, 2.8], spot];
        run(V[4], tau, ck, {
            at: hd?.doorLeft ?? [1.41, -22.68], facing: 140,
            moves: [{ t: at(1, 0.4), path: homeFromHamlet(hd?.doorLeft ?? [1.41, -22.68], bench?.backRight ?? [-4.72, 2.61]), face: 165 }],
            loops: [{ from: -1, to: at(0, 0.6), clip: 'Interact', phase: 0.2 }],
        });
        run(V[9], tau, ck, {
            at: hd?.doorRight ?? [3.01, -23.96], facing: 290,
            moves: [{ t: at(1, 0.5), path: homeFromHamlet(hd?.doorRight ?? [3.01, -23.96], bench?.local(-0.3, -0.85) ?? [-6.0, 2.9]), face: 165 }],
            loops: [{ from: -1, to: at(0, 0.6), clip: 'Interact', phase: 0.7 }],
        });
        // one of the crowd goes over to the hamlet in the time-lapse
        run(V[0], tau, ck, {
            at: [CROWD[1][0], CROWD[1][1]], facing: CROWD[1][2],
            moves: [{ t: T0 + 2, path: [[CROWD[1][0], CROWD[1][1]], [2.6, 6.4], [2.0, 1.6], [4.0, -0.4], [5.2, -3.0], [5.6, -6.6], [6.0, -11.6], [6.5, -16.0], [8.2, -19.6]], face: 200 }],
        });
        // the rest of the crowd, the speaker, the shed's keepers, the teacher heading for the plot, the plot
        run(V[1], tau, ck, { at: [CROWD[3][0], CROWD[3][1]], facing: CROWD[3][2] });
        run(V[3], tau, ck, { at: set?.stage.speaker ?? [-0.3, 4.5], facing: 180, loops: [{ from: -1, to: stopWork, clip: 'Interact', phase: 0.1, rate: 0.8, weight: 0.8 }] });
        set?.tip.lift(V[3], STAGE_TOP);
        const shed = set?.shed;
        run(V[5], tau, ck, { at: shed?.doorLeft ?? [-10.29, 7.7], facing: 135, loops: [{ from: -1, to: stopWork, clip: 'Interact', phase: 0.9 }] });
        {
            // in and out of the shed with tools, again and again, and back at the door by the end
            const r6 = [shed?.doorRight ?? [-8.98, 6.11], [-8.0, 7.4], [-7.6, 9.2]];
            const cycle = 2 * (pathLength(r6) / 1.3) + 2 * 2.2;
            const laps = Math.floor((tauT1 - T0 - 1) / cycle);
            const p = tau - (T0 + 1);
            if (p > 0 && p < laps * cycle) patrol(V[6], r6, p, { speed: 1.3, pause: 2.2, act: 'Interact' });
            else run(V[6], tau, ck, { at: r6[0], facing: 300 });
        }
        run(V[8], tau, ck, {
            at: [CROWD[0][0], CROWD[0][1]], facing: CROWD[0][2],
            moves: [{ t: T0 + 4, path: [[CROWD[0][0], CROWD[0][1]], [-3.2, 6.4], [-6.4, 6.6], [-7.4, 8.6], [-9.4, 11.6], [-10.4, 13.4], [-11.0, 15.4], [-12.1, 16.4], [-13.4, 17.0], [-13.5, 18.6], [-13.3, 20.4], [-13.4, 22.0]], face: 280 }],
        });
        run(V[2], tau, ck, {
            at: SPOT.plotWork, facing: 270,
            moves: [{ t: at(1, 0.7), path: [SPOT.plotWork, [-17.7, 21.6], FIELD.mate], face: 270 }],
            loops: [{ from: -1, to: at(1, 0.66), clip: 'Interact', phase: 0.3 }, { from: tl(at(1, 0.66)) + 4, to: stopWork, clip: 'Interact', phase: 0.3 }],
        });
        run(V[10], tau, ck, { at: FIELD.newcomer, facing: 270, loops: [{ from: -1, to: stopWork, clip: 'Interact', phase: 0.4 }] });

        // ---- Props ---------------------------------------------------------------------------------------
        set?.apply({ ...AFTER.reach, fingerpost: { rise: 1, arms: [1, 1, 1], lit: [0.3, 0.3, 0.3] }, plank: ease.inOut(seg(t, fixFrom + 0.2, fixTo)) }, ck);

        // ---- Camera --------------------------------------------------------------------------------------
        camera(world, t, [
            [0, SHOT.wider],
            [at(0, 0.7), SHOT.bothSides],
            [at(0, 0.95), SHOT.bothSides],
            [at(1, 0.2), SHOT.plank],
            [at(1, 0.8), SHOT.plank],
            [at(2, 0.35), SHOT.season],
            [at(2, 0.6), SHOT.season],
            [at(2, 0.98), SHOT.dawnPlot],
        ]);

        // ---- HUD -----------------------------------------------------------------------------------------
        world.hud.toast('What changed, not how visible', seg(t, at(0, 0.05), at(0, 0.95)), { label: 'What counts' });
        // The previous chapter's quest gives way as this one opens, so the box names what's on screen.
        world.hud.quest(t < at(0, 0.15) ? 'How far it reaches' : t < at(2, 0.1) ? 'What counts' : 'A contribution you keep up', t < at(0, 0.15) ? '4/4' : null);
    },
};
