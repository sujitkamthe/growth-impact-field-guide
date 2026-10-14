// Shared pieces for the Org & Community film ("Building Sahaj together"): the film's own places, the
// props its chapters build (a fingerpost for the three ways to contribute, the DevDay stage, the
// workshop, the tool sheds, the broken bridge plank, a small fire, a mended fence rail), a person
// "plan" runner that keeps every walk at a real pace, and a hook that tips a person forward for a
// stumble. Everything is a pure function of the frame's time and clock, like the chapters.
//
// Props are built from Kenney's CC0 models (the same files the world loads, baked to vertex colours
// with the world's own bake()) plus three.js primitives in the valley's low-poly style. The models
// load once, with this module (top-level await), so a chapter's build() can use them at once.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bake, ASSET_ROOT } from '../../../world/assets.js';
import { box, cyl, colored, centreXZ, clothGeometry, gableRoof } from '../../../world/geom.js';
import { clamp01, ease, seg, mix, lerpAngle, noise, DEG } from '../../../world/util.js';
import { line, stroll, travel } from '../../../chapters/_shared.js';

export { clamp01, ease, seg, mix, lerpAngle };

// ---- Models ------------------------------------------------------------------------------------

const MODELS = {
    survival: ['workbench', 'barrel', 'box'],
    town: ['lantern'],
    nature: ['campfire_stones', 'campfire_logs', 'fence_simple'],
};
const GEO = new Map();
try {
    const loader = new GLTFLoader();
    await Promise.all(Object.entries(MODELS).flatMap(([kit, names]) => names.map(async n => {
        const gltf = await loader.loadAsync(new URL(`${kit}/${n}.glb`, ASSET_ROOT).href);
        let g = bake(gltf.scene);
        if (/^fence_|^log|^stump/.test(n)) g = centreXZ(g);
        GEO.set(n, g);
    })));
} catch (err) {
    console.warn('Org film: some props failed to load; using plain shapes', err);
}
const model = (name, fallback) => GEO.get(name) || fallback();

// One vertex-coloured material per world, under the shroud like the world's own props.
const mats = new WeakMap();
function propMat(world) {
    if (!mats.has(world)) {
        mats.set(world, {
            solid: world.fog.patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 })),
        });
    }
    return mats.get(world).solid;
}

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
// Matrix: at (x, y, z), turned to `facing` (degrees clockwise from north; the model's +z faces it).
export const yawOf = facing => (180 - facing) * DEG;
const M = (x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) =>
    new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
const placed = (g, m) => { const c = g.clone(); c.applyMatrix4(m); return c; };

// A merged static mesh from parts [[geometry, matrix], ...].
function mergedMesh(world, parts, { shadow = true } = {}) {
    const mesh = new THREE.Mesh(mergeGeometries(parts.map(([g, m]) => placed(g, m))), propMat(world));
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    return mesh;
}

const WOOD = '#8f6440', WOOD_DARK = '#5e412b', WOOD_NEW = '#d6a46a', AMBER = '#d9952a', AMBER_DEEP = '#b9741b';
export const INDIGO = '#33357d';

// ---- Places ------------------------------------------------------------------------------------
// The film's own spots, as [x, z] (see layout.js for the valley's).

export const SPOT = {
    // the explorer's plot (Direct): where they work, just inside the east gate, and the gate itself
    plotWork: [-16.9, 22.3],
    gateIn: [-16.0, 21.5],
    gateOut: [-14.1, 21.5],
    outOfGate: [-13.5, 18.8],      // where When there is no room leaves the explorer, heading for the village
    // the fingerpost for the three ways to contribute, where the road from the plot meets the village
    fingerpost: [-8.6, 12.4],
    // the notice board (layout.places.noticeBoard) and where the explorer stands to pin a note
    board: [-3.6, 9],
    boardFront: [-5.9, 9.3],
    // the workshop on the grass between the lake path and the square (a workbench under a lean-to)
    workbench: [-5.7, 3.6],
    // the DevDay stage on the square's west side, facing south over the crowd
    stage: [0, 4.4],
    // the meadow between the ring road and the lake path: a class in Ways, the tool shed from Reach
    shed: [-11.6, 5.4],
    // the copy across the river, in the hamlet
    hamletShed: [0.6, -25.2],
    // the small fire for the Direct session, by the plot's north-east corner
    directFire: [-16.2, 16.9],
};

// Where people stand: the crowd before the stage (facing it), the class in the meadow, the gathering
// by the fingerpost (a ring round its centre) and the plot's people.
export const CROWD = [[-1.3, 7.1, 8], [0.3, 7.4, 356], [1.7, 7.1, 345], [-0.5, 8.6, 4], [1.0, 8.7, 352]];
export const CLASS = { teacher: [-10.1, 6.9, 252], a: [-11.9, 6.7, 96], b: [-11.3, 5.3, 32] };
export const GATHER = { c: [-9.8, 10.4], r: 1.35 };
export const ring = bearingDeg => [GATHER.c[0] + GATHER.r * Math.sin(bearingDeg * DEG), GATHER.c[1] - GATHER.r * Math.cos(bearingDeg * DEG), bearingDeg + 180];
export const STAGE_TOP = 0.61;            // the deck's height above the ground

// The bridge deck (as village.js builds it): x, its ends, and the plank that has come loose.
export const BRIDGE = { x: 6, z0: -7.6, z1: -15.6, planks: 13, broken: 2 };
export function deckY(world, k) {
    const yA = world.heightAt(BRIDGE.x, BRIDGE.z0) + 0.05, yB = world.heightAt(BRIDGE.x, BRIDGE.z1) + 0.05;
    return yA + (yB - yA) * k + Math.sin(Math.PI * k) * 0.9;
}
export const plankZ = i => BRIDGE.z0 + (BRIDGE.z1 - BRIDGE.z0) * ((i + 0.5) / BRIDGE.planks);

// ---- Text on wood ----------------------------------------------------------------------------------

function woodTexture(lines, { w = 1024, h = 256, bg = ['#e2a54a', '#c9862c'], ink = '#2a170b', edge = '#7a4a17' } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const draw = () => {
        const c = canvas.getContext('2d');
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.globalAlpha = 0.12; c.strokeStyle = '#6b4325'; c.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const y = 20 + i * (h / 8) + Math.sin(i * 2.3) * 5;
            c.beginPath(); c.moveTo(0, y);
            for (let x = 0; x <= w; x += 64) c.lineTo(x, y + Math.sin(x * 0.011 + i) * 4);
            c.stroke();
        }
        c.globalAlpha = 1;
        c.strokeStyle = edge; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
        c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
        const font = sz => `600 ${sz}px "IBM Plex Sans", "Segoe UI", system-ui, sans-serif`;
        let size = lines.length > 1 ? 84 : 104;
        c.font = font(size);
        while (Math.max(...lines.map(l => c.measureText(l).width)) > w - 90 && size > 30) { size -= 2; c.font = font(size); }
        const gap = size * 1.08;
        lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * gap + 4));
        tex.needsUpdate = true;
    };
    draw();
    if (document.fonts?.load) document.fonts.load('600 80px "IBM Plex Sans"').then(draw, () => {});
    return tex;
}

// A soft round glow (for lanterns and lit things), additive and unlit.
let glowTex = null;
function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace;
    return glowTex;
}
function glowSprite(world, colour = '#ffbe6a', size = 2) {
    const s = new THREE.Sprite(world.fog.patch(new THREE.SpriteMaterial({ map: glowTexture(), color: colour, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), { fade: true }));
    s.scale.setScalar(size);
    return s;
}

// ---- The fingerpost: three ways to contribute ----------------------------------------------------
// A tall post with three amber arms, each naming one way to contribute, turned to face the camera.
// rise(k) brings the post up out of the ground; arm(i, k) swings an arm out; lit(i, k) brightens it.
export const WAYS = [
    { lines: ['Culture and', 'organisational health'], name: 'Culture and organisational health', side: -1 },
    { lines: ['Initiatives and', 'capability'], name: 'Initiatives and capability', side: 1 },
    { lines: ['Community and', 'external contribution'], name: 'Community and external contribution', side: -1 },
];
export function buildFingerpost(world, { at = SPOT.fingerpost, facing = 196 } = {}) {
    const group = new THREE.Group();
    const wood = propMat(world);
    const post = new THREE.Mesh(mergeGeometries([
        cyl(0.13, 0.16, 4.2, WOOD_DARK, 6).translate(0, 2.1, 0),
        colored(new THREE.SphereGeometry(0.2, 8, 6), '#e2b04e').translate(0, 4.32, 0),
        box(0.7, 0.18, 0.7, '#7d7468').translate(0, 0.09, 0),
    ]), wood);
    post.castShadow = true;
    group.add(post);
    const heights = [3.55, 2.75, 1.95];
    const arms = WAYS.map((way, i) => {
        const pivot = new THREE.Group();
        pivot.position.y = heights[i];
        const face = world.fog.patch(new THREE.MeshStandardMaterial({ map: woodTexture(way.lines), roughness: 0.85, emissive: '#ffb347', emissiveIntensity: 0 }));
        const edge = world.fog.patch(new THREE.MeshStandardMaterial({ color: AMBER_DEEP, roughness: 0.9 }));
        const L = 2.6, H = 0.66;
        const g = new THREE.BoxGeometry(L, H, 0.09).translate(way.side * (L / 2 + 0.12), 0, 0.12);
        const plank = new THREE.Mesh(g, [edge, edge, edge, edge, face, edge]);
        plank.castShadow = true;
        // the pointed tip
        const tip = new THREE.Mesh(colored(new THREE.CylinderGeometry(0.0, H / 2 * 1.02, 0.3, 3).rotateZ(-way.side * Math.PI / 2).rotateY(0), AMBER_DEEP), wood);
        tip.position.set(way.side * (L + 0.27), 0, 0.12);
        tip.scale.set(1, 1, 0.14);
        pivot.add(plank, tip);
        group.add(pivot);
        return { pivot, face };
    });
    group.rotation.y = yawOf(facing);
    const y0 = world.heightAt(at[0], at[1]);
    group.position.set(at[0], y0, at[1]);
    group.visible = false;
    return {
        group,
        set({ rise = 1, arms: a = [1, 1, 1], lit = [0, 0, 0] } = {}) {
            group.visible = rise > 0.002;
            if (!group.visible) return;
            const e = ease.out(clamp01(rise));
            group.position.y = y0 - 4.6 * (1 - e);
            group.rotation.z = 0.05 * Math.sin(e * Math.PI);
            arms.forEach((arm, i) => {
                const k = clamp01(a[i]);
                arm.pivot.visible = k > 0.002;
                arm.pivot.scale.set(Math.max(0.001, ease.out(k)), 1, 1);
                arm.pivot.rotation.y = 0.5 * (1 - ease.out(k)) * WAYS[i].side;
                arm.face.emissiveIntensity = 0.42 * clamp01(lit[i]);
            });
        },
    };
}

// ---- Lanterns on a string --------------------------------------------------------------------------
// Small amber lanterns hung along a sagging line between two points [x, y, z]; lit(k) lights them.
function lanternString(world, a, b, n = 7, sag = 0.5) {
    const group = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 16; i++) {
        const k = i / 16;
        pts.push(new THREE.Vector3(mix(a[0], b[0], k), mix(a[1], b[1], k) - sag * Math.sin(Math.PI * k), mix(a[2], b[2], k)));
    }
    const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.02, 4), world.fog.patch(new THREE.MeshStandardMaterial({ color: '#3a2a1c', roughness: 1 })));
    group.add(rope);
    const bulbMat = world.fog.patch(new THREE.MeshStandardMaterial({ color: '#f3c46b', emissive: '#ffb340', emissiveIntensity: 0, roughness: 0.6 }));
    const bulbGeo = new THREE.OctahedronGeometry(0.13, 0).scale(1, 1.35, 1);
    const glows = [];
    for (let i = 1; i < n + 1; i++) {
        const k = i / (n + 1);
        const p = new THREE.Vector3(mix(a[0], b[0], k), mix(a[1], b[1], k) - sag * Math.sin(Math.PI * k) - 0.16, mix(a[2], b[2], k));
        const m = new THREE.Mesh(bulbGeo, bulbMat);
        m.position.copy(p);
        const g = glowSprite(world, '#ffb24a', 1.1);
        g.position.copy(p);
        group.add(m, g);
        glows.push(g);
    }
    return {
        group,
        lit(k) {
            bulbMat.emissiveIntensity = 1.6 * k;
            for (const g of glows) { g.visible = k > 0.01; g.material.opacity = 0.75 * k; }
        },
    };
}

// ---- The DevDay stage ------------------------------------------------------------------------------
// A low wooden platform with steps, a backdrop hung with amber cloth, two banner poles either side
// (their amber banners unfurl) and strings of lanterns out over the crowd.
// set({ rise, banners: [k0, k1], backdrop, lights })
export function buildStage(world, { at = SPOT.stage, facing = 180 } = {}) {
    const group = new THREE.Group();
    const y0 = world.heightAt(at[0], at[1]);
    const W = 3.4, D = 2.2, H = 0.55;
    // the platform rises as it is built; the poles stand from the start
    const deck = new THREE.Group();
    const parts = [
        [box(W, 0.12, D, '#a87648'), M(0, H, 0)],
        [box(W + 0.1, H, D + 0.1, '#7a5236'), M(0, H / 2, 0)],
        // planks lines on the top
        ...[-1.2, -0.4, 0.4, 1.2].map(x => [box(0.03, 0.01, D, '#6c4a2f'), M(x, H + 0.065, 0)]),
        // steps at the front, to the right
        [box(0.9, 0.18, 0.4, '#8d6140'), M(W / 2 - 0.6, 0.09, D / 2 + 0.25)],
        [box(0.9, 0.36, 0.4, '#8d6140'), M(W / 2 - 0.6, 0.18, D / 2 + 0.0)],
        // an amber skirt along the front
        [box(W + 0.12, 0.3, 0.04, AMBER), M(0, H - 0.12, D / 2 + 0.07)],
        // backdrop frame
        [box(0.14, 2.6, 0.14, WOOD_DARK), M(-W / 2 + 0.1, H + 1.3, -D / 2 + 0.1)],
        [box(0.14, 2.6, 0.14, WOOD_DARK), M(W / 2 - 0.1, H + 1.3, -D / 2 + 0.1)],
        [box(W + 0.2, 0.14, 0.16, WOOD_DARK), M(0, H + 2.6, -D / 2 + 0.1)],
    ];
    deck.add(mergedMesh(world, parts));
    // the backdrop cloth with the event's name
    const backTex = woodTexture(['DevDay'], { w: 1024, h: 512, bg: ['#e8a542', '#c97f22'], ink: '#fff6e2', edge: '#8a5212' });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, 1.9), world.fog.patch(new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.9, side: THREE.DoubleSide })));
    back.position.set(0, H + 1.55, -D / 2 + 0.17);
    deck.add(back);
    group.add(deck);
    // banner poles either side, a little in front
    const poles = [[-W / 2 - 0.55, 0.2], [W / 2 + 0.55, 0.2]];
    const poleParts = [];
    const clothGeo = clothGeometry(0.85, 2.3, 8);
    const clothMat = world.fog.patch(new THREE.MeshStandardMaterial({ color: AMBER, roughness: 0.85, side: THREE.DoubleSide }));
    const cloths = poles.map(([x, z]) => {
        poleParts.push([cyl(0.06, 0.08, 4.0, WOOD_DARK, 6), M(x, 2.0, z)]);
        poleParts.push([box(1.1, 0.08, 0.08, WOOD_DARK), M(x, 3.75, z)]);
        poleParts.push([colored(new THREE.SphereGeometry(0.11, 6, 4), '#d9b456'), M(x, 4.06, z)]);
        const c = new THREE.Mesh(clothGeo, clothMat);
        c.position.set(x, 3.7, z + 0.03);
        group.add(c);
        return c;
    });
    group.add(mergedMesh(world, poleParts));
    // lanterns strung from the poles out over the crowd, to two posts
    const posts = [[-W / 2 - 0.9, 4.6], [W / 2 + 0.9, 4.6]];
    const postParts = posts.map(([x, z]) => [cyl(0.05, 0.07, 3.0, WOOD_DARK, 5), M(x, 1.5, z)]);
    const postMesh = mergedMesh(world, postParts);
    group.add(postMesh);
    const strings = [
        lanternString(world, [poles[0][0], 3.4, poles[0][1]], [posts[1][0], 2.9, posts[1][1]], 7, 0.45),
        lanternString(world, [poles[1][0], 3.4, poles[1][1]], [posts[0][0], 2.9, posts[0][1]], 7, 0.45),
        lanternString(world, [poles[0][0], 3.2, poles[0][1]], [poles[1][0], 3.2, poles[1][1]], 5, 0.3),
    ];
    for (const s of strings) group.add(s.group);
    group.position.set(at[0], y0, at[1]);
    group.rotation.y = yawOf(facing);
    return {
        group,
        // where the speaker stands, in world [x, z] (front middle of the deck)
        speaker: (() => { const v = new THREE.Vector3(-0.3, 0, 0.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOf(facing)); return [at[0] + v.x, at[1] + v.z]; })(),
        top: y0 + H + 0.06,
        set({ rise = 1, banners = [1, 1], lights = 1, poles: showPoles = 1 } = {}) {
            group.visible = showPoles > 0.002 || rise > 0.002;
            const e = ease.out(clamp01(rise));
            deck.visible = rise > 0.002;
            deck.scale.set(1, Math.max(0.001, e), 1);
            postMesh.visible = rise > 0.5;
            cloths.forEach((c, i) => {
                const k = ease.out(clamp01(banners[i]));
                c.scale.set(1, 0.06 + 0.94 * k, 1);
            });
            strings.forEach(s => { s.group.visible = rise > 0.5; s.lit(clamp01(lights) * clamp01(rise * 2 - 1)); });
        },
    };
}

// ---- The workshop ----------------------------------------------------------------------------------
// A workbench in the open with a tool rack behind it, a barrel and a crate; tool(k) puts the new tool
// on the bench. (No roof: the camera looks down on it, and the people at the bench must stay in view.)
export function buildWorkshop(world, { at = SPOT.workbench, facing = 165 } = {}) {
    const group = new THREE.Group();
    const y0 = world.heightAt(at[0], at[1]);
    const parts = [
        [model('workbench', () => box(0.5, 0.25, 0.3, WOOD)), M(0, -0.02, 0, 0, 4.4)],
        [model('barrel', () => cyl(0.1, 0.1, 0.2, WOOD)), M(2.2, -0.02, -1.3, 0.4, 4)],
        [model('box', () => box(0.15, 0.15, 0.15, WOOD)), M(-2.1, -0.02, -1.35, 0.3, 3.8)],
        // a tool rack behind the bench: two posts, a board, a small roof and the tools hung on it
        ...[-1.6, 1.6].map(x => [box(0.14, 2.1, 0.14, WOOD_DARK), M(x, 1.05, -1.55)]),
        [box(3.3, 1.0, 0.08, '#94653f'), M(0, 1.35, -1.6)],
        [box(3.6, 0.08, 0.5, '#6d4a30'), M(0, 2.12, -1.48, 0, 1, 1, 1, -0.25)],
        [box(0.06, 0.6, 0.04, '#5e5a55'), M(-1.1, 1.4, -1.54)],
        [box(0.3, 0.12, 0.05, '#7d7a75'), M(-1.1, 1.66, -1.53)],
        [box(0.06, 0.7, 0.04, WOOD_DARK), M(-0.5, 1.35, -1.54)],
        [box(0.22, 0.3, 0.05, '#8a8580'), M(-0.5, 1.05, -1.53)],
        [box(0.5, 0.06, 0.04, '#5e5a55'), M(0.3, 1.6, -1.54, 0, 1, 1, 1, 0, 0.5)],
        [colored(new THREE.TorusGeometry(0.22, 0.04, 4, 10), WOOD_NEW), M(1.0, 1.35, -1.54)],
    ];
    group.add(mergedMesh(world, parts));
    // the tool being made: a little cart wheel and a mallet on the bench
    const tool = new THREE.Group();
    const wheel = new THREE.Mesh(colored(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 10).rotateX(Math.PI / 2), WOOD_NEW), propMat(world));
    wheel.position.set(-0.35, 1.18, 0.05);
    wheel.rotation.x = -1.2;
    const hub = new THREE.Mesh(colored(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 6).rotateX(Math.PI / 2), INDIGO), propMat(world));
    hub.position.copy(wheel.position); hub.rotation.copy(wheel.rotation);
    const mallet = new THREE.Mesh(mergeGeometries([box(0.06, 0.06, 0.5, WOOD_DARK), box(0.14, 0.14, 0.24, '#a87648').translate(0, 0, 0.3)]), propMat(world));
    mallet.position.set(0.4, 1.1, 0.1);
    mallet.rotation.y = 0.6;
    tool.add(wheel, hub, mallet);
    group.add(tool);
    group.position.set(at[0], y0, at[1]);
    group.rotation.y = yawOf(facing);
    const local = (lx, lz) => { const v = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOf(facing)); return [at[0] + v.x, at[1] + v.z]; };
    return {
        group,
        // standing spots, in world [x, z]: behind the bench (facing out, over it), and at its west end
        spots: { back: local(0, -0.8), backLeft: local(-1.1, -0.75), backRight: local(1.2, -0.7), end: local(-1.55, 0.25), local },
        facing,
        set({ tool: k = 1 } = {}) {
            tool.visible = k > 0.01;
            const e = ease.out(clamp01(k));
            tool.scale.setScalar(Math.max(0.001, e));
        },
    };
}

// ---- A tool shed -----------------------------------------------------------------------------------
// Plank walls, a gable roof, a door and a sign over it. It is built in front of you: the corner posts
// rise, the walls go up, the roof settles on, then the sign. set({ build: 0..1, sign: 0..1, door: 0..1 }).
export function buildShed(world, { at, facing = 160, sign = 'Tool shed', roof = 'terracotta', w = 3.2, d = 2.4, keyAt = true } = {}) {
    const group = new THREE.Group();
    const y0 = world.heightAt(at[0], at[1]) - 0.04;
    const H = 2.0;
    const posts = mergedMesh(world, [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => [box(0.16, H, 0.16, WOOD_DARK), M(sx * (w / 2), H / 2, sz * (d / 2))]));
    const walls = mergedMesh(world, [
        [box(w, H, 0.1, '#a2714a'), M(0, H / 2, -d / 2)],
        [box(0.1, H, d, '#9b6c45'), M(-w / 2, H / 2, 0)],
        [box(0.1, H, d, '#9b6c45'), M(w / 2, H / 2, 0)],
        [box(w, H, 0.1, '#a2714a'), M(0, H / 2, d / 2)],
        // plank seams
        ...[-1, -0.33, 0.33, 1].map(x => [box(0.03, H, 0.02, '#7a5236'), M(x * (w / 2 - 0.3), H / 2, d / 2 + 0.06)]),
        // the door frame, and a window
        [box(1.0, 1.65, 0.04, '#5e412b'), M(0, 0.83, d / 2 + 0.06)],
        [box(0.6, 0.5, 0.04, '#3c3330'), M(w / 2 + 0.06, 1.3, 0, Math.PI / 2)],
    ]);
    const { geo: roofGeo } = gableRoof(w, d, { roof, wallColor: '#a2714a', pitch: 0.7, over: 0.3, gableOver: 0.25, t: 0.12 });
    const roofMesh = new THREE.Mesh(roofGeo, propMat(world));
    roofMesh.castShadow = true;
    const door = new THREE.Mesh(box(0.86, 1.55, 0.06, '#b07c4b'), propMat(world));
    door.geometry.translate(0.43, 0.78, 0);
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.43, 0, d / 2 + 0.09);
    doorPivot.add(door);
    const signTex = woodTexture([sign], { w: 1024, h: 230 });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.06), [
        ...Array(4).fill(world.fog.patch(new THREE.MeshStandardMaterial({ color: AMBER_DEEP, roughness: 0.9 }))),
        world.fog.patch(new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.85 })),
        world.fog.patch(new THREE.MeshStandardMaterial({ color: AMBER_DEEP, roughness: 0.9 })),
    ]);
    signMesh.position.set(0, H + 0.05, d / 2 + 0.36);
    signMesh.rotation.x = -0.18;
    // a lantern by the door
    const lamp = new THREE.Mesh(model('lantern', () => box(0.1, 0.4, 0.1, '#333')), propMat(world));
    lamp.position.set(w / 2 + 0.55, 0, d / 2 + 0.3);
    lamp.scale.setScalar(1.6);
    const parts = new THREE.Group();
    parts.add(posts, walls, roofMesh, doorPivot, signMesh, lamp);
    group.add(parts);
    group.position.set(at[0], y0, at[1]);
    group.rotation.y = yawOf(facing);
    const local = (lx, lz) => { const v = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOf(facing)); return [at[0] + v.x, at[1] + v.z]; };
    void keyAt;
    return {
        group,
        door: local(0, d / 2 + 1.0), doorLeft: local(-1.0, d / 2 + 1.25), doorRight: local(1.05, d / 2 + 1.3),
        front: local(0, d / 2 + 2.2),
        facing,
        set({ build = 1, sign: s = 1, door: open = 0 } = {}) {
            group.visible = build > 0.002;
            if (!group.visible) return;
            const k = clamp01(build);
            const p = ease.out(seg(k, 0, 0.3)), wl = ease.out(seg(k, 0.2, 0.65)), r = ease.out(seg(k, 0.55, 0.9));
            posts.scale.set(1, Math.max(0.001, p), 1);
            walls.visible = wl > 0.002;
            walls.scale.set(1, Math.max(0.001, wl), 1);
            roofMesh.visible = r > 0.002;
            roofMesh.position.y = H + 1.6 * (1 - r);
            roofMesh.scale.setScalar(Math.max(0.001, 0.6 + 0.4 * r));
            doorPivot.visible = k > 0.6;
            doorPivot.rotation.y = -1.6 * ease.inOut(clamp01(open));
            lamp.visible = k > 0.85;
            const sk = ease.out(clamp01(s));
            signMesh.visible = sk > 0.002;
            signMesh.scale.setScalar(Math.max(0.001, sk));
        },
    };
}

// ---- A small fire ------------------------------------------------------------------------------------
// Stones, logs and a few faceted tongues of flame flickering by the clock; set(k) lights it.
export function buildFire(world, at = SPOT.directFire, size = 1.0) {
    const group = new THREE.Group();
    const y = world.heightAt(at[0], at[1]);
    const stones = new THREE.Group();
    group.add(stones);
    stones.add(mergedMesh(world, [
        [model('campfire_stones', () => cyl(0.3, 0.3, 0.1, '#888')), M(0, -0.02, 0, 0, 2.6)],
        [model('campfire_logs', () => cyl(0.2, 0.2, 0.1, WOOD)), M(0, -0.02, 0, 0, 2.1)],
    ], { shadow: false }));
    const flameMat = world.fog.patch(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
    const flames = [[0.24, 0.9, 0, 0, 1.3], [0.19, 0.66, 0.4, 0.14, 1.7], [0.19, 0.62, 2.5, 0.15, 1.55], [0.18, 0.6, 4.4, 0.14, 1.85], [0.15, 0.42, 1.4, 0.26, 2.2]].map(([r, h, a, d, rate], i) => {
        const prof = [[0, 0], [r * 0.72, h * 0.1], [r, h * 0.3], [r * 0.78, h * 0.55], [r * 0.36, h * 0.8], [0, h]];
        const geo = new THREE.LatheGeometry(prof.map(([x, yy]) => new THREE.Vector2(x * size, yy * size)), 6).toNonIndexed();
        const pos = geo.getAttribute('position'), col = new Float32Array(pos.count * 3);
        const lo = new THREE.Color('#e2481b'), hi = new THREE.Color('#ffd65e'), c = new THREE.Color();
        for (let j = 0; j < pos.count; j++) { c.copy(lo).lerp(hi, clamp01(pos.getY(j) / (h * size) + 0.15)); col.set([c.r, c.g, c.b], j * 3); }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const m = new THREE.Mesh(geo, flameMat);
        m.position.set(Math.cos(a) * d * size, 0.1, Math.sin(a) * d * size);
        group.add(m);
        return { m, rate, seed: i * 1.618 };
    });
    const glow = glowSprite(world, '#ff9b4a', 3.2 * size);
    glow.position.y = 0.6 * size;
    group.add(glow);
    group.position.set(at[0], y, at[1]);
    return {
        group,
        // lit 0..1: the flames; laid 0..1: the stones and logs (laid out before it is lit, cleared after)
        set(k, clock, laid = 1) {
            const l = ease.out(clamp01(laid));
            stones.visible = l > 0.002;
            stones.scale.setScalar(Math.max(0.001, l));
            const kk = ease.out(clamp01(Math.min(k, laid)));
            for (const f of flames) {
                f.m.visible = kk > 0.01;
                const ph = (clock * f.rate + f.seed) % 1;
                const lick = (0.62 + 0.38 * Math.sin(Math.PI * ph)) * (0.85 + 0.3 * noise(clock * 7 + f.seed * 5, f.seed, 5));
                f.m.scale.set(Math.max(0.001, kk), Math.max(0.001, kk * lick), Math.max(0.001, kk));
                f.m.rotation.y = clock * 0.8 + f.seed * 3;
            }
            glow.visible = kk > 0.01;
            glow.material.opacity = 0.55 * kk;
        },
    };
}

// ---- The bridge's broken plank ---------------------------------------------------------------------
// A plank that has split and sprung up, a dark gap where it has dropped, and the new plank that
// replaces it. set(fixed 0..1): the new plank settles in as the broken pieces go.
export function buildPlank(world) {
    const group = new THREE.Group();
    const i = BRIDGE.broken;
    const k = (i + 0.5) / BRIDGE.planks;
    const z = plankZ(i);
    const y = deckY(world, k);
    const slope = (deckY(world, k + 0.01) - deckY(world, k - 0.01)) / (Math.abs(BRIDGE.z1 - BRIDGE.z0) * 0.02);
    const tilt = Math.atan(slope);
    const base = new THREE.Group();
    base.position.set(BRIDGE.x, y, z);
    base.rotation.x = tilt;
    group.add(base);
    // the gap: a dark slot across most of the deck
    const gap = new THREE.Mesh(box(2.1, 0.02, 0.5, '#20170f'), propMat(world));
    gap.position.set(-0.25, 0.085, 0);
    // two broken halves, one sprung up at an angle and one sagging
    const halfA = new THREE.Mesh(box(1.25, 0.12, 0.52, '#6f5a44'), propMat(world));
    halfA.geometry.translate(0.62, 0, 0);
    halfA.position.set(-1.3, 0.12, 0.02);
    halfA.rotation.z = 0.32;
    halfA.rotation.y = 0.12;
    const halfB = new THREE.Mesh(box(0.9, 0.12, 0.5, '#6a543f'), propMat(world));
    halfB.geometry.translate(-0.45, 0, 0);
    halfB.position.set(0.85, 0.13, -0.03);
    halfB.rotation.z = 0.2;
    halfB.rotation.y = -0.1;
    const broken = new THREE.Group();
    broken.add(gap, halfA, halfB);
    // the new plank, fresh pale wood
    const fresh = new THREE.Mesh(box(3.1, 0.16, 0.6, WOOD_NEW), propMat(world));
    fresh.receiveShadow = true;
    base.add(broken, fresh);
    return {
        group, z, y, i,
        set(fixed) {
            const f = clamp01(fixed);
            broken.visible = f < 0.55;
            halfA.rotation.z = 0.32 * (1 - ease.inOut(seg(f, 0, 0.5)));
            fresh.visible = f > 0.35;
            const e = ease.out(seg(f, 0.35, 1));
            fresh.position.y = 0.04 + 0.5 * (1 - e);
            fresh.rotation.z = 0.25 * (1 - e);
        },
    };
}

// ---- A fence being mended ----------------------------------------------------------------------------
// A short fence along the ring road, north of it, beside the meadow: three panels, the middle one
// with its top rail hanging loose, swung back into place (in fresh wood) as k goes 0..1.
export const FENCE = { x0: -22.0, x1: -16.6, z: 8.1 };
export function buildRail(world) {
    const group = new THREE.Group();
    const n = 3, L = (FENCE.x1 - FENCE.x0) / n;
    const parts = [];
    for (let i = 0; i < n; i++) {
        const x = FENCE.x0 + L * (i + 0.5);
        parts.push([model('fence_simple', () => box(1, 0.3, 0.05, WOOD)), M(x, world.heightAt(x, FENCE.z) - 0.06, FENCE.z, 0, L + 0.02, 2.6, 2.6)]);
    }
    group.add(mergedMesh(world, parts));
    const mid = FENCE.x0 + L;
    const y = world.heightAt(mid + L / 2, FENCE.z);
    const pivot = new THREE.Group();
    pivot.position.set(mid + 0.05, y + 0.62, FENCE.z + 0.09);
    const rail = new THREE.Mesh(box(L - 0.1, 0.12, 0.07, WOOD_NEW), propMat(world));
    rail.geometry.translate((L - 0.1) / 2, 0, 0);
    pivot.add(rail);
    group.add(pivot);
    return {
        group,
        // where someone mending it stands, and faces
        spot: [mid + L / 2, FENCE.z + 0.75], facing: 0,
        set(k) { pivot.rotation.z = -0.62 * (1 - ease.inOut(clamp01(k))); },
    };
}

// ---- People: plans --------------------------------------------------------------------------------------
// A person's plan for a chapter: where they start, the walks they take (each at a real pace unless a
// pace is given, from `t` or arriving `by`), what they do at rest, and gestures on top.
//   { at, facing, moves: [{ t | by | after, path, pace, face, ramp }], loops: [{ from, to, clip, phase, rate }],
//     gestures: [{ clip, from, to, weight }], nods: [[from, to]], looks: [{ from, to, at }] }
// A walk turns on the spot towards its first stretch for half a second before it sets off and
// turns to `face` for half a second after it arrives. Returns { moving, pos } for cameras and fog.
const sstep = x => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const bearing = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])) / DEG;
const compiled = new WeakMap();
function compile(plan) {
    const out = [];
    for (const m of plan.moves || []) {
        const L = line(m.path);
        const pace = m.pace ?? 1.4;
        const ramp = m.ramp ?? 0.7;
        let t0 = m.t;
        // `after`: seconds after the previous walk arrives
        if (t0 == null && m.by == null && m.after != null) t0 = (out.at(-1)?.end ?? 0) + m.after;
        if (t0 == null) t0 = m.by - (L.total / pace + ramp);
        let p = pace;
        if (m.t != null && m.by != null) p = Math.min(m.maxPace ?? 3, Math.max(0.6, L.total / Math.max(0.3, m.by - m.t - ramp)));
        const w = stroll(t0, L.total, { pace: p, ramp: Math.min(ramp, L.total / p) });
        const a = L.at(0), b = L.at(Math.min(0.8, L.total)), e0 = L.at(Math.max(0, L.total - 0.8)), e1 = L.at(L.total);
        out.push({ ...m, L, keys: w.keys, t0, end: w.end, start: [a.x, a.z], startBearing: bearing([a.x, a.z], [b.x, b.z]), endPos: [e1.x, e1.z], endBearing: bearing([e0.x, e0.z], [e1.x, e1.z]) });
    }
    return out;
}
export function moves(plan) {
    if (!compiled.has(plan)) compiled.set(plan, compile(plan));
    return compiled.get(plan);
}
export function run(person, t, clock, plan) {
    const list = moves(plan);
    let pos = plan.at, facing = plan.facing ?? 0, since = -Infinity, from = facing, moving = false;
    let done = false;
    for (const m of list) {
        const turn = m.turn ?? 0.5;
        if (t < m.t0 - turn) break;
        if (t < m.t0) {
            // turning towards the way ahead
            person.place(pos, lerpAngle(facing, m.startBearing, sstep((t - (m.t0 - turn)) / turn)));
            done = true;
            break;
        }
        if (t < m.end) {
            const d = Math.min(m.L.total, Math.max(0, travel(m.keys, t)));
            person.walk(m.path, d / m.L.total, m.idle ? { idle: m.idle } : undefined);
            moving = true; done = true;
            break;
        }
        pos = m.endPos; from = m.endBearing; facing = m.face ?? m.endBearing; since = m.end;
    }
    if (!done) {
        const turn = 0.6;
        person.place(pos, since > -Infinity ? lerpAngle(from, facing, sstep((t - since) / turn)) : facing);
    }
    if (!moving) {
        for (const l of plan.looks || []) {
            const k = sstep(seg(t, l.from, l.from + (l.turn ?? 0.6))) * (l.to != null ? 1 - sstep(seg(t, l.to, l.to + (l.turn ?? 0.6))) : 1);
            if (k > 0) person.lookAt(l.at, k * (l.k ?? 1));
        }
        for (const lp of plan.loops || []) {
            const w = Math.min(sstep((t - lp.from) / 0.5), lp.to == null ? 1 : sstep((lp.to - t) / 0.5)) * (lp.weight ?? 1);
            if (w > 0.002) person.play(lp.clip, clock * (lp.rate ?? 0.9) + (lp.phase ?? 0), { weight: Math.min(0.995, w) });
        }
    }
    for (const g of plan.gestures || []) {
        if (t <= g.from || t >= g.to) continue;
        const blend = g.blend ?? 0.3;
        const w = (g.weight ?? 1) * Math.min(sstep((t - g.from) / blend), sstep((g.to - t) / blend));
        person.play(g.clip, (t - g.from) * (g.rate ?? 1) + (g.phase ?? 0), { weight: Math.min(0.995, w) });
    }
    for (const [a, b] of plan.nods || []) if (t > a && t < b) person.nod((t - a) / (b - a));
    if (plan.show) person.show(plan.show(t));
    return { moving, pos: [person.pos[0], person.pos[2]] };
}
// Where a plan leaves its person at the end (after every move): [x, z] and facing.
export function endOf(plan) {
    const list = moves(plan);
    if (!list.length) return { at: plan.at, facing: plan.facing };
    const m = list.at(-1);
    return { at: m.endPos, facing: m.face ?? m.endBearing };
}
// A time-lapse: a warped time that runs `rate` times faster between t0 and t1, easing into and out
// of the speed-up over `ramp` seconds (so walks speed up and slow down without a jolt). Returns
// tau(t); people's plans and loops run on tau, so everyone moves at the same quickened pace.
export function timeLapse(t0, t1, rate, ramp = 0.8) {
    const r = Math.max(0.01, Math.min(ramp, (t1 - t0) / 2));
    // integral of the extra speed: a trapezoid rising over r, flat, falling over r
    const extra = t => {
        if (t <= t0) return 0;
        const a = Math.min(t, t0 + r) - t0;
        let e = (a * a) / (2 * r);
        if (t > t0 + r) e += Math.min(t, t1 - r) - (t0 + r);
        if (t > t1 - r) { const b = Math.min(t, t1) - (t1 - r); e += b - (b * b) / (2 * r); }
        return e;
    };
    return t => t + (rate - 1) * extra(t);
}

// The time a plan's walk number i arrives.
export const arrival = (plan, i) => moves(plan)[i].end;
export const departure = (plan, i) => moves(plan)[i].t0;

// ---- A stumble ---------------------------------------------------------------------------------------
// The people's roots only turn about the vertical, so a stumble (a lurch forward and a catch) is
// applied in a hook that runs inside the scene's matrix update, after the people's own: it tips the
// root about its own sideways axis and puts the rotation back once the matrices are written, so
// nothing carries over into the next frame.
export function tipHook(world, group) {
    const want = new Map();
    const hook = new THREE.Object3D();
    hook.name = 'org-tip';
    hook.updateMatrixWorld = function (force) {
        THREE.Object3D.prototype.updateMatrixWorld.call(this, force);
        if (!group.visible) { want.clear(); return; }
        for (const [person, { angle = 0, lift = 0 }] of want) {
            const r = person.root;
            if (!r.visible || (Math.abs(angle) < 1e-4 && Math.abs(lift) < 1e-4)) continue;
            r.rotation.order = 'YXZ';
            r.rotation.x = angle;
            r.position.y += lift;
            r.updateMatrixWorld(true);
            r.rotation.x = 0;
            r.position.y -= lift;
        }
        want.clear();
    };
    group.add(hook);
    const get = p => { if (!want.has(p)) want.set(p, {}); return want.get(p); };
    return {
        tip(person, angle) { get(person).angle = angle; },
        // raises a person (standing on the stage, say) by dy metres
        lift(person, dy) { get(person).lift = dy; },
    };
}
// Anyone walking over the broken plank (before it is fixed) catches a foot on it: a small lurch as
// they pass within half a metre of it, whichever way they are going.
export function stumbleOnPlank(tip, people, fixed) {
    if (fixed >= 0.5) return;
    const z0 = plankZ(BRIDGE.broken);
    for (const p of people) {
        const [x, , z] = p.pos;
        if (Math.abs(x - BRIDGE.x) > 1.4) continue;
        const d = Math.abs(z - z0);
        if (d < 0.6) tip.tip(p, 0.22 * Math.sin(Math.PI * (1 - d / 0.6)) * (1 - fixed * 2));
    }
}

// The lurch over k 0..1, in radians: tipped forward fast, caught, and slowly back upright.
export const lurch = k => (k <= 0 || k >= 1 ? 0 : k < 0.25 ? 0.38 * sstep(k / 0.25) : 0.38 * (1 - sstep((k - 0.25) / 0.75)));

// ---- The film's village --------------------------------------------------------------------------
// Every prop the film adds, built once per chapter (each chapter has its own group) and set per frame
// from a state: { fingerpost: {rise, arms, lit}, stage: {rise, banners, lights}, workshop: {tool},
// shed: {build, sign, door}, hamletShed: {build, sign}, plank: fixed, rail: mended, fire: lit }.
// Anything left out of the state is hidden (or at rest: plank broken, rail loose, fire out).
export function buildVillage(world, group, { fire = false, hamlet = false } = {}) {
    const P = {
        fingerpost: buildFingerpost(world),
        stage: buildStage(world),
        workshop: buildWorkshop(world),
        shed: buildShed(world, { at: SPOT.shed, facing: 128 }),
        plank: buildPlank(world),
        rail: buildRail(world),
    };
    if (fire) P.fire = buildFire(world);
    if (hamlet) P.hamletShed = buildShed(world, { at: SPOT.hamletShed, facing: 140, roof: 'slate' });
    for (const p of Object.values(P)) group.add(p.group);
    P.tip = tipHook(world, group);
    return {
        ...P,
        apply(s, clock) {
            P.fingerpost.set(s.fingerpost ?? { rise: 0 });
            P.stage.set(s.stage ?? { rise: 0, banners: [0, 0], lights: 0 });
            P.workshop.set(s.workshop ?? { tool: 0 });
            P.shed.set(s.shed ?? { build: 0 });
            P.plank.set(s.plank ?? 0);
            P.rail.set(s.rail ?? 0);
            P.fire?.set(s.fire ?? 0, clock, s.fireLaid ?? 0);
            P.hamletShed?.set(s.hamletShed ?? { build: 0 });
        },
    };
}

// The village as the film leaves it after each chapter (props), so the next chapter starts there.
export const AFTER = {
    start: { stage: { rise: 0, banners: [0, 0], lights: 0 }, workshop: { tool: 0 } },
    together: { stage: { rise: 0, banners: [1, 0], lights: 0 }, rail: 1, workshop: { tool: 0 } },
    ways: { fingerpost: { rise: 1, arms: [1, 1, 1], lit: [0, 0, 0] }, stage: { rise: 1, banners: [1, 1], lights: 1 }, rail: 1, workshop: { tool: 1 } },
    reach: { fingerpost: { rise: 1 }, stage: { rise: 1, banners: [1, 1], lights: 1 }, rail: 1, workshop: { tool: 1 }, shed: { build: 1, sign: 1, door: 1 }, hamletShed: { build: 1, sign: 1, door: 1 } },
    counts: { fingerpost: { rise: 1 }, stage: { rise: 1, banners: [1, 1], lights: 1 }, rail: 1, workshop: { tool: 1 }, shed: { build: 1, sign: 1, door: 1 }, hamletShed: { build: 1, sign: 1, door: 1 }, plank: 1 },
};
AFTER.room = AFTER.counts;

// The world's own state for the whole film: Client & Delivery and People & Team banners up (as after
// the guide's film), the landmarks found so far, Org & Community's banners up from DevDay (oc) and the
// explorer's note on the board (note, pinned in Ways).
export function keepWorld(world, oc = 1, { note = 1 } = {}) {
    world.props.noticeSheet.show(note);
    world.props.noticeSheet.write(note);
    world.banners('cd', 1);
    world.banners('pt', 1);
    world.banners('oc', oc);
    for (const n of ['crossroads', 'stoneRing', 'noticeBoard', 'lake', 'plot', 'neighbours', 'village', 'houses']) world.discover(n, 1);
}

// ---- Shots shared across chapter boundaries --------------------------------------------------------
// target [x, y, z], distance, yaw (where the camera stands: 0 south, 90 east), pitch, fov.
export const SHOT = {
    high: { target: [-7, 0, 12], distance: 120, yaw: 8, pitch: 58, fov: 28 },
    village: { target: [-8, 0.6, 13.5], distance: 62, yaw: 10, pitch: 52, fov: 28 },
    villageCore: { target: [-5.5, 0.6, 12], distance: 48, yaw: 12, pitch: 50, fov: 28 },
    plot: { target: [-15.4, 0.6, 20.8], distance: 24, yaw: 22, pitch: 46, fov: 28 },
    plotRoad: { target: [-13.2, 0.6, 18.0], distance: 28, yaw: 24, pitch: 47, fov: 28 },     // together -> ways
    fingerpost: { target: [-9.4, 1.0, 12.6], distance: 26, yaw: 20, pitch: 56, fov: 28 },
    culture: { target: [-8.4, 0.8, 10.4], distance: 26, yaw: 18, pitch: 55, fov: 28 },
    workshop: { target: [-6.4, 0.8, 4.8], distance: 24, yaw: 16, pitch: 50, fov: 28 },
    classView: { target: [-9.4, 0.6, 6.0], distance: 26, yaw: 20, pitch: 46, fov: 28 },
    devday: { target: [-3.0, 1.0, 6.8], distance: 30, yaw: -26, pitch: 45, fov: 28 },
    note: { target: [-3.6, 1.4, 7.6], distance: 16, yaw: -38, pitch: 38, fov: 28 },          // ways -> reach
    rings: { target: [-8, 0, 15], distance: 100, yaw: 10, pitch: 56, fov: 28 },
    direct: { target: [-16.0, 0.6, 18.0], distance: 27, yaw: 18, pitch: 50, fov: 28 },
    extended: { target: [-7.5, 0, 13], distance: 74, yaw: 12, pitch: 55, fov: 28 },
    team: { target: [-4, 0, 6], distance: 82, yaw: 12, pitch: 55, fov: 28 },
    hamlet: { target: [2.5, 0.6, -23.5], distance: 50, yaw: 14, pitch: 50, fov: 28 },
    wider: { target: [2, 0, -8], distance: 165, yaw: 8, pitch: 60, fov: 28 },                 // reach -> counts
    bothSides: { target: [3.2, 0.8, -1.8], distance: 44, yaw: 38, pitch: 44, fov: 28 },
    plank: { target: [5.8, 0.8, -9.6], distance: 17, yaw: 28, pitch: 47, fov: 30 },
    season: { target: [-5, 0, 4], distance: 92, yaw: 12, pitch: 57, fov: 28 },
    dawnPlot: { target: [-13.4, 0.8, 18.4], distance: 50, yaw: -42, pitch: 42, fov: 28 },   // counts -> room
    talk: { target: [-14.6, 0.8, 21.2], distance: 22, yaw: -34, pitch: 38, fov: 28 },
    roomRoad: { target: [-11.4, 0.8, 16.4], distance: 40, yaw: -34, pitch: 42, fov: 28 },   // room -> close
    closeHigh: { target: [-4, 0, 7], distance: 80, yaw: 6, pitch: 51, fov: 28 },
};

// Hours at each boundary.
export const HOURS = { start: 8.4, together: 10.6, ways: 12, reach: 13.4, counts: 6.3, room: 9.6, close: 17.1 };

// The explorer's plot and the road out of it to the village.
export const PATH = {
    plotOut: [[-16.9, 22.3], [-16.0, 21.5], [-14.1, 21.5], [-13.4, 20.4], [-13.4, 18.8], [-13.1, 17.4]],
    toFingerpost: [[-13.1, 17.4], [-12.1, 16.5], [-11.0, 15.6], [-10.4, 14.2], [-10.0, 12.9]],
};
