// Org film, chapter 2, Three ways to contribute: each way shown as people doing it.
//
// 1. "There are three ways to contribute, and you can choose one or more."  A fingerpost rises where
//    the road from the plot meets the village, its three amber arms swinging out, as the explorer
//    walks up to it. Toast "Three ways to contribute"; quest "Choose one or more" 0/3.
// 2. "Culture and organisational health..."  A newcomer comes in along the west road; the explorer
//    meets them with a wave and walks them over to the people by the notice board, who wave hello;
//    then the explorer raises a hand in that small gathering: speaking up. Quest 1/3.
// 3. "Initiatives and capability..."  At the workshop by the hall, the explorer and two villagers
//    build a tool at the workbench (a new wheel appears on it); in the meadow beside it a villager
//    teaches two others (a capability track). Quest 2/3.
// 4. "Community and external contribution..."  DevDay: the stage rises in the square with the
//    speaker on it, amber banners unfurl, lanterns light and a crowd gathers; the explorer pins a
//    written note to the notice board. Quest 3/3. Ends with the explorer at the board.
//
// Starts where Built by all of us ends. Everything is set from `time` alone.

import { buildVillage, AFTER, keepWorld, run, SPOT, CLASS, CROWD, SHOT, HOURS, PATH, WAYS, STAGE_TOP, ease, seg, mix } from './_org.js';
import { beatClock, camera } from '../../../chapters/_shared.js';

const AT_POST = PATH.toFingerpost.at(-1);          // where the explorer stops by the fingerpost
const MEET = [-10.4, 9.7];                         // where the explorer meets the newcomer
const NEWCOMER_STOP = [-10.7, 8.7];               // and where the newcomer stops, a step short
const BY_BOARD = { explorer: [-7.6, 9.8], newcomer: [-7.9, 11.0] };

export default {
    id: 'ways',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.v = buildVillage(world, group);
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const at = beatClock(time);
        const clock = world.clock;
        const V = world.villagers, ex = world.explorer;
        const set = group?.userData.v;
        const bench = set?.workshop.spots;
        const speaker = set?.stage.speaker ?? [-0.3, 4.5];

        world.setTimeOfDay(mix(HOURS.together, HOURS.ways, ease.inOut(seg(t, 0, duration))));
        world.fog.set(world.REVEALS.afterScopes);
        keepWorld(world, ease.out(seg(t, at(3, 0.15), at(3, 0.8))), { note: 0 });

        // ---- The explorer -------------------------------------------------------------------------------
        run(ex, t, clock, {
            at: PATH.plotOut.at(-1), facing: 22,
            moves: [
                { t: 0.25, turn: 0.25, path: PATH.toFingerpost, face: 60 },
                { by: at(1, 0.36), path: [AT_POST, [-10.3, 11.4], MEET], face: 343 },
                { t: at(1, 0.55), path: [MEET, [-8.8, 9.6], BY_BOARD.explorer], face: 85 },
                { t: at(2, 0.02), path: [BY_BOARD.explorer, [-7.9, 7.0], bench?.end ?? [-7.1, 4.2]], face: 75 },
                { t: at(3, 0.06), path: [bench?.end ?? [-7.1, 4.2], [-7.6, 6.6], [-6.8, 8.6], SPOT.boardFront], face: 90 },
            ],
            gestures: [
                { clip: 'Wave', from: at(1, 0.38), to: at(1, 0.54), weight: 0.9 },
                // speaking up: a hand raised in the gathering, held into the next beat
                { clip: 'Wave', from: at(1, 0.84), to: at(2, 0.06), rate: 0.5, weight: 0.85 },
                { clip: 'Interact', from: at(2, 0.5), to: at(2, 0.86) },
                { clip: 'Interact', from: at(3, 0.57), to: at(3, 0.82) },
            ],
        });

        // ---- The newcomer: in along the west road, welcomed, then off to settle in by the plot -----------
        run(V[10], t, clock, {
            at: [-13.4, 8.0], facing: 90,
            moves: [
                { by: at(1, 0.4), path: [[-13.4, 8.0], [-11.4, 8.0], NEWCOMER_STOP], face: 163 },
                { t: at(1, 0.57), path: [NEWCOMER_STOP, [-9.2, 10.0], BY_BOARD.newcomer], face: 100 },
                { t: at(2, 0.25), path: [BY_BOARD.newcomer, [-9.6, 12.8], [-10.8, 15.2], [-12.0, 16.6], [-14.0, 16.9], [-16.6, 15.6], [-17.4, 16.3]], face: 115 },
            ],
            gestures: [{ clip: 'Wave', from: at(1, 0.44), to: at(1, 0.58), weight: 0.85 }],
            nods: [[at(1, 0.78), at(1, 0.9)]],
        });

        // ---- The gathering by the board: they turn and wave hello, then head for DevDay ------------------
        run(V[0], t, clock, {
            at: [-6.0, 8.4], facing: 72,
            moves: [{ t: at(2, 0.94), path: [[-6.0, 8.4], [-5.0, 6.6], [-3.0, 6.3], [-1.0, 6.4], [CROWD[1][0], CROWD[1][1]]], face: CROWD[1][2] }],
            looks: [{ from: at(1, 0.6), to: at(2, 0.3), at: BY_BOARD.newcomer, k: 0.9 }],
            gestures: [{ clip: 'Wave', from: at(1, 0.68), to: at(1, 0.84), weight: 0.85 }],
        });
        run(V[1], t, clock, {
            at: [-6.1, 10.2], facing: 104,
            moves: [{ t: at(3, 0.04), path: [[-6.1, 10.2], [-5.2, 11.4], [-3.0, 11.2], [CROWD[3][0], CROWD[3][1]]], face: CROWD[3][2] }],
            looks: [{ from: at(1, 0.62), to: at(2, 0.3), at: BY_BOARD.newcomer, k: 0.9 }],
            gestures: [{ clip: 'Wave', from: at(1, 0.72), to: at(1, 0.88), weight: 0.85 }],
        });

        // ---- The workshop: two at the bench, the banner hanger joining them -------------------------------
        run(V[9], t, clock, { at: bench?.backLeft ?? [-6.96, 3.16], facing: 165, loops: [{ from: -1, clip: 'Interact', phase: 0.6 }] });
        run(V[4], t, clock, {
            at: [-2.25, 5.45], facing: 0,
            moves: [
                { t: at(1, 0.1), path: [[-2.25, 5.45], [-3.0, 3.6], [-3.5, 2.75], bench?.backRight ?? [-4.72, 2.61]], face: 165 },
                // the tool made, off to DevDay
                { t: at(3, 0.08), path: [bench?.backRight ?? [-4.72, 2.61], [-3.6, 3.2], [-3.2, 5.8], [-2.2, 6.6], [CROWD[0][0], CROWD[0][1]]], face: CROWD[0][2] },
            ],
            loops: [{ from: at(1, 0.6), to: at(3, 0.02), clip: 'Interact', phase: 0.2 }],
        });

        // ---- The class in the meadow ---------------------------------------------------------------------
        const [tx, tz, tf] = CLASS.teacher, [ax, az, af] = CLASS.a, [bx, bz, bf] = CLASS.b;
        run(V[8], t, clock, { at: [tx, tz], facing: tf, loops: [{ from: -1, clip: 'Interact', phase: 0.5, rate: 0.7, weight: 0.7 }], gestures: [{ clip: 'Wave', from: at(2, 0.7), to: at(2, 0.86), weight: 0.6 }] });
        run(V[5], t, clock, { at: [ax, az], facing: af, nods: [[at(2, 0.74), at(2, 0.86)]] });
        run(V[6], t, clock, { at: [bx, bz], facing: bf, nods: [[at(2, 0.8), at(2, 0.92)]] });

        // ---- The fence mender heads over for DevDay -----------------------------------------------------
        run(V[7], t, clock, {
            at: [-19.3, 7.4], facing: 180,
            moves: [{ t: at(1, 0.45), path: [[-19.3, 7.4], [-16.0, 7.8], [-13.4, 8.0], [-11.4, 8.0], [-8.6, 7.6], [-6.4, 7.0], [-4.4, 6.4], [-2.9, 7.6], [-1.6, 8.2], [CROWD[4][0], CROWD[4][1]]], face: CROWD[4][2] }],
        });

        // ---- The speaker takes her place, and the stage rises under her --------------------------------
        const rise = ease.out(seg(t, at(3, 0.0), at(3, 0.35)));
        run(V[3], t, clock, {
            at: [-0.4, 6.9], facing: 321,
            moves: [{ t: at(2, 0.2), path: [[-0.4, 6.9], [-0.6, 5.6], speaker], face: 180 }],
            loops: [{ from: at(3, 0.45), clip: 'Interact', phase: 0.1, rate: 0.8, weight: 0.8 }],
            gestures: [{ clip: 'Wave', from: at(3, 0.72), to: at(3, 0.88), weight: 0.7 }],
        });
        set?.tip.lift(V[3], STAGE_TOP * rise);

        // ---- The plot: the teammate at work --------------------------------------------------------------
        run(V[2], t, clock, { at: SPOT.plotWork, facing: 270, loops: [{ from: -1, clip: 'Interact', phase: 0.3 }] });

        // ---- Props ---------------------------------------------------------------------------------------
        const arms = [0, 1, 2].map(i => seg(t, at(0, 0.25 + i * 0.12), at(0, 0.55 + i * 0.12)));
        // each arm lights while its way is shown, and keeps a soft glow after
        const lit = [1, 2, 3].map(b => {
            const on = ease.out(seg(t, at(b, 0), at(b, 0.15)));
            return b < 3 ? mix(on, 0.3, seg(t, at(b + 1, 0), at(b + 1, 0.15))) : on;
        });
        set?.apply({
            ...AFTER.together,
            fingerpost: { rise: seg(t, at(0, 0.0), at(0, 0.45)), arms, lit },
            workshop: { tool: seg(t, at(2, 0.52), at(2, 0.85)) },
            stage: { rise, banners: [1, seg(t, at(3, 0.25), at(3, 0.6))], lights: seg(t, at(3, 0.3), at(3, 0.6)) },
        }, clock);
        world.props.noticeSheet.show(seg(t, at(3, 0.6), at(3, 0.72)));
        world.props.noticeSheet.write(seg(t, at(3, 0.66), at(3, 0.88)));

        // ---- Camera --------------------------------------------------------------------------------------
        camera(world, t, [
            [0, SHOT.plotRoad],
            [at(0, 0.75), SHOT.fingerpost],
            [at(1, 0.05), SHOT.fingerpost],
            [at(1, 0.5), SHOT.culture],
            [at(1, 0.95), SHOT.culture],
            [at(2, 0.42), SHOT.workshop],
            [at(2, 0.6), SHOT.workshop],
            [at(2, 0.9), SHOT.classView],
            [at(3, 0.04), SHOT.classView],
            [at(3, 0.4), SHOT.devday],
            [at(3, 0.56), SHOT.devday],
            [at(3, 0.9), SHOT.note],
        ]);

        // ---- HUD -----------------------------------------------------------------------------------------
        const done = [1, 2, 3].filter(i => t >= at(i, 0.1)).length;
        if (t >= at(0, 0.2)) world.hud.quest('Choose one or more', `${done}/3`);
        else world.hud.quest('Contribute to the village', null);
        world.hud.toast('Three ways to contribute', seg(t, at(0, 0.08), at(0, 0.95)), { label: 'Building Sahaj' });
        WAYS.forEach((way, i) => {
            const k = seg(t, at(i + 1, 0.02), at(i + 1, 0.6));
            if (k > 0 && k < 1) world.hud.toast(way.name, k, { label: 'Way to contribute' });
        });
    },
};
