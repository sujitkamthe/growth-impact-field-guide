// Everything built by hand on the map: the camp, the crossroads signpost, the stone ring, the plots,
// the village (houses, mill, market, square, fountain, notice board), the bridge, the hamlet and the
// windmill. Static pieces are merged into one mesh (one draw call, one shadow caster); the few that
// move (windmill sails, mill wheel, fires, banners, flags, the cart, the notice sheet) stay separate
// and are driven from the frame's clock.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as L from '../layout.js';
import { DEG, rng, clamp01, ease, seg, polyline, smoothLine, noise } from './util.js';
import { colored, box, cyl, gableRoof, pyramidRoof, clothGeometry, centreXZ, recolor } from './geom.js';

const S = 3;                         // town kit: one unit is a 3 m storey / cell
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const M = (x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) =>
    new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
// Model +z faces `facing` (degrees clockwise from north).
const yaw = facing => (180 - facing) * DEG;

export const AREA_COLORS = { cd: '#12907c', pt: '#3d6cc2', oc: '#c48a1e' };
const CREAM = new THREE.Color('#ecdfc4');
const WOOD = '#8f6440', WOOD_DARK = '#5e412b', STONE = '#9c968a', PAPER = '#f4ecd8';

// Kenney's town walls are a cool lilac plaster; warm them to a limewashed cream.
function warmPlaster(c) {
    if (c.b > c.r + 0.015) {
        const lum = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
        c.copy(CREAM).multiplyScalar(Math.min(1.12, Math.max(0.55, lum / 0.5)));
    }
}

export function buildVillage({ assets, heightAt, material, patch, clock }) {
    const parts = [];
    const geoCache = new Map();
    const geo = name => {
        if (geoCache.has(name)) return geoCache.get(name);
        let g = assets.geo(name);
        if (/^wall/.test(name) || name === 'chimney') g = recolor(g, warmPlaster);
        if (/^fence_|^sign$|^log|^stump/.test(name)) g = centreXZ(g);
        geoCache.set(name, g);
        return g;
    };
    const placed = (g, m) => { const c = g.clone(); c.applyMatrix4(m); return c; };
    const put = (g, m) => parts.push(placed(g, m));
    // A prop on the ground at (x, z).
    const prop = (name, x, z, { facing = 0, s = 1, sx, sy, sz, y, dy = -0.04, tilt = 0 } = {}) => {
        const yy = y ?? heightAt(x, z) + dy;
        put(geo(name), M(x, yy, z, yaw(facing), sx ?? s, sy ?? s, sz ?? s, tilt));
    };
    const R = rng(11);
    const ground = (x, z) => heightAt(x, z);

    // ---- Houses ---------------------------------------------------------------------------
    function buildHouse(h, extra = {}) {
        const { w, d, floors = 1, stone = false, roof = 'terracotta' } = h;
        const [x, z] = h.at;
        const ry = yaw(h.facing);
        const W = w * S, D = d * S;
        const rot = new THREE.Matrix4().makeRotationY(ry);
        const corner = (lx, lz) => { const v = new THREE.Vector3(lx, 0, lz).applyMatrix4(rot); return ground(x + v.x, z + v.z); };
        const hs = [corner(-W / 2, -D / 2), corner(W / 2, -D / 2), corner(-W / 2, D / 2), corner(W / 2, D / 2), ground(x, z)];
        const floorY = Math.max(...hs) + 0.12;
        const minY = Math.min(...hs);
        const base = new THREE.Matrix4().compose(_p.set(x, floorY, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1));
        // foundation
        const fh = floorY - minY + 0.5;
        put(box(W + 0.36, fh, D + 0.36, stone ? '#8e887c' : '#8a7a66'), base.clone().multiply(M(0, -fh / 2 - 0.005, 0)));
        // door step
        put(box(1.4, 0.24, 0.7, '#8e887c'), base.clone().multiply(M(0, -0.12, D / 2 + 0.45)));
        const pre = stone ? 'wall' : 'wall-wood';
        const doorCell = Math.floor((w - 1) / 2);
        const piece = (name, cx, f, cz, r) => put(geo(name), base.clone().multiply(M(cx * S, f * S, cz * S, r, S)));
        for (let f = 0; f < floors; f++) {
            const p = stone && f > 0 ? 'wall-wood' : pre;
            const win = k => `${p}-window-${(k + f + w) % 3 === 1 ? 'small' : 'shutters'}`;
            for (let i = 0; i < w; i++) {
                const cx = i - (w - 1) / 2;
                piece(f === 0 && i === doorCell ? `${p}-door` : win(i), cx, f, (d - 1) / 2, -Math.PI / 2);
                piece((i + f) % 2 ? win(i + 1) : p, cx, f, -(d - 1) / 2, Math.PI / 2);
            }
            for (let j = 0; j < d; j++) {
                const cz = j - (d - 1) / 2;
                piece((j + f) % 2 === 0 ? win(j + 2) : p, (w - 1) / 2, f, cz, 0);
                piece((j + f) % 2 === 1 ? win(j) : p, -(w - 1) / 2, f, cz, Math.PI);
            }
        }
        const top = floors * S;
        const wallColor = stone && floors === 1 ? CREAM : '#7c5638';
        const { geo: rg, rise } = gableRoof(W, D, { roof, wallColor: floors > 1 || !stone ? '#7c5638' : wallColor });
        put(rg, base.clone().multiply(M(0, top, 0)));
        if (h.chimney !== false) {
            put(geo('chimney'), base.clone().multiply(M(W / 2 - 1.3, top - 0.4, -D / 4 - 0.5, 0, 2.6, rise * 0.62 + 1.5, 2.6)));
        }
        return { floorY, base, W, D, top, rise, ...extra };
    }
    const builtHouses = L.houses.map(h => buildHouse(h));

    // ---- Windmill on its hill ---------------------------------------------------------------
    const windmill = (() => {
        const [x, z] = L.places.windmill;
        const h = buildHouse({ at: [x, z], facing: 180, w: 2, d: 2, floors: 3, stone: true, roof: 'slate', chimney: false });
        // replace the gable roof look with a tall cap: a pyramid over the gable
        put(pyramidRoof(h.W, h.D, 3.4, 'slate', 0.3), h.base.clone().multiply(M(0, h.top + 0.02, 0)));
        // the sails turn in front of the south face
        const hub = new THREE.Vector3(0, h.top - 1.2, h.D / 2 + 0.7).applyMatrix4(h.base);
        put(cyl(0.35, 0.35, 1.4, WOOD_DARK, 8), M(hub.x, hub.y, hub.z - 0.55, 0, 1, 1, 1, Math.PI / 2));
        const pivot = new THREE.Group();
        pivot.position.copy(hub);
        pivot.rotation.y = Math.PI / 2;          // the rotor model's axle is its x axis; point it south
        const rotor = new THREE.Mesh(assets.geo('windmill'), material);
        rotor.scale.setScalar(3.6);
        rotor.castShadow = true;
        pivot.add(rotor);
        return { pivot, rotor };
    })();

    // ---- Watermill wheel ----------------------------------------------------------------------
    const watermill = (() => {
        const mill = L.houses.find(h => h.mill);
        const [x, wz] = L.places.millWheel;
        const wall = mill.at[1] + (mill.d * S) / 2;     // the mill's south wall
        const pivot = new THREE.Group();
        pivot.position.set(x, L.WATER_Y + 1.9, wz);
        const wheel = new THREE.Mesh(assets.geo('watermill'), material);
        wheel.scale.set(1.9, 2.75, 2.75);
        wheel.rotation.y = Math.PI / 2;
        const spin = new THREE.Group();
        spin.add(wheel);
        pivot.add(spin);
        // the axle into the mill wall
        put(cyl(0.22, 0.22, wall - wz + 0.4, WOOD_DARK, 8), M(x, L.WATER_Y + 1.9, (wall + wz) / 2, 0, 1, 1, 1, Math.PI / 2));
        return { pivot, spin };
    })();

    // ---- The square -----------------------------------------------------------------------------
    const [sqx, sqz] = L.places.square;
    prop('fountain-round-detail', sqx, sqz, { s: 2.7, dy: -0.05 });
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const bx = sqx + Math.cos(a) * 5.4, bz = sqz + Math.sin(a) * 5.4;
        if (Math.hypot(bx - L.places.fire[0], bz - L.places.fire[1]) < 3) continue;   // the evening fire's spot
        prop('stall-bench', bx, bz, { s: 2.4, facing: (Math.atan2(sqx - bx, -(sqz - bz)) / DEG) + 90 });
    }
    for (const [x, z] of L.village.lanterns) prop('lantern', x, z, { s: 2 });

    // ---- Notice board (faces west, towards the path) --------------------------------------------
    const boardM = (() => {
        const [x, z] = L.places.noticeBoard;
        const y = ground(x, z);
        const m = new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, yaw(270), 0)), _s.set(1, 1, 1));
        const at = (g, lx, ly, lz, r = 0, rz = 0) => put(g, m.clone().multiply(M(lx, ly, lz, r, 1, 1, 1, 0, rz)));
        for (const sx of [-1.25, 1.25]) at(box(0.16, 2.9, 0.16, WOOD_DARK), sx, 1.4, -0.02);
        at(box(2.7, 1.55, 0.1, '#a57449'), 0, 1.66, 0);
        at(box(2.86, 0.1, 0.16, WOOD_DARK), 0, 2.48, 0);
        at(box(2.86, 0.1, 0.16, WOOD_DARK), 0, 0.86, 0);
        const { geo: rg } = gableRoof(2.6, 0.7, { roof: 'brown', wallColor: WOOD_DARK, pitch: 0.6, over: 0.18, gableOver: 0.16, t: 0.08 });
        at(rg, 0, 2.86, -0.02);
        // papers already pinned up
        const papers = [[-0.9, 1.95, 0.08], [-0.42, 1.5, -0.05], [0.05, 2.0, 0.04], [-0.95, 1.25, -0.06], [0.2, 1.3, 0.07]];
        for (const [px, py, r] of papers) {
            at(box(0.34, 0.44, 0.012, R() < 0.5 ? PAPER : '#efe2c2'), px, py, 0.06, 0, r);
            at(box(0.05, 0.05, 0.03, '#b8483a'), px, py + 0.18, 0.075);
        }
        // a crate and a bucket at its foot
        prop('box', x - 0.4, z + 1.9, { s: 2.4, facing: 20 });
        return m;
    })();

    // ---- Market and the rest of Client & Delivery ------------------------------------------------
    for (const [name, x, z, facing] of L.village.stalls) prop(name, x, z, { s: 2.7, facing });
    prop('workbench', ...L.places.workbench, { s: 4.4, facing: 250 });
    for (const [n, x, z, f, s] of [['barrel', 12.2, -1.2, 0, 4], ['barrel', 12.9, -0.4, 40, 4], ['box', 15.9, 0.8, 15, 4.2], ['box-large', 16.4, 5.4, 70, 3.8],
        ['chest', 17.4, 6.4, 260, 4], ['barrel', 19.8, 9.0, 0, 4], ['box', 9.6, 11.2, 30, 4], ['resource-wood', 19.6, 1.6, 80, 4.4], ['bucket', 17.6, 2.2, 0, 4],
        ['box', 22.6, -1.4, 10, 4], ['barrel', 23.2, -2.4, 0, 4]]) prop(n, x, z, { s, facing: f });
    prop('cart', 23.4, 4.2, { s: 2.4, facing: 300 });

    // ---- People & Team: gardens, hedges, a woodpile ------------------------------------------------
    for (const [x, z] of [[-11.8, 20.4], [-11.6, 22.6], [5.8, 23.4], [-3.2, 24.8], [6.2, 26]]) prop('plant_bushLarge', x, z, { s: 3.2, facing: x * 40 });
    prop('log_stack', -10.8, 15.6, { s: 2.6, facing: 90 });
    prop('stump_round', -9.8, 22.4, { s: 2.6 });
    prop('barrel', 5.6, 17.8, { s: 4, facing: 30 });
    prop('pot_large', -4.6, 21.6, { s: 2.6 });

    // ---- Plots and fields ----------------------------------------------------------------------
    const CROPS = { leafs: ['crops_leafsStageB'], carrot: ['crop_carrot', 'crops_leafsStageB'], wheat: ['crops_wheatStageB', 'crops_wheatStageA'], pumpkin: ['crop_pumpkin', 'crops_leafsStageB', 'crop_melon'], corn: ['crops_cornStageD', 'crops_cornStageC'] };
    for (const pl of L.plots) {
        const [cx, cz] = pl.at;
        const big = pl.w * pl.d > 80;
        const dx = big ? 1.5 : 1.05, dz = big ? 1.5 : 1.2;
        const kinds = CROPS[pl.crop];
        for (let gz = -pl.d / 2 + dz / 2; gz < pl.d / 2 - 0.2; gz += dz) for (let gx = -pl.w / 2 + dx / 2; gx < pl.w / 2 - 0.2; gx += dx) {
            const x = cx + gx + (R() - 0.5) * 0.15, z = cz + gz + (R() - 0.5) * 0.12;
            const k = kinds[R() < 0.8 ? 0 : Math.floor(R() * kinds.length)];
            prop(k, x, z, { s: (big ? 2.7 : 2.3) * (0.9 + R() * 0.2), facing: R() * 360, dy: -0.02 });
        }
        if (pl.fence) {
            const segLen = 2;
            const sides = [
                { from: [-pl.w / 2, -pl.d / 2], dir: [1, 0], len: pl.w, facing: 0 },
                { from: [-pl.w / 2, pl.d / 2], dir: [1, 0], len: pl.w, facing: 0 },
                { from: [-pl.w / 2, -pl.d / 2], dir: [0, 1], len: pl.d, facing: 90 },
                { from: [pl.w / 2, -pl.d / 2], dir: [0, 1], len: pl.d, facing: 90 },
            ];
            sides.forEach((sd, si) => {
                const n = Math.max(1, Math.round(sd.len / segLen));
                const L1 = sd.len / n;
                for (let k = 0; k < n; k++) {
                    // leave a gate gap facing the path
                    const gateSide = pl.gate === 'east' ? 3 : 1;
                    if (si === gateSide && k === Math.floor(n / 2)) continue;
                    const x = cx + (sd.from[0] + sd.dir[0] * (k + 0.5) * L1) + (si === 2 ? -0.5 : si === 3 ? 0.5 : 0) * 0.6;
                    const z = cz + (sd.from[1] + sd.dir[1] * (k + 0.5) * L1) + (si === 0 ? -0.5 : si === 1 ? 0.5 : 0) * 0.6;
                    prop('fence_simple', x, z, { facing: sd.facing, sx: L1 + 0.02, sy: 2.6, sz: 2.6, dy: -0.06 });
                }
            });
        }
    }
    // tools by your plot
    prop('tool-hoe', -14.6, 19.4, { s: 4, facing: 30, tilt: 0 });
    prop('bucket', -14.4, 20.6, { s: 4 });

    // ---- The camp -----------------------------------------------------------------------------
    prop('tent_detailedOpen', ...L.places.tent, { s: 3.6, facing: 112 });
    prop('campfire_stones', ...L.places.campfire, { s: 3.2, dy: -0.02 });
    prop('campfire_logs', ...L.places.campfire, { s: 2.6, dy: -0.02 });
    prop('log', L.places.campfire[0] + 1.8, L.places.campfire[1] + 0.3, { s: 3, facing: 10, dy: -0.06 });
    prop('log', L.places.campfire[0] - 0.4, L.places.campfire[1] + 1.9, { s: 3, facing: 95, dy: -0.06 });
    prop('bedroll', -47.4, 41.9, { s: 3, facing: 22 });
    prop('chest', -46.8, 37.6, { s: 2.6, facing: 150 });
    prop('log_stack', -47.4, 37.4, { s: 2.6, facing: 20 });
    prop('lantern', -47.8, 39.2, { s: 1.6 });
    prop('stump_round', -39.6, 39.4, { s: 2.6 });

    // ---- Crossroads signpost --------------------------------------------------------------------
    {
        // a post with an arrow board down each road: north to the ring, east to the village,
        // west into the woods, and back to the camp
        const [x, z] = [L.places.crossroads[0] + 1.3, L.places.crossroads[1] - 1.1];
        const y = ground(x, z);
        put(box(0.18, 2.9, 0.18, WOOD_DARK), M(x, y + 1.35, z));
        put(colored(new THREE.ConeGeometry(0.16, 0.22, 4), WOOD_DARK), M(x, y + 2.9, z, Math.PI / 4));
        [[352, 2.45, '#c9965e'], [72, 2.12, '#b8844f'], [280, 1.8, '#c9965e'], [226, 1.5, '#a9784a']].forEach(([facing, h, c]) => {
            const r = (90 - facing) * DEG;     // the board's length points along its road
            const mm = M(x, y + h, z, r).multiply(M(0.62, 0, 0));
            put(box(1.05, 0.24, 0.07, c), mm);
            put(colored(new THREE.CylinderGeometry(0, 0.17, 0.2, 3).rotateZ(-Math.PI / 2), c), mm.clone().multiply(M(0.6, 0, 0, 0, 1, 1.05, 0.35)));
        });
        prop('rock_smallA', x + 0.7, z + 0.5, { s: 2.6 });
    }

    // ---- The stone ring: nine stones of the same height ---------------------------------------------
    {
        const [cx, cz] = L.places.stoneRing;
        const n = 9, r = 5.4;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + 0.2;
            const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
            const y = Math.min(ground(x, z), ground(x + 0.6, z), ground(x - 0.6, z), ground(x, z + 0.6), ground(x, z - 0.6)) - 0.15;
            const facing = Math.atan2(cx - x, -(cz - z)) / DEG;
            put(geo('stone_tallB'), M(x, y, z, yaw(facing), 2.2, 3.0, 1.4));
        }
    }

    // ---- The bridge (north of the square, over the river) ------------------------------------------
    {
        const [bx] = L.places.bridge;
        const z0 = -7.6, z1 = -15.6, n = 13;
        const yA = ground(bx, z0) + 0.05, yB = ground(bx, z1) + 0.05;
        const deckY = k => yA + (yB - yA) * k + Math.sin(Math.PI * k) * 0.9;
        for (let i = 0; i < n; i++) {
            const k = (i + 0.5) / n;
            const z = z0 + (z1 - z0) * k;
            const slope = (deckY(k + 0.01) - deckY(k - 0.01)) / (Math.abs(z1 - z0) * 0.02);
            put(box(3.1, 0.16, 0.6, i % 2 ? '#9b6c45' : '#8d6140'), M(bx, deckY(k), z, 0, 1, 1, 1, Math.atan(slope)));
        }
        for (const sx of [-1.55, 1.55]) {
            for (let i = 0; i <= 5; i++) {
                const k = i / 5, z = z0 + (z1 - z0) * k;
                put(box(0.16, 1.1, 0.16, WOOD_DARK), M(bx + sx, deckY(k) + 0.5, z));
            }
            for (let i = 0; i < 5; i++) {
                const k0 = i / 5, k1 = (i + 1) / 5;
                const za = z0 + (z1 - z0) * k0, zb = z0 + (z1 - z0) * k1;
                const ya = deckY(k0) + 0.95, yb = deckY(k1) + 0.95;
                put(box(0.1, 0.1, Math.hypot(zb - za, yb - ya) + 0.1, '#a87a50'), M(bx + sx, (ya + yb) / 2, (za + zb) / 2, 0, 1, 1, 1, Math.atan2(yb - ya, za - zb)));
            }
        }
        // piers in the water
        for (const z of [-10.2, -13]) put(box(3.3, 2.2, 0.5, '#7d7468'), M(bx, L.WATER_Y - 0.4, z));
    }

    // ---- The hamlet, the far fields, tents --------------------------------------------------------
    prop('cart-high', 10.4, -38.6, { s: 2.3, facing: 70 });
    for (const [n, x, z, f, s] of [['barrel', 13.6, -31.6, 0, 4], ['box', 14.4, -32.4, 30, 4], ['log_stack', 4.2, -33.6, 90, 2.8], ['resource-wood', 19.8, -33.2, 10, 4.2],
        ['tent_detailedOpen', 33.6, -25.4, 200, 3.4], ['tent_detailedOpen', 38.2, -23.6, 230, 3.4], ['campfire_stones', 36, -27.6, 0, 3], ['campfire_logs', 36, -27.6, 0, 2.4],
        ['tent_detailedOpen', -4, 46.6, 160, 3.2], ['log', -2, 45, 30, 3], ['canoe', -24.4, -3.6, 70, 3.2]]) {
        if (n === 'canoe') prop(n, x, z, { s, facing: f, y: L.WATER_Y - 0.02 });
        else prop(n, x, z, { s, facing: f });
    }
    // fences along the east road's farm
    for (let i = 0; i < 8; i++) prop('fence_simple', 34 + i * 2, 13.2 - 0.3, { sx: 2.02, sy: 2.6, sz: 2.6 });

    // ---- Area banners (poles static, cloth unfurls) ------------------------------------------------
    const bannerSets = {};
    const clothGeo = clothGeometry(1.25, 2.9, 8);
    const clothMat = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide }));
    addSway(clothMat, clock, 2.9);
    for (const [key, d] of Object.entries(L.districts)) {
        const inst = new THREE.InstancedMesh(clothGeo, clothMat, d.banners.length);
        inst.castShadow = false;
        inst.frustumCulled = false;
        const c = new THREE.Color(AREA_COLORS[key]);
        const mats = d.banners.map(([x, z, facing], i) => {
            const y = ground(x, z);
            put(cyl(0.07, 0.09, 5.6, WOOD_DARK, 6), M(x, y + 2.7, z));
            put(box(1.6, 0.1, 0.1, WOOD_DARK), M(x, y + 5.3, z, yaw(facing)));
            put(colored(new THREE.SphereGeometry(0.13, 6, 4), '#c9a34a'), M(x, y + 5.62, z));
            inst.setColorAt(i, c);
            return { x, y: y + 5.25, z, ry: yaw(facing) };
        });
        inst.instanceColor.needsUpdate = true;
        bannerSets[key] = { inst, mats, k: 0 };
    }

    // ---- Discovery flags at landmarks ----------------------------------------------------------------
    const flagNames = Object.keys(L.landmarks);
    const flagPoleGeo = cyl(0.04, 0.05, 2.2, '#e8dcc0', 5); flagPoleGeo.translate(0, 1.1, 0);
    const pennantGeo = new THREE.BufferGeometry();
    pennantGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.5, 0, 0.85, -0.25, 0], 3));
    pennantGeo.computeVertexNormals();
    const flagPoles = new THREE.InstancedMesh(flagPoleGeo, material, flagNames.length);
    const pennantMat = patch(new THREE.MeshStandardMaterial({ color: '#d4573f', roughness: 0.8, side: THREE.DoubleSide }));
    addSway(pennantMat, clock, 0.85, 'x');
    const pennants = new THREE.InstancedMesh(pennantGeo, pennantMat, flagNames.length);
    for (const m of [flagPoles, pennants]) { m.frustumCulled = false; m.castShadow = false; }
    const flagState = new Map();

    // ---- Rating flags in the square ------------------------------------------------------------------
    const ratingFlags = L.village.ratingFlags.map(([x, z], i) => {
        const key = ['cd', 'pt', 'oc'][i];
        const g = new THREE.Group();
        g.position.set(x, ground(x, z), z);
        const pole = new THREE.Mesh(cyl(0.05, 0.06, 3.0, '#e8dcc0', 6).translate(0, 1.5, 0), material);
        const flagGeo = new THREE.PlaneGeometry(1.0, 0.62, 6, 1).translate(0.5, -0.31, 0);
        const fm = patch(new THREE.MeshStandardMaterial({ color: AREA_COLORS[key], roughness: 0.85, side: THREE.DoubleSide }));
        addSway(fm, clock, 1.0, 'x');
        const flag = new THREE.Mesh(flagGeo, fm);
        flag.rotation.y = yaw(160) + Math.PI / 2;
        g.add(pole, flag);
        return { g, pole, flag };
    });

    // ---- Notice sheet (pinned up by the explorer) -----------------------------------------------------
    const noticeSheet = (() => {
        const g = new THREE.Group();
        g.matrixAutoUpdate = false;
        g.matrix.copy(boardM).multiply(M(0.68, 1.7, 0.075));
        const sheet = new THREE.Mesh(box(0.46, 0.6, 0.014, '#fbf6ea'), material);
        const pin = new THREE.Mesh(box(0.06, 0.06, 0.03, '#c0392b'), material);
        pin.position.set(0, 0.25, 0.015);
        const lines = [0.16, 0.04, -0.08, -0.2].map((y, i) => {
            const m = new THREE.Mesh(box(1, 0.032, 0.004, i === 0 ? '#3b3226' : '#6b5d4a'), material);
            m.position.set(0, y, 0.01);
            m.userData.len = i === 0 ? 0.26 : [0.34, 0.3, 0.22][i - 1];
            return m;
        });
        g.add(sheet, pin, ...lines);
        return {
            group: g,
            // k: 0 hidden .. 1 pinned in place (it grows from the explorer's hand).
            show(k) { g.visible = k > 0.001; g.userData.show = k; },
            // k: 0 blank .. 1 four lines of writing.
            write(k) { g.userData.write = k; },
            apply() {
                const s = ease.out(clamp01(g.userData.show ?? 0));
                const w = clamp01(g.userData.write ?? 0);
                g.matrix.copy(boardM).multiply(M(0.68, 1.7 - (1 - s) * 0.3, 0.075 + (1 - s) * 0.25, 0, Math.max(0.001, s)));
                lines.forEach((m, i) => {
                    const kk = clamp01(w * lines.length - i);
                    m.visible = kk > 0.01;
                    m.scale.x = Math.max(0.001, m.userData.len * kk);
                    m.position.x = -0.15 + (m.userData.len * kk) / 2 - (i === 0 ? 0 : 0.0);
                });
            },
            reset() { g.userData.show = 0; g.userData.write = 0; g.visible = false; },
        };
    })();

    // ---- The cart (loaded and rolled off) -----------------------------------------------------------
    const cart = (() => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(assets.geo('cart-high'), material);
        body.scale.setScalar(2.4);
        g.add(body);
        const loads = [['box', -0.25, 0.9, 0.5, 4.2], ['box', 0.28, 0.9, 0.2, 4.2], ['barrel', 0, 0.9, -0.8, 4]].map(([n, x, y, z, s]) => {
            const m = new THREE.Mesh(assets.geo(n), material);
            m.position.set(x, y, z); m.scale.setScalar(s);
            g.add(m);
            return m;
        });
        const blob = makeBlob(1.7, 2.6, patch);
        const api = {
            group: g, blob,
            place([x, z], facing = 330) { api._at = { x, z, facing }; },
            along(path, k) {
                const line = typeof path === 'string' ? polyline(L.paths[path]) : polyline(path);
                const a = line.at(line.total * clamp01(k));
                api._at = { x: a.x, z: a.z, facing: Math.atan2(a.dx, -a.dz) / DEG };
            },
            load(k) { api._load = k; },
            show(on) { api._show = on; },
            reset() { api._at = { x: L.places.cart[0], z: L.places.cart[1], facing: 330 }; api._load = 0; api._show = true; },
            apply() {
                const { x, z, facing } = api._at;
                g.visible = blob.visible = api._show !== false;
                const ry = yaw(facing);
                const fx = Math.sin(ry) * 1.4, fz = Math.cos(ry) * 1.4;
                const yf = ground(x + fx, z + fz), yb = ground(x - fx, z - fz);
                g.position.set(x, (yf + yb) / 2 - 0.02, z);
                g.rotation.set(0, 0, 0);
                g.rotation.order = 'YXZ';
                g.rotation.y = ry;
                g.rotation.x = -Math.atan2(yf - yb, 2.8);
                loads.forEach((m, i) => { m.visible = clamp01(api._load * loads.length - i) > 0.5; });
                blob.position.set(x, (yf + yb) / 2 + 0.03, z);
                blob.rotation.z = -ry;
            },
        };
        api.reset();
        return api;
    })();

    // ---- Fires: the camp's, always lit, and the square's evening fire --------------------------------
    const campFire = makeFire(L.places.campfire, ground, patch, 0.8);
    const squareFire = (() => {
        const [x, z] = L.places.fire;
        const g = new THREE.Group();
        const y = ground(x, z);
        const parts2 = [];
        const add = (g2, m) => parts2.push(placed(g2, m));
        add(geo('campfire_stones'), M(x, y - 0.02, z, 0, 3.2));
        add(geo('campfire_logs'), M(x, y - 0.02, z, 0, 2.6));
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + 0.6;
            const lx = x + Math.cos(a) * 2.5, lz = z + Math.sin(a) * 2.5;
            add(geo('log'), M(lx, ground(lx, lz) - 0.06, lz, a + Math.PI / 2, 3));
        }
        const mesh = new THREE.Mesh(mergeGeometries(parts2), material);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        g.add(mesh);
        const fire = makeFire([x, z], ground, patch, 0.9);
        g.add(fire.group);
        return {
            group: g, fire,
            light(k) { g.userData.k = k; },
            apply(t) {
                const k = clamp01(g.userData.k ?? 0);
                g.visible = k > 0.001;
                mesh.scale.setScalar(1);
                fire.apply(t, k);
            },
            reset() { g.userData.k = 0; },
        };
    })();

    // ---- Lantern and window glow at dusk ----------------------------------------------------------
    const glowPts = [];
    for (const [x, z] of L.village.lanterns) glowPts.push(x, ground(x, z) + 2.75, z);
    glowPts.push(-47.8, ground(-47.8, 39.2) + 2.2, 39.2);
    for (const h of builtHouses) {
        const p = new THREE.Vector3(0, 1.5, h.D / 2 + 0.12).applyMatrix4(h.base);
        glowPts.push(p.x + 1.1 * Math.cos(0), p.y, p.z);
    }
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(glowPts, 3));
    const glowMat = new THREE.PointsMaterial({ size: 2.4, map: glowTexture(), color: '#ffc879', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: true });
    patch(glowMat, { fade: true });
    const glow = new THREE.Points(glowGeo, glowMat);
    glow.frustumCulled = false;

    // ---- Merge the static world -----------------------------------------------------------------------
    const staticMesh = new THREE.Mesh(mergeGeometries(parts), material);
    staticMesh.castShadow = true;
    staticMesh.receiveShadow = true;
    staticMesh.name = 'village';

    const group = new THREE.Group();
    group.name = 'village';
    group.add(staticMesh, windmill.pivot, watermill.pivot, ...Object.values(bannerSets).map(b => b.inst), flagPoles, pennants,
        ...ratingFlags.map(f => f.g), noticeSheet.group, cart.group, cart.blob, campFire.group, squareFire.group, glow,
        campFire.light, squareFire.fire.light);

    const tmp = new THREE.Matrix4();
    function applyBanners(t) {
        for (const set of Object.values(bannerSets)) {
            const k = ease.out(clamp01(set.k));
            set.inst.visible = true;
            set.mats.forEach((b, i) => {
                // each banner drops a moment after the one before
                const kk = clamp01(k * 1.6 - i * 0.2);
                // furled, a banner is a short roll of colour under its crossbar
                tmp.compose(_p.set(b.x, b.y, b.z), _q.setFromEuler(_e.set(0, b.ry, 0)), _s.set(1, 0.08 + 0.92 * ease.out(kk), 1));
                set.inst.setMatrixAt(i, tmp);
            });
            set.inst.instanceMatrix.needsUpdate = true;
        }
    }
    function applyFlags() {
        let any = false;
        flagNames.forEach((name, i) => {
            const k = flagState.get(name) ?? 0;
            const [x, z] = L.landmarks[name].flag;
            const y = ground(x, z) - 0.05;
            const up = ease.out(seg(k, 0, 0.6)), pk = ease.out(seg(k, 0.35, 1));
            if (k > 0) any = true;
            tmp.compose(_p.set(x, y, z), _q.identity(), _s.set(1, Math.max(0.001, up), 1));
            flagPoles.setMatrixAt(i, tmp);
            tmp.compose(_p.set(x, y + 2.15 * up, z), _q.setFromEuler(_e.set(0, -0.6, 0)), _s.setScalar(Math.max(0.001, pk)));
            pennants.setMatrixAt(i, tmp);
        });
        flagPoles.visible = pennants.visible = any;
        flagPoles.instanceMatrix.needsUpdate = pennants.instanceMatrix.needsUpdate = true;
    }
    const ratingK = [0, 0, 0];

    return {
        group, staticMesh,
        banners(key, k) { if (bannerSets[key]) bannerSets[key].k = k; },
        flag(name, k) { if (name in L.landmarks) flagState.set(name, Math.max(flagState.get(name) ?? 0, k)); },
        props: {
            noticeSheet, cart, campfire: squareFire, campFire,
            ratingFlags: { raise(i, k) { ratingK[i] = k; } },
            windmill: windmill.pivot, watermill: watermill.pivot,
        },
        reset() {
            for (const s of Object.values(bannerSets)) s.k = 0;
            flagState.clear();
            ratingK.fill(0);
            noticeSheet.reset(); cart.reset(); squareFire.reset();
        },
        // t: the film clock in seconds; dusk 0..1 (lantern glow).
        apply(t, dusk) {
            windmill.rotor.rotation.x = t * 0.55;
            watermill.spin.rotation.z = -t * 0.8;
            applyBanners(t);
            applyFlags();
            ratingFlags.forEach((f, i) => {
                const k = clamp01(ratingK[i]);
                f.g.visible = k > 0.001;
                f.pole.scale.y = Math.max(0.001, ease.out(seg(k, 0, 0.5)));
                f.flag.position.y = 0.4 + 2.55 * ease.inOut(seg(k, 0.35, 1));
                f.flag.scale.setScalar(Math.max(0.001, seg(k, 0.3, 0.45)));
            });
            noticeSheet.apply();
            cart.apply();
            campFire.group.userData.dusk = squareFire.fire.group.userData.dusk = Math.max(dusk, 0.15);
            campFire.apply(t, 1);
            squareFire.apply(t);
            glowMat.opacity = dusk * 0.9;
            glow.visible = dusk > 0.01;
        },
    };
}

// A wind ripple for cloth hanging from y = 0 (banners) or out along x (flags and pennants).
function addSway(mat, clock, len, axis = 'y') {
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, r) => {
        shader.uniforms.uClothTime = clock;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uClothTime;')
            .replace('#include <begin_vertex>', `#include <begin_vertex>
                #ifdef USE_INSTANCING
                    float clPh = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.3;
                #else
                    float clPh = 0.0;
                #endif
                ${axis === 'y'
                    ? `float clA = clamp(-position.y / ${len.toFixed(2)}, 0.0, 1.0);
                       transformed.z += sin(uClothTime * 2.3 + position.y * 2.6 + clPh) * 0.11 * clA;
                       transformed.x += sin(uClothTime * 1.7 + position.y * 1.9 + clPh) * 0.04 * clA;`
                    : `float clA = clamp(position.x / ${len.toFixed(2)}, 0.0, 1.0);
                       transformed.z += sin(uClothTime * 3.1 - position.x * 4.0 + clPh) * 0.09 * clA;`}`);
        prev?.(shader, r);
    };
    const prevKey = mat.customProgramCacheKey?.bind(mat);
    mat.customProgramCacheKey = () => `cloth-${axis}-${len}|${prevKey ? prevKey() : ''}`;
    mat.needsUpdate = true;
}

// A soft dark ellipse on the ground, for things that move and so cannot use the static shadow map.
let blobTex = null;
export function blobTexture() {
    if (blobTex) return blobTex;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    blobTex = new THREE.CanvasTexture(cv);
    return blobTex;
}
export function makeBlob(w, d, patch) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), patch(new THREE.MeshBasicMaterial({
        map: blobTexture(), transparent: true, depthWrite: false, color: 0x000000, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    })));
    m.rotation.x = -Math.PI / 2;
    m.rotation.order = 'XYZ';
    m.renderOrder = 2;
    return m;
}

function glowTexture() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,240,200,1)');
    grad.addColorStop(0.25, 'rgba(255,200,120,0.6)');
    grad.addColorStop(1, 'rgba(255,160,80,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
}

// A low-poly fire: tongues of flame (faceted teardrops, deep orange at the root to pale yellow at
// the tip) that rise, lick and fall back on their own cycles and sway in the draught, a few embers
// drifting up, a warm glow on the ground and a point light that flickers gently. Everything is a
// function of the clock, so the same t always gives the same flames.
const FLAME_STOPS = [[0, '#b8281a'], [0.3, '#f2561c'], [0.66, '#ff9a2e'], [1, '#ffd65e']];
function flameGeometry(r, h, hot = 0) {
    // a faceted teardrop: widest a third of the way up, pointed at the tip
    const prof = [[0, 0], [r * 0.72, h * 0.1], [r, h * 0.3], [r * 0.78, h * 0.55], [r * 0.36, h * 0.8], [0, h]];
    const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 6).toNonIndexed();
    const pos = geo.getAttribute('position'), col = new Float32Array(pos.count * 3);
    const stops = FLAME_STOPS.map(([k, c]) => [k, new THREE.Color(c)]);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const k = clamp01(pos.getY(i) / h + hot);
        let j = 1;
        while (j < stops.length - 1 && stops[j][0] < k) j++;
        c.copy(stops[j - 1][1]).lerp(stops[j][1], clamp01((k - stops[j - 1][0]) / (stops[j][0] - stops[j - 1][0])));
        col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
}

function makeFire([x, z], ground, patch, size = 1) {
    const g = new THREE.Group();
    const y = ground(x, z);
    g.position.set(x, y + 0.12, z);
    // unlit and untouched by tone mapping, so the flames read as their own light by day and by dusk
    const flameMat = patch(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
    // [radius, height, offset angle, offset distance, outward lean, cycle rate, hotness]
    const specs = [
        [0.27, 1.0, 0, 0, 0, 1.3, 0.3],                    // the core, the hottest
        [0.22, 0.8, 0.4, 0.15, 0.12, 1.7, 0.12],
        [0.22, 0.76, 2.5, 0.16, 0.14, 1.55, 0.12],
        [0.21, 0.74, 4.4, 0.15, 0.12, 1.85, 0.1],
        [0.19, 0.52, 1.3, 0.3, 0.3, 2.1, -0.05],           // short outer tongues, deeper red
        [0.18, 0.46, 3.3, 0.31, 0.32, 2.4, -0.08],
        [0.19, 0.5, 5.3, 0.29, 0.28, 2.25, -0.05],
        [0.16, 0.4, 0.2, 0.33, 0.36, 2.7, -0.1],
    ];
    const tongues = specs.map(([r, h, a, d, lean, rate, hot], i) => {
        const pivot = new THREE.Group();
        pivot.position.set(Math.cos(a) * d * size, 0, Math.sin(a) * d * size);
        const m = new THREE.Mesh(flameGeometry(r * size, h * size, hot), flameMat);
        m.castShadow = false;
        pivot.add(m);
        g.add(pivot);
        return { pivot, mesh: m, a, lean, rate, seed: i * 1.618 };
    });
    // embers: tiny tetrahedra drifting up from the fire and burning out
    const emberMat = patch(new THREE.MeshBasicMaterial({ color: '#ffc05a', toneMapped: false }));
    const emberGeo = new THREE.TetrahedronGeometry(0.045 * size);
    const embers = Array.from({ length: 7 }, (_, i) => {
        const m = new THREE.Mesh(emberGeo, emberMat);
        g.add(m);
        return { m, off: (i * 0.618) % 1, a: i * 2.4, rate: 0.42 + (i % 3) * 0.08 };
    });
    // a warm pool of light on the ground around the fire
    const glowMat = patch(new THREE.MeshBasicMaterial({ map: fireGlowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), { fade: true });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.2 * size, 4.2 * size).rotateX(-Math.PI / 2), glowMat);
    glow.position.y = 0.05;
    glow.renderOrder = 2;
    g.add(glow);
    // Kept out of the group: hiding a light would change the scene's light count and recompile
    // every material, so it stays in the scene at zero strength instead.
    const light = new THREE.PointLight('#ff9b4a', 0, 14 * size, 1.6);
    light.position.set(x, y + 1.0 * size, z);
    return {
        group: g, light,
        apply(t, k = 1) {
            g.visible = k > 0.001;
            const kk = ease.out(clamp01(k));
            // the draught: a slow common sway with a quicker gust on top
            const windX = 0.07 * Math.sin(t * 0.9) + 0.05 * (noise(t * 1.7, 3.1, 4) - 0.5);
            const windZ = 0.05 * Math.sin(t * 0.7 + 1.3) + 0.05 * (noise(t * 1.9, 7.7, 4) - 0.5);
            tongues.forEach(f => {
                // each tongue rises and falls back on its own cycle, with a flicker on top
                const ph = (t * f.rate + f.seed) % 1;
                const lick = 0.62 + 0.38 * Math.sin(Math.PI * ph);
                const flick = 0.85 + 0.3 * noise(t * 7 + f.seed * 5, f.seed, 5);
                const sy = Math.max(0.001, kk * lick * flick);
                const sw = Math.max(0.001, kk * (0.8 + 0.25 * (1 - ph)));
                f.mesh.scale.set(sw, sy, sw);
                f.mesh.rotation.y = t * 0.8 + f.seed * 3;
                // lean outwards from the centre, and with the draught
                const lean = f.lean * (0.8 + 0.4 * noise(t * 2.3, f.seed * 2, 6));
                f.pivot.rotation.set(Math.sin(f.a) * lean + windX * 2 + 0.06 * Math.sin(t * 5.3 + f.seed),
                    0, -Math.cos(f.a) * lean + windZ * 2 + 0.06 * Math.sin(t * 4.7 + f.seed * 2));
            });
            embers.forEach(e => {
                const ph = (t * e.rate + e.off) % 1;
                const h = (0.4 + ph * 1.9) * size;
                const r = (0.06 + 0.22 * ph) * size;
                e.m.position.set(Math.cos(e.a + ph * 2.6) * r + windX * 2 * ph, h, Math.sin(e.a + ph * 2.6) * r + windZ * 2 * ph);
                e.m.rotation.set(t * 3 + e.a, t * 2.2, 0);
                e.m.scale.setScalar(Math.max(0.001, kk * (1 - ph) * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, ph * 5)))));
            });
            const dusk = g.userData.dusk ?? 0;
            const flicker = 0.82 + 0.12 * noise(t * 6, 0.5, 9) + 0.06 * noise(t * 15, 2.5, 9);
            glowMat.opacity = kk * flicker * (0.12 + 0.55 * dusk);
            // the light is always in the scene (its count must not change), only its strength
            light.intensity = g.visible ? kk * 12 * flicker * size * (0.08 + 0.92 * dusk) : 0;
            light.position.set(x + windX * 0.6, y + (1.0 + 0.08 * Math.sin(t * 3.1)) * size, z + windZ * 0.6);
        },
    };
}

let fireGlowTex = null;
function fireGlowTexture() {
    if (fireGlowTex) return fireGlowTex;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d');
    const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,170,80,0.9)');
    grad.addColorStop(0.35, 'rgba(255,130,50,0.45)');
    grad.addColorStop(1, 'rgba(255,100,30,0)');
    c.fillStyle = grad;
    c.fillRect(0, 0, 64, 64);
    fireGlowTex = new THREE.CanvasTexture(cv);
    fireGlowTex.colorSpace = THREE.SRGBColorSpace;
    return fireGlowTex;
}
