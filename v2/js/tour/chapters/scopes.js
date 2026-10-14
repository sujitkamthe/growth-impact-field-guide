// Chapter 3, How far you reach: scope as how much of the field you can see.
//
// Reach is drawn the way a strategy game shows a selected unit's radius: four nested rings
// (layout.SCOPE_RINGS), Direct round the explorer's own plot, each next one taking in more and reaching
// further towards the village and beyond, each sweeping on as its scope is named ("Scope · Direct"
// and so on in the toast, "How far you reach 1/4 ... 4/4" in the quest box), labelled with its name
// and lifting the fog out to it. The fog lifts for reach only: the explorer's own reach is Extended,
// so that is what stays lifted (layout.REVEALS.afterScopes); Team and Wider open for a moment.
//
// 1. "How far your impact reaches is your scope..."  The explorer turns from the lake and heads for
//    their plot while the camera rises to look west over everything uncovered so far.
// 2. "The first scope is Direct..."  At the plot: the explorer works their own crops; the Direct ring
//    draws round the plot.
// 3. "The second is Extended..."  Out of the gate to help the neighbour bring in the wheat across the
//    fence; the camera widens as the Extended ring takes in the neighbours' plots.
// 4. "The third is Team..."  Up over the whole village as the Team ring sweeps round it.
// 5. "The fourth is Wider..."  Higher still: the Wider ring crosses the river to the hamlet and the
//    windmill, the fog rolling back as it goes.
// 6. "Each scope includes the ones inside it..."  The rings pulse once, inner to outer, during one
//    smooth pull back; then the far fog drifts back and the rings fade, ending on
//    layout.states.afterScopes with the explorer working in the neighbour's field.

import { beatClock, line, catchUp, stroll, follow, camera, turnTo, bearing, CAST, keepDiscovered, DISCOVERED, clamp01, buildSigns, buildRings } from './_shared.js';
import { village } from './_cast.js';

const QUEST = 'How far you reach';

// ---- Reach: the four scope rings (layout.SCOPE_RINGS), drawn by buildRings in _shared.js ---------
const ORDER = ['direct', 'extended', 'team', 'wider'];
const LABEL_AT = { direct: 20, extended: 325, team: 40, wider: 62 };

// ---- The explorer's route ---------------------------------------------------------------------
// Lake shore to the plot, round the house and in by the plot's east gate.
const toPlot = [[-14.6, -1.7], [-13.3, 0.4], [-13.4, 3.2], [-15.6, 8.4], [-16.4, 11.5], [-16.4, 15.5], [-14.6, 17.0],
    [-13.5, 18.6], [-13.4, 20.6], [-14.1, 21.5], [-16.3, 21.4]];
// Out of the gate and down the track to the corner of the neighbour's wheat.
const toNeighbour = [[-16.3, 21.4], [-14.1, 21.5], [-13.5, 22.6], [-13.5, 25.6], [-14.0, 27.2]];
// Round to the wheat field's gate on its south side and in to work beside the neighbour.
const intoField = [[-14.0, 27.2], [-13.9, 28.8], [-14.0, 33.4], [-15.0, 34.4], [-18.0, 34.3], [-18.0, 33.2], [-18.3, 31.6], [-18.5, 30.2]];
const neighbourIn = [[-15.4, 28.7], [-16.2, 30.0], [-16.9, 31.0]];

// ---- Shots ------------------------------------------------------------------------------------
const WEST_HIGH = { target: [-44, 0, 16], distance: 92, yaw: 88, pitch: 55, fov: 28 };   // over all that's been seen
const PLOT_VIEW = { target: [-17.2, 0.6, 22.2], distance: 18.5, yaw: 40, pitch: 45, fov: 28 };
const NEIGH_WIDE = { target: [-9.5, 0.6, 19.5], distance: 64, yaw: 14, pitch: 58, fov: 28 };
const TEAM_HIGH = { target: [1, 0, 10], distance: 150, yaw: 12, pitch: 60, fov: 28 };
const WIDER_VIEW = { target: [0, 0, 4], distance: 215, yaw: 10, pitch: 62, fov: 28 };

export default {
    id: 'scopes',

    build(world) {
        const group = new world.THREE.Group();
        const rings = buildRings(world, { labelAt: LABEL_AT }), signs = buildSigns(world);
        group.add(rings.group, signs.group);
        Object.assign(group.userData, { rings, signs });
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const { seg, ease, mix } = world.util;
        const { REVEALS, states } = world;
        const at = beatClock(time);
        const ex = world.explorer;
        const V = world.villagers;
        const clock = world.clock;

        world.setTimeOfDay(mix(states.afterPrinciples.hours, states.afterScopes.hours, seg(t, 0, duration)));

        // ---- The explorer ----------------------------------------------------------------------
        const legA = { points: toPlot, keys: catchUp(1.3, at(1, 0.18), line(toPlot).total, { head: 2.2, tail: 2.4 }) };
        const legB = { points: toNeighbour, keys: stroll(at(1, 0.63), line(toNeighbour).total).keys };
        const legC = { points: intoField, keys: stroll(at(3, 0.08), line(intoField).total).keys };
        const s = follow(ex, [legA, legB, legC], t);
        const nA = CAST.neighbour;

        if (s.i === 0 && t < legA.keys[0][0]) {
            // a last look at the water, then a turn towards the plot
            ex.face(states.afterPrinciples.explorer.facing);
            turnTo(ex, bearing(toPlot[0], toPlot[1]), ease.inOut(seg(t, 0.35, 1.3)));
        }
        if (s.i === 0 && t >= legA.keys.at(-1)[0]) {
            // working their own plot: face the crops, hands busy, then turn for the gate
            const arrived = legA.keys.at(-1)[0];
            turnTo(ex, 270, ease.inOut(seg(t, arrived, arrived + 0.5)));
            turnTo(ex, 95, ease.inOut(seg(t, at(1, 0.55), at(1, 0.63))));
            const w = Math.min(0.995, ease.sine(seg(t, arrived + 0.3, arrived + 0.7)) * ease.sine(seg(t, at(1, 0.57), at(1, 0.52))));
            if (w > 0) ex.play('Interact', (t - arrived) * 0.9, { weight: w });
        }
        if (s.i === 1 && t >= legB.keys.at(-1)[0]) {
            // across the fence from the neighbour, helping bring in the wheat
            const arrived = legB.keys.at(-1)[0];
            ex.lookAt(nA.at, ease.inOut(seg(t, arrived, arrived + 0.6)));
            const w = Math.min(0.995, ease.sine(seg(t, arrived + 0.4, arrived + 0.9)) * ease.sine(seg(t, at(3, 0.1), at(3, 0.02))));
            if (w > 0) ex.play('Interact', (t - arrived) * 0.9 + 0.5, { weight: w });
        }
        if (s.i === 2 && t >= legC.keys.at(-1)[0]) {
            // in the wheat beside the neighbour
            const arrived = legC.keys.at(-1)[0];
            turnTo(ex, states.afterScopes.explorer.facing, ease.inOut(seg(t, arrived, arrived + 0.7)));
            const w = Math.min(0.995, ease.sine(seg(t, arrived + 0.4, arrived + 1.0)));
            if (w > 0) ex.play('Interact', clock * 0.9, { weight: w });
        }

        // ---- Villagers ----------------------------------------------------------------------------
        // the pair from the lake walk on, one to chat in the square, one to the green stall, and settle
        // into the village's own day (village() takes them over once they have)
        const busy = [nA.who];
        CAST.pair.forEach(({ who, path, facing, arrived, act, phase }, i) => {
            const v = V[who];
            const walk = stroll(0.9 + i * 0.5, line(path).total);
            const settled = walk.end + 1.0;
            if (t >= settled) return;
            busy.push(who);
            follow(v, [{ points: path, keys: walk.keys }], t);
            if (t < walk.keys[0][0]) {
                // from the way they faced at the end of Principles, onto the road
                const onto = v.facing;
                v.face(arrived);
                turnTo(v, onto, ease.inOut(seg(t, 0.1, walk.keys[0][0])));
            } else if (t > walk.end) {
                turnTo(v, facing, ease.inOut(seg(t, walk.end, settled - 0.15)));
                if (act) v.play(act, clock + phase, { weight: Math.min(0.995, ease.sine(seg(t, walk.end, settled))) });
                else {
                    // the same now-and-then hand gesture chatting() gives them
                    const u = (clock + who * 2.3) % 7;
                    if (u < 1.6) v.play('Interact', u, { weight: 0.35 * Math.sin((Math.PI * u) / 1.6) });
                }
            }
        });
        village(world, clock, busy);
        // the neighbour in the wheat: working by the corner, then further in once the explorer joins
        {
            const v = V[nA.who];
            const move = stroll(at(3, 0.4), line(neighbourIn).total);
            follow(v, [{ points: neighbourIn, keys: move.keys }], t);
            if (t < move.keys[0][0]) v.face(nA.facing).play('Interact', clock * 0.9 + 1.1);
            else if (t > move.end) {
                turnTo(v, nA.endFacing, ease.inOut(seg(t, move.end, move.end + 0.6)));
                const w = Math.min(0.995, ease.sine(seg(t, move.end + 0.3, move.end + 0.9)));
                if (w > 0) v.play('Interact', clock * 0.9 + 1.1, { weight: w });
            }
        }

        // ---- Camera --------------------------------------------------------------------------------
        camera(world, t, [
            [0, 'lake'],
            [at(0, 0.06), 'lake'],
            [at(0, 0.66), WEST_HIGH],
            [at(0, 0.84), WEST_HIGH],
            [at(1, 0.2), PLOT_VIEW],
            [at(1, 0.62), PLOT_VIEW],
            [at(2, 0.5), NEIGH_WIDE],
            [at(2, 0.92), NEIGH_WIDE],
            [at(3, 0.62), TEAM_HIGH],
            [at(4, 0.04), TEAM_HIGH],
            [at(4, 0.58), WIDER_VIEW],
            [at(5, 0.06), WIDER_VIEW],
            [at(5, 0.92), 'village'],
        ]);

        // ---- Reach: each scope's ring sweeps on as it is named, and lifts the fog out to it ------------
        const draw = [1, 2, 3, 4].map(i => ease.sine(seg(t, at(i, 0.04), at(i, 0.62))));
        const pulse = [0, 1, 2, 3].map(i => ease.bump(seg(t, at(5, 0.06 + i * 0.12), at(5, 0.3 + i * 0.12))));
        const fadeOut = ease.inOut(seg(t, at(5, 0.5), at(5, 0.86)));        // Team and Wider: not yet theirs
        const fadeRings = ease.inOut(seg(t, at(5, 0.7), at(5, 0.97)));     // the rings themselves
        const rings = group?.userData.rings;
        ORDER.forEach((key, i) => {
            const current = i < 3 ? 1 - seg(t, at(i + 2, 0.0), at(i + 2, 0.35)) : 1 - seg(t, at(5, 0.0), at(5, 0.3));
            const gone = i >= 2 ? Math.max(fadeOut, fadeRings) : fadeRings;
            rings?.set(key, { draw: draw[i], alpha: 1 - gone, fill: draw[i] * current, pulse: pulse[i] });
        });
        group?.userData.signs.all(1);

        // The fog lifts for reach only: the lit pool Principles left at the lake lets go as the explorer
        // walks away; Direct and Extended (the explorer's own reach) lift it for good; Team and Wider
        // open for a moment and close again in the last beat, ending on afterScopes.
        const D = world.layout.SCOPE_RINGS;
        const lifted = c => ({ x: c.c[0], z: c.c[1], r: c.r + 3 });
        const reveals = REVEALS.afterArrival.slice();
        const pool = states.afterPrinciples.reveals.at(-1);
        const letGo = 1 - ease.inOut(seg(t, at(0, 0.1), at(0, 0.6)));
        if (letGo > 0.004) reveals.push({ ...pool, r: pool.r * letGo });
        ORDER.forEach((key, i) => {
            const k = draw[i] * (i >= 2 ? 1 - fadeOut : 1);
            if (k > 0.004) reveals.push(world.fog.grow(lifted(D[key]), k));
        });
        world.fog.set(reveals);

        // ---- HUD: each scope named as its ring draws ----------------------------------------------
        keepDiscovered(world, DISCOVERED.afterPrinciples);
        const place = ['plot', 'neighbours', 'village', null];
        for (let i = 1; i <= 4; i++) {
            const k = seg(t, at(i, 0.02), at(i, 0.5));
            if (place[i - 1]) world.discover(place[i - 1], k);
            if (k > 0 && k < 1) world.hud.toast(`Scope · ${world.layout.SCOPE_RINGS[ORDER[i - 1]].name}`, k, { label: 'Reach' });
        }
        if (t < at(0, 0.14)) world.hud.quest('Discover the five principles', '5/5');
        else world.hud.quest(QUEST, `${[1, 2, 3, 4].filter(i => t >= at(i, 0.1)).length}/4`);
    },
};
