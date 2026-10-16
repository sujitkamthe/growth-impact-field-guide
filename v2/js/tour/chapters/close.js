// Chapter 10, Your turn: the camera rises high over the valley.
//
// 1. "There's always more of the field to explore..."  A slow pull up from the hamlet to the whole
//    valley: everything revealed so far, villagers going about their day on both banks and out at
//    the farms, the fog easing back a little further at the edges yet still lying beyond them. The
//    explorer looks out across the river and settles. Ends on layout.states.end, where the player
//    offers "Find your scope" and "Watch again".
//
// Starts on layout.states.afterGrowth. Everything is set from `time` alone.

import { beats, keepWorld, valleyDay, lerpAngle } from './_shared2.js';
import { buildSigns } from './_shared.js';     // the principles' signs stay standing

export default {
    id: 'close',

    build(world) {
        const group = new world.THREE.Group();
        group.userData.signs = buildSigns(world);
        group.add(group.userData.signs.group);
        return group;
    },

    update(world, group, time) {
        const { t, span } = beats(time);
        const { mix, ease } = world.util;
        const { states, REVEALS } = world;
        const from = states.afterGrowth, to = states.end;
        const ex = world.explorer;

        world.setTimeOfDay(mix(from.hours, to.hours, ease.inOut(span([0, 0], [0, 0.9]))));
        keepWorld(world);
        group?.userData.signs?.all(1);
        for (const n of ['bridge', 'hamlet', 'windmill']) world.discover(n, 1);
        valleyDay(world, world.clock);

        // the explorer looks out, east and back, and settles facing the village
        const look = span([0, 0.1], [0, 0.75]);
        ex.place(from.explorer.at, lerpAngle(from.explorer.facing, to.explorer.facing, ease.inOut(look)) + 28 * Math.sin(Math.PI * 2 * look) * ease.bump(look));

        world.fog.set(world.fog.between(REVEALS.afterGrowth, REVEALS.final, span([0, 0.1], [0, 0.8])));
        world.lerpShot(from.shot, to.shot, span([0, 0], [0, 0.88]));
        world.hud.quest('A new season: write your expectations', null);
    },
};
