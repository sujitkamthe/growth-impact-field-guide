// Chapter 4, Three areas: the village's three districts, each with its colour and its name.
//
// 1. "Wherever you are, your impact counts in three areas."  The camera settles over the village
//    square; the explorer finishes in the neighbour's wheat and sets off for the square.
// 2. "Client and Delivery..."  East to the market and the mill (lit up while shown: the market is
//    beyond the explorer's reach): the teal banners unfurl under its floating name, the toast reads
//    "Area · Client & Delivery", and the cart hand loads the cart and pulls it off over the bridge.
// 3. "People and Team..."  Over to the houses: blue banners and their name; the neighbour steps in to
//    help at the garden while the explorer comes up the lane between the houses.
// 4. "Org and Community..."  The square: amber banners and their name, villagers gathering.
// 5. "Each area is rated on its own..."  The HUD shows the three areas, each with its own empty
//    slot, marked one after another (no rating words), as the explorer joins the gathering and the
//    camera settles over the square with all three names in view. Ends on layout.states.afterAreas.

import { beatClock, line, catchUp, stroll, follow, camera, turnTo, bearing, CAST, keepDiscovered, DISCOVERED, travel, buildSigns, buildDistrictLabels, areaSlots, AREA_NAMES } from './_shared.js';
import { village } from './_cast.js';
import { bridgeLift, CHATTERS } from './_shared2.js';
import { polyline } from '../world/util.js';

const QUEST = 'Find the three areas';

// ---- The explorer: out of the wheat by its south gate, along the strip between the garden and the
// pumpkins, round the bush, up the lane between the two houses and into the square. -----------------
const lane = [[-2.2, 25.6], [-2.2, 24.4], [-3.6, 22.6], [-3.6, 16.4], [-2.4, 14.4], [0.8, 11.0], [3.4, 6.4]];
const toSquare = [[-18.5, 30.2], [-18.3, 31.6], [-18.0, 33.2], [-17.4, 34.4], [-15.0, 34.5], [-14.0, 33.4], [-13.9, 28.8],
    [-13.6, 26.3], [-10.0, 26.1], [-5.0, 26.0], ...lane];

// ---- The cart hand and the cart: loaded, then pulled along the cart road and over the bridge to the
// far bank, where the later chapters find it (keepWorld in _shared2.js). The hand walks 2.3 m ahead. --
const CART_ROAD = [[10.8, -2.6], [8, -6.2], [6.2, -10], [6.4, -16], [8, -22]];      // layout.paths.cartRoute
const pull = [[9.39, -4.41], [8, -6.2], [6.2, -10], [6.4, -16], [8, -22], [8.62, -24.24]];
const toCartFront = [[9.0, -3.0], [9.1, -3.8], [9.39, -4.41]];
// ---- The readers cross to chat in the square (their chatting() spots) ------------------------------
const chatSpot = who => CHATTERS.find(c => c[0] === who);
const toChat = [
    { who: 4, path: [[-6.0, 8.4], [-3.2, 8.0], [0.0, 7.3], [2.2, 7.6], [3.3, 8.7], [4.2, 9.9]], start: [2, 0.24] },
    { who: 5, path: [[-6.1, 10.2], [-3.2, 10.4], [0.2, 11.4], [2.0, 10.9], [3.4, 9.0], [5.6, 8.4]], start: [2, 0.0] },
];
// ---- The neighbour leaves the wheat to help at the garden: in by garden1's south gate, across the
// fence from the villager tending it (villageDay's v10 at [-3.8, 24.0]). ---------------------------
const toGarden = [[-16.9, 31.0], [-17.6, 32.0], [-18.0, 33.2], [-17.4, 34.4], [-15.0, 34.5], [-14.0, 33.4], [-13.9, 28.8],
    [-13.6, 26.3], [-8.6, 26.1], [-7.0, 26.0], [-7.0, 25.0], [-6.0, 24.2], [-5.0, 23.9]];

// ---- Shots ---------------------------------------------------------------------------------------------
const OVER_SQUARE = { target: [5, 0.6, 5], distance: 64, yaw: 12, pitch: 52, fov: 28 };
const MARKET = { target: [14.6, 0.6, -2.8], distance: 40, yaw: 30, pitch: 53, fov: 28 };
const HOUSES = { target: [-5.0, 1.0, 21.0], distance: 23, yaw: 8, pitch: 41, fov: 28 };
const SQUARE_MID = { target: [4.6, 0.6, 5.2], distance: 31, yaw: 10, pitch: 53, fov: 28 };

export default {
    id: 'areas',

    build(world) {
        const group = new world.THREE.Group();
        const signs = buildSigns(world);
        group.add(signs.group);
        group.userData.signs = signs;
        bridgeLift(world, group);              // the cart hand walks the bridge's planks, not the river bed
        const labels = buildDistrictLabels(world);
        group.add(labels.group);
        group.userData.labels = labels;
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const { seg, ease, mix } = world.util;
        const { states } = world;
        const at = beatClock(time);
        const ex = world.explorer;
        const V = world.villagers;
        const clock = world.clock;

        world.setTimeOfDay(mix(states.afterScopes.hours, states.afterAreas.hours, seg(t, 0, duration)));

        // ---- The explorer ----------------------------------------------------------------------
        const L = line(toSquare).total;
        const leg = { points: toSquare, keys: catchUp(at(0, 0.42), at(4, 0.55), L, { head: 3.6, tail: line(lane).total }) };
        follow(ex, [leg], t);
        if (t < leg.keys[0][0]) {
            // still at work in the wheat, then a turn for the gate
            const w = 0.995 * (1 - ease.sine(seg(t, at(0, 0.22), at(0, 0.34))));
            ex.face(states.afterScopes.explorer.facing);
            if (w > 0) ex.play('Interact', clock * 0.9, { weight: w });
            turnTo(ex, bearing(toSquare[0], toSquare[1]), ease.inOut(seg(t, at(0, 0.3), leg.keys[0][0])));
        } else if (t >= leg.keys.at(-1)[0]) {
            const arrived = leg.keys.at(-1)[0];
            turnTo(ex, states.afterAreas.explorer.facing, ease.inOut(seg(t, arrived, arrived + 0.9)));
        }

        // ---- Villagers ----------------------------------------------------------------------------
        const busy = [CAST.neighbour.who, CAST.cartHand.who];
        // the readers cross the square to chat; chatting() has them once they are there
        toChat.forEach(({ who, path, start }) => {
            const v = V[who];
            const [, spot, facing] = chatSpot(who);
            const walk = stroll(at(...start), line(path).total);
            const settled = walk.end + 1.0;
            if (t >= settled) return;
            busy.push(who);
            if (t < walk.keys[0][0]) {
                const r = CAST.readers.find(x => x.who === who);
                v.place(r.at, r.facing);
                turnTo(v, bearing(path[0], path[1]), ease.inOut(seg(t, walk.keys[0][0] - 0.8, walk.keys[0][0])));
                return;
            }
            follow(v, [{ points: path, keys: walk.keys }], t);
            if (t > walk.end) {
                turnTo(v, facing, ease.inOut(seg(t, walk.end, settled - 0.15)));
                const u = (clock + who * 2.3) % 7;
                if (u < 1.6) v.play('Interact', u, { weight: 0.35 * Math.sin((Math.PI * u) / 1.6) });
            }
            void spot;
        });
        village(world, clock, busy, { readersAtBoard: false });

        // the neighbour: done in the wheat, off to help at the garden
        {
            const n = CAST.neighbour, v = V[n.who];
            const leg = { points: toGarden, keys: catchUp(at(0, 0.06), at(2, 0.3), line(toGarden).total, { head: 2.4, tail: 3.2 }) };
            follow(v, [leg], t);
            if (t < leg.keys[0][0]) {
                v.face(n.endFacing).play('Interact', clock * 0.9 + 1.1, { weight: 0.995 * (1 - ease.sine(seg(t, 0, leg.keys[0][0]))) });
                turnTo(v, bearing(toGarden[0], toGarden[1]), ease.inOut(seg(t, 0.05, leg.keys[0][0])));
            } else if (t >= leg.keys.at(-1)[0]) {
                const arrived = leg.keys.at(-1)[0];
                turnTo(v, 90, ease.inOut(seg(t, arrived, arrived + 0.6)));
                const w = Math.min(0.995, ease.sine(seg(t, arrived + 0.3, arrived + 0.9)));
                if (w > 0) v.play('Interact', clock * 0.85 + 0.6, { weight: w });
                V[10].nod(seg(t, at(2, 0.62), at(2, 0.8)));
            }
        }

        // the cart: loaded, then pulled off along the road and over the bridge
        {
            const v = V[CAST.cartHand.who];
            const cart = world.props.cart;
            const road = polyline(CART_ROAD);
            cart.load(seg(t, at(1, 0.14), at(1, 0.46)));
            const pre = stroll(at(1, 0.46), line(toCartFront).total);
            const L = road.total;
            const roll = stroll(pre.end + 0.3, L);
            const d = Math.max(0, Math.min(L, travel(roll.keys, t)));
            const a = road.at(d);
            const along = (Math.atan2(a.dx, -a.dz) * 180) / Math.PI;
            const f0 = 330;            // how the cart stands at the market
            cart.place([a.x, a.z], f0 + ((((along - f0) % 360) + 540) % 360 - 180) * ease.inOut(Math.min(1, d / 1.2)));
            if (t < pre.keys[0][0]) {
                v.place(CAST.cartHand.at, CAST.cartHand.facing).play('Idle', clock + 2.1);
                const w = Math.min(0.995, ease.sine(seg(t, at(1, 0.1), at(1, 0.16))) * ease.sine(seg(t, at(1, 0.46), at(1, 0.4))));
                if (w > 0) v.play('Interact', (t - at(1, 0.1)) * 1.1, { weight: w });
            } else if (t < roll.keys[0][0]) {
                follow(v, [{ points: toCartFront, keys: pre.keys }], t);
                turnTo(v, bearing(pull[0], pull[1]), ease.inOut(seg(t, pre.end - 0.4, roll.keys[0][0])));
            } else {
                v.walk(pull, Math.min(1, d / line(pull).total));
            }
        }

        // ---- Banners and names: each district's colour and name together, staying up once named ----
        const named = { cd: seg(t, at(1, 0.06), at(1, 0.3)), pt: seg(t, at(2, 0.06), at(2, 0.3)), oc: seg(t, at(3, 0.06), at(3, 0.3)) };
        world.banners('cd', seg(t, at(1, 0.12), at(1, 0.7)));
        world.banners('pt', seg(t, at(2, 0.3), at(2, 0.85)));
        world.banners('oc', seg(t, at(3, 0.3), at(3, 0.85)));
        // (they are still up as the chapter ends; Expectations lets them fade in its first moments)
        for (const area of ['cd', 'pt', 'oc']) group?.userData.labels.set(area, named[area]);

        // ---- Camera --------------------------------------------------------------------------------
        camera(world, t, [
            [0, 'village'],
            [at(0, 0.05), 'village'],
            [at(0, 0.88), OVER_SQUARE],
            [at(1, 0.0), OVER_SQUARE],
            [at(1, 0.4), MARKET],
            [at(1, 0.92), MARKET],
            [at(2, 0.42), HOUSES],
            [at(2, 0.9), HOUSES],
            [at(3, 0.42), SQUARE_MID],
            [at(4, 0.0), SQUARE_MID],
            [at(4, 0.85), 'square'],
        ]);

        // The market lies beyond the explorer's reach: it lights up while it is shown, then lets go.
        const market = ease.inOut(seg(t, at(1, 0.0), at(1, 0.3))) * (1 - ease.inOut(seg(t, at(2, 0.1), at(2, 0.6))));
        const reveals = world.REVEALS.afterAreas.slice();
        if (market > 0.004) reveals.push(world.fog.grow({ x: 15.5, z: 0, r: 11 }, market));
        world.fog.set(reveals);
        group?.userData.signs.all(1);           // the principles' signs stay standing

        // ---- HUD and discoveries ------------------------------------------------------------------
        keepDiscovered(world, DISCOVERED.afterScopes);
        world.discover('market', seg(t, at(1, 0.02), at(1, 0.5)));
        world.discover('houses', seg(t, at(2, 0.02), at(2, 0.5)));
        for (const [i, area] of [[1, 'cd'], [2, 'pt'], [3, 'oc']]) {
            const k = seg(t, at(i, 0.02), at(i, 0.5));
            if (k > 0 && k < 1) world.hud.toast(`Area · ${AREA_NAMES[area]}`, k, { label: 'Area' });
        }
        if (t < at(0, 0.2)) world.hud.quest('How far you reach', '4/4');
        else world.hud.quest(QUEST, `${[1, 2, 3].filter(i => t >= at(i, 0.1)).length}/3`);
        // each area judged on its own: three rows, each slot marked in turn
        if (t >= at(4, 0.02)) {
            const marked = ['cd', 'pt', 'oc'].filter((a, i) => t >= at(4, 0.3 + i * 0.16));
            world.hud.rows(areaSlots(marked), seg(t, at(4, 0.02), at(4, 0.2)));
        }
    },
};
