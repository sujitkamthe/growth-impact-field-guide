// Helpers for the later chapters (expectations, feedback, self-assessment, growth, close): beat
// timing, walks that turn before they set off and after they stop, villagers going about their day,
// the world as earlier chapters left it, and a lift for people crossing the bridge.
//
// Like the chapters, everything here is a function of the frame's time and clock alone.

import { smoothLine, polyline } from '../world/util.js';
import { DISCOVERED } from './_shared.js';

const clamp01 = x => Math.min(1, Math.max(0, x));
export const angleDelta = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
export const lerpAngle = (a, b, k) => a + angleDelta(a, b) * k;
// The facing (degrees clockwise from north) from point a towards point b, both [x, z].
export const facingTo = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180 / Math.PI;
const sstep = x => { const t = clamp01(x); return t * t * (3 - 2 * t); };

// Beat timing for one frame: at(i, f) is the moment f of the way through beat i; span(a, b) is the
// progress of t from moment a to moment b, both given as [beat, fraction].
export function beats(time) {
    const { t, beatStarts, beatEnds } = time;
    const at = (i, f) => beatStarts[i] + (beatEnds[i] - beatStarts[i]) * f;
    const span = ([i0, f0], [i1, f1]) => {
        const a = at(i0, f0), b = at(i1, f1);
        return clamp01((t - a) / (b - a));
    };
    return { t, at, span };
}

// Path lengths, measured along the same smoothed line person.walk() follows.
const lengths = new Map();
export function pathLength(points) {
    const key = JSON.stringify(points);
    if (!lengths.has(key)) lengths.set(key, polyline(smoothLine(points, 6)).total);
    return lengths.get(key);
}

// Progress (0..1) along a walk of `len` metres that takes `dur` seconds, at `s` seconds in: a steady
// pace with a gentle start and stop over about half a second, so the speed never peaks the way an
// eased curve over the whole walk would.
export function pace(s, dur, len = 1) {
    if (s <= 0) return 0;
    if (s >= dur) return 1;
    const r = Math.min(0.6, dur / 3);
    const v = 1 / (dur - r);
    if (s < r) return (v * s * s) / (2 * r);
    if (s > dur - r) return 1 - (v * (dur - s) * (dur - s)) / (2 * r);
    return v * (s - r / 2);
}

// A walk between two moments (seconds) along `points`: turns on the spot from `from` towards the
// way ahead over `turn` seconds, walks at a steady pace, then turns to `to` over `turn` seconds.
// Before t0 the person stands at the start; after t1 at the end. Returns the walk's progress.
export function stroll(person, points, t, t0, t1, { from = null, to = null, turn = 0.45, idle = 'Idle' } = {}) {
    const ta = from == null ? t0 : t0 + turn;
    const tb = to == null ? t1 : t1 - turn;
    const k = pace(t - ta, tb - ta);
    person.walk(points, k, { idle });
    if (from != null && t < ta) {
        const ahead = person.facing;
        person.face(lerpAngle(from, ahead, sstep((t - t0) / turn)));
    }
    if (to != null && t > tb) person.face(lerpAngle(person.facing, to, sstep((t - tb) / turn)));
    return k;
}

// A few steps backwards from `a` to `b` between two moments (seconds), turning from `fromFacing` to
// `toFacing` on the way: the Walk clip runs in reverse with the distance, so the feet stay planted.
export function stepBack(person, a, b, t, t0, t1, fromFacing, toFacing) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = pace(t - t0, t1 - t0);
    const e = sstep(k);
    person.place([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], lerpAngle(fromFacing, toFacing, e));
    const d = len * k;
    const w = Math.min(sstep(d / 0.35), sstep((len - d) / 0.35));
    if (w > 0.001) person.play('Walk', -d / person.stride, { weight: Math.min(0.999, w) });
    return k;
}

// A clip played once between two moments (seconds), blended in and out over `blend` seconds on top
// of whatever the person is doing (Interact to hand something over, Wave, ...).
export function gesture(person, clip, t, t0, t1, { blend = 0.25, weight = 1 } = {}) {
    if (t <= t0 || t >= t1) return 0;
    const w = weight * Math.min(sstep((t - t0) / blend), sstep((t1 - t) / blend));
    person.play(clip, t - t0, { weight: Math.min(0.999, w) });
    return w;
}

// A villager going about their day: walks `route` there and back at `speed`, pausing at each end
// for `pause` seconds doing `act` (Idle, Interact...), phase-shifted by `phase` seconds of clock.
export function patrol(person, route, clock, { speed = 1.25, pause = 3, phase = 0, act = 'Idle', actBack = act } = {}) {
    const len = pathLength(route);
    const walk = len / speed;
    const cycle = 2 * walk + 2 * pause;
    const u = ((((clock + phase) % cycle) + cycle) % cycle);
    const back = route.slice().reverse();
    // at each end the act blends in over the idle and out again before setting off
    const rest = (clip, s) => {
        if (clip === 'Idle') return;
        const w = Math.min(sstep(s / 0.4), sstep((pause - s) / 0.4));
        if (w > 0.001) person.play(clip, s, { weight: Math.min(0.999, w) });
    };
    if (u < walk) person.walk(route, pace(u, walk));
    else if (u < walk + pause) { person.walk(route, 1); rest(act, u - walk); }
    else if (u < 2 * walk + pause) person.walk(back, pace(u - walk - pause, walk));
    else { person.walk(back, 1); rest(actBack, u - 2 * walk - pause); }
    return person;
}

// A villager at work in one spot: stands at [x, z] facing `facing`, looping `act`.
export function work(person, at, facing, clock, act = 'Interact', phase = 0) {
    return person.place(at, facing).play(act, clock + phase);
}

// The landmarks discovered before these chapters, whose pennants stay up from here on.
export const SEEN = DISCOVERED.afterAreas;

// The village as Areas leaves it: every banner unfurled, the landmarks'
// pennants raised and the cart, loaded, rolled off over the bridge to the far bank.
export function keepWorld(world, { seen = SEEN } = {}) {
    for (const n of seen) world.discover(n, 1);
    for (const a of ['cd', 'pt', 'oc']) world.banners(a, 1);
    world.props.cart.along('cartRoute', 1);
    world.props.cart.load(1);
}

// The ground ignores the bridge, so anyone crossing it would walk along the river bed. This lifts
// people on the deck to its planks (the deck's shape is the one village.js builds). It runs inside
// the scene's matrix update, after the people's own, and only while `group` is shown; it does
// nothing once the ground itself is high enough there.
export function bridgeLift(world, group) {
    const { THREE } = world;
    const bx = world.layout.places.bridge[0], z0 = -7.6, z1 = -15.6;
    const yA = world.heightAt(bx, z0) + 0.05, yB = world.heightAt(bx, z1) + 0.05;
    const deckTop = z => {
        const k = (z - z0) / (z1 - z0);
        return yA + (yB - yA) * k + Math.sin(Math.PI * k) * 0.9 + 0.08;
    };
    const hook = new THREE.Object3D();
    hook.name = 'bridge-lift';
    hook.updateMatrixWorld = function (force) {
        THREE.Object3D.prototype.updateMatrixWorld.call(this, force);
        if (!group.visible) return;
        for (const p of [world.explorer, ...world.villagers]) {
            const r = p.root;
            if (!r.visible) continue;
            const { x, z } = r.position;
            if (Math.abs(x - bx) > 1.6 || z > z0 || z < z1) continue;
            const y = deckTop(z);
            if (y > r.position.y) { r.position.y = y; r.updateMatrixWorld(true); }
        }
    };
    group.add(hook);
    return { deckTop, onDeck: (x, z) => Math.abs(x - bx) <= 1.6 && z <= z0 && z >= z1 };
}

// The evening fire's spots: the explorer's seat and three places to stand around it, each in a gap
// between the log seats (which appear when the fire is lit), facing the flames.
export const FIRE_SPOTS = {
    seat: { at: [-0.4, 6.3], facing: 133 },
    a: { at: [3.4, 7.75], facing: 271 },
    b: { at: [1.8, 5.6], facing: 195 },
    c: { at: [-0.54, 9.14], facing: 52 },
};

// Villagers in the village by day, as a function of the clock alone, so they carry on unbroken from
// one chapter into the next. `skip` lists villager indices a chapter is choreographing itself.
export function villageDay(world, clock, skip = []) {
    const v = world.villagers;
    const on = i => !skip.includes(i);
    if (on(7)) work(v[7], [17.3, 3.3], 72, clock, 'Interact', 0.4);                       // at the market's workbench
    if (on(8)) patrol(v[8], [[5.0, -0.4], [5.3, -3.6], [5.6, -6.3]], clock, { pause: 4.5, phase: 2 });   // to the river and back
    if (on(9)) work(v[9], [15.5, 6.6], 268, clock, 'Idle_Neutral', 1.1);                  // behind the red stall
    if (on(10)) work(v[10], [-3.8, 24.0], 272, clock, 'Interact', 0.8);                    // tending a garden
    if (on(3)) work(v[3], [11.9, 1.9], 96, clock, 'Interact', 0.2);                        // buying at the green stall
}

// The far bank and the valley's edges once they are in view (Growth's later beats and Close).
export function valleyDay(world, clock, skip = []) {
    const v = world.villagers;
    const on = i => !skip.includes(i);
    if (on(10)) work(v[10], [9.5, -22.6], 285, clock, 'Interact', 0.3);                    // at the cart on the far bank
    if (on(9)) work(v[9], [18.4, -32.7], 104, clock, 'Interact', 0.9);                     // chopping wood in the hamlet
    if (on(7)) work(v[7], [15.3, -33.3], 205, clock, 'Idle_Neutral', 0.5);                 // at a hamlet door
    if (on(8)) patrol(v[8], [[10.6, -30.8], [4.2, -32.7], [-3.6, -34.7], [-9.8, -36.6]], clock, { pause: 5, phase: 6, speed: 1.15 });  // up windmill hill
    if (on(3)) work(v[3], [17.3, 3.3], 72, clock, 'Interact', 0.4);                        // the market's workbench
    if (on(5)) patrol(v[5], [[5.0, -0.4], [5.3, -3.6], [5.6, -6.3]], clock, { pause: 4.5, phase: 9 });
    if (on(6)) work(v[6], [-3.8, 24.0], 272, clock, 'Interact', 0.8);
    if (on(4)) work(v[4], [15.5, 6.6], 268, clock, 'Idle_Neutral', 1.1);
    if (on(0)) work(v[0], [-27.4, 45.6], 250, clock, 'Interact', 0.6);                     // in the wheat by the camp
    if (on(1)) patrol(v[1], [[-12.6, 10.3], [-20.4, 9.8], [-27.6, 8.4]], clock, { pause: 6, phase: 3, speed: 1.1 });  // the path to the ring
    if (on(2)) work(v[2], [41.2, 12.8], 180, clock, 'Interact', 1.3);                      // at the east farm
}

// Three villagers chatting on the square's south side through Expectations and most of Feedback,
// before they come over with notes. [index, spot, facing]
export const CHATTERS = [[4, [4.2, 9.9], 255], [5, [5.6, 8.4], 250], [6, [0.6, 8.8], 95]];
export function chatting(world, clock, skip = []) {
    for (const [i, at, facing] of CHATTERS) {
        if (skip.includes(i)) continue;
        // (their own idle, so a walk that follows blends from the very same pose)
        const p = world.villagers[i].place(at, facing);
        // now and then one of them talks with their hands
        const u = (clock + i * 2.3) % 7;
        if (u < 1.6) p.play('Interact', u, { weight: 0.35 * Math.sin(Math.PI * u / 1.6) });
    }
}
