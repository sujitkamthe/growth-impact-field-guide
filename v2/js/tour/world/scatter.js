// Vegetation and rocks, scattered over the valley by noise (woods, meadows, rocky slopes) and kept
// off the roads, the water, the plots and the buildings. One InstancedMesh per model, all sharing a
// vertex-coloured material with a gentle wind sway, so a few thousand plants cost a couple of dozen
// draw calls.

import * as THREE from 'three';
import { rng, noise, fbm, smooth, DEG } from './util.js';
import { waterDistance, roadDistance } from './terrain.js';
import * as L from '../layout.js';

const BROADLEAF = ['tree_default', 'tree_oak', 'tree_detailed', 'tree_fat', 'tree_tall', 'tree_simple'];
const DARK = ['tree_default_dark', 'tree_oak_dark', 'tree_pineRoundA', 'tree_pineRoundC', 'tree_pineDefaultA', 'tree_pineTallA', 'tree_cone'];
const FALL = ['tree_default_fall', 'tree_oak_fall'];
const BUSHES = ['plant_bush', 'plant_bushLarge', 'plant_bushDetailed', 'plant_bushSmall'];
const FLOWERS = ['flower_redA', 'flower_yellowA', 'flower_purpleA', 'flower_yellowB', 'flower_redB'];
const GRASS = ['grass', 'grass_large'];
const ROCKS = ['rock_largeA', 'rock_largeB', 'rock_largeC'];
const SMALL_ROCKS = ['rock_smallA', 'rock_smallC', 'rock_smallE'];

// Places that must stay clear: [x, z, radius].
function clearings() {
    const c = [
        [...L.places.square, 12], [...L.places.tent, 5.5], [...L.places.campfire, 4.5], [...L.places.camp, 3],
        [...L.places.crossroads, 4.5], [...L.places.stoneRing, 8.5], [...L.places.noticeBoard, 4], [...L.places.market, 9],
        [...L.places.bridge, 5], [...L.places.lakeShore, 3.5], [...L.places.windmill, 7], [...L.places.workbench, 4], [...L.places.millWheel, 3],
    ];
    for (const h of L.houses) c.push([h.at[0], h.at[1], Math.max(h.w, h.d) * 2.4 + 3]);
    return c;
}

function inPlot(x, z, margin) {
    for (const p of L.plots) if (Math.abs(x - p.at[0]) < p.w / 2 + margin && Math.abs(z - p.at[1]) < p.d / 2 + margin) return true;
    return false;
}

export function scatter(assets, heightAt, material) {
    const R = rng(7);
    const clear = clearings();
    const lim = L.MAP.terrainHalf - 4;
    const blocked = (x, z, m = 0) => {
        for (const [cx, cz, r] of clear) if ((x - cx) ** 2 + (z - cz) ** 2 < (r + m) ** 2) return true;
        return inPlot(x, z, 1.4 + m);
    };
    const items = new Map();   // name -> [{x, z, y, ry, s, sy}]
    const add = (name, x, z, s, extra = {}) => {
        if (!items.has(name)) items.set(name, []);
        items.get(name).push({ x, z, y: extra.y ?? heightAt(x, z) - (extra.sink ?? 0.06), ry: extra.ry ?? R() * Math.PI * 2, s, sy: extra.sy ?? 1 });
    };

    // Woods: a noise field, thicker towards the valley's rim. Trees on a jittered grid.
    const forest = (x, z) => {
        const r = Math.hypot(x, z);
        const n = fbm(x * 0.028 + 3, z * 0.028 - 7, 3, 99) * 0.5 + 0.5;
        return smooth(0.56, 0.72, n) * 0.85 + smooth(52, 78, r) * 0.95 + smooth(0.62, 0.75, noise(x * 0.08, z * 0.08, 4)) * 0.22;
    };
    const G = 3.1;
    for (let gz = -lim; gz < lim; gz += G) for (let gx = -lim; gx < lim; gx += G) {
        const x = gx + (R() - 0.5) * G * 0.9, z = gz + (R() - 0.5) * G * 0.9;
        const f = forest(x, z);
        if (R() > f) continue;
        const wd = waterDistance(x, z), rd = roadDistance(x, z);
        if (wd < 2.2 || rd < 2.2 || blocked(x, z, 1.2)) continue;
        const h = heightAt(x, z);
        const rim = smooth(58, 85, Math.hypot(x, z));
        const pine = R() < 0.25 + rim * 0.5 + smooth(3, 7, h) * 0.4;
        const fall = R() < 0.05;
        const name = fall ? R.pick(FALL) : pine ? R.pick(DARK) : R.pick(BROADLEAF);
        const s = (pine ? 3.4 : 3.6) + R() * 1.6 + rim * 0.8;
        add(name, x, z, s, { sy: 0.9 + R() * 0.25 });
    }
    // Lone trees in the open, for scale and shade by the paths.
    for (let i = 0; i < 70; i++) {
        const x = (R() - 0.5) * 140, z = (R() - 0.5) * 140;
        if (waterDistance(x, z) < 3 || roadDistance(x, z) < 2.4 || blocked(x, z, 2)) continue;
        add(R.pick([...BROADLEAF, ...FALL.slice(0, 1)]), x, z, 3.8 + R() * 1.4);
    }

    // Bushes: along wood edges and near paths, in small clumps.
    for (let i = 0; i < 900; i++) {
        const x = (R() - 0.5) * 2 * lim, z = (R() - 0.5) * 2 * lim;
        const f = forest(x, z);
        const rd = roadDistance(x, z);
        const want = smooth(0.15, 0.45, f) * (1 - smooth(0.7, 1.0, f)) + (rd > 1.6 && rd < 4 ? 0.35 : 0);
        if (R() > want || waterDistance(x, z) < 1.5 || rd < 1.5 || blocked(x, z, 0.5)) continue;
        const n = 1 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) add(R.pick(BUSHES), x + (R() - 0.5) * 2.2, z + (R() - 0.5) * 2.2, 2.6 + R() * 1.6);
    }

    // Meadows: flowers in drifts, grass tufts everywhere open.
    for (let i = 0; i < 260; i++) {
        const cx = (R() - 0.5) * 150, cz = (R() - 0.5) * 150;
        if (forest(cx, cz) > 0.5) continue;
        const kind = R.pick(FLOWERS);
        const n = 4 + Math.floor(R() * 8);
        for (let k = 0; k < n; k++) {
            const x = cx + (R() - 0.5) * 5, z = cz + (R() - 0.5) * 5;
            if (waterDistance(x, z) < 0.8 || roadDistance(x, z) < 0.6 || blocked(x, z, -0.5)) continue;
            add(kind, x, z, 2.0 + R() * 0.9);
        }
    }
    for (let i = 0; i < 1500; i++) {
        const x = (R() - 0.5) * 2 * lim, z = (R() - 0.5) * 2 * lim;
        if (waterDistance(x, z) < 0.4 || roadDistance(x, z) < 0.5 || blocked(x, z, -1)) continue;
        add(R.pick(GRASS), x, z, 2.4 + R() * 1.4, { sink: 0.04 });
    }

    // Rocks: on slopes and in the woods, a few by the water.
    for (let i = 0; i < 260; i++) {
        const x = (R() - 0.5) * 2 * lim, z = (R() - 0.5) * 2 * lim;
        const h = heightAt(x, z);
        const want = 0.12 + smooth(2, 6, h) * 0.5 + forest(x, z) * 0.2;
        if (R() > want || waterDistance(x, z) < 0.6 || roadDistance(x, z) < 1.4 || blocked(x, z, 1)) continue;
        if (R() < 0.35) add(R.pick(ROCKS), x, z, 2.4 + R() * 2.4, { sink: 0.2 });
        else add(R.pick(SMALL_ROCKS), x, z, 2 + R() * 2, { sink: 0.08 });
    }
    // Rock ledges where the creek comes down.
    for (let i = 0; i < 26; i++) {
        const x = -62 + R() * 40, z = -78 + R() * 64;
        const wd = waterDistance(x, z);
        if (wd < 0.8 || wd > 5 || blocked(x, z)) continue;
        add(R.pick([...ROCKS, 'rock_tallA', 'rock_tallE']), x, z, 2.2 + R() * 2, { sink: 0.2 });
    }

    // Reeds along the lake and river banks, lily pads on the lake.
    for (let i = 0; i < 1600; i++) {
        const x = -40 + R() * 120, z = -30 + R() * 30;
        const wd = waterDistance(x, z);
        if (wd < -0.6 || wd > 1.1 || blocked(x, z, -1.5) || roadDistance(x, z) < 1) continue;
        if (Math.abs(x - L.places.bridge[0]) < 4.5 && Math.abs(z - L.places.bridge[1]) < 6) continue;
        if (Math.hypot(x - L.places.millWheel[0], z - L.places.millWheel[1]) < 4.5) continue;
        if (R() < 0.6) add('grass_leafs', x, z, 2.4 + R() * 1.4, { sink: 0.02 });
    }
    for (let i = 0; i < 60; i++) {
        const a = R() * Math.PI * 2, d = 0.25 + R() * 0.65;
        const x = L.lake.x + Math.cos(a) * L.lake.rx * d, z = L.lake.z + Math.sin(a) * L.lake.rz * d;
        if (waterDistance(x, z) > -0.8) continue;
        // keep the reflection beat's water clear in front of the explorer
        if (Math.hypot(x - L.places.lakeShore[0], z - L.places.lakeShore[1]) < 6.5) continue;
        add(R() < 0.5 ? 'lily_large' : 'lily_small', x, z, 2.2 + R() * 1.4, { y: L.WATER_Y + 0.015 });
    }
    // Mushrooms in the woods, for close shots.
    for (let i = 0; i < 120; i++) {
        const x = (R() - 0.5) * 2 * lim, z = (R() - 0.5) * 2 * lim;
        if (forest(x, z) < 0.7 || roadDistance(x, z) < 1 || blocked(x, z)) continue;
        add(R() < 0.5 ? 'mushroom_red' : 'mushroom_tan', x, z, 2.2 + R());
    }

    // Build one InstancedMesh per model.
    const group = new THREE.Group();
    group.name = 'vegetation';
    const col = new THREE.Color();
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    const noShadow = new Set([...FLOWERS, ...GRASS, 'grass_leafs', 'lily_large', 'lily_small', 'mushroom_red', 'mushroom_tan', ...SMALL_ROCKS]);
    let count = 0;
    for (const [name, list] of items) {
        const mesh = new THREE.InstancedMesh(assets.geo(name), material, list.length);
        const tint = /^tree|^plant|^grass/.test(name);
        list.forEach((it, i) => {
            m4.compose(p.set(it.x, it.y, it.z), q.setFromEuler(e.set(0, it.ry, 0)), s.set(it.s, it.s * it.sy, it.s));
            mesh.setMatrixAt(i, m4);
            // a little variety in brightness and warmth from plant to plant
            if (tint) mesh.setColorAt(i, col.setRGB(0.88 + R() * 0.2, 0.9 + R() * 0.16, 0.86 + R() * 0.14));
        });
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        mesh.castShadow = !noShadow.has(name);
        mesh.receiveShadow = true;
        mesh.name = name;
        group.add(mesh);
        count += list.length;
    }
    group.userData.count = count;
    return group;
}

// A material for plants: the shared vertex-coloured look plus a gentle wind sway that grows with
// height above the ground (in model units, before scaling), phased by where each instance stands.
export function swayMaterial(base, timeUniform) {
    const m = base.clone();
    m.onBeforeCompile = shader => {
        shader.uniforms.uSwayTime = timeUniform;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uSwayTime;')
            .replace('#include <begin_vertex>', `#include <begin_vertex>
                #ifdef USE_INSTANCING
                    vec2 swPh = instanceMatrix[3].xz;
                #else
                    vec2 swPh = vec2(0.0);
                #endif
                float swH = max(position.y, 0.0);
                float swW = sin(uSwayTime * 1.3 + swPh.x * 0.21 + swPh.y * 0.17) + 0.5 * sin(uSwayTime * 2.7 + swPh.x * 0.5);
                transformed.x += swW * 0.012 * swH * swH;
                transformed.z += cos(uSwayTime * 1.1 + swPh.y * 0.23) * 0.008 * swH * swH;`);
    };
    m.customProgramCacheKey = () => 'sway';
    return m;
}
