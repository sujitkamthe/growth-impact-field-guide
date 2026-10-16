// Chapter 9, Further: growing into the next scope, told with the reach rings from Scopes.
//
// 1. "You grow by taking on some of the next scope's responsibilities, usually as a stretch."  The
//    fire's evening ends: everyone heads home and the camera rises over the village as dusk turns into
//    the blue before sunrise. The rings come back: Extended, the explorer's own reach, lit as theirs;
//    Direct dimmed inside it; Team, the next scope, dashed and faint. Morning: the explorer is at work
//    in the market, Client & Delivery, inside the Team ring but beyond their own.
// 2. "Strong next-scope impact in one area is rated as exceeding."  The Team ring's Client & Delivery
//    arc fills solid in teal and the HUD row reads Client & Delivery · Exceeds.
// 3. "Once the people around you depend on that impact in all three areas..."  The explorer crosses to
//    the square (Org & Community) and the people of all three districts turn to them; the blue and
//    amber arcs fill, the Team ring becomes the explorer's own (Extended dims to an inner ring) and the
//    fog lifts out to it and stays. Quest: "Your reach has grown".
// 4. "Then a new season begins..."  Sunrise light sweeps the valley as the camera rises; the rings
//    settle away and a new quest appears. Ends on layout.states.afterGrowth.
//
// No black frame: dusk at 19:00 and the light before sunrise look alike, so the time of day crosses
// from one to the other while the camera is rising and the village is empty.
//
// Starts on layout.states.afterSelfAssessment. Everything is set from `time` alone.

import { beatClock, line, stroll, travel, follow, camera, turnTo, bearing, buildRings, buildDistrictLabels, buildSigns } from './_shared.js';
import { keepWorld, valleyDay, villageDay, FIRE_SPOTS, facingTo } from './_shared2.js';

const FIRE = [1.2, 7.8];
const LAKE_SHORE = [-11.8, 0.9];                         // where Self-assessment leaves villager 0
const AT_STALL = { at: [12.8, 6.2], facing: 92 };        // Client & Delivery: at the red stall's front
const TO_SQUARE = [[12.8, 6.2], [10.4, 4.4], [8.2, 2.4], [7.0, 1.0]];   // to Org & Community, by the fountain
const LABEL_AT = { direct: 20, extended: 325, team: 52 };

const RISE = { target: [2, 0, 8], distance: 118, yaw: 14, pitch: 58, fov: 28 };
const MARKET_VIEW = { target: [20, 0.6, 4.5], distance: 54, yaw: 14, pitch: 54, fov: 28 };
const TEAM_VIEW = { target: [3, 0, 6], distance: 132, yaw: 12, pitch: 60, fov: 28 };

export default {
    id: 'growth',

    build(world) {
        const group = new world.THREE.Group();
        const rings = buildRings(world, { labelAt: LABEL_AT, keys: ['direct', 'extended', 'team'] });
        const labels = buildDistrictLabels(world);
        const signs = buildSigns(world);
        group.add(rings.group, labels.group, signs.group);
        Object.assign(group.userData, { rings, labels, signs });
        return group;
    },

    update(world, group, time) {
        const { t, duration } = time;
        const { seg, ease, mix } = world.util;
        const { states, REVEALS } = world;
        const at = beatClock(time);
        const ex = world.explorer;
        const v = world.villagers;
        const clock = world.clock;
        const seat = states.afterSelfAssessment.explorer, end = states.afterGrowth.explorer;
        const night = at(0, 0.36);                              // dusk crosses into the light before sunrise

        // ---- Light ----------------------------------------------------------------------------------
        if (t < night) world.setTimeOfDay(mix(states.afterSelfAssessment.hours, 19.3, seg(t, 0, night)));
        else if (t < at(3, 0)) world.setTimeOfDay(mix(6.1, 6.8, seg(t, night, at(3, 0))));
        else world.setTimeOfDay(mix(6.8, states.afterGrowth.hours, ease.inOut(seg(t, at(3, 0), at(3, 0.88)))));
        keepWorld(world);
        group?.userData.signs?.all(1);

        // ---- Evening: everyone leaves the fire ------------------------------------------------------
        if (t < night) {
            world.props.campfire.light(1 - ease.inOut(seg(t, at(0, 0.14), night)));
            // each turns from the fire and walks off at an easy pace, fading into the dusk
            const turnAt = at(0, 0.05), walkAt = turnAt + 0.5;
            const AWAY = 1.8, walk = stroll(walkAt, AWAY, { pace: 1.2 });
            const away = (p, from, facing, alpha) => {
                const dx = from[0] - FIRE[0], dz = from[1] - FIRE[1], d = Math.hypot(dx, dz) || 1;
                const out = [from[0] + (dx / d) * AWAY, from[1] + (dz / d) * AWAY];
                if (t < turnAt) p.place(from, facing);
                else {
                    p.walk([from, out], travel(walk.keys, t) / line([from, out]).total);
                    if (t < walkAt) { const ahead = p.facing; p.face(facing); turnTo(p, ahead, ease.inOut(seg(t, turnAt, walkAt))); }
                }
                return p.show(alpha);
            };
            const fade = 1 - ease.inOut(seg(t, at(0, 0.16), at(0, 0.33)));
            for (const [i, s] of [[4, FIRE_SPOTS.a], [5, FIRE_SPOTS.b], [6, FIRE_SPOTS.c]]) {
                const f = s.facing + ((((facingTo(s.at, seat.at) - s.facing) % 360) + 540) % 360 - 180) * 0.45;
                away(v[i], s.at, f, fade);
            }
            away(v[3], [2.2, 4.4], facingTo([2.2, 4.4], FIRE), fade);
            v[0].place(LAKE_SHORE, 328).show(fade);
            villageDay(world, clock, [3]);
            for (const i of [7, 8, 9, 10]) v[i].show(fade);
            away(ex, seat.at, seat.facing, fade);
            ex.ring(fade);
        } else {
            // ---- Morning: the valley's day, and the explorer at work beyond their own reach ----------------
            const dawn = ease.inOut(seg(t, night, at(0, 0.62)));
            valleyDay(world, clock, [4]);
            v[4].place([15.5, 6.6], 268).play('Idle_Neutral', clock + 1.1);      // keeping the red stall
            for (const p of v) if (p.root) p.show(dawn);
            const go = stroll(at(1, 0.8), line(TO_SQUARE).total);
            follow(ex, [{ points: TO_SQUARE, keys: go.keys }], t);
            if (t < go.keys[0][0]) {
                ex.face(AT_STALL.facing);
                const w = Math.min(0.995, ease.sine(seg(t, at(0, 0.6), at(0, 0.75))) * ease.sine(seg(t, at(1, 0.78), at(1, 0.66))));
                if (w > 0) ex.play('Interact', clock * 0.9, { weight: w });
            } else if (t > go.end) {
                turnTo(ex, end.facing, ease.inOut(seg(t, go.end, go.end + 0.8)));
            }
            ex.show(ease.inOut(seg(t, at(0, 0.48), at(0, 0.66))));
            ex.ring(ease.inOut(seg(t, at(0, 0.48), at(0, 0.66))));
            // the people who rely on it: the stall keeper, then the square and the gardens
            v[4].lookAt([AT_STALL.at[0], AT_STALL.at[1]], ease.inOut(seg(t, at(1, 0.2), at(1, 0.4))) * (1 - seg(t, at(2, 0.5), at(2, 0.7))));
            v[4].nod(seg(t, at(1, 0.42), at(1, 0.6)));
            for (const [i, f] of [[5, 0.3], [6, 0.42], [3, 0.5]]) {
                const p = v[i];
                p.lookAt([ex.pos[0], ex.pos[2]], ease.inOut(seg(t, at(2, f - 0.1), at(2, f + 0.05))) * (1 - seg(t, at(3, 0.2), at(3, 0.4))));
                p.nod(seg(t, at(2, f + 0.05), at(2, f + 0.22)));
            }
        }

        // ---- Reach: the rings come back; Team becomes the explorer's own ---------------------------------
        const rings = group?.userData.rings;
        const back = ease.sine(seg(t, at(0, 0.4), at(0, 0.8)));
        const grown = ease.inOut(seg(t, at(2, 0.58), at(2, 0.9)));
        const settle = 1 - ease.inOut(seg(t, at(3, 0.35), at(3, 0.9)));
        rings?.set('direct', { draw: back, alpha: settle, dim: 1 });
        rings?.set('extended', { draw: back, alpha: settle, fill: 1 - grown, dim: grown, own: 1 - grown });
        rings?.set('team', { draw: back, alpha: settle, fill: grown, dashed: 1 - grown, own: grown, pulse: ease.bump(seg(t, at(2, 0.62), at(2, 0.95))) });
        rings?.arc('team', 'cd', ease.sine(seg(t, at(1, 0.15), at(1, 0.6))), settle);
        rings?.arc('team', 'pt', ease.sine(seg(t, at(2, 0.22), at(2, 0.55))), settle);
        rings?.arc('team', 'oc', ease.sine(seg(t, at(2, 0.4), at(2, 0.72))), settle);
        const labels = group?.userData.labels;
        for (const area of ['cd', 'pt', 'oc']) labels?.set(area, (t < night ? 0 : ease.inOut(seg(t, at(0, 0.62), at(0, 0.85)))) * settle);

        // the fog: the explorer's reach grows to the Team ring and stays
        const team = world.layout.SCOPE_RINGS.team;
        const reveals = REVEALS.afterSelfAssessment.slice();
        const lift = ease.inOut(seg(t, at(2, 0.55), at(2, 0.95)));
        // the stretch work beyond their reach lights up while they do it (light, not reach), until the
        // reach itself grows over it
        const work = ease.inOut(seg(t, at(0, 0.5), at(0, 0.8))) * (1 - ease.inOut(seg(t, at(2, 0.6), at(2, 0.95))));
        if (work > 0.004) reveals.push(world.fog.grow({ x: 13.4, z: 5.2, r: 7.5 }, work));
        if (lift > 0.004) reveals.push(world.fog.grow({ x: team.c[0], z: team.c[1], r: team.r + 3 }, lift));
        world.fog.set(reveals);

        // ---- Camera --------------------------------------------------------------------------------
        camera(world, t, [
            [0, 'fire'],
            [at(0, 0.06), 'fire'],
            [at(0, 0.62), RISE],
            [at(0, 0.7), RISE],
            [at(1, 0.3), MARKET_VIEW],
            [at(1, 0.85), MARKET_VIEW],
            [at(2, 0.72), TEAM_VIEW],
            [at(3, 0.05), TEAM_VIEW],
            [at(3, 0.88), states.afterGrowth.shot],
        ]);

        // ---- HUD ---------------------------------------------------------------------------------------
        const hudOut = 1 - seg(t, at(0, 0.04), at(0, 0.22));
        if (hudOut > 0) {
            world.hud.notes(7);
            world.hud.rows([['cd', 'Meets'], ['pt', 'Exceeds'], ['oc', 'Meets']], hudOut);
        }
        if (t >= at(1, 0.3) && t < at(3, 0.3)) {
            const exceeds = [['cd', at(1, 0.55)], ['pt', at(2, 0.5)], ['oc', at(2, 0.7)]].map(([a, x]) => [a, t >= x ? 'Exceeds' : null]);
            world.hud.rows(exceeds, Math.min(seg(t, at(1, 0.3), at(1, 0.5)), 1 - seg(t, at(3, 0.1), at(3, 0.3))));
        }
        if (t < at(0, 0.3)) world.hud.quest('Team check', null);
        else if (t < at(2, 0.8)) world.hud.quest('Take on a stretch', null);
        else if (t < at(3, 0.35)) world.hud.quest('Your reach has grown', null);
        else world.hud.quest('A new season: write your expectations', null);
        void duration; void bearing;
    },
};
