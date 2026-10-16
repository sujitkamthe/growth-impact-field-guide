// Chapter 8, Around the fire: dusk, the evening fire in the square, and looking back.
//
// 1. "At the end of the cycle, you look back one area at a time..."  The explorer walks from the
//    fountain to a seat by the fire spot while teammates take their places around it; one kneels and
//    lights the fire. Dusk falls. The HUD's three area rows appear, still empty.
// 2. "For each area, you say what changed because of you..."  The camera comes down to the fire; the
//    rows fill in one by one (Meets, Exceeds, Meets) and the explorer nods at each.
// 3. "Then, around the fire, your teammates confirm, correct or add..."  Another teammate walks up
//    across the square; one by one they nod, and the newcomer adds a note (the counter goes to 7).
//    Ends on layout.states.afterSelfAssessment.
//
// Nobody stands on the log seats or in the fire: people move through the fire's spot only before it
// is lit (the seats appear with the flames) and stand in the gaps between the logs (FIRE_SPOTS).
//
// Starts on layout.states.afterFeedback. Everything is set from `time` alone.

import { beats, stroll, stepBack, gesture, keepWorld, villageDay, FIRE_SPOTS, facingTo } from './_shared2.js';
import { buildSigns } from './_shared.js';     // the principles' signs stay standing

const FIRE = [1.2, 7.8];
const TO_SEAT = [[3.4, 6.4], [2.4, 5.9], [0.9, 6.1], [-0.4, 6.3]];
const KNEEL = [2.35, 7.9];                                   // inside the ring, by the fire, to light it
const V4_TO_FIRE = [[3.5, 8.0], KNEEL];
const V5_TO_SPOT = [[4.8, 7.4], [2.9, 6.6], FIRE_SPOTS.b.at];
const V6_TO_SPOT = [[2.15, 7.35], [1.4, 9.0], FIRE_SPOTS.c.at];
// A teammate from the market crosses the square at dusk and stands behind the ring.
const FROM_MARKET = [[11.9, 1.9], [9.4, 2.4], [5.0, 0.9], [2.3, 1.6], [2.2, 4.4]];
const LAKE_SHORE = [-11.8, 0.9];

// Over the fire from above, then down at its level (looking past the lanterns, not through them).
const FIRE_HIGH = { target: [1.0, 1.0, 7.2], distance: 24, yaw: 52, pitch: 32, fov: 30 };
const FIRE_LOW = { target: [0.9, 1.3, 7.4], distance: 12.5, yaw: 56, pitch: 13, fov: 32 };

export default {
    id: 'self-assessment',

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
        const start = states.afterFeedback.explorer, seat = states.afterSelfAssessment.explorer;

        world.setTimeOfDay(mix(states.afterFeedback.hours, states.afterSelfAssessment.hours, ease.sine(t / time.duration)));
        world.fog.set(REVEALS.afterSelfAssessment);
        keepWorld(world);
        group?.userData.signs?.all(1);
        villageDay(world, world.clock, t >= at(1, 0) ? [3] : []);
        v[0].place(LAKE_SHORE, 328);

        // ---- To the fire ------------------------------------------------------------------------------
        stroll(ex, TO_SEAT, t, at(0, 0.03), at(0, 0.6), { from: start.facing, to: seat.facing });
        // the rows fill: a small nod at each
        [0.18, 0.42, 0.66].forEach(f => { const k = span([1, f], [1, f + 0.14]); if (k > 0 && k < 1) ex.nod(k); });

        // one teammate kneels and lights the fire, then steps back to their place
        if (t < at(0, 0.8)) {
            stroll(v[4], V4_TO_FIRE, t, at(0, 0.12), at(0, 0.4), { from: facingTo([3.5, 8.0], start.at), to: 270 });
            gesture(v[4], 'Interact', t, at(0, 0.42), at(0, 0.42) + 1.58);
        } else {
            stepBack(v[4], KNEEL, FIRE_SPOTS.a.at, t, at(0, 0.8), at(0, 0.98), 270, FIRE_SPOTS.a.facing);
        }
        stroll(v[5], V5_TO_SPOT, t, at(0, 0.2), at(0, 0.62), { from: facingTo([4.8, 7.4], start.at), to: FIRE_SPOTS.b.facing });
        stroll(v[6], V6_TO_SPOT, t, at(0, 0.08), at(0, 0.5), { from: facingTo([2.15, 7.35], start.at), to: FIRE_SPOTS.c.facing });
        world.props.campfire.light(ease.out(span([0, 0.6], [0, 0.92])));

        // ---- Teammates confirm, correct, add -------------------------------------------------------------
        if (t >= at(1, 0)) {
            stroll(v[3], FROM_MARKET, t, at(1, 0), at(2, 0.4), { from: 96, to: facingTo(FROM_MARKET.at(-1), FIRE) });
            gesture(v[3], 'Interact', t, at(2, 0.55), at(2, 0.55) + 1.58);
        }
        // as the explorer finishes, the others glance across at them
        for (const [i, s] of [[4, FIRE_SPOTS.a], [5, FIRE_SPOTS.b], [6, FIRE_SPOTS.c]]) {
            if (t > at(1, 0.1)) v[i].lookAt(seat.at, 0.45 * ease.inOut(span([1, 0.1], [1, 0.3])));
        }
        v[5].nod(span([2, 0.12], [2, 0.3]));
        v[4].nod(span([2, 0.28], [2, 0.46]));
        v[6].nod(span([2, 0.44], [2, 0.62]));

        // ---- Camera --------------------------------------------------------------------------------------
        if (t < at(1, 0)) world.lerpShot('square', FIRE_HIGH, span([0, 0.05], [0, 0.9]));
        else if (t < at(2, 0)) world.lerpShot(FIRE_HIGH, FIRE_LOW, span([1, 0], [1, 0.85]));
        else world.lerpShot(FIRE_LOW, 'fire', span([2, 0.65], [2, 0.98]));

        // ---- HUD -----------------------------------------------------------------------------------------
        world.hud.quest(t < at(0, 0.08) ? 'Gather feedback as you go' : t < at(2, 0) ? 'Look back on the cycle' : 'Team check', null);
        world.hud.toast('The team check', span([2, 0], [2, 0.5]));
        world.hud.notes(t >= at(2, 0.72) ? 7 : 6);
        if (t >= at(0, 0.55)) {
            const rated = f => t >= at(1, f);
            world.hud.rows([
                ['cd', rated(0.18) ? 'Meets' : null],
                ['pt', rated(0.42) ? 'Exceeds' : null],
                ['oc', rated(0.66) ? 'Meets' : null],
            ], span([0, 0.55], [0, 0.75]));
        }
    },
};
