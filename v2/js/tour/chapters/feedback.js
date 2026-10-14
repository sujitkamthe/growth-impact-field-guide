// Chapter 6, Along the way: feedback through the season, while the sun crosses the sky.
//
// 1. "As the season goes on, you ask the people you work with for feedback..."  At the board the
//    two teammates who agreed the expectations each hand the explorer a note, then go on their way;
//    the explorer walks round the board and a third teammate comes out of the hall with another.
//    The HUD's notes counter goes 1, 2, 3, and the afternoon wears on.
// 2. "Each note says what they saw, what it changed, and which expectation..."  One note opens as
//    a parchment card in the HUD while the explorer reads it and strolls on to the fountain.
// 3. "You keep every note..."  Three villagers who were chatting on the square come over, one after
//    another, each with a note; the counter settles at 6 in the late golden light. Ends on
//    layout.states.afterFeedback.
//
// Starts on layout.states.afterExpectations. Everything is set from `time` alone.

import { beats, stroll, gesture, keepWorld, villageDay, chatting, lerpAngle, facingTo } from './_shared2.js';
import { buildSigns } from './_shared.js';     // the principles' signs stay standing

const NOTE = [
    'What I saw: you untangled the flaky release pipeline',
    'What it changed: our releases went out on time all month',
    'Which expectation: Client & Delivery, delivering reliably',
];

// The explorer: round the board's north end to meet the teammate from the hall, then on to the
// fountain.
const ROUND_BOARD = [[-5.9, 9.3], [-4.9, 7.95], [-3.8, 6.9], [-3.0, 6.55]];
const TO_FOUNTAIN = [[-3.0, 6.55], [-0.8, 5.7], [1.4, 5.4], [3.4, 6.4]];
// The teammates at the board go on their way: one to the lake shore, one home.
const TO_LAKE = [[-5.2, 7.85], [-7.6, 6.6], [-9.6, 3.6], [-11.8, 0.9]];
const HOME = [[-5.5, 10.6], [-6.9, 11.0], [-8.8, 12.0], [-11.5, 12.6]];
// The teammate from the hall, and back.
const FROM_HALL = [[-1.3, -0.5], [-1.9, 2.6], [-1.9, 5.75]];
// The chatting villagers step over to the explorer at the fountain: [index, from, to].
const COME_OVER = [[5, [5.6, 8.4], [4.8, 7.4]], [4, [4.2, 9.9], [3.5, 8.0]], [6, [0.6, 8.8], [2.15, 7.35]]];

export default {
    id: 'feedback',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.signs = buildSigns(world);
        group.add(group.userData.signs.group);
        return group;
    },

    update(world, group, time) {
        const { t, at, span } = beats(time);
        const { mix, ease } = world.util;
        const { states, REVEALS } = world;
        const ex = world.explorer;
        const v = world.villagers;
        const front = states.afterExpectations.explorer;
        const end = states.afterFeedback.explorer;

        // The afternoon passes: the sun sweeps west and the light turns golden.
        world.setTimeOfDay(mix(states.afterExpectations.hours, states.afterFeedback.hours, t / time.duration));
        world.fog.set(REVEALS.afterFeedback);
        keepWorld(world);
        group?.userData.signs?.all(1);
        villageDay(world, world.clock);

        // ---- At the board: two notes -----------------------------------------------------------------
        const r1At = [-5.2, 7.85], r2At = [-5.5, 10.6];
        const toR1 = facingTo(front.at, r1At), toR2 = facingTo(front.at, r2At);
        if (t < at(0, 0.43)) {
            let f = lerpAngle(front.facing, toR1, ease.inOut(span([0, 0], [0, 0.05])));
            f = lerpAngle(f, toR2, ease.inOut(span([0, 0.2], [0, 0.26])));
            ex.place(front.at, f);
        }
        gesture(ex, 'Interact', t, at(0, 0.04), at(0, 0.04) + 1.3);
        gesture(ex, 'Interact', t, at(0, 0.24), at(0, 0.24) + 1.3);

        // the first teammate turns to the explorer, hands over a note and heads for the lake
        if (t < at(0, 0.22)) {
            v[0].place(r1At, lerpAngle(186, facingTo(r1At, front.at), ease.inOut(span([0, 0], [0, 0.04]))));
            gesture(v[0], 'Interact', t, at(0, 0.02), at(0, 0.02) + 1.58);
        } else {
            const k = stroll(v[0], TO_LAKE, t, at(0, 0.22), at(1, 0.55), { from: facingTo(r1At, front.at), to: 328 });
            if (k >= 1) v[0].face(328);
        }
        // the second hands over hers and goes home
        if (t < at(0, 0.42)) {
            v[1].place(r2At, lerpAngle(5, facingTo(r2At, front.at), ease.inOut(span([0, 0.12], [0, 0.18]))));
            gesture(v[1], 'Interact', t, at(0, 0.2), at(0, 0.2) + 1.58);
        } else {
            stroll(v[1], HOME, t, at(0, 0.42), at(1, 0.08), { from: facingTo(r2At, front.at) });
            v[1].show(1 - ease.inOut(span([1, 0.0], [1, 0.1])));
        }

        // ---- Round the board, and a note from the hall --------------------------------------------------
        const stop = ROUND_BOARD.at(-1);
        const hallAt = FROM_HALL.at(-1);
        if (t >= at(0, 0.43) && t < at(1, 0.3)) {
            stroll(ex, ROUND_BOARD, t, at(0, 0.43), at(0, 0.9), { from: toR2 });
            ex.face(lerpAngle(ex.facing, facingTo(stop, hallAt), ease.inOut(span([0, 0.86], [0, 0.94]))));
        }
        gesture(ex, 'Interact', t, at(0, 0.88), at(0, 0.88) + 1.3);
        if (t >= at(0, 0.18) && t < at(1, 0.95)) {
            if (t < at(1, 0.12)) {
                stroll(v[2], FROM_HALL, t, at(0, 0.24), at(0, 0.88), { to: facingTo(hallAt, stop) });
                v[2].show(ease.out(span([0, 0.18], [0, 0.3])));
                gesture(v[2], 'Interact', t, at(0, 0.84), at(0, 0.84) + 1.58);
            } else {
                // a nod, and back to the hall
                stroll(v[2], FROM_HALL.slice().reverse(), t, at(1, 0.12), at(1, 0.85), { from: facingTo(hallAt, stop) });
                v[2].show(1 - ease.inOut(span([1, 0.82], [1, 0.95])));
            }
        }
        v[2].nod(span([1, 0.02], [1, 0.14]));

        // ---- Reading the note, and on to the fountain ------------------------------------------------------
        if (t >= at(1, 0.3)) {
            stroll(ex, TO_FOUNTAIN, t, at(1, 0.3), at(2, 0.22), { from: facingTo(stop, hallAt) });
        }

        // ---- At the fountain: three more notes ---------------------------------------------------------------
        const comeAt = [at(1, 0.85), at(1, 0.9), at(2, 0.05)];
        const arriveAt = [at(2, 0.2), at(2, 0.38), at(2, 0.52)];
        chatting(world, world.clock, COME_OVER.filter((c, i) => t >= comeAt[i]).map(c => c[0]));
        COME_OVER.forEach(([i, from, to], n) => {
            const p = v[i];
            if (t < comeAt[n]) {
                // they look round as the explorer comes across the square
                if (t > at(1, 0.4)) p.lookAt([ex.pos[0], ex.pos[2]], 0.6 * ease.inOut(span([1, 0.4], [1, 0.7])));
                return;
            }
            stroll(p, [from, to], t, comeAt[n], arriveAt[n], { to: facingTo(to, end.at) });
            gesture(p, 'Interact', t, arriveAt[n], arriveAt[n] + 1.4);
        });
        if (t >= at(2, 0.18)) {
            // the explorer turns to each in turn, takes their note, and settles facing the square
            let f = ex.facing;
            const faceTo = n => facingTo(end.at, COME_OVER[n][2]);
            f = lerpAngle(f, faceTo(0), ease.inOut(span([2, 0.18], [2, 0.26])));
            f = lerpAngle(f, faceTo(1), ease.inOut(span([2, 0.36], [2, 0.44])));
            f = lerpAngle(f, faceTo(2), ease.inOut(span([2, 0.5], [2, 0.58])));
            f = lerpAngle(f, end.facing, ease.inOut(span([2, 0.68], [2, 0.8])));
            ex.face(f);
            arriveAt.forEach(a => gesture(ex, 'Interact', t, a + 0.15, a + 1.15, { blend: 0.2 }));
        }

        // ---- Camera ------------------------------------------------------------------------------------------------
        const [x, y, z] = ex.pos;
        const follow = { target: [x, y + 0.9, z], distance: 32, yaw: 64, pitch: 46, fov: 28 };
        const wide = { target: [x + 1, y + 0.9, z - 0.5], distance: 40, yaw: 34, pitch: 48, fov: 28 };
        if (t < at(1, 0)) world.lerpShot('noticeBoard', follow, span([0, 0.36], [0, 0.95]));
        else if (t < at(2, 0)) world.lerpShot(follow, wide, span([1, 0], [1, 1]), { eased: false });
        else world.lerpShot(wide, 'square', span([2, 0], [2, 0.78]));

        // ---- HUD ----------------------------------------------------------------------------------------------------
        world.hud.quest(t < at(0, 0.05) ? 'Expectations agreed' : 'Gather feedback as you go', t < at(0, 0.05) ? '1/1' : null);
        const marks = [at(0, 0.17), at(0, 0.37), at(0, 0.97), at(2, 0.36), at(2, 0.52), at(2, 0.66)];
        const notes = marks.filter(m => t >= m).length;
        if (notes > 0) world.hud.notes(notes);
        world.hud.card(NOTE, span([1, 0.06], [1, 0.94]), { label: 'A note from a teammate' });
    },
};
