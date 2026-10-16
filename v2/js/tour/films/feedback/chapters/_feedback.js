// Shared pieces for the feedback film ("Feedback, every day"): the film's places, its cast, the
// village's background exchanges (pairs turning to each other for a moment all day long), the world
// as the film keeps it, the cart that leaves after the showcase, and the shots and hours at each
// chapter boundary. Like the chapters, everything is a function of the frame's time and clock alone.
//
// People's walks use the org film's plan runner (run() in ../../org/chapters/_org.js): every walk at
// a real pace, timed by its path length, turning before it sets off and after it stops.

import { run, arrival, ease, seg, mix, clamp01 } from '../../org/chapters/_org.js';
import { beatClock, camera, areaSlots, line, travel, stroll as legStroll } from '../../../chapters/_shared.js';
import { bridgeLift, facingTo } from '../../../chapters/_shared2.js';

export { run, arrival, ease, seg, mix, clamp01, beatClock, camera, areaSlots, bridgeLift, facingTo };

export const PACE = 1.3;                     // m/s, an unhurried walk

// ---- The cast, by villager index ------------------------------------------------------------------
export const CAST = {
    joiner: 10,       // the new joiner, who arrives over the bridge
    presenter: 4,     // gives the showcase at the cart
    client: 2,        // the client, who pulls the cart away over the bridge
    client2: 3,       // the client's colleague, who walks on ahead
    mate: 8,          // the teammate who watches the showcase and takes the explorer aside
    planner: 6,       // runs the client's planning, at the hall's door
    reader: 5,        // at the notice board, where the joiner joins them
};

// ---- Places ([x, z]) ----------------------------------------------------------------------------
export const SPOT = {
    // the explorer in the square, as the guide's film leaves them (layout.states.afterGrowth)
    square: [7.0, 1.0],
    // where the joiner stops in front of them, off the bridge
    joinerStop: [6.4, -0.2],
    // the showcase round the cart, which stands at the head of the bridge road for this film (CART),
    // clear of the banner pole and lantern at the square's corner so the camera sees everyone
    presenter: [8.35, -5.15],       // on the cart's east side
    client: [6.45, -4.05],          // on its west side, by the shafts (PATH.pull starts a step on)
    client2: [8.6, -3.4],           // at its back
    mate: [4.6, -1.4],              // watching from the square's north side, a little apart
    // where the presenter stops to hear the explorer, and then waits, watching the bridge
    presenterStop: [7.55, -0.35],   // (clear of the bench, lantern and banner pole round it)
    presenterWait: [10.6, -2.4],
    // the riverbank east of the bridge, in private
    bankExplorer: [10.2, -7.4],
    bankMate: [9.0, -7.8],
    // the hall's door: the planner, and where the explorer stands to talk with them
    planner: [-1.0, 0.2],
    byPlanner: [-0.2, 1.3],
    // the notice board's readers (as in the guide's film)
    boardJoiner: [-6.0, 8.4],
    boardReader: [-6.1, 10.2],
};

// The team check: a small circle between the notice board and the fountain, open to the south-south-east
// (where the camera stands, clear of the banner pole due south of it at [-1.4, 9.6]). [x, z, facing] for
// each, facing the circle's centre.
export const RING = { c: [-1.4, 5.8], r: 1.4 };
const onRing = bearing => {
    const b = bearing * Math.PI / 180;
    return [RING.c[0] + RING.r * Math.sin(b), RING.c[1] - RING.r * Math.cos(b), (bearing + 180) % 360];
};
export const CIRCLE = {
    joiner: onRing(210), planner: onRing(270), mate: onRing(330), explorer: onRing(30), reader: onRing(90),
};
export const circleAt = who => [CIRCLE[who][0], CIRCLE[who][1]];

// ---- Paths ----------------------------------------------------------------------------------------
export const PATH = {
    // the joiner, in over the bridge to stand in front of the explorer
    joinerIn: [[6.8, -18.6], [6.4, -16], [6.0, -11.6], [5.6, -6.4], [5.2, -3.4], [6.4, -0.2]],
    // and on to the notice board, round the fountain's west side
    joinerToBoard: [[6.4, -0.2], [3.6, 0.4], [2.0, 2.4], [0.4, 5.4], [-2.6, 7.0], [-4.6, 7.2], [-6.0, 8.4]],
    // the cart road over the bridge (layout.paths.cartRoute) and the client's walk in front of it
    // (it stops on the far bank, just past the bridge, so the pull fits inside one chapter)
    cartRoad: [[7.4, -4.6], [6.4, -7.0], [6.0, -10], [6.2, -13], [6.4, -15.6], [6.7, -17.4]],
    pull: [[6.53, -6.72], [6.0, -10], [6.2, -13], [6.4, -15.6], [6.7, -17.4], [7.3, -19.6]],
    toShafts: [[6.45, -4.05], [5.9, -5.4], [6.53, -6.72]],
    client2Out: [[8.6, -3.4], [8.8, -6.0], [7.4, -8.2], [6.9, -10], [6.9, -15.6], [7.9, -18.2]],
    presenterOver: [[8.35, -5.15], [7.6, -2.6], [7.55, -0.35]],
    presenterAway: [[7.55, -0.35], [8.0, -1.7], [9.0, -2.4], [10.6, -2.4]],      // (north of the bench, south of the pole)
    // the explorer and the teammate, out of the square to the riverbank east of the bridge
    // (the bench by the explorer runs from [8.1, -0.6] to [9.7, 1.0], so the teammate waits on the other side)
    mateUp: [[4.6, -1.4], [5.2, -0.6], [5.6, 0.0]],
    explorerToBank: [[7.0, 1.0], [7.6, -1.2], [8.6, -3.6], [9.8, -5.8], [10.2, -7.4]],
    mateToBank: [[5.6, 0.0], [5.8, -2.6], [7.0, -4.6], [8.2, -6.4], [9.0, -7.8]],
    // from the riverbank: the explorer to the hall's door, the teammate to the circle
    explorerToHall: [[10.2, -7.4], [8.6, -5.2], [5.8, -3.0], [3.4, 0.2], [2.0, 2.0], [0.4, 1.8], [-0.2, 1.3]],
    mateToCircle: [[9.0, -7.8], [7.6, -5.6], [5.4, -3.6], [3.6, -0.6], [2.0, 2.6], circleAt('mate')],
    // into the circle
    explorerToCircle: [[-0.2, 1.3], [0.2, 3.0], circleAt('explorer')],
    plannerToCircle: [[-1.0, 0.2], [-2.6, 1.8], [-3.6, 4.4], circleAt('planner')],
    joinerToCircle: [[-6.0, 8.4], [-4.6, 7.0], circleAt('joiner')],
    readerToCircle: [[-6.1, 10.2], [-4.2, 11.0], [-2.0, 11.0], [0.2, 9.6], circleAt('reader')],
};

// ---- The cart ------------------------------------------------------------------------------------
// Loaded at the showcase, then pulled off along the cart road and over the bridge by the client, as
// in the guide's Areas chapter. t0: the second the pull starts (null: not yet). Returns the metres rolled.
const cartLine = () => line(PATH.cartRoad);
export function cartRoll(world, t, t0) {
    const cart = world.props.cart;
    cart.load(1);
    const L = cartLine().total;
    const f0 = facingTo(PATH.cartRoad[0], PATH.cartRoad[1]);
    if (t0 == null) { cart.place(CART, f0); return 0; }
    // (a brisk pull, still a walk, so it is over the bridge before The same day ends)
    const roll = legStroll(t0, L, { pace: 1.45 });
    const d = Math.max(0, Math.min(L, travel(roll.keys, t)));
    const a = cartLine().at(d);
    const along = Math.atan2(a.dx, -a.dz) * 180 / Math.PI;
    cart.place([a.x, a.z], f0 + ((((along - f0) % 360) + 540) % 360 - 180) * ease.inOut(Math.min(1, d / 1.2)));
    return d;
}
// The client walking in front of the cart: their distance along PATH.pull matches the cart's.
export function pullAlong(person, d) {
    const L = line(PATH.pull).total;
    person.walk(PATH.pull, Math.min(1, d / L));
}
// After the showcase: the cart on the far bank, the client beside it, the colleague a step away.
export const CLIENT2_END = 150;          // the colleague waits facing the cart as it comes off the bridge
// (Set exactly as The same day leaves them: the pull's last frame.)
export function cartGone(world) {
    pullAlong(world.villagers[CAST.client], cartRoll(world, 1e6, 0));
    world.villagers[CAST.client2].place(PATH.client2Out.at(-1), CLIENT2_END);
}

// ---- The world as the film keeps it ------------------------------------------------------------------
// The guide's film's end: every district's banners up, the landmarks found, the explorer's sheet on
// the notice board.
// (not 'village': its pennant stands at the hall's door, in the middle of a scene)
const SEEN = ['crossroads', 'stoneRing', 'noticeBoard', 'lake', 'plot', 'neighbours', 'market', 'houses', 'bridge', 'hamlet'];
export function keepWorld(world) {
    for (const n of SEEN) world.discover(n, 1);
    for (const a of ['cd', 'pt', 'oc']) world.banners(a, 1);
    world.props.noticeSheet.show(1);
    world.props.noticeSheet.write(1);
    world.fog.set(world.REVEALS.afterGrowth);
}

// ---- Small exchanges all over the village -------------------------------------------------------------
// Two people facing each other; on a cycle of `period` seconds of clock, one talks with their hands
// for a moment and the other nods, then the other way round.
const sstep = x => { const k = clamp01(x); return k * k * (3 - 2 * k); };
export function exchange(a, b, at, bt, clock, { phase = 0, period = 9, weight = 0.55 } = {}) {
    a.place(at, facingTo(at, bt));
    b.place(bt, facingTo(bt, at));
    const u = ((((clock + phase) % period) + period) % period) / period;
    const talk = (p, k0) => {
        const k = (u - k0) / 0.2;
        if (k > 0 && k < 1) p.play('Interact', k * 1.6, { weight: weight * Math.sin(Math.PI * k) });
    };
    talk(a, 0.05);
    b.nod(sstep((u - 0.27) / 0.08));
    talk(b, 0.55);
    a.nod(sstep((u - 0.77) / 0.08));
}

// The background pairs: at the market's workbench and at a People & Team house.
export const PAIRS = {
    market: { a: 7, b: 9, at: [16.4, 2.6], bt: [17.6, 3.6] },
    houses: { a: 0, b: 1, at: [-10.3, 12.2], bt: [-9.1, 13.0] },     // at the door of the house west of the square
};
// skip: villager indices the chapter is choreographing itself this frame.
export function villageLife(world, clock, skip = []) {
    const V = world.villagers;
    const on = i => !skip.includes(i);
    for (const [k, p] of Object.entries(PAIRS)) {
        if (on(p.a) && on(p.b)) exchange(V[p.a], V[p.b], p.at, p.bt, clock, { phase: k === 'market' ? 0 : 3.1, period: k === 'market' ? 8.5 : 10 });
    }
}

// ---- The showcase, before it ends (Small and often, Ask first) -----------------------------------------
// The teammate shows the client's two people the loaded cart, talking with their hands; the two nod now
// and then, and the teammate who watches stands a little back.
export const CART = [7.4, -4.6];          // PATH.cartRoad[0]
export function showcaseOn(world, clock) {
    const V = world.villagers;
    V[CAST.presenter].place(SPOT.presenter, facingTo(SPOT.presenter, SPOT.client)).play('Interact', clock * 0.8 + 0.3, { weight: 0.8 });
    for (const [who, at, phase] of [[CAST.client, SPOT.client, 0], [CAST.client2, SPOT.client2, 2.4]]) {
        const c = V[who].place(at, facingTo(at, SPOT.presenter));
        const u = ((((clock + phase) % 6.2) + 6.2) % 6.2) / 6.2;
        if (u > 0.6 && u < 0.72) c.nod((u - 0.6) / 0.12);
    }
    V[CAST.mate].place(SPOT.mate, facingTo(SPOT.mate, CART));
}

// How the people whose part is done stand: the presenter watching the bridge, the planner at the
// hall's door, the reader and the joiner at the notice board.
export const WAIT = { presenter: 330, planner: 160, reader: 104, joiner: 72 };

// ---- Shots at chapter boundaries and the film's places ------------------------------------------------
// target [x, y, z], distance, yaw (where the camera stands: 0 south, 90 east), pitch, fov.
export const SHOT = {
    top: { target: [2, 0, 6], distance: 168, yaw: 10, pitch: 61, fov: 28 },              // layout.SHOTS.grown (the film opens here)
    square: { target: [6.0, 0.6, 2.0], distance: 44, yaw: 12, pitch: 50, fov: 28 },
    explorer: { target: [7.2, 0.9, 0.6], distance: 26, yaw: 330, pitch: 44, fov: 28 },      // habit -> ask
    meet: { target: [7.0, 1.0, 0.2], distance: 18, yaw: 306, pitch: 50, fov: 30 },
    showcase: { target: [7.6, 1.0, -3.4], distance: 23, yaw: 14, pitch: 52, fov: 28 },     // ask -> give
    pair: { target: [7.55, 1.0, 0.35], distance: 15, yaw: 28, pitch: 40, fov: 30 },        // give -> change
    bank: { target: [9.6, 1.0, -7.6], distance: 15, yaw: 172, pitch: 36, fov: 30 },          // from across the river
    bankClose: { target: [9.6, 1.1, -7.6], distance: 11, yaw: 162, pitch: 30, fov: 30 },     // change -> everyone
    wide: { target: [5, 0, 6.5], distance: 58, yaw: 6, pitch: 54, fov: 28 },
    hall: { target: [-0.6, 1.0, 0.7], distance: 13, yaw: 306, pitch: 38, fov: 30 },          // everyone -> loop
    circle: { target: [-1.3, 1.0, 5.9], distance: 17, yaw: 30, pitch: 42, fov: 28 },          // loop -> ahead
    closeHigh: { target: [3, 0, 6], distance: 92, yaw: 8, pitch: 55, fov: 28 },
};

// Hours at each chapter boundary: one day, from early morning to golden hour.
export const HOURS = { start: 8.0, habit: 8.6, ask: 9.2, give: 10.0, change: 11.4, everyone: 13.0, loop: 15.0, ahead: 17.1 };
export const hoursOver = (world, time, a, b) => world.setTimeOfDay(mix(HOURS[a], HOURS[b], ease.inOut(seg(time.t, 0, time.duration))));
