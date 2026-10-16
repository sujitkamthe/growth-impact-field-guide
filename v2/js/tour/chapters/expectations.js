// Chapter 6, Your quest: the explorer writes down what they will take on and the team agrees it.
//
// 1. "Every cycle begins like a new quest..."  A new quest in the HUD, "Write your expectations".
//    The explorer turns from the fountain and walks across the square to the notice board, the
//    camera following from above and then craning down towards the board.
// 2. "Your scope, anything specific..."  Close on the board: the explorer pins up a fresh sheet and
//    its lines fill in, one by one.
// 3. "Your teammates read it..."  Two teammates walk up, one from the hall and one from the houses,
//    and read it; one points at the sheet, the explorer changes a line, and they all wave. The quest
//    box ticks: "Expectations agreed". Ends on layout.states.afterExpectations.
//
// Starts on layout.states.afterAreas. Everything is set from `time` alone.

import { beats, stroll, stepBack, gesture, keepWorld, villageDay, chatting, lerpAngle, facingTo } from './_shared2.js';
import { buildSigns, buildDistrictLabels, areaSlots } from './_shared.js';     // signs stay; Areas' names and rows fade

// The walk from the fountain round the north end of the board to the new sheet's side, within reach.
const TO_BOARD = [[3.4, 6.4], [1.6, 5.7], [-1.2, 6.3], [-3.6, 6.8], [-4.6, 7.6], [-4.45, 9.0]];
const AT_SHEET = [-4.45, 9.0], AT_SHEET_FACING = 131;
// Two teammates: one out of the hall's door, one from the square's south side, where they watch
// the explorer go by.
const FROM_HALL = [[-1.3, -0.5], [-2.0, 2.9], [-3.5, 5.6], [-4.6, 6.9], [-5.2, 7.85]];
const FROM_SQUARE = [[2.6, 9.8], [-1.0, 11.2], [-3.0, 12.0], [-4.8, 11.8], [-5.5, 10.6]];
const SHEET = [-3.68, 9.68];        // where the new sheet hangs on the board

// Close on the board from the south-west, the explorer beside the new sheet in the middle of the frame.
const CLOSE = { target: [-3.85, 1.35, 9.4], distance: 7.4, yaw: 288, pitch: 11, fov: 30 };

export default {
    id: 'expectations',

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
        const { mix, ease } = world.util;
        const { states, REVEALS } = world;
        const ex = world.explorer;
        const [r1, r2] = world.villagers;
        const sheet = world.props.noticeSheet;

        world.setTimeOfDay(mix(states.afterAreas.hours, states.afterExpectations.hours, t / time.duration));
        world.fog.set(REVEALS.afterExpectations);
        keepWorld(world);
        group?.userData.signs?.all(1);
        // the area names and rows Areas ended on fade away as this chapter begins
        const areasOut = 1 - ease.inOut(span([0, 0], [0, 0.22]));
        for (const area of ['cd', 'pt', 'oc']) group?.userData.labels?.set(area, areasOut);
        if (areasOut > 0) world.hud.rows(areaSlots(['cd', 'pt', 'oc']), areasOut);
        villageDay(world, world.clock, [0, 1]);
        chatting(world, world.clock);

        // ---- The explorer: to the board, pin the sheet, change a line, step back, wave -----------------
        const front = states.afterExpectations.explorer;
        if (t < at(2, 0.56)) {
            stroll(ex, TO_BOARD, t, at(0, 0.03), at(1, 0.42), { from: states.afterAreas.explorer.facing, to: AT_SHEET_FACING, turn: 0.5 });
        } else {
            // back from the board to where a reader stands, turning to face it square on
            stepBack(ex, AT_SHEET, front.at, t, at(2, 0.56), at(2, 0.72), AT_SHEET_FACING, front.facing);
        }
        gesture(ex, 'Interact', t, at(1, 0.42), at(1, 0.42) + 1.58);                 // pinning it up
        gesture(ex, 'Interact', t, at(2, 0.36), at(2, 0.36) + 1.58);                 // changing a line
        // a turn towards the teammates to wave, and back to the board
        const wave = span([2, 0.68], [2, 0.88]);
        if (wave > 0 && wave < 1) {
            ex.face(lerpAngle(front.facing, 40, ease.bump(wave)));
            gesture(ex, 'Wave', t, at(2, 0.68), at(2, 0.86), { weight: 0.9 });
        }

        // ---- The sheet ------------------------------------------------------------------------------
        sheet.show(span([1, 0.5], [1, 0.66]));
        // the lines fill as the narrator lists them; the last is rewritten when a teammate asks
        const rewrite = ease.bump(span([2, 0.46], [2, 0.66]));
        sheet.write(span([1, 0.6], [1, 0.9]) * (1 - 0.22 * rewrite));

        // ---- The teammates ----------------------------------------------------------------------------
        // out of the hall's door, across the square, to the board's north side
        r1.show(0);
        if (t >= at(0, 0.9)) {
            stroll(r1, FROM_HALL, t, at(1, 0), at(2, 0.24), { to: 131 });
            r1.show(ease.out(span([0, 0.9], [1, 0.08])));
        }
        // standing on the square's south side, watching the explorer pass, then following to read
        const watching = lerpAngle(300, facingTo(FROM_SQUARE[0], [ex.pos[0], ex.pos[2]]), 0.8);
        if (t < at(1, 0.02)) r2.place(FROM_SQUARE[0], watching);
        else stroll(r2, FROM_SQUARE, t, at(1, 0.02), at(2, 0.26), { from: watching, to: 62 });
        // they read it; one points at a line; then both turn to the explorer and wave
        if (t >= at(2, 0.2)) {
            r1.lookAt(SHEET, 1);
            r2.lookAt(SHEET, 1);
            gesture(r1, 'Interact', t, at(2, 0.22), at(2, 0.22) + 1.58);
            const turn = ease.inOut(span([2, 0.56], [2, 0.66]));
            r1.face(lerpAngle(r1.facing, 186, turn));
            r2.face(lerpAngle(r2.facing, 5, turn));
            gesture(r1, 'Wave', t, at(2, 0.62), at(2, 0.84));
            gesture(r2, 'Wave', t, at(2, 0.64), at(2, 0.86));
        }

        // ---- Camera ---------------------------------------------------------------------------------------
        const [x, y, z] = ex.pos;
        const follow = { target: [x, y + 0.9, z], distance: 30, yaw: 4, pitch: 44, fov: 28 };
        if (t < at(0, 0.7)) world.lerpShot('square', follow, span([0, 0], [0, 0.7]));
        else if (t < at(2, 0)) world.lerpShot(follow, CLOSE, span([0, 0.7], [1, 0.4]));
        else world.lerpShot(CLOSE, 'noticeBoard', span([2, 0.02], [2, 0.5]));

        // ---- HUD ----------------------------------------------------------------------------------------
        if (t >= at(2, 0.6)) world.hud.quest('Expectations agreed', '1/1');
        else if (t >= at(0, 0.1)) world.hud.quest('Write your expectations', '0/1');
    },
};

