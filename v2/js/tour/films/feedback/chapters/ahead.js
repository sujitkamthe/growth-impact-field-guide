// Feedback film, chapter 7, Looking ahead: the team check looks for what nobody has seen, and something
// to do this week.
//
// 1. "At each team check, look for what nobody has seen yet..."  Late afternoon. The team in its circle
//    between the notice board and the fountain. The HUD's area rows show Client & Delivery and People &
//    Team marked and Building Sahaj's slot still empty; toast, labelled "Team check": "Where is
//    evidence missing?" The teammate from the riverbank speaks, the others nod, and the planner raises a
//    hand to arrange it. Quest box: "Next cycle: an opportunity in Building Sahaj".
// 2. "This week, tell one teammate what you saw them do and what it changed..."  The rows go; the
//    circle carries on talking as the camera pulls up high over the village in golden light, pairs still
//    turning to each other everywhere. Quest box: "This week: tell one, ask one". The player's end card
//    follows.
//
// Starts where Closing the loop ends.

import { run, keepWorld, villageLife, facingTo, beatClock, camera, hoursOver, cartGone, seg, areaSlots, circleAt, CAST, SPOT, SHOT, WAIT, CIRCLE, RING } from './_feedback.js';

export default {
    id: 'ahead',

    build(world) { return new world.THREE.Group(); },

    update(world, group, time) {
        const { t } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;

        hoursOver(world, time, 'loop', 'ahead');
        keepWorld(world);
        villageLife(world, clock);
        cartGone(world);
        V[CAST.presenter].place(SPOT.presenterWait, WAIT.presenter);

        // ---- The circle ---------------------------------------------------------------------------------------
        run(ex, t, clock, {
            at: circleAt('explorer'), facing: facingTo(circleAt('explorer'), circleAt('mate')),
            looks: [{ from: 0.2, at: RING.c, k: 1, turn: 0.8 }],
            nods: [[at(0, 0.8), at(0, 0.9)]],
            gestures: [{ clip: 'Interact', from: at(1, 0.12), to: at(1, 0.34), weight: 0.6 }],
        });
        run(V[CAST.mate], t, clock, {
            at: circleAt('mate'), facing: facingTo(circleAt('mate'), circleAt('explorer')),
            looks: [{ from: 0.3, at: RING.c, k: 1, turn: 0.8 }],
            gestures: [{ clip: 'Interact', from: at(0, 0.14), to: at(0, 0.42), weight: 0.8 }],
            nods: [[at(1, 0.36), at(1, 0.46)]],
        });
        run(V[CAST.planner], t, clock, {
            at: circleAt('planner'), facing: CIRCLE.planner[2],
            // a hand raised: they will arrange it
            gestures: [{ clip: 'Wave', from: at(0, 0.54), to: at(0, 0.8), weight: 0.65 }],
            nods: [[at(0, 0.44), at(0, 0.52)]],
        });
        run(V[CAST.reader], t, clock, {
            at: circleAt('reader'), facing: CIRCLE.reader[2],
            nods: [[at(0, 0.44), at(0, 0.54)]],
            gestures: [{ clip: 'Interact', from: at(1, 0.5), to: at(1, 0.72), weight: 0.6 }],
        });
        run(V[CAST.joiner], t, clock, {
            at: circleAt('joiner'), facing: CIRCLE.joiner[2],
            nods: [[at(0, 0.46), at(0, 0.56)], [at(1, 0.74), at(1, 0.84)]],
        });

        camera(world, t, [
            [0, SHOT.circle],
            [at(1, 0.02), SHOT.circle],
            [at(1, 0.9), SHOT.closeHigh],
        ]);

        // ---- HUD ------------------------------------------------------------------------------------------
        world.hud.notes(4);
        if (t < at(1, 0.14)) {
            // the area rows: two marked, Building Sahaj's slot still empty; in, then out as the camera lifts
            const k = t < at(1, 0) ? seg(t, at(0, 0.06), at(0, 0.26)) : 0.25 * (1 - seg(t, at(1, 0), at(1, 0.12)));
            world.hud.rows(areaSlots(['cd', 'pt']), k);
        }
        world.hud.toast('Where is evidence missing?', seg(t, at(0, 0.05), at(0, 0.6)), { label: 'Team check' });
        if (t < at(0, 0.62)) world.hud.quest('Make feedback a habit', null);
        else if (t < at(1, 0.2)) world.hud.quest('Next cycle: an opportunity in Building Sahaj', null);
        else world.hud.quest('This week: tell one, ask one', null);
    },
};
