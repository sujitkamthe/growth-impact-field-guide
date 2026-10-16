// Chapter 5, Your strengths: going deep in what you do best, with every area still part of what's expected.
//
// 1. "Deciding your own growth also means you can grow through what you do best."  The explorer leaves the fountain
//    for the square's east edge and looks out to the market; Client & Delivery's name stays bright
//    while the other two dim. Quest: "Agree where you go deep".
// 2. "All three areas stay part of what's expected of you..."  The other two names come back up as the explorer
//    looks round at each district in turn.
// 3. "When your team already relies on a strength of yours..."  The teammate who watched from the
//    square's south side walks over; the explorer hands something over and they take it, then nod.
//    The HUD's parchment card opens on the agreement, a line at a time.
// 4. "In return, you take on a stronger contribution..."  The teammate heads back; the explorer turns
//    to the market and gets to work, the market lit while it's shown (as in Areas, it isn't reach).
// 5. "Your teammate chose to take it on..."  The explorer walks back to the
//    fountain, the teammate nods from their spot, and the quest ticks: "Agreement made". Ends on
//    layout.states.afterAreas again, so Your quest starts exactly as it did after Areas.
//
// Starts and ends on layout.states.afterAreas. Everything is set from `time` alone.

import { beats, stroll, gesture, keepWorld, lerpAngle, facingTo, pathLength } from './_shared2.js';
import { village } from './_cast.js';
import { buildSigns, buildDistrictLabels, areaSlots } from './_shared.js';

const PACE = 1.3;                                        // m/s, an unhurried walk
const FOUNTAIN = [3.4, 6.4];                              // states.afterAreas.explorer.at
const EDGE = [8.8, 5.2], EDGE_FACING = 80;                // the square's east edge, looking out to the market
const TO_EDGE = [FOUNTAIN, [5.6, 6.9], [7.4, 6.2], EDGE];
const BACK = TO_EDGE.slice().reverse();
// The teammate: from their spot on the square's south side (CAST.watcher), round the chatters and the
// fountain, to stand an arm's length from the explorer.
const SPOT = [2.6, 9.8], SPOT_FACING = 358.6;
const MEET = [7.9, 6.3];
const TO_MEET = [SPOT, [2.9, 8.2], [4.6, 7.0], [6.6, 6.6], MEET];
const FROM_MEET = TO_MEET.slice().reverse();
// The neighbour, still helping at the garden where Areas left them, and the cart hand on the far bank.
const GARDEN = [-5.0, 23.9];
const PULL = [[9.39, -4.41], [8, -6.2], [6.2, -10], [6.4, -16], [8, -22], [8.62, -24.24]];

const LINES = [
    'A strength your team relies on',
    'One responsibility, accepted by a teammate',
    'A stronger contribution through your strength',
];

// The square, the two of them at its edge, and a look past the explorer to the market.
const NEAR_SQUARE = { target: [5.8, 0.6, 4.6], distance: 45, yaw: 11, pitch: 49, fov: 28 };   // 'square', a touch closer
const PAIR = { target: [7.9, 1.0, 5.9], distance: 25, yaw: 338, pitch: 38, fov: 28 };
const PAST = { target: [12.4, 1.0, 3.6], distance: 23, yaw: 258, pitch: 31, fov: 28 };

export default {
    id: 'strengths',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.signs = buildSigns(world);
        group.add(group.userData.signs.group);
        group.userData.labels = buildDistrictLabels(world);
        group.add(group.userData.labels.group);
        return group;
    },

    update(world, group, time) {
        const { t, at, span } = beats(time);
        const { ease, seg } = world.util;
        const { states, REVEALS } = world;
        const end = time.duration - 0.15;                 // every walk is done by here, so the join holds
        const ex = world.explorer;
        const V = world.villagers;
        const mate = V[1];
        const clock = world.clock;

        world.setTimeOfDay(states.afterAreas.hours);
        keepWorld(world);
        group?.userData.signs?.all(1);
        village(world, clock, [0, 1, 2], { readersAtBoard: false });
        V[0].place(GARDEN, 90).play('Interact', clock * 0.85 + 0.6, { weight: 0.995 });
        V[2].walk(PULL, 1);

        // ---- The explorer -----------------------------------------------------------------------------
        const outDur = pathLength(TO_EDGE) / PACE + 0.9;
        const out0 = at(0, 0.06), out1 = out0 + outDur;
        const back0 = at(4, 0.06), back1 = Math.min(back0 + outDur, end);
        // the teammate's walk over, the handover, and their walk back
        const meetDur = pathLength(TO_MEET) / PACE + 0.45;
        const meet0 = Math.max(at(1, 0.55), at(2, 0) - meetDur * 0.6), meet1 = meet0 + meetDur;
        const give = Math.max(meet1 + 0.15, at(2, 0.3));  // the explorer hands it over
        const take = give + 0.35;                         // and the teammate takes it
        const leave0 = Math.max(take + 1.9, at(3, 0.02));
        const leave1 = Math.min(leave0 + meetDur, end);

        const towardMate = facingTo(EDGE, MEET);
        if (t < back0) {
            stroll(ex, TO_EDGE, t, out0, out1, { from: states.afterAreas.explorer.facing, to: EDGE_FACING, turn: 0.45 });
            if (t >= out1) {
                // looking round at each district in turn, then back out to the market
                const look0 = Math.max(out1 + 0.2, at(1, 0.2)), look1 = at(1, 0.95);
                const s = (look1 - look0) / 3;
                let f = EDGE_FACING;
                f = lerpAngle(f, facingTo(EDGE, [-4.0, 18.6]), ease.inOut(seg(t, look0, look0 + s * 0.7)));
                f = lerpAngle(f, facingTo(EDGE, [4.4, 0.8]), ease.inOut(seg(t, look0 + s, look0 + s * 1.7)));
                f = lerpAngle(f, EDGE_FACING, ease.inOut(seg(t, look0 + s * 2, look0 + s * 2.7)));
                // then to the teammate as they arrive, and back to the market once they go
                f = lerpAngle(f, towardMate, ease.inOut(seg(t, meet1 - 0.8, meet1)));
                f = lerpAngle(f, EDGE_FACING, ease.inOut(seg(t, leave0, leave0 + 0.7)));
                ex.face(f);
            }
            gesture(ex, 'Interact', t, give, give + 1.58);
            // at work on their strength while the narrator describes it
            const work = Math.min(ease.sine(seg(t, leave0 + 0.5, leave0 + 1.0)), 1 - ease.sine(seg(t, back0 - 0.5, back0)));
            if (work > 0.001) ex.play('Interact', clock * 0.9, { weight: Math.min(0.995, work) });
        } else {
            stroll(ex, BACK, t, back0, back1, { from: EDGE_FACING, to: states.afterAreas.explorer.facing, turn: 0.45 });
        }

        // ---- The teammate ----------------------------------------------------------------------------
        if (t < leave0) {
            stroll(mate, TO_MEET, t, meet0, meet1, { from: SPOT_FACING, to: facingTo(MEET, EDGE) });
            gesture(mate, 'Interact', t, take, take + 1.58);
            mate.nod(seg(t, take + 1.3, take + 1.9));
        } else {
            stroll(mate, FROM_MEET, t, leave0, leave1, { from: facingTo(MEET, EDGE), to: SPOT_FACING });
            // a nod to the explorer as they pass on the way back to the fountain
            if (t > leave1) {
                const k = span([4, 0.45], [4, 0.75]);
                mate.lookAt([ex.pos[0], ex.pos[2]], 0.5 * ease.bump(k));
                mate.nod(span([4, 0.52], [4, 0.68]));
            }
        }

        // ---- Fog: the market lit while it's shown, as in Areas, then let go ----------------------------
        const market = ease.inOut(span([3, 0.0], [3, 0.35])) * (1 - ease.inOut(span([4, 0.15], [4, 0.6])));
        const reveals = REVEALS.afterAreas.slice();
        if (market > 0.004) reveals.push(world.fog.grow({ x: 15.5, z: 0, r: 11 }, market));
        world.fog.set(reveals);

        // ---- District names: Client & Delivery stays bright as the explorer looks to it; the others dim,
        // then come back up, because every area stays part of what's expected. All three are up at the end. -----
        const dim = 0.75 * ease.inOut(span([0, 0.35], [0, 0.85])) * (1 - ease.inOut(span([1, 0.05], [1, 0.4])));
        const labels = group?.userData.labels;
        labels?.set('cd', 1);
        labels?.set('pt', 1 - dim);
        labels?.set('oc', 1 - dim);

        // ---- Camera --------------------------------------------------------------------------------
        const glide = (a, b, k) => world.lerpShot(a, b, k);
        // wide over the square while the names dim and come back, so all three stay in view; then in
        // to the two of them for the handover
        if (t < at(2, 0)) glide('square', NEAR_SQUARE, span([0, 0.1], [1, 0.9]));
        else if (t < at(3, 0.05)) glide(NEAR_SQUARE, PAIR, span([2, 0], [2, 0.4]));
        else if (t < at(4, 0.0)) glide(PAIR, PAST, span([3, 0.05], [3, 0.55]));
        else glide(PAST, 'square', span([4, 0.0], [4, 0.85]));

        // ---- HUD -------------------------------------------------------------------------------------
        world.hud.rows(areaSlots(['cd', 'pt', 'oc']), 1);          // as Areas left them; Your quest fades them
        if (t < at(0, 0.15)) world.hud.quest('Find the three areas', '3/3');
        else if (t < at(4, 0.6)) world.hud.quest('Agree where you go deep', '0/1');
        else world.hud.quest('Agreement made', '1/1');
        const lines = LINES.slice(0, t >= at(3, 0.15) ? 3 : t >= take ? 2 : 1);
        world.hud.card(lines, span([2, 0.05], [4, 0.7]), { label: 'Specialist agreement' });
    },
};
